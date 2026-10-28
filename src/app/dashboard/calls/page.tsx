import { supabase } from "@/lib/supabase";
import CallsClientWrapper from "./CallsClientWrapper";

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

  return (
    <CallsClientWrapper
      initialCalls={calls || []}
      error={error?.message || null}
    />
  );
}