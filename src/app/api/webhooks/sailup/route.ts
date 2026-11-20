import { z } from "zod";
import { verifySailupWebhookSignature } from "@/lib/sailup-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maximumBodyBytes = 64 * 1024;
const eventTypes = [
  "message.delivered",
  "message.failed",
  "message.expired",
  "message.rejected",
  "email.delivered",
  "email.bounced",
  "email.complained",
  "email.failed",
  "email.suppressed",
  "sender_id.approved",
  "sender_id.rejected",
  "sender_id.deactivated",
  "sender_id.reactivated",
] as const;

const webhookSchema = z.object({
  event: z.enum(eventTypes),
  created_at: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
});

async function readLimitedBody(request: Request): Promise<string | null> {
  if (!request.body) return null;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maximumBodyBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  try {
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return Response.json({ error: "Expected a JSON webhook payload." }, { status: 415 });
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maximumBodyBytes) {
    return Response.json({ error: "Webhook payload is too large." }, { status: 413 });
  }

  const secret = process.env.SAILUP_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error(JSON.stringify({ event: "sailup.webhook_secret_missing" }));
    return Response.json({ error: "Webhook endpoint is not configured." }, { status: 503 });
  }

  const rawBody = await readLimitedBody(request);
  if (rawBody === null) {
    return Response.json({ error: "Webhook payload is missing, invalid, or too large." }, { status: 413 });
  }

  const timestamp = request.headers.get("x-sailup-timestamp") ?? "";
  const signature = request.headers.get("x-sailup-signature") ?? "";
  const deliveryId = request.headers.get("x-sailup-delivery-id") ?? "";
  if (!deliveryId || !verifySailupWebhookSignature(rawBody, timestamp, signature, secret)) {
    return Response.json({ error: "Webhook signature is invalid or expired." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Webhook payload is not valid JSON." }, { status: 400 });
  }

  const parsed = webhookSchema.safeParse(payload);
  const headerEvent = request.headers.get("x-sailup-event");
  if (!parsed.success || headerEvent !== parsed.data.event) {
    return Response.json({ error: "Webhook event payload is invalid." }, { status: 400 });
  }

  const data = parsed.data.data;
  const resourceId = typeof data.id === "string" ? data.id : undefined;
  const status = typeof data.status === "string" ? data.status : parsed.data.event;
  console.info(JSON.stringify({
    event: "sailup.webhook_received",
    deliveryId,
    eventType: parsed.data.event,
    resourceId,
    status,
    createdAt: parsed.data.created_at,
  }));

  return Response.json({ received: true });
}
