import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { pairing_code, device_id, device_name } = await request.json();

    if (!pairing_code) {
      return NextResponse.json(
        { error: "Missing pairing code" },
        { status: 400 }
      );
    }

    // 1. Hash the incoming 6-digit code to match the hash stored in Supabase
    const codeHash = crypto
      .createHash("sha256")
      .update(pairing_code.trim())
      .digest("hex");

    // 2. Fetch active, non-expired pairing code from Supabase
    const { data: codeRecord, error: fetchError } = await supabaseAdmin
      .from("android_pairing_codes")
      .select("*")
      .eq("code_hash", codeHash)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (fetchError || !codeRecord) {
      return NextResponse.json(
        { error: "Invalid or expired pairing code" },
        { status: 400 }
      );
    }

    // 3. Register or update the companion phone in android_devices
    const { data: deviceRecord, error: deviceError } = await supabaseAdmin
      .from("android_devices")
      .insert({
        business_name: codeRecord.business_name,
        device_label: device_name || "Android Shop Phone",
        status: "active",
        last_seen_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (deviceError || !deviceRecord) {
      return NextResponse.json(
        { error: "Failed to register companion device" },
        { status: 500 }
      );
    }

    // 4. Delete the used pairing code so it cannot be reused
    await supabaseAdmin
      .from("android_pairing_codes")
      .delete()
      .eq("id", codeRecord.id);

    // 5. Return success and the business_id (device UUID) expected by Android app
    return NextResponse.json(
      {
        success: true,
        business_id: deviceRecord.id,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}