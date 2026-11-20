"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuthenticatedHeaders } from "@/lib/client-auth";

export function SmsFollowupButton({
  callEventId,
  enabled,
  size = "xs",
}: {
  callEventId: string;
  enabled: boolean;
  size?: "xs" | "sm";
}) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  async function sendSms() {
    setSending(true);
    setMessage("");
    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "content-type": "application/json", ...await getAuthenticatedHeaders() },
        body: JSON.stringify({ call_event_id: callEventId }),
      });
      const result = await response.json() as { error?: string; dispatch?: { status?: string; deliveryStatus?: string } };
      if (!response.ok) throw new Error(result.error || "SMS follow-up could not be sent.");
      setMessage(result.dispatch?.deliveryStatus
        ? `SMS ${result.dispatch.deliveryStatus}.`
        : "SMS accepted by Sailup.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "SMS follow-up could not be sent.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant="neutral" size={size} disabled={!enabled || sending} loading={sending} onClick={sendSms}>
        <Send className="size-3" /> SMS
      </Button>
      {message && <span role="status" className="max-w-48 text-[9px] text-zinc-600 dark:text-zinc-400">{message}</span>}
      {!enabled && <span className="max-w-48 text-[9px] text-zinc-500 dark:text-zinc-400">Blocked: configure Sailup and an active Sender ID. <Link className="underline" href="/dashboard/templates">Set up</Link></span>}
    </div>
  );
}

export function WhatsAppFollowupButton({
  recipient,
  message,
  enabled,
  size = "xs",
}: {
  recipient: string;
  message: string;
  enabled: boolean;
  size?: "xs" | "sm";
}) {
  const phone = recipient.replace(/\D/g, "");
  if (!enabled) {
    return (
      <div className="flex flex-col items-start gap-1">
        <Button type="button" variant="neutral" size={size} disabled>
          <MessageCircle className="size-3" /> WhatsApp
        </Button>
        <span className="max-w-48 text-[9px] text-zinc-500 dark:text-zinc-400">Blocked: WhatsApp API settings are missing. <Link className="underline" href="/dashboard/templates">Setup</Link></span>
      </div>
    );
  }

  return (
    <Button
      render={<a href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" />}
      variant="neutral"
      size={size}
    >
      <MessageCircle className="size-3" /> WhatsApp
    </Button>
  );
}
