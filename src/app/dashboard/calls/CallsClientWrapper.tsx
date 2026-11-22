"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PhoneMissed, Smartphone, Clock, AlertCircle, ChevronDown } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { SmsFollowupButton, WhatsAppFollowupButton } from "@/components/MissedCallActions";

interface CallsClientWrapperProps {
  initialCalls: any[];
  error: string | null;
  smsConfigured: boolean;
  whatsappConfigured: boolean;
}

export default function CallsClientWrapper({ initialCalls, error, smsConfigured, whatsappConfigured }: CallsClientWrapperProps) {
  const router = useRouter();
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="space-y-4 max-w-4xl mx-auto px-2 sm:px-0 bg-transparent min-h-screen text-zinc-900 dark:text-zinc-100 pb-20 text-[11px]">
      <div>
        <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block mb-0.5">Live Lead Stream</span>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Missed Call Logs</h2>
      </div>

      <div className="bg-white dark:bg-[#191B1A] rounded-xl border border-zinc-200 dark:border-[#282B29] shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-zinc-200 dark:border-[#282B29] bg-zinc-50/50 dark:bg-[#141615]/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Recent Inbound Calls</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Synced automatically from companion devices</p>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono bg-white dark:bg-[#191B1A] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#282B29]">
            {initialCalls.length} Call{initialCalls.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-[#282B29]">
          {error && (
            <div className="p-4 text-[11px] text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> Error loading calls: {error}
            </div>
          )}

          {!error && initialCalls.length === 0 ? (
            <div className="p-10 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
              No missed calls logged yet. Incoming calls from your companion devices will appear here instantly.
            </div>
          ) : (
            initialCalls.map((call) => {
              const isDropdownOpen = openDropdownId === call.id;
              return (
                <div key={call.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative hover:bg-zinc-50/60 dark:hover:bg-[#141615]/40 transition-colors">
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#141615] border border-zinc-200 dark:border-[#282B29] flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0 mt-0.5 sm:mt-0 font-bold">
                      <PhoneMissed className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-[11px] text-zinc-900 dark:text-zinc-100 font-mono">{call.phone_number}</h4>
                        {call.contact_name && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-[#282B29] truncate">
                            {call.contact_name}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1 truncate">
                        <Smartphone className="w-3 h-3 shrink-0" />
                        <span className="truncate">{call.android_devices?.business_name || "Shop"} ({call.android_devices?.device_label || "Phone"})</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-[#282B29]">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                      <Clock className="w-3 h-3 shrink-0" />
                      {call.created_at ? new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                    </div>

                    {/* Cute Clean Follow-Up Button & Dropdown */}
                    <div className="relative" ref={isDropdownOpen ? dropdownRef : undefined}>
                      <Button
                        onClick={() => setOpenDropdownId(isDropdownOpen ? null : call.id)}
                        variant="primary"
                        size="sm"
                        className="text-[11px]"
                      >
                        Follow Up <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                      </Button>

                      {isDropdownOpen && (
                        <div className="absolute right-0 mt-1.5 w-44 bg-white/95 dark:bg-[#191B1A]/95 backdrop-blur-xl rounded-xl shadow-xl border border-zinc-200 dark:border-[#282B29] p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-2 py-1 text-[8px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-[#282B29] mb-1">
                            Quick Action
                          </div>
                          <div className="p-1">
                            <SmsFollowupButton callEventId={String(call.id)} enabled={smsConfigured} size="sm" />
                          </div>
                          <div className="p-1">
                            <WhatsAppFollowupButton
                              recipient={call.phone_number}
                              message={`Hello! We missed your call at ${call.android_devices?.business_name || "our shop"}. How can we help you today?`}
                              enabled={whatsappConfigured}
                              size="sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}