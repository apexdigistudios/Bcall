import { supabase } from "@/lib/supabase";
import { Smartphone, Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let devices: any[] = [];
  try {
    const res = await supabase.from("android_devices").select("*");
    devices = res.data || [];
  } catch (err) {
    console.error("Error fetching devices:", err);
  }

  const activeDevice = devices[0] || null;

  return (
    <div className="space-y-5 max-w-4xl mx-auto px-2 sm:px-0 bg-transparent min-h-screen text-zinc-900 dark:text-zinc-100 font-sans text-[11px] pb-20">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-[#282B29] pb-4 flex items-center justify-between">
        <div>
          <span className="text-[9px] font-mono tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">y'elllo / System</span>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">System Settings</h2>
        </div>
        <span className="text-[9px] px-2.5 py-1 rounded-md bg-white dark:bg-[#191B1A] text-zinc-700 dark:text-zinc-300 font-mono border border-zinc-200 dark:border-[#282B29] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Production Environment
        </span>
      </div>

      {/* Group 1: Companion Device Status */}
      <div className="bg-white dark:bg-[#191B1A] rounded-xl border border-zinc-200 dark:border-[#282B29] p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#282B29] pb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#141615] border border-zinc-200 dark:border-[#282B29] flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0 font-bold">
              <Smartphone className="w-4 h-4 text-[#EAB308]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-[11px] text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Paired Android Gateway</h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Background call-monitoring SIM phone</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-md text-[9px] font-semibold font-mono shrink-0 ${activeDevice?.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-[#282B29]'}`}>
            {activeDevice?.status === 'active' ? 'Connected' : 'Not Paired'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-lg bg-zinc-50/50 dark:bg-[#141615] border border-zinc-200 dark:border-[#282B29] space-y-1">
            <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">Business Name</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate font-mono text-xs">{activeDevice?.business_name || "Not set"}</span>
          </div>
          <div className="p-3.5 rounded-lg bg-zinc-50/50 dark:bg-[#141615] border border-zinc-200 dark:border-[#282B29] space-y-1">
            <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">Device Label</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate font-mono text-xs">{activeDevice?.device_label || "Shop Phone"}</span>
          </div>
        </div>
      </div>

      {/* Group 2: Notification & System Preferences */}
      <div className="bg-white dark:bg-[#191B1A] rounded-xl border border-zinc-200 dark:border-[#282B29] p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-[#282B29] pb-3.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#141615] border border-zinc-200 dark:border-[#282B29] flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0 font-bold">
            <Bell className="w-4 h-4 text-[#EAB308]" />
          </div>
          <div>
            <h3 className="font-bold text-[11px] text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Lead Capture Alerts</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Configure instant push notification behavior</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs py-1">
          <div>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 block text-[11px]">Local Device Notification</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Show popup on phone when a missed call registers</span>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[9px] bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 font-semibold font-mono shrink-0">
            Enabled
          </span>
        </div>
      </div>
    </div>
  );
}