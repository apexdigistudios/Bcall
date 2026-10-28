import { supabase } from "@/lib/supabase";
import { Smartphone, Plus, ShieldCheck, Trash2, AlertCircle, Copy, KeyRound, Clock, CheckCircle2 } from "lucide-react";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import DevicesClientWrapper from "./DevicesClientWrapper";

export const dynamic = "force-dynamic";

export default async function DevicesPage({
  searchParams,
}: {
  searchParams: Promise<{ generated?: string; code?: string; biz?: string; exp?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawCode = resolvedSearchParams?.code;
  const bizName = resolvedSearchParams?.biz;
  const expiresAtParam = resolvedSearchParams?.exp;

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
    redirect(`/dashboard/devices?code=${generatedRawCode}&biz=${encodeURIComponent(businessName)}&exp=${expiresAt}`);
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
    <DevicesClientWrapper
      initialDevices={deviceList}
      error={error?.message || null}
      rawCode={rawCode}
      bizName={bizName}
      expiresAt={expiresAtParam}
      handleGenerateCode={handleGenerateCode}
      handleRevokeDevice={handleRevokeDevice}
    />
  );
}