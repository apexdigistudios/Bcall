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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#111214]">Settings</h2>
        <p className="text-xs text-[#686b73] mt-0.5">
          Manage your companion Android devices, webhook endpoints, and shop preferences.
        </p>
      </div>

      {/* Companion Device Status */}
      <div className="bg-white rounded-2xl border border-[#e7e7e9] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#e7e7e9] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#111214]">Paired Android Device</h3>
              <p className="text-xs text-[#686b73]">Your background call-monitoring companion phone</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${activeDevice?.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {activeDevice?.status === 'active' ? 'Connected' : 'Not Paired'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#f7f7f5] border border-[#e7e7e9]">
            <span className="text-[#686b73] block">Business Name</span>
            <span className="font-semibold text-[#111214] mt-0.5 block">{activeDevice?.business_name || "Not set"}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#f7f7f5] border border-[#e7e7e9]">
            <span className="text-[#686b73] block">Device Label</span>
            <span className="font-semibold text-[#111214] mt-0.5 block">{activeDevice?.device_label || "Shop Phone"}</span>
          </div>
        </div>
      </div>

      {/* Webhook Endpoint Info */}
      <div className="bg-white rounded-2xl border border-[#e7e7e9] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-[#e7e7e9] pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#111214]">API Webhook Endpoint</h3>
            <p className="text-xs text-[#686b73]">Where your Android APK transmits captured missed calls</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#686b73]">Vercel API Route</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value="/api/android/calls"
              className="w-full px-3.5 py-2 rounded-xl bg-[#f7f7f5] border border-[#e7e7e9] text-xs font-mono text-[#111214] outline-none"
            />
          </div>
          <p className="text-[11px] text-[#686b73]">
            Ensure your Android app is configured to point to this route on your deployed Vercel domain.
          </p>
        </div>
      </div>

      {/* Notification & Alert Preferences */}
      <div className="bg-white rounded-2xl border border-[#e7e7e9] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-[#e7e7e9] pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#111214]">Lead Capture Alerts</h3>
            <p className="text-xs text-[#686b73]">Configure instant push notification behavior</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs py-2">
          <div>
            <span className="font-semibold text-[#111214] block">Local Device Notification</span>
            <span className="text-[#686b73]">Show "New Lead Captured!" popup on phone when a missed call registers</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            Enabled in APK
          </span>
        </div>
      </div>
    </div>
  );
}