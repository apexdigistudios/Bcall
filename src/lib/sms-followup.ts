import { supabase } from "@/lib/supabase";
import {
  claimCallEventSms,
  completeCallEventSms,
  createMissedCallMessage,
  getPrimarySailupSender,
  getSailupSenders,
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
  try {
    sender = getPrimarySailupSender(await getSailupSenders());
  } catch (error) {
    const statusCode = error instanceof SailupError ? error.status : 502;
    const message = error instanceof Error ? error.message : "Could not check the Sailup Sender ID status.";
    console.error(JSON.stringify({
      event: "sms.sender_status_failed",
      callEventId: input.callEventId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      status: statusCode,
    }));
    return { status: "failed", message, statusCode };
  }
  if (!sender || sender.status !== "active") {
    return {
      status: "blocked",
      reason: "sender_not_active",
      message: "SMS follow-up is blocked until a Sender ID is approved and active.",
    };
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
