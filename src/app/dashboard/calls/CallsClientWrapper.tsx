"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PhoneMissed, Smartphone, Clock, AlertCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

interface CallsClientWrapperProps {
  initialCalls: any[];
  error: string | null;
}

export default function CallsClientWrapper({ initialCalls, error }: CallsClientWrapperProps) {
  const router = useRouter();

  // Real-time subscription to auto-update when a new call event arrives
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    if (!supabaseUrl || !supabaseAnonKey) return;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const channel = supabase
      .channel("call-events-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "call_events" },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#111214]">Missed Call Logs</h2>
        <p className="text-xs text-[#686b73] mt-0.5">
          Real-time missed calls captured from your paired shop Android phones.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e7e7e9] overflow-hidden shadow-sm">
        <div className="p-5 md:p-6 border-b border-[#e7e7e9] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#111214]">Recent Calls</h3>
            <p className="text-xs text-[#686b73]">Synced automatically via background worker</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f7f7f5] text-[#111214] border border-[#e7e7e9]">
            {initialCalls.length} Call{initialCalls.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="divide-y divide-[#e7e7e9]">
          {error && (
            <div className="p-6 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Error loading calls: {error}
            </div>
          )}

          {!error && initialCalls.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#686b73]">
              No missed calls logged yet. Incoming calls from your companion devices will appear here instantly.
            </div>
          ) : (
            initialCalls.map((call) => (
              <div key={call.id} className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5 sm:mt-0">
                    <PhoneMissed className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-[#111214] font-mono">{call.phone_number}</h4>
                      {call.contact_name && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#f7f7f5] text-[#686b73] border border-[#e7e7e9]">
                          {call.contact_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#686b73] mt-1 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" />
                      {call.android_devices?.business_name || "Shop"} ({call.android_devices?.device_label || "Phone"})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#686b73] pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e7e7e9]">
                  <Clock className="w-3.5 h-3.5" />
                  {call.created_at ? new Date(call.created_at).toLocaleString() : "Just now"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}