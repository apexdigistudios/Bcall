import { randomUUID } from "node:crypto";
import { z } from "zod";

const sailupBaseUrl = "https://api.sailup.io/v1";
const requestTimeoutMs = 12_000;
const senderRateLimit = 5;
const smsRateLimit = 10;
const rateWindowMs = 60 * 60 * 1_000;
const requestsByIp = new Map<string, { count: number; resetAt: number }>();
const smsRequestsByDevice = new Map<string, { count: number; resetAt: number }>();
const dispatchedCallEvents = new Map<string, { expiresAt: number; inProgress: boolean }>();

const senderInputSchema = z.object({
  name: z.string().trim().min(1).max(11).regex(/^[A-Za-z0-9 ]+$/, "Use only letters, numbers, and spaces."),
  use_case: z.enum(["promotional", "transactional"]),
  notes: z.string().trim().max(500).optional().default(""),
  sample_message: z.string().trim().min(1).max(500),
}).strict();

export type SenderRegistrationInput = z.infer<typeof senderInputSchema>;

export type SailupSender = {
  id: string;
  name: string;
  use_case: "promotional" | "transactional";
  sample_message: string;
  notes: string;
  status: "pending" | "active" | "rejected" | "inactive" | string;
  status_reason: string;
  is_default: boolean;
  reviewed_at: string | null;
  created_at: string;
};

const senderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  use_case: z.enum(["promotional", "transactional"]),
  sample_message: z.string(),
  notes: z.string().default(""),
  status: z.string().min(1),
  status_reason: z.string().default(""),
  is_default: z.boolean().default(false),
  reviewed_at: z.string().nullable().default(null),
  created_at: z.string().default(""),
});

export class SailupError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "SailupError";
  }
}

function getApiKey(): string | null {
  return process.env.SAILUP_API_KEY?.trim() || null;
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() &&
    process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
  );
}

export function hasSailupApiKey(): boolean {
  return getApiKey() !== null;
}

function requestIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")?.trim()
    ?? "unknown";
}

function takeRateLimit(
  store: Map<string, { count: number; resetAt: number }>,
  key: string,
  maximum: number,
): boolean {
  const now = Date.now();
  for (const [storedKey, entry] of store) {
    if (entry.resetAt <= now) store.delete(storedKey);
  }
  const entry = store.get(key);
  if (entry && entry.resetAt > now && entry.count >= maximum) return false;
  if (!entry || entry.resetAt <= now) store.set(key, { count: 1, resetAt: now + rateWindowMs });
  else entry.count += 1;
  return true;
}

export function takeSenderRateLimit(request: Request): boolean {
  return takeRateLimit(requestsByIp, requestIp(request), senderRateLimit);
}

export function takeSmsRateLimit(request: Request, deviceId: string): boolean {
  return takeRateLimit(requestsByIp, requestIp(request), smsRateLimit) &&
    takeRateLimit(smsRequestsByDevice, deviceId, smsRateLimit);
}

export function claimCallEventSms(callEventId: string): boolean {
  const now = Date.now();
  for (const [eventId, entry] of dispatchedCallEvents) {
    if (entry.expiresAt <= now) dispatchedCallEvents.delete(eventId);
  }
  if (dispatchedCallEvents.has(callEventId)) return false;
  dispatchedCallEvents.set(callEventId, { expiresAt: now + 60 * 60 * 1_000, inProgress: true });
  return true;
}

export function completeCallEventSms(callEventId: string): void {
  dispatchedCallEvents.set(callEventId, { expiresAt: Date.now() + 24 * 60 * 60 * 1_000, inProgress: false });
}

export function releaseCallEventSms(callEventId: string): void {
  if (dispatchedCallEvents.get(callEventId)?.inProgress) dispatchedCallEvents.delete(callEventId);
}

export function validateSenderRegistration(value: unknown) {
  return senderInputSchema.safeParse(value);
}

async function sailupRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) throw new SailupError("Sailup is not configured. Set SAILUP_API_KEY on the server.", 503);

  const response = await fetch(`${sailupBaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const message = typeof record.message === "string"
      ? record.message
      : typeof record.error === "string" ? record.error : `Sailup returned HTTP ${response.status}.`;
    throw new SailupError(message.replaceAll(apiKey, "[REDACTED]").slice(0, 500), response.status, payload);
  }
  return payload as T;
}

export async function getSailupSenders(): Promise<SailupSender[]> {
  if (!getApiKey()) return [];
  const payload = await sailupRequest<unknown>("/senders/?page_size=100");
  const results = payload && typeof payload === "object" && "results" in payload
    ? payload.results
    : undefined;
  const parsed = z.array(senderSchema).safeParse(results);
  if (!parsed.success) throw new SailupError("Sailup returned an invalid sender list.", 502);
  return parsed.data;
}

export function getPrimarySailupSender(senders: SailupSender[]): SailupSender | null {
  return senders.find((sender) => sender.status === "active" && sender.is_default)
    ?? senders.find((sender) => sender.status === "active")
    ?? senders[0]
    ?? null;
}

export async function registerSailupSender(input: SenderRegistrationInput): Promise<SailupSender> {
  const payload = await sailupRequest<unknown>("/senders/", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const parsed = senderSchema.safeParse(payload);
  if (!parsed.success) throw new SailupError("Sailup returned an invalid sender registration.", 502);
  return parsed.data;
}

export function validateGhanaRecipient(value: string): string | null {
  const trimmed = value.trim();
  const compact = trimmed.replace(/[\s().-]/g, "");
  if (!/^(?:\+?233\d{9}|0\d{9})$/.test(compact)) return null;
  return compact;
}

export type SailupSmsResponse = {
  count?: number;
  total_quantity?: number;
  messages?: Array<{
    id?: string;
    to?: string[];
    sender?: string;
    status?: string;
    delivery_status?: string;
    created_at?: string;
  }>;
};

export async function sendSailupSms(sender: SailupSender, to: string, body: string): Promise<SailupSmsResponse> {
  return sailupRequest<SailupSmsResponse>("/sms/", {
    method: "POST",
    body: JSON.stringify({ from: sender.name, to: [to], body }),
  });
}

export function createMissedCallMessage(
  businessName: string,
  template?: string | null,
): string {
  const safeBusinessName = businessName.trim().slice(0, 100) || "our business";
  const message = template?.trim()
    ? template
      .replace(/\[Business Name\]/gi, safeBusinessName)
      .replace(/\[Time\]/gi, new Date().toLocaleTimeString("en", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }))
    : `Hi, this is ${safeBusinessName}. Sorry we missed your call. Reply to let us know how we can help. Reply STOP to opt out.`;
  return message.trim().slice(0, 1_600);
}

export function logSmsDispatch(input: {
  callEventId: string;
  senderName: string;
  status: string;
  providerMessageId?: string;
  error?: string;
}) {
  console.info(JSON.stringify({
    event: "sms.missed_call_dispatch",
    requestId: randomUUID(),
    callEventId: input.callEventId,
    senderName: input.senderName,
    status: input.status,
    ...(input.providerMessageId ? { providerMessageId: input.providerMessageId } : {}),
    ...(input.error ? { error: input.error.slice(0, 300) } : {}),
  }));
}
