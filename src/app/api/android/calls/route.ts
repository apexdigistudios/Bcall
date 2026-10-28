import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header." }, { status: 401 });
    }

    const rawCredential = authHeader.replace("Bearer ", "").trim();
    const credentialHash = crypto.createHash("sha256").update(rawCredential).digest("hex");

    // 1. Authenticate device via credential hash
    const { data: device, error: deviceError } = await supabase
      .from("android_devices")
      .select("*")
      .eq("credential_hash", credentialHash)
      .eq("status", "active")
      .single();

    if (deviceError || !device) {
      return NextResponse.json({ error: "Unauthorized or revoked device." }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, callerNumber, callOutcome, callStartedAt, durationSeconds } = body;

    if (!callerNumber) {
      return NextResponse.json({ error: "Caller number is required." }, { status: 400 });
    }

    // 2. Insert missed call event into database
    const { error: insertError } = await supabase.from("call_events").insert({
      device_id: device.id,
      business_name: device.business_name,
      caller_number: callerNumber,
      call_outcome: callOutcome || "missed",
      lead_status: "new",
      duration_seconds: durationSeconds || 0,
      created_at: callStartedAt ? new Date(callStartedAt).toISOString() : new Date().toISOString(),
    });

    if (insertError) {
      // Handle unique event deduplication gracefully if already recorded
      console.error("Insert call error:", insertError);
    }

    // 3. Update device last seen timestamp
    await supabase
      .from("android_devices")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", device.id);

    return NextResponse.json({ success: true, message: "Call event ingested successfully." });
  } catch (err: any) {
    console.error("Calls API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}