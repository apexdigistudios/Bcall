import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { dispatchMissedCallFollowup, type FollowupResult } from "@/lib/sms-followup";
import { takeSmsRateLimit } from "@/lib/sailup";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { device_id, phone_number, contact_name } = body;

    if (!device_id || !phone_number) {
      return NextResponse.json(
        { error: "Missing required fields: device_id or phone_number" },
        { status: 400 }
      );
    }

    // 1. Find the device by device_id to get its primary UUID key (referenced by call_events.business_id)
    const { data: device, error: deviceError } = await supabase
      .from("android_devices")
      .select("id, device_id, business_name, status")
      .eq("device_id", device_id)
      .single();

    if (deviceError || !device) {
      return NextResponse.json(
        { error: "Device not found. Please pair the device first." },
        { status: 404 }
      );
    }

    if (device.status !== "active") {
      return NextResponse.json(
        { error: "Device pairing has been revoked." },
        { status: 403 }
      );
    }

    // 2. Insert call event into call_events table matching your exact schema columns
    const { data: callEvent, error: insertError } = await supabase
      .from("call_events")
      .insert({
        business_id: device.id,
        phone_number: phone_number.trim(),
        contact_name: contact_name ? contact_name.trim() : "",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to insert call event:", insertError.message);
      return NextResponse.json(
        { error: "Failed to log call event in database." },
        { status: 500 }
      );
    }

    // 3. Update device last_seen_at timestamp
    await supabase
      .from("android_devices")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", device.id);

    let smsFollowup: FollowupResult | { status: "skipped"; reason: string } = {
      status: "skipped",
      reason: "sailup_not_configured",
    };
    if (process.env.SAILUP_API_KEY?.trim()) {
      if (!takeSmsRateLimit(request, device.device_id)) {
        smsFollowup = { status: "skipped", reason: "sms_rate_limited" };
      } else {
        smsFollowup = await dispatchMissedCallFollowup({
          callEventId: callEvent.id,
          recipient: phone_number.trim(),
          businessName: device.business_name,
        });
      }
    }

    return NextResponse.json({ success: true, smsFollowup });
  } catch (err) {
    console.error("Call API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}