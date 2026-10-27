import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { pairingCode, deviceLabel } = await req.json();

    if (!pairingCode) {
      return NextResponse.json({ error: "Pairing code is required." }, { status: 400 });
    }

    const codeHash = crypto.createHash("sha256").update(pairingCode.trim()).digest("hex");
    const nowISO = new Date().toISOString();

    // 1. Find valid, unexpired, unused pairing code
    const { data: codeRecord, error: codeQueryError } = await supabase
      .from("android_pairing_codes")
      .select("*")
      .eq("code_hash", codeHash)
      .is("used_at", null)
      .gt("expires_at", nowISO)
      .single();

    if (codeQueryError || !codeRecord) {
      return NextResponse.json({ error: "Invalid or expired pairing code." }, { status: 400 });
    }

    // 2. Mark code as used
    await supabase
      .from("android_pairing_codes")
      .update({ used_at: nowISO })
      .eq("id", codeRecord.id);

    // 3. Generate secure per-device credential token
    const rawCredential = "cb_live_" + crypto.randomBytes(32).toString("hex");
    const credentialHash = crypto.createHash("sha256").update(rawCredential).digest("hex");

    // 4. Register the device
    const { data: deviceRecord, error: deviceInsertError } = await supabase
      .from("android_devices")
      .insert({
        business_name: codeRecord.business_name,
        device_label: deviceLabel || "Shop Companion Phone",
        credential_hash: credentialHash,
        status: "active",
        last_seen_at: nowISO,
      })
      .select()
      .single();

    if (deviceInsertError) {
      throw deviceInsertError;
    }

    // Return the raw credential ONCE to the Android app
    return NextResponse.json({
      success: true,
      deviceId: deviceRecord.id,
      deviceCredential: rawCredential,
      businessName: codeRecord.business_name,
    });
  } catch (err: any) {
    console.error("Pairing API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}