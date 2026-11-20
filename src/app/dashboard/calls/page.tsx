import { supabase } from "@/lib/supabase";
import CallsClientWrapper from "./CallsClientWrapper";
import { getSailupSenders, isWhatsAppConfigured, SailupError } from "@/lib/sailup";

export const dynamic = "force-dynamic";

export default async function CallsPage() {
  // Fetch calls with joined device info matching your exact schema
  const { data: calls, error } = await supabase
    .from("call_events")
    .select(`
      id,
      phone_number,
      contact_name,
      created_at,
      android_devices (
        business_name,
        device_label
      )
    `)
    .order("created_at", { ascending: false });

  let smsConfigured = false;
  try {
    smsConfigured = (await getSailupSenders()).some((sender) => sender.status === "active");
  } catch (statusError) {
    console.error(JSON.stringify({
      event: "dashboard.sailup_status_failed",
      errorName: statusError instanceof Error ? statusError.name : "UnknownError",
      status: statusError instanceof SailupError ? statusError.status : undefined,
    }));
  }

  return (
    <CallsClientWrapper
      initialCalls={calls || []}
      error={error?.message || null}
      smsConfigured={smsConfigured}
      whatsappConfigured={isWhatsAppConfigured()}
    />
  );
}