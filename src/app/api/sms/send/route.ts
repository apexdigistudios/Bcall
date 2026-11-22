import { z } from "zod";
import { dispatchMissedCallFollowup } from "@/lib/sms-followup";
import { takeSmsRateLimit, validateGhanaRecipient } from "@/lib/sailup";
import { supabase } from "@/lib/supabase";
import { getRequestUser } from "@/lib/request-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  call_event_id: z.string().uuid(),
  to: z.string().trim().min(1).max(32).optional(),
  body: z.string().trim().min(1).max(1_600).optional(),
}).strict();

export async function POST(request: Request) {
  let userId: string;
  try {
    const user = await getRequestUser(request);
    if (!user) return Response.json({ error: "Sign in to send SMS follow-ups." }, { status: 401 });
    userId = user.id;
  } catch (error) {
    console.error(JSON.stringify({
      event: "sms.auth_check_failed",
      errorName: error instanceof Error ? error.name : "UnknownError",
    }));
    return Response.json({ error: "Authentication is temporarily unavailable." }, { status: 503 });
  }

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return Response.json({ error: "Send the missed-call details as JSON." }, { status: 415 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > 4_096) {
    return Response.json({ error: "The SMS request is too large." }, { status: 413 });
  }

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return Response.json({ error: "We couldn't read the SMS request." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(value);
  if (!parsed.success) {
    return Response.json({ error: "A valid call_event_id and message are required." }, { status: 400 });
  }

  const { data: call, error } = await supabase
    .from("call_events")
    .select("id, phone_number, contact_name, android_devices(device_id, business_name, status)")
    .eq("id", parsed.data.call_event_id)
    .maybeSingle();
  if (error) {
    console.error(JSON.stringify({
      event: "sms.call_event_lookup_failed",
      errorCode: error.code,
    }));
    return Response.json({ error: "Could not verify the missed-call event." }, { status: 502 });
  }
  if (!call) return Response.json({ error: "The missed-call event was not found." }, { status: 404 });

  const device = Array.isArray(call.android_devices) ? call.android_devices[0] : call.android_devices;
  if (!device || device.status !== "active") {
    return Response.json({ error: "The call's companion device is not active." }, { status: 409 });
  }
  if (!takeSmsRateLimit(request, device.device_id)) {
    return Response.json({ error: "Too many SMS follow-ups. Try again in about an hour." }, { status: 429 });
  }

  if (parsed.data.to) {
    const submittedRecipient = validateGhanaRecipient(parsed.data.to);
    const eventRecipient = validateGhanaRecipient(call.phone_number);
    if (!submittedRecipient || submittedRecipient !== eventRecipient) {
      return Response.json({ error: "The recipient must match the verified missed-call number." }, { status: 400 });
    }
  }

  const result = await dispatchMissedCallFollowup({
    callEventId: call.id,
    recipient: call.phone_number,
    businessName: device.business_name,
    body: parsed.data.body,
    userId,
  });
  if (result.status === "sent") return Response.json({ dispatch: result }, { status: 202 });
  if (result.status === "blocked") {
    return Response.json({ dispatch: result, error: result.message }, {
      status: result.reason === "already_dispatched" ? 409 : result.reason === "invalid_recipient" || result.reason === "invalid_message" ? 400 : 409,
    });
  }
  return Response.json({ dispatch: result, error: result.message }, {
    status: result.statusCode >= 400 && result.statusCode < 600 ? result.statusCode : 502,
  });
}
