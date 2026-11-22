import {
  getSailupSenders,
  hasSailupApiKey,
  isWhatsAppConfigured,
  registerSailupSender,
  SailupError,
  takeSenderRateLimit,
  validateSenderRegistration,
} from "@/lib/sailup";
import { getRequestUser } from "@/lib/request-auth";
import { supabase } from "@/lib/supabase";
import type { SailupSender } from "@/lib/sailup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestLimitBytes = 8_192;

async function requireUser(request: Request): Promise<{ response: Response } | { userId: string }> {
  try {
    const user = await getRequestUser(request);
    return user
      ? { userId: user.id }
      : { response: Response.json({ error: "Sign in to manage Sender IDs." }, { status: 401 }) };
  } catch (error) {
    console.error(JSON.stringify({
      event: "sailup.auth_check_failed",
      errorName: error instanceof Error ? error.name : "UnknownError",
    }));
    return { response: Response.json({ error: "Authentication is temporarily unavailable." }, { status: 503 }) };
  }
}

function mapStoredSender(row: Record<string, unknown>): SailupSender {
  return {
    id: String(row.id),
    name: String(row.name),
    use_case: row.use_case === "promotional" ? "promotional" : "transactional",
    sample_message: String(row.sample_message ?? ""),
    notes: String(row.notes ?? ""),
    status: String(row.status ?? "pending"),
    status_reason: String(row.status_reason ?? ""),
    is_default: Boolean(row.is_default),
    reviewed_at: typeof row.reviewed_at === "string" ? row.reviewed_at : null,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
  };
}

export async function GET(request: Request) {
  const authError = await requireUser(request);
  if ("response" in authError) return authError.response;
  const { userId } = authError;

  try {
    const { data: rows, error: storageError } = await supabase
      .from("sailup_senders")
      .select("*")
      .eq("user_id", userId);
    if (storageError) {
      console.error(JSON.stringify({ event: "sailup.sender_storage_failed", errorCode: storageError.code }));
      return Response.json({ error: "Sender ID storage is unavailable. Apply the Sailup sender migration.", configured: hasSailupApiKey(), senders: [], whatsappConfigured: isWhatsAppConfigured() }, { status: 503 });
    }
    const ownedIds = new Set((rows ?? []).map((row) => String(row.id)));
    const providerSenders = await getSailupSenders();
    const senders = providerSenders.filter((sender) => ownedIds.has(sender.id)).map((providerSender) => {
      const stored = (rows ?? []).find((row) => String(row.id) === providerSender.id);
      return stored ? providerSender : providerSender;
    });

    if (senders.length !== (rows ?? []).length) {
      const storedOnly = (rows ?? [])
        .filter((row) => !providerSenders.some((sender) => sender.id === String(row.id)))
        .map(mapStoredSender);
      senders.push(...storedOnly);
    }
    if (senders.length > 0) {
      await supabase.from("sailup_senders").upsert(senders.map((sender) => ({
        id: sender.id,
        user_id: userId,
        name: sender.name,
        use_case: sender.use_case,
        sample_message: sender.sample_message,
        notes: sender.notes,
        status: sender.status,
        status_reason: sender.status_reason,
        is_default: sender.is_default,
        reviewed_at: sender.reviewed_at,
        created_at: sender.created_at || null,
      })), { onConflict: "id" });
    }
    return Response.json({
      configured: hasSailupApiKey(),
      senders,
      whatsappConfigured: isWhatsAppConfigured(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof SailupError ? error.status : 502;
    const message = error instanceof Error ? error.message : "Could not load Sender IDs from Sailup.";
    console.error(JSON.stringify({
      event: "sailup.sender_list_failed",
      errorName: error instanceof Error ? error.name : "UnknownError",
      status,
    }));
    return Response.json({ error: message }, { status: status >= 400 && status < 600 ? status : 502 });
  }
}

export async function POST(request: Request) {
  const authError = await requireUser(request);
  if ("response" in authError) return authError.response;
  const { userId } = authError;

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return Response.json({ error: "Send Sender ID details as JSON." }, { status: 415 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > requestLimitBytes) {
    return Response.json({ error: "Sender ID details exceed the request size limit." }, { status: 413 });
  }
  if (!takeSenderRateLimit(request)) {
    return Response.json({ error: "Too many Sender ID registration attempts. Try again in about an hour." }, { status: 429 });
  }
  if (!hasSailupApiKey()) {
    return Response.json({ error: "Sender ID registration is unavailable because SAILUP_API_KEY is not configured on the server." }, { status: 503 });
  }

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return Response.json({ error: "We couldn't read the Sender ID details." }, { status: 400 });
  }
  const parsed = validateSenderRegistration(value);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      parsed.error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]),
    );
    return Response.json({ error: "Please check the Sender ID details.", fieldErrors }, { status: 400 });
  }

  try {
    const sender = await registerSailupSender(parsed.data);
    const { error: storageError } = await supabase.from("sailup_senders").upsert({
      id: sender.id,
      user_id: userId,
      name: sender.name,
      use_case: sender.use_case,
      sample_message: sender.sample_message,
      notes: sender.notes,
      status: sender.status,
      status_reason: sender.status_reason,
      is_default: sender.is_default,
      reviewed_at: sender.reviewed_at,
      created_at: sender.created_at || null,
    }, { onConflict: "id" });
    if (storageError) {
      console.error(JSON.stringify({ event: "sailup.sender_storage_failed", errorCode: storageError.code }));
      return Response.json({ error: "Sender ID was created by Sailup, but could not be saved to this account.", sender }, { status: 503 });
    }
    console.info(JSON.stringify({
      event: "sailup.sender_registered",
      senderId: sender.id,
      senderName: sender.name,
      status: sender.status,
    }));
    return Response.json({ sender }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof SailupError ? error.status : 502;
    const message = error instanceof Error ? error.message : "Sender ID registration failed.";
    console.error(JSON.stringify({
      event: "sailup.sender_registration_failed",
      errorName: error instanceof Error ? error.name : "UnknownError",
      status,
    }));
    return Response.json({
      error: message,
    }, { status: status >= 400 && status < 600 ? status : 502 });
  }
}
