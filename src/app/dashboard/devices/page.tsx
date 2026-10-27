import { supabase } from "@/lib/supabase";
import { Smartphone, Plus, ShieldCheck, Trash2, AlertCircle, Copy, KeyRound } from "lucide-react";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DevicesPage({
  searchParams,
}: {
  searchParams: Promise<{ generated?: string; code?: string; biz?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawCode = resolvedSearchParams?.code;
  const bizName = resolvedSearchParams?.biz;

  // Fetch devices using Supabase HTTPS client
  const { data: devices, error } = await supabase
    .from("android_devices")
    .select("*")
    .order("created_at", { ascending: false });

  const deviceList = devices || [];

  // Server Action to generate pairing code
  async function handleGenerateCode(formData: FormData) {
    "use server";
    const businessName = (formData.get("businessName") as string) || "My Shop";
    const generatedRawCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const codeHash = crypto.createHash("sha256").update(generatedRawCode).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins from now

    const { error: insertError } = await supabase.from("android_pairing_codes").insert({
      business_name: businessName,
      code_hash: codeHash,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("Failed to insert pairing code:", insertError.message);
    }

    revalidatePath("/dashboard/devices");
    redirect(`/dashboard/devices?code=${generatedRawCode}&biz=${encodeURIComponent(businessName)}`);
  }

  async function handleRevokeDevice(formData: FormData) {
    "use server";
    const deviceId = formData.get("deviceId") as string;
    if (deviceId) {
      await supabase
        .from("android_devices")
        .update({ status: "revoked" })
        .eq("id", deviceId);
      revalidatePath("/dashboard/devices");
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Android Companion Devices</h2>
        <p className="text-xs text-[#686b73]">
          Pair your shop phone running MTN or Telecel to automatically detect and sync missed calls.
        </p>
      </div>

      {/* SUCCESS BANNER: Displays the generated pairing code */}
      {rawCode && (
        <div className="p-6 bg-[#111214] text-white rounded-2xl shadow-xl border border-[#f5c62e]/30 space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2 text-[#f5c62e]">
            <KeyRound className="w-5 h-5" />
            <h3 className="font-bold text-sm">Pairing Code Generated Successfully!</h3>
          </div>
          <p className="text-xs text-gray-300">
            Use this secure code inside your installed CallBackly Android companion app for <span className="font-semibold text-white">{decodeURIComponent(bizName || "your shop")}</span>. It expires in 10 minutes.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <div className="bg-white/10 border border-white/20 px-4 py-2.5 rounded-xl font-mono text-xl tracking-widest text-[#f5c62e] font-bold">
              {rawCode}
            </div>
          </div>
        </div>
      )}

      {/* Generate Pairing Code Box - Mobile Optimized */}
      <div className="p-5 md:p-6 bg-white rounded-2xl border border-[#e7e7e9] shadow-sm space-y-4">
        <div>
          <h3 className="font-semibold text-sm">Pair a New Phone</h3>
          <p className="text-xs text-[#686b73] mt-1">
            Generate a 10-minute secure pairing code. Enter this code inside your installed CallBackly Android companion app.
          </p>
        </div>
        <form action={handleGenerateCode} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            name="businessName"
            placeholder="Business / Shop Name"
            required
            className="px-3.5 py-2.5 rounded-xl border border-[#e7e7e9] text-sm bg-[#f7f7f5] focus:outline-none focus:border-[#111214] flex-1 text-[#111214]"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#f5c62e] text-[#111214] font-semibold text-xs hover:bg-[#e6b825] transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Generate Pairing Code
          </button>
        </form>
      </div>

      {/* Connected Devices List */}
      <div className="bg-white rounded-2xl border border-[#e7e7e9] overflow-hidden shadow-sm">
        <div className="p-5 md:p-6 border-b border-[#e7e7e9]">
          <h3 className="font-bold text-base">Connected Devices</h3>
          <p className="text-xs text-[#686b73]">Active Android phones monitoring incoming calls</p>
        </div>

        <div className="divide-y divide-[#e7e7e9]">
          {error && (
            <div className="p-6 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Error loading devices: {error.message}
            </div>
          )}

          {!error && deviceList.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#686b73]">
              No Android devices paired yet. Generate a pairing code above to connect your phone.
            </div>
          ) : (
            deviceList.map((device) => (
              <div key={device.id} className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f7f7f5] border border-[#e7e7e9] flex items-center justify-center text-[#111214] shrink-0 mt-0.5 sm:mt-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{device.device_label || "Shop Phone"}</h4>
                    <p className="text-xs text-[#686b73] mt-0.5">
                      Business: {device.business_name} • Last seen:{" "}
                      {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : "Never"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e7e7e9]">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      device.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {device.status}
                  </span>
                  {device.status === "active" && (
                    <form action={handleRevokeDevice}>
                      <input type="hidden" name="deviceId" value={device.id} />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                      >
                        Revoke
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}