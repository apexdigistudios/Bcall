import { supabase } from "@/lib/supabase";
import {
  claimCallEventSms,
  completeCallEventSms,
  createMissedCallMessage,
  hasSailupApiKey,
  logSmsDispatch,
  releaseCallEventSms,
  SailupError,
  sendSailupSms,
  validateGhanaRecipient,
} from "@/lib/sailup";

type FollowupInput = {
  callEventId: string;
  recipient: string;
  businessName: string;
  body?: string;
  userId?: string;
};

export type FollowupResult =
  | { status: "sent"; sender: string; messageId?: string; deliveryStatus?: string }
  | { status: "blocked"; reason: "not_configured" | "sender_not_active" | "invalid_recipient" | "invalid_message" | "already_dispatched"; message: string }
  | { status: "failed"; message: string; statusCode: number };

export async function getBusinessSmsTemplate(businessName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select("sms_template")
    .eq("name", businessName)
    .maybeSingle();
  if (error) {
    console.warn(JSON.stringify({
      event: "sms.template_unavailable",
      errorCode: error.code,
    }));
    return null;
  }
  return typeof data?.sms_template === "string" ? data.sms_template : null;
}

export async function dispatchMissedCallFollowup(input: FollowupInput): Promise<FollowupResult> {
  const recipient = validateGhanaRecipient(input.recipient);
  if (!recipient) {
    return {
      status: "blocked",
      reason: "invalid_recipient",
      message: "SMS follow-up is available only for valid Ghanaian mobile numbers.",
    };
  }
  if (!hasSailupApiKey()) {
    return {
      status: "blocked",
      reason: "not_configured",
      message: "SMS follow-up is unavailable because Sailup is not configured.",
    };
  }

  let sender;
  if (input.userId) {
    const { data: ownedSender, error: ownerError } = await supabase
      .from("sailup_senders")
      .select("id,name,use_case,sample_message,notes,status,status_reason,is_default,reviewed_at,created_at")
      .eq("user_id", input.userId)
      .eq("status", "active")
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (ownerError) {
      return { status: "failed", message: "Could not verify the account's active Sender ID.", statusCode: 502 };
    }
    if (!ownedSender) {
      return { status: "blocked", reason: "sender_not_active", message: "SMS follow-up is blocked until an account-owned Sender ID is approved and active." };
    }
    sender = {
      id: ownedSender.id,
      name: ownedSender.name,
      use_case: ownedSender.use_case,
      sample_message: ownedSender.sample_message,
      notes: ownedSender.notes,
      status: ownedSender.status,
      status_reason: ownedSender.status_reason,
      is_default: ownedSender.is_default,
      reviewed_at: ownedSender.reviewed_at,
      created_at: ownedSender.created_at,
    };
  } else {
    return { status: "blocked", reason: "sender_not_active", message: "Automatic SMS ownership could not be verified for this device." };
  }
  if (!claimCallEventSms(input.callEventId)) {
    return {
      status: "blocked",
      reason: "already_dispatched",
      message: "An SMS follow-up has already been accepted for this missed call.",
    };
  }

  const template = input.body ? null : await getBusinessSmsTemplate(input.businessName);
  const body = (input.body ?? createMissedCallMessage(input.businessName, template)).trim();
  if (!body || body.length > 1_600) {
    releaseCallEventSms(input.callEventId);
    return {
      status: "blocked",
      reason: "invalid_message",
      message: "The SMS message must contain between 1 and 1,600 characters.",
    };
  }

  try {
    const result = await sendSailupSms(sender, recipient, body);
    const message = result.messages?.[0];
    completeCallEventSms(input.callEventId);
    logSmsDispatch({
      callEventId: input.callEventId,
      senderName: sender.name,
      status: message?.delivery_status ?? message?.status ?? "accepted",
      providerMessageId: message?.id,
    });
    return {
      status: "sent",
      sender: sender.name,
      ...(message?.id ? { messageId: message.id } : {}),
      ...(message?.delivery_status ? { deliveryStatus: message.delivery_status } : {}),
    };
  } catch (error) {
    releaseCallEventSms(input.callEventId);
    const statusCode = error instanceof SailupError ? error.status : 502;
    const message = error instanceof Error ? error.message : "Sailup could not dispatch the SMS.";
    logSmsDispatch({
      callEventId: input.callEventId,
      senderName: sender.name,
      status: "failed",
      error: message,
    });
    return { status: "failed", message, statusCode };
  }
}
