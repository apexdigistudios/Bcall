"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { MessageSquare, Send, Check, Sparkles, RefreshCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { SailupSender } from "@/lib/sailup";
import { getAuthenticatedHeaders } from "@/lib/client-auth";

type ChannelStatus = {
  configured: boolean;
  senders: SailupSender[];
  whatsappConfigured: boolean;
  error?: string;
};

const smsLibrary = [
  "Hi [Business Name] here! Sorry we missed your call. What can we get sorted out for you today?",
  "Hello! We missed your call at [Business Name]. Are you looking to make a purchase or booking? Let us know!",
  "Hey there! Thanks for calling [Business Name]. Drop your inquiry here and our team will respond right away.",
  "Hi! Sorry we couldn't answer your call at [Business Name] just now. How can we assist you today?",
  "Greetings from [Business Name]! We missed you. Reply with what you need and we'll get right on it.",
];

const whatsappLibrary = [
  "Hello! Thanks for reaching out to [Business Name]. We missed your call—tell us what you need and we'll sort you out right away!",
  "Hi from [Business Name]! Sorry we missed you. Drop your request or questions here and we'll reply instantly!",
  "Greetings! Thanks for calling [Business Name]. Looking for a quote, booking, or product info? Let us know below!",
  "Hi there! We missed your live call at [Business Name]. How can we help make things easier? Let's chat!",
  "Hello! [Business Name] team here. Sorry we were away from the phone. Send your message here and we'll assist!",
];

