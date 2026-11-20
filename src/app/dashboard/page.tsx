import { supabase } from "@/lib/supabase";
import { Smartphone, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SmsFollowupButton, WhatsAppFollowupButton } from "@/components/MissedCallActions";
import { getPrimarySailupSender, getSailupSenders, hasSailupApiKey, isWhatsAppConfigured, SailupError } from "@/lib/sailup";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let devices: any[] = [];
  let calls: any[] = [];
  let connectionError: string | null = null;
  const sailupConfigured = hasSailupApiKey();
  const whatsappConfigured = isWhatsAppConfigured();
  let sender: Awaited<ReturnType<typeof getPrimarySailupSender>> = null;
  let senderStatusError = false;

  try {
    const devicesRes = await supabase.from("android_devices").select("*");
    if (devicesRes.error) throw devicesRes.error;
    devices = devicesRes.data || [];

    const callsRes = await supabase
      .from("call_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (callsRes.error) throw callsRes.error;
    calls = callsRes.data || [];
  } catch (error: any) {
    console.error("Supabase query error:", error);
    connectionError = error?.message || "Failed to query Supabase.";
  }

  if (sailupConfigured) {
    try {
      sender = getPrimarySailupSender(await getSailupSenders());
    } catch (error) {
      senderStatusError = true;
      console.error(JSON.stringify({
        event: "dashboard.sailup_status_failed",
        errorName: error instanceof Error ? error.name : "UnknownError",
        status: error instanceof SailupError ? error.status : undefined,
      }));
    }
  }

  const totalMissed = calls.length;
  const activeDevicesCount = devices.filter((d) => d.status === "active").length;

  return (
    <div className="w-full min-w-0 space-y-5 bg-transparent text-zinc-900 dark:text-zinc-100 pb-20 px-2 sm:px-0 text-[11px]">
      {/* Database Connection Error Banner */}
      {connectionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400 shrink-0" />
            Supabase Connection Error
          </div>
          <p className="text-[10px] font-mono bg-white dark:bg-[#141615] p-2 rounded-lg border border-rose-200 dark:border-rose-900/50 overflow-x-auto text-rose-800 dark:text-rose-300">
            {connectionError}
          </p>
        </div>
      )}

      {/* Device Pairing Notice Banner */}
      {!connectionError && activeDevicesCount === 0 && (
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#191B1A] border border-zinc-200 dark:border-[#282B29] text-zinc-900 dark:text-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-yellow-500/15 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            </div>
            <div>
              <p className="text-[11px] font-semibold">No active companion phone paired</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Pair your device to start capturing and auto-responding to missed calls.</p>
            </div>
          </div>
          <Button render={<Link href="/dashboard/devices" />} variant="primary" size="sm" className="shrink-0 rounded-lg px-3 text-[11px]">
            Pair Device
          </Button>
        </div>
      )}

      {/* Compact Bento Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-[#191B1A] rounded-xl border border-zinc-200 dark:border-[#282B29] shadow-sm space-y-1.5">
          <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">Missed Leads</span>
          <h3 className="text-2xl font-bold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">{totalMissed}</h3>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Captured in real-time
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#191B1A] rounded-xl border border-zinc-200 dark:border-[#282B29] shadow-sm space-y-1.5">
          <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">Active Devices</span>
          <h3 className="text-2xl font-bold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">{activeDevicesCount}</h3>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Connected SIM gateway</p>
        </div>

        <div className="p-4 bg-white dark:bg-[#191B1A] rounded-xl border border-zinc-200 dark:border-[#282B29] shadow-sm flex flex-col justify-between">
          <div className="min-w-0">
            <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">SMS Sender ID</span>
            <h4 className="font-bold text-[11px] mt-1 truncate text-zinc-900 dark:text-zinc-100">
              {sender?.name || "Not configured"}
            </h4>
            <p className="text-[10px] mt-0.5 truncate text-zinc-500 dark:text-zinc-400">
              Sender ID: {sender?.id || "—"}
            </p>
            <p className={`text-[9px] mt-1 font-medium ${sender?.status === "active" ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
              {senderStatusError ? "Status unavailable" : sender?.status ? sender.status[0].toUpperCase() + sender.status.slice(1) : sailupConfigured ? "No sender registered" : "Not configured"}
            </p>
          </div>
          <Button render={<Link href="/dashboard/templates" />} variant="neutral" size="sm" className="mt-3 w-full rounded-lg px-2.5 text-[11px]">
            View
          </Button>
        </div>

        <div className="p-4 bg-white dark:bg-[#191B1A] rounded-xl border border-zinc-200 dark:border-[#282B29] shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">Quick Action</span>
            <h4 className="font-bold text-[11px] mt-0.5 text-zinc-900 dark:text-zinc-100">Companion Setup</h4>
          </div>
          <Button render={<Link href="/dashboard/devices" />} variant="primary" size="sm" className="mt-3 w-full rounded-lg px-2.5 text-[11px]">
            Pair Phone
          </Button>
        </div>
      </div>

      {/* Missed Calls Inbox Section */}
      <div className="w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-[#282B29] bg-white dark:bg-[#191B1A] shadow-sm">
        <div className="flex items-center justify-between p-3.5 border-b border-zinc-200 dark:border-[#282B29] bg-zinc-50/50 dark:bg-[#141615]/50">
          <div>
            <h2 className="font-bold text-[11px] uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Missed Call Logs</h2>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Instant automated lead recovery stream</p>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-white dark:bg-[#191B1A] text-zinc-700 dark:text-zinc-300 font-mono border border-zinc-200 dark:border-[#282B29]">
            {calls.length} Leads
          </span>
        </div>

        {/* Mobile Feed View */}
        <div className="space-y-2.5 p-3 xl:hidden">
          {calls.length === 0 ? (
            <div className="py-10 text-center space-y-1.5">
              <MessageSquare className="w-7 h-7 mx-auto text-zinc-300 dark:text-zinc-700 stroke-[1.5]" />
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {connectionError ? "Database connection error." : "No missed calls recorded yet."}
              </p>
            </div>
          ) : calls.map((call) => {
            const number = call.phone_number || call.caller_number || call.callerNumber || "Unknown";
            return (
              <article key={call.id} className="rounded-lg border border-zinc-200 dark:border-[#282B29] bg-zinc-50/50 dark:bg-[#141615]/50 p-3 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[11px] font-bold text-zinc-900 dark:text-zinc-100">{number}</p>
                    {call.contact_name && <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{call.contact_name}</p>}
                  </div>
                  <span className="rounded-md bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/20 px-2 py-0.5 text-[9px] font-semibold font-mono text-rose-700 dark:text-rose-400">
                    {call.lead_status || "missed"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200/60 dark:border-[#282B29]">
                  <span>{call.created_at ? new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}</span>
                  <div className="flex flex-wrap gap-1.5">
                    <SmsFollowupButton callEventId={String(call.id)} enabled={Boolean(sender && sender.status === "active")} />
                    <WhatsAppFollowupButton
                      recipient={number}
                      message="Hello! We missed your call at our shop. How can we help you today?"
                      enabled={whatsappConfigured}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden overflow-x-auto xl:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-[#282B29] bg-zinc-50/50 dark:bg-[#141615]/50 text-zinc-500 dark:text-zinc-400 text-[9px] font-mono uppercase tracking-wider">
                <th className="py-2.5 px-4">Caller Number</th>
                <th className="py-2.5 px-4">Time Received</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-[#282B29] text-[11px]">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-zinc-500 dark:text-zinc-400">
                    {connectionError ? "Unable to load calls." : "No missed calls recorded yet."}
                  </td>
                </tr>
              ) : (
                calls.map((call) => {
                  const number = call.phone_number || call.caller_number || call.callerNumber || "Unknown";

                  return (
                    <tr key={call.id} className="hover:bg-zinc-50/60 dark:hover:bg-[#141615]/40 transition-colors">
                      <td className="py-3 px-4 font-bold font-mono text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-2">
                          <span>{number}</span>
                          {call.contact_name && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-sans font-normal">
                              {call.contact_name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                        {call.created_at ? new Date(call.created_at.replace(" ", "T")).toLocaleString() : "Just now"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 font-mono">
                          {call.lead_status || call.leadStatus || "missed"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-start gap-1.5">
                          <SmsFollowupButton callEventId={String(call.id)} enabled={Boolean(sender && sender.status === "active")} />
                          <WhatsAppFollowupButton
                            recipient={number}
                            message="Hello! We missed your call at our shop. How can we help you today?"
                            enabled={whatsappConfigured}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}