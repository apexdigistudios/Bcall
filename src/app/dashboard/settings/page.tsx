import { supabase } from "@/lib/supabase";
import { Smartphone, Shield, Key, Bell, Save, CheckCircle2 } from "lucide-react";

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
    <div className="space-y-4 max-w-2xl mx-auto px-2 sm:px-0 bg-white min-h-screen text-[#111214] font-sans pb-20">
      {/* Header */}
      <div className="pt-2 border-b border-neutral-100 pb-3 flex items-center justify-between">
        <div>
          <span className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase">y'elllo / System</span>
          <h2 className="text-lg font-bold tracking-tight text-[#111214]">Settings</h2>
        </div>
      </div>

      {/* Companion Device Status */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[#111214] shrink-0 font-bold">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-xs text-[#111214] truncate">Paired Android Device</h3>
              <p className="text-[10px] text-neutral-500 truncate">Background call-monitoring phone</p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold font-mono shrink-0 ${activeDevice?.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'}`}>
            {activeDevice?.status === 'active' ? 'Connected' : 'Not Paired'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-neutral-50/50 border border-neutral-200/80">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide block">Business Name</span>
            <span className="font-bold text-[#111214] mt-0.5 block truncate">{activeDevice?.business_name || "Not set"}</span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50/50 border border-neutral-200/80">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide block">Device Label</span>
            <span className="font-bold text-[#111214] mt-0.5 block truncate">{activeDevice?.device_label || "Shop Phone"}</span>
          </div>
        </div>
      </div>

      {/* Webhook Endpoint Info */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
          <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[#111214] shrink-0 font-bold">
            <Key className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-[#111214]">API Webhook Endpoint</h3>
            <p className="text-[10px] text-neutral-500">Where your Android APK transmits captured missed calls</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide block">Vercel API Route</label>
          <input
            type="text"
            readOnly
            value="/api/android/calls"
            className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-mono text-[#111214] outline-none"
          />
          <p className="text-[10px] text-neutral-400 leading-relaxed">
            Ensure your Android companion app is configured to point to this route on your deployed domain.
          </p>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
          <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[#111214] shrink-0 font-bold">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-[#111214]">Lead Capture Alerts</h3>
            <p className="text-[10px] text-neutral-500">Configure instant push notification behavior</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs py-1">
          <div>
            <span className="font-semibold text-[#111214] block text-xs">Local Device Notification</span>
            <span className="text-[10px] text-neutral-500">Show popup on phone when a missed call registers</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold font-mono shrink-0">
            Enabled
          </span>
        </div>
      </div>
    </div>
  );
}