export default function TemplatesPage() {
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"sms" | "whatsapp">("sms");
  const [successMsg, setSuccessMsg] = useState("");
  const [channelStatus, setChannelStatus] = useState<ChannelStatus>({
    configured: false,
    senders: [],
    whatsappConfigured: false,
  });
  const [senderModalOpen, setSenderModalOpen] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderUseCase, setSenderUseCase] = useState<"promotional" | "transactional">("transactional");
  const [senderNotes, setSenderNotes] = useState("");
  const [showNamingRules, setShowNamingRules] = useState(false);
  const [registeringSender, setRegisteringSender] = useState(false);
  const [senderError, setSenderError] = useState("");
  const [senderStatusMessage, setSenderStatusMessage] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [smsTemplate, setSmsTemplate] = useState("");
  const [whatsappTemplate, setWhatsappTemplate] = useState("");
  const [templateIndex, setTemplateIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [{ data }, headers] = await Promise.all([
          supabase.from("businesses").select("*").limit(1).single(),
          getAuthenticatedHeaders(),
        ]);
        const statusResponse = await fetch("/api/sailup/senders", { cache: "no-store", headers });
        const status = await statusResponse.json() as ChannelStatus;
        if (cancelled) return;
        if (data) {
          setBusiness(data);
          setBusinessName(data.name || "My Business");
          setSmsTemplate(data.sms_template || smsLibrary[0]);
          setWhatsappTemplate(data.whatsapp_template || whatsappLibrary[0]);
        }
        if (statusResponse.ok) setChannelStatus(status);
        else setChannelStatus({ configured: false, senders: [], whatsappConfigured: false, error: status.error || "Could not load Sender ID status." });
      } catch {
        if (!cancelled) {
          setChannelStatus({ configured: false, senders: [], whatsappConfigured: false, error: "Could not load Sender ID status. Please refresh the page or sign in again." });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRegisterSender(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegisteringSender(true);
    setSenderError("");
    setSenderStatusMessage("");

    const trimmedName = senderName.trim();
    if (!/^[A-Za-z0-9 ]{1,11}$/.test(trimmedName)) {
      setSenderError("Use 1–11 letters, numbers, or spaces.");
      setRegisteringSender(false);
      return;
    }
    const sampleMessage = senderUseCase === "transactional"
      ? `${trimmedName}: Thanks for contacting ${businessName || trimmedName}. We missed your call. Reply to let us know how we can help. Reply STOP to opt out.`
      : `${trimmedName}: Thanks for connecting with ${businessName || trimmedName}. Reply to learn more about our services. Reply STOP to opt out.`;

    try {
      const authHeaders = await getAuthenticatedHeaders();
      const response = await fetch("/api/sailup/senders", {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeaders },
        body: JSON.stringify({
          name: trimmedName,
          use_case: senderUseCase,
          notes: senderNotes,
          sample_message: sampleMessage.slice(0, 500),
        }),
      });
      const result = await response.json() as { sender?: SailupSender; error?: string };
      if (!response.ok || !result.sender) throw new Error(result.error || "Sender ID registration failed.");
      setSenderStatusMessage(`${result.sender.name} submitted. Status: ${result.sender.status}. Sender ID: ${result.sender.id}`);
      setSenderModalOpen(false);
      setSenderName("");
      setSenderNotes("");
      try {
        const refresh = await fetch("/api/sailup/senders", { cache: "no-store", headers: authHeaders });
        const status = await refresh.json() as ChannelStatus;
        if (refresh.ok) setChannelStatus(status);
        else setChannelStatus((current) => ({ ...current, error: status.error || "Registration submitted, but sender status could not be refreshed." }));
      } catch {
        setChannelStatus((current) => ({ ...current, error: "Registration submitted, but sender status could not be refreshed." }));
      }
    } catch (error) {
      setSenderError(error instanceof Error ? error.message : "Sender ID registration failed.");
    } finally {
      setRegisteringSender(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (business?.id) {
      await supabase.from("businesses").update({
        name: businessName,
        sms_template: smsTemplate,
        whatsapp_template: whatsappTemplate
      }).eq("id", business.id);
    }
    setSaving(false);
    setSuccessMsg("Saved");
    setTimeout(() => setSuccessMsg(""), 2000);
  }

  function handleShuffleTemplate() {
    if (activeTab === "sms") {
      const nextIdx = (templateIndex + 1) % smsLibrary.length;
      setTemplateIndex(nextIdx);
      setSmsTemplate(smsLibrary[nextIdx]);
    } else {
      const nextIdx = (templateIndex + 1) % whatsappLibrary.length;
      setTemplateIndex(nextIdx);
      setWhatsappTemplate(whatsappLibrary[nextIdx]);
    }
    setSuccessMsg("Loaded");
    setTimeout(() => setSuccessMsg(""), 1500);
  }

  function insertTag(tag: string) {
    if (activeTab === "sms") {
      setSmsTemplate((prev) => prev + " " + tag);
    } else {
      setWhatsappTemplate((prev) => prev + " " + tag);
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-xs font-mono text-zinc-500 bg-transparent">Loading templates...</div>;
  }

  const currentText = activeTab === "sms" ? smsTemplate : whatsappTemplate;
  const activeSender = channelStatus.senders.find((sender) => sender.status === "active" && sender.is_default)
    ?? channelStatus.senders.find((sender) => sender.status === "active")
    ?? null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 pb-20 px-2 sm:px-0 bg-transparent min-h-screen text-zinc-900 dark:text-zinc-100 font-sans text-[11px]">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-[#282B29] pb-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-[9px] font-mono tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">y&apos;elllo / Automation</span>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Message Templates</h2>
        </div>
        <div className="flex items-center gap-2">
        <Button type="button" variant="primary" size="sm" onClick={() => { setSenderError(""); setSenderModalOpen(true); }}>
          Register Sender ID
        </Button>
        {successMsg && (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3 h-3" /> {successMsg}
          </span>
        )}
        </div>
      </div>

      {senderStatusMessage && (
        <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-[11px] text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
          {senderStatusMessage}
        </div>
      )}
      {channelStatus.error && (
        <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-[11px] text-rose-800 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300">
          {channelStatus.error}
        </div>
      )}
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-[#282B29] dark:bg-[#191B1A]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100">Sailup Sender ID</h3>
            <p className="mt-1 text-[10px] text-zinc-600 dark:text-zinc-400">
              {activeSender
                ? `Active sender: ${activeSender.name} · ${activeSender.id}`
                : channelStatus.configured
                  ? "SMS follow-ups are blocked until a Sender ID is approved and active."
                  : "SMS follow-ups are blocked until Sailup is configured and a Sender ID is active."}
            </p>
            {channelStatus.senders.filter((sender) => sender.status !== "active").map((sender) => (
              <p key={sender.id} className="mt-1 text-[10px] text-amber-800 dark:text-amber-300">
                {sender.name} · {sender.id} · {sender.status}{sender.status_reason ? `: ${sender.status_reason}` : ""}
              </p>
            ))}
          </div>
          <Link href="/dashboard/templates" className="sr-only">Sender ID setup</Link>
        </div>
        {!activeSender && <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">Register a Sender ID below. Approval normally takes 1–3 business days.</p>}
        {!channelStatus.whatsappConfigured && <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">WhatsApp sending is disabled until WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are configured on the server.</p>}
      </section>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Segmented Tab Control */}
        <div className="grid grid-cols-2 gap-1.5 bg-zinc-100 dark:bg-[#141615] p-1.5 rounded-xl border border-zinc-200 dark:border-[#282B29]">
          <Button
            type="button"
            onClick={() => setActiveTab("sms")}
            variant={activeTab === "sms" ? "neutral" : "ghost"}
            size="sm"
            className={`py-2 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 ${
              activeTab === "sms"
                ? "bg-white dark:bg-[#191B1A] text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200 dark:border-[#282B29]"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> SMS Auto-Reply
          </Button>
          <Button
            type="button"
            onClick={() => setActiveTab("whatsapp")}
            variant={activeTab === "whatsapp" ? "neutral" : "ghost"}
            size="sm"
            className={`py-2 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 ${
              activeTab === "whatsapp"
                ? "bg-white dark:bg-[#191B1A] text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200 dark:border-[#282B29]"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> WhatsApp Auto-Reply
          </Button>
        </div>

        {/* Business Name Config Card */}
        <div className="bg-white dark:bg-[#191B1A] border border-zinc-200 dark:border-[#282B29] rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 block">Sender Business Name</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Used dynamically for the <code className="font-mono text-xs text-[#EAB308]">[Business Name]</code> tag.</span>
          </div>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Shop Name"
            className="w-48 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#282B29] bg-zinc-50/50 dark:bg-[#141615] text-[11px] font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 font-mono"
          />
        </div>

        {/* Editor & Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Editor Column */}
          <div className="md:col-span-7 space-y-3 bg-white dark:bg-[#191B1A] rounded-xl border border-zinc-200 dark:border-[#282B29] p-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Message Editor</label>
                <Button
                  type="button"
                  onClick={handleShuffleTemplate}
                  variant="neutral"
                  size="xs"
                  className="font-medium"
                >
                  <RefreshCw className="w-3 h-3 text-zinc-500" /> Generate Preset
                </Button>
              </div>

              <textarea
                rows={5}
                value={currentText}
                onChange={(e) => (activeTab === "sms" ? setSmsTemplate(e.target.value) : setWhatsappTemplate(e.target.value))}
                className="w-full resize-none rounded-lg border border-zinc-200 dark:border-[#282B29] bg-zinc-50/50 dark:bg-[#141615] p-3 text-[11px] font-normal leading-relaxed text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                placeholder="Type your auto-reply template..."
              />
            </div>

            {/* Quick Insert Tags */}
            <div className="pt-2 border-t border-zinc-100 dark:border-[#282B29] flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-mono">Insert tag:</span>
              <Button
                type="button"
                onClick={() => insertTag("[Business Name]")}
                variant="neutral"
                size="xs"
                className="font-mono font-medium"
              >
                [Business Name]
              </Button>
              <Button
                type="button"
                onClick={() => insertTag("[Time]")}
                variant="neutral"
                size="xs"
                className="font-mono font-medium"
              >
                [Time]
              </Button>
            </div>
          </div>

          {/* Compact Device Mockup Preview Column */}
          <div className="md:col-span-5 flex flex-col">
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">Live Preview</span>
            <div className="flex-1 bg-zinc-50 dark:bg-[#141615] rounded-xl border border-zinc-200 dark:border-[#282B29] p-4 flex flex-col justify-center relative overflow-hidden shadow-sm min-h-[180px]">
              {/* Phone Speaker Notch Graphic */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />

              {/* Notification Bubble */}
              <div className="mt-3 bg-white dark:bg-[#191B1A] rounded-lg p-3 shadow-sm border border-zinc-200 dark:border-[#282B29] space-y-1.5">
                <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{businessName || "y'elllo"}</span>
                  <span>Just now</span>
                </div>
                <p className="text-[11px] font-normal text-zinc-800 dark:text-zinc-200 leading-snug break-words">
                  {currentText.replace(/\[Business Name\]/g, businessName || "Our Shop")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-2 border-t border-zinc-200 dark:border-[#282B29] flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            variant="primary"
            size="sm"
            className="w-full sm:w-auto"
          >
            {saving ? "Saving Templates..." : "Save Templates"}
          </Button>
        </div>
      </form>

      {senderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !registeringSender) setSenderModalOpen(false);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="register-sender-title" className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-[#282B29] dark:bg-[#191B1A]">
            <h2 id="register-sender-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Register sender ID</h2>
            <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">Up to 11 characters. Approval takes 1–3 business days.</p>
            <form className="mt-4 space-y-4" onSubmit={handleRegisterSender}>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="sender-name" className="form-label text-zinc-800 dark:text-zinc-200">Sender name</label>
                  <Button type="button" variant="ghost" size="xs" onClick={() => setShowNamingRules((shown) => !shown)} aria-expanded={showNamingRules}>
                    Naming rules
                  </Button>
                </div>
                {showNamingRules && <p className="mb-2 rounded-md bg-zinc-100 p-2 text-[10px] leading-5 text-zinc-700 dark:bg-[#141615] dark:text-zinc-300">Use only letters, numbers, and spaces. Sender names can be up to 11 characters.</p>}
                <input id="sender-name" name="name" required maxLength={11} value={senderName} onChange={(event) => setSenderName(event.target.value)} className="form-input" autoComplete="off" />
                <p className="mt-1 text-right text-[9px] text-zinc-500 dark:text-zinc-400">{senderName.length}/11</p>
              </div>
              <div>
                <label htmlFor="sender-use-case" className="form-label text-zinc-800 dark:text-zinc-200">Use case</label>
                <select id="sender-use-case" value={senderUseCase} onChange={(event) => setSenderUseCase(event.target.value as "promotional" | "transactional")} className="form-input">
                  <option value="promotional">Promotional</option>
                  <option value="transactional">Transactional</option>
                </select>
              </div>
              <div>
                <label htmlFor="sender-notes" className="form-label text-zinc-800 dark:text-zinc-200">Notes (optional)</label>
                <textarea id="sender-notes" value={senderNotes} maxLength={500} onChange={(event) => setSenderNotes(event.target.value)} className="form-input min-h-20" placeholder="Anything else the reviewer should know" />
              </div>
              {senderError && <p role="alert" className="rounded-md border border-rose-300 bg-rose-50 p-2 text-[10px] text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{senderError}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="neutral" size="sm" disabled={registeringSender} onClick={() => setSenderModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={registeringSender} loading={registeringSender}>Register</Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}