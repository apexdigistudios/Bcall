import { supabase } from "@/lib/supabase";
import { PhoneCall, Smartphone, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";
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
    <div className="space-y-6">
      {/* Database Connection Error Banner */}
      {connectionError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-2">
          <div className="flex items-center gap-3 font-semibold text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            Supabase HTTPS Connection Error
          </div>
          <p className="text-xs font-mono bg-white/80 p-2 rounded border border-red-200 overflow-x-auto">
            {connectionError}
          </p>
          <p className="text-xs text-red-700">
            Please check your <code>.env</code> file. Ensure your <code>NEXT_PUBLIC_SUPABASE_URL</code> and API keys are correct.
          </p>
        </div>
      )}

      {/* Verification Banner */}
      {!connectionError && activeDevicesCount === 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm font-medium">
              No active Android companion phone paired. Pair your shop phone to start recovering missed calls on MTN & Telecel.
            </p>
          </div>
          <Link href="/dashboard/devices" className="px-4 py-2 rounded-lg bg-[#111214] text-white text-xs font-semibold hover:bg-black transition-colors shrink-0">
            Pair Device Now
          </Link>
        </div>
      )}

      {/* Metric Cards Bento Grid - Responsive auto-adjustment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 md:p-6 bg-white rounded-2xl border border-[#e7e7e9] shadow-sm">
          <p className="text-xs font-medium text-[#686b73]">Missed Calls (30 Days)</p>
          <h3 className="text-3xl font-bold mt-2 text-[#111214]">{totalMissed}</h3>
          <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% captured from companion phone
          </p>
        </div>

        <div className="p-5 md:p-6 bg-white rounded-2xl border border-[#e7e7e9] shadow-sm">
          <p className="text-xs font-medium text-[#686b73]">Paired Android Devices</p>
          <h3 className="text-3xl font-bold mt-2 text-[#111214]">{activeDevicesCount}</h3>
          <p className="text-xs text-[#686b73] mt-2">Active on shop SIM cards</p>
        </div>

        <div className="p-5 md:p-6 bg-white rounded-2xl border border-[#e7e7e9] shadow-sm flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-xs font-medium text-[#686b73]">Quick Action</p>
            <h4 className="font-semibold text-sm mt-1 text-[#111214]">Connect Companion Phone</h4>
          </div>
          <Link href="/dashboard/devices" className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#f5c62e] text-[#111214] font-semibold text-xs text-center hover:bg-[#e6b825] transition-colors">
            Generate Pairing Code
          </Link>
        </div>
      </div>

      {/* Missed Calls Inbox Table */}
      <div className="bg-white rounded-2xl border border-[#e7e7e9] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#e7e7e9] flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base">Recent Missed Calls</h2>
            <p className="text-xs text-[#686b73]">Instant lead recovery for Ghanaian local business</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#f7f7f5] text-[#686b73] font-medium border border-[#e7e7e9]">
            {calls.length} Total Leads
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-[#e7e7e9] bg-[#f7f7f5]/50 text-[#686b73] text-xs font-semibold">
                <th className="py-3 px-6">Caller Number</th>
                <th className="py-3 px-6">Outcome</th>
                <th className="py-3 px-6">Time Received</th>
                <th className="py-3 px-6">Lead Status</th>
                <th className="py-3 px-6 text-right">Instant Follow-up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e7e9] text-sm">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#686b73]">
                    {connectionError ? "Unable to load calls due to database connection issue." : "No missed calls recorded yet. When customers call your paired phone and it rings out, they will appear here instantly."}
                  </td>
                </tr>
              ) : (
                calls.map((call) => {
                  const number = call.caller_number || call.callerNumber || "";
                  return (
                    <tr key={call.id} className="hover:bg-[#f7f7f5]/40 transition-colors">
                      <td className="py-4 px-6 font-semibold font-mono text-[#111214]">
                        {number}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          {call.call_outcome || call.callOutcome || "missed"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-[#686b73]">
                        {call.created_at ? new Date(call.created_at).toLocaleString() : "Just now"}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          {call.lead_status || call.leadStatus || "new"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        <a
                          href={`tel:${number}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111214] text-white text-xs font-medium hover:bg-black transition-colors"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Call
                        </a>
                        <a
                          href={`https://wa.me/${number.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
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