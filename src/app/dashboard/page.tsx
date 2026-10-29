import { supabase } from "@/lib/supabase";
import { PhoneCall, Smartphone, MessageSquare, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let devices: any[] = [];
  let calls: any[] = [];
  let connectionError: string | null = null;

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

  const totalMissed = calls.length;
  const activeDevicesCount = devices.filter((d) => d.status === "active").length;

  return (
    <div className="w-full min-w-0 space-y-4 bg-white min-h-screen text-[#111214] pb-20 px-2 sm:px-0">
      {/* Database Connection Error Banner */}
      {connectionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            Supabase Connection Error
          </div>
          <p className="text-[10px] font-mono bg-white p-2 rounded border border-rose-200 overflow-x-auto">
            {connectionError}
          </p>
        </div>
      )}

      {/* Device Pairing Notice Banner */}
      {!connectionError && activeDevicesCount === 0 && (
        <div className="p-3.5 rounded-xl bg-neutral-100 border border-neutral-200 text-[#111214] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs font-medium">
              No active companion phone paired. Pair your device to start capturing missed calls.
            </p>
          </div>
          <Link href="/dashboard/devices" className="px-3.5 py-1.5 rounded-lg bg-black text-[#f5c62e] text-[11px] font-bold hover:bg-neutral-900 transition-colors shrink-0">
            Pair Device
          </Link>
        </div>
      )}

      {/* Compact Bento Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 shadow-sm space-y-1">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">Missed Leads</span>
          <h3 className="text-2xl font-black text-[#111214]">{totalMissed}</h3>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Captured in real-time
          </p>
        </div>

        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 shadow-sm space-y-1">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">Active Devices</span>
          <h3 className="text-2xl font-black text-[#111214]">{activeDevicesCount}</h3>
          <p className="text-[11px] text-neutral-500">Connected SIM gateway</p>
        </div>

        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">Quick Action</span>
            <h4 className="font-bold text-xs mt-0.5 text-[#111214]">Companion Setup</h4>
          </div>
          <Link href="/dashboard/devices" className="mt-3 w-full py-2 px-3 rounded-xl bg-black text-[#f5c62e] font-bold text-[11px] text-center hover:bg-neutral-900 transition-colors flex items-center justify-center gap-1">
            Pair Phone <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Missed Calls Inbox Section */}
      <div className="w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50/50">
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wider text-[#111214]">Missed Call Logs</h2>
            <p className="text-[10px] text-neutral-500">Instant automated lead recovery stream</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-neutral-600 font-mono border border-neutral-200">
            {calls.length} Leads
          </span>
        </div>

        {/* Mobile Feed View */}
        <div className="space-y-2.5 p-3 xl:hidden">
          {calls.length === 0 ? (
            <p className="py-8 text-center text-xs text-neutral-400">
              {connectionError ? "Database connection error." : "No missed calls recorded yet."}
            </p>
          ) : calls.map((call) => {
            const number = call.phone_number || call.caller_number || call.callerNumber || "Unknown";
            const cleanPhone = number.replace(/\D/g, "");
            return (
              <article key={call.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-bold text-[#111214]">{number}</p>
                    {call.contact_name && <p className="text-[10px] text-neutral-500">{call.contact_name}</p>}
                  </div>
                  <span className="rounded-md bg-neutral-200 px-2 py-0.5 text-[9px] font-mono text-neutral-700">
                    {call.lead_status || "new"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1">
                  <span>{call.created_at ? new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}</span>
                  <div className="flex gap-1.5">
                    <a href={`tel:${number}`} className="px-2.5 py-1 rounded-lg bg-black text-white text-[10px] font-medium">Call</a>
                    <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg border border-neutral-300 bg-white text-[10px] font-medium text-[#111214]">WhatsApp</a>
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
              <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 text-[10px] font-mono uppercase">
                <th className="py-2.5 px-4">Caller Number</th>
                <th className="py-2.5 px-4">Outcome</th>
                <th className="py-2.5 px-4">Time Received</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400">
                    {connectionError ? "Unable to load calls." : "No missed calls recorded yet."}
                  </td>
                </tr>
              ) : (
                calls.map((call) => {
                  const number = call.phone_number || call.caller_number || call.callerNumber || "Unknown";
                  const cleanPhone = number.replace(/\D/g, "");

                  return (
                    <tr key={call.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold font-mono text-[#111214]">
                        <div className="flex items-center gap-2">
                          <span>{number}</span>
                          {call.contact_name && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 font-sans font-normal">
                              {call.contact_name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-700 font-mono">
                          {call.call_outcome || call.callOutcome || "missed"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-neutral-500 font-mono">
                        {call.created_at ? new Date(call.created_at.replace(" ", "T")).toLocaleString() : "Just now"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-800 font-mono">
                          {call.lead_status || call.leadStatus || "new"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <a
                          href={`tel:${number}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black text-white text-[11px] font-medium hover:bg-neutral-800 transition-colors"
                        >
                          <PhoneCall className="w-3 h-3" /> Call
                        </a>
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-300 bg-white text-[11px] font-medium text-[#111214] hover:bg-neutral-50 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </a>
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