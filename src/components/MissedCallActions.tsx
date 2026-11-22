"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  const [setupOpen, setSetupOpen] = useState(false);
  const [channelEnabled, setChannelEnabled] = useState(enabled);

  useEffect(() => {
    let cancelled = false;
    async function syncChannelStatus() {
      try {
        const response = await fetch("/api/sailup/senders", {
          cache: "no-store",
          headers: await getAuthenticatedHeaders(),
        });
        const result = await response.json() as { senders?: Array<{ status: string }> };
        if (!cancelled && response.ok) {
          setChannelEnabled(result.senders?.some((sender) => sender.status === "active") ?? false);
        }
      } catch {
        if (!cancelled) setChannelEnabled(false);
      }
    }
    void syncChannelStatus();
    return () => { cancelled = true; };
  }, []);

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
    <div className="relative flex flex-col items-start">
      <Button
        type="button"
        variant="neutral"
        size={size}
        disabled={sending}
        loading={sending}
        onClick={channelEnabled ? sendSms : () => setSetupOpen(true)}
        aria-describedby={!channelEnabled ? `sms-${callEventId}-setup` : undefined}
      >
        <Image src="/logos/sms.svg" alt="" width={12} height={12} unoptimized className="size-3 object-contain" /> SMS
      </Button>
      {message && <span role="status" className="absolute left-0 top-full z-[70] mt-1 max-w-48 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[9px] shadow-md dark:border-[#282B29] dark:bg-[#191B1A] text-zinc-600 dark:text-zinc-300">{message}</span>}
      {!channelEnabled && setupOpen && (
        <div id={`sms-${callEventId}-setup`} role="dialog" className="absolute left-0 top-full z-[70] mt-1.5 w-56 rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-xl dark:border-[#282B29] dark:bg-[#191B1A]">
          <p className="text-[10px] font-semibold text-zinc-900 dark:text-zinc-100">SMS follow-up blocked</p>
          <p className="mt-1 text-[9px] leading-relaxed text-zinc-500 dark:text-zinc-400">Configure Sailup and an active Sender ID.</p>
          <Link className="mt-2 inline-flex text-[9px] font-semibold underline" href="/dashboard/templates" onClick={() => setSetupOpen(false)}>Set up SMS</Link>
        </div>
      )}
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
  const [setupOpen, setSetupOpen] = useState(false);
  const [channelEnabled, setChannelEnabled] = useState(enabled);

  useEffect(() => {
    let cancelled = false;
    async function syncChannelStatus() {
      try {
        const response = await fetch("/api/sailup/senders", {
          cache: "no-store",
          headers: await getAuthenticatedHeaders(),
        });
        const result = await response.json() as { whatsappConfigured?: boolean };
        if (!cancelled && response.ok) setChannelEnabled(result.whatsappConfigured ?? false);
      } catch {
        if (!cancelled) setChannelEnabled(false);
      }
    }
    void syncChannelStatus();
    return () => { cancelled = true; };
  }, []);

  if (!channelEnabled) {
    return (
      <div className="relative flex flex-col items-start">
        <Button type="button" variant="neutral" size={size} onClick={() => setSetupOpen(true)}>
          <Image src="/logos/whatsapp.svg" alt="" width={12} height={12} unoptimized className="size-3 object-contain" /> WhatsApp
        </Button>
        {setupOpen && (
          <div role="dialog" className="absolute left-0 top-full z-[70] mt-1.5 w-56 rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-xl dark:border-[#282B29] dark:bg-[#191B1A]">
            <p className="text-[10px] font-semibold text-zinc-900 dark:text-zinc-100">WhatsApp follow-up blocked</p>
            <p className="mt-1 text-[9px] leading-relaxed text-zinc-500 dark:text-zinc-400">WhatsApp API settings are missing.</p>
            <Link className="mt-2 inline-flex text-[9px] font-semibold underline" href="/dashboard/templates" onClick={() => setSetupOpen(false)}>Set up WhatsApp</Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      render={<a href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" />}
      variant="neutral"
      size={size}
    >
      <Image src="/logos/whatsapp.svg" alt="" width={12} height={12} unoptimized className="size-3 object-contain" /> WhatsApp
    </Button>
  );
}
