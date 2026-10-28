"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PhoneMissed, Smartphone, Clock, AlertCircle, MessageCircle, Send, ChevronDown } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

interface CallsClientWrapperProps {
  initialCalls: any[];
  error: string | null;
}

export default function CallsClientWrapper({ initialCalls, error }: CallsClientWrapperProps) {
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
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#111214]">Missed Call Logs</h2>
        <p className="text-xs text-[#686b73] mt-0.5">
          Real-time missed calls captured from your paired shop Android phones.
        </p>
      </div>

      {/* Removed overflow-hidden to prevent clipping dropdown popups */}
      <div className="bg-white rounded-2xl border border-[#e7e7e9] shadow-sm">
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
            initialCalls.map((call) => {
              const cleanPhone = call.phone_number.replace(/\D/g, "");
              const defaultMsg = encodeURIComponent("Hello! We missed your call at our shop. How can we help you today?");
              const isDropdownOpen = openDropdownId === call.id;

              return (
                <div key={call.id} className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
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

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e7e7e9]">
                    <div className="flex items-center gap-1.5 text-xs text-[#686b73]">
                      <Clock className="w-3.5 h-3.5" />
                      {call.created_at ? new Date(call.created_at).toLocaleString() : "Just now"}
                    </div>

                    {/* iOS-Inspired Follow Up Menu */}
                    <div className="relative" ref={isDropdownOpen ? dropdownRef : undefined}>
                      <button
                        onClick={() => setOpenDropdownId(isDropdownOpen ? null : call.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#f5c62e] text-[#111214] font-semibold text-xs hover:bg-[#e6b825] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                      >
                        Follow Up <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-[#e7e7e9] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                          <a
                            href={`sms:${call.phone_number}?body=${defaultMsg}`}
                            className="w-full px-3 py-2.5 text-xs text-left text-[#111214] hover:bg-[#f7f7f7] rounded-xl flex items-center gap-2.5 font-medium transition-colors"
                            onClick={() => setOpenDropdownId(null)}
                          >
                            <span className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-sm shrink-0">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </span>
                            Send SMS
                          </a>
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${defaultMsg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full px-3 py-2.5 text-xs text-left text-[#111214] hover:bg-[#f7f7f7] rounded-xl flex items-center gap-2.5 font-medium transition-colors mt-0.5"
                            onClick={() => setOpenDropdownId(null)}
                          >
                            <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
                              <Send className="w-3.5 h-3.5" />
                            </span>
                            WhatsApp
                          </a>
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