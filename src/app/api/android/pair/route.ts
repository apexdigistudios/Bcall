import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pairing_code, device_id, device_name } = body;

    if (!pairing_code || !device_id) {
      return NextResponse.json(
        { error: "Missing pairing_code or device_id" },
        { status: 400 }
      );
    }

    // Hash the incoming code with SHA-256 to match android_pairing_codes.code_hash
    const codeHash = crypto
      .createHash("sha256")
      .update(pairing_code.trim())
      .digest("hex");

    const now = new Date().toISOString();

    // 1. Verify the pairing code exists, is unused, and hasn't expired
    const { data: codeRecord, error: codeError } = await supabase
      .from("android_pairing_codes")
      .select("*")
      .eq("code_hash", codeHash)
      .is("used_at", null)
      .gt("expires_at", now)
      .single();

    if (codeError || !codeRecord) {
      return NextResponse.json(
        { error: "Invalid or expired pairing code." },
        { status: 400 }
      );
    }

    // 2. Mark the pairing code as used
    await supabase
      .from("android_pairing_codes")
      .update({ used_at: now })
      .eq("id", codeRecord.id);

    // 3. Register the device into android_devices matching your exact schema columns
    const { data: deviceRecord, error: deviceError } = await supabase
      .from("android_devices")
      .upsert(
        {
          device_id: device_id,
          business_name: codeRecord.business_name,
          device_label: device_name || "Shop Phone",
          status: "active",
          last_seen_at: now,
        },
        { onConflict: "device_id" }
      )
      .select()
      .single();

    if (deviceError) {
      console.error("Device registration error:", deviceError);
      return NextResponse.json(
        { error: "Failed to register device in database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      business_id: deviceRecord.id,
      business_name: deviceRecord.business_name,
    });
  } catch (err: any) {
    console.error("Pairing API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}