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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestLimitBytes = 8_192;

async function requireUser(request: Request): Promise<Response | null> {
  try {
    const user = await getRequestUser(request);
    return user ? null : Response.json({ error: "Sign in to manage Sender IDs." }, { status: 401 });
  } catch (error) {
    console.error(JSON.stringify({
      event: "sailup.auth_check_failed",
      errorName: error instanceof Error ? error.name : "UnknownError",
    }));
    return Response.json({ error: "Authentication is temporarily unavailable." }, { status: 503 });
  }
}

export async function GET(request: Request) {
  const authError = await requireUser(request);
  if (authError) return authError;

  try {
    const senders = await getSailupSenders();
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
  if (authError) return authError;

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
