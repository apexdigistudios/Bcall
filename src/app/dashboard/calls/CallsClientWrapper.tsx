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
    <div className="space-y-4 max-w-4xl mx-auto px-2 sm:px-0 bg-white min-h-screen text-[#111214] pb-20">
      <div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-0.5">Live Lead Stream</span>
        <h2 className="text-xl font-bold tracking-tight text-[#111214]">Missed Call Logs</h2>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#111214]">Recent Inbound Calls</h3>
            <p className="text-[10px] text-neutral-500">Synced automatically from companion devices</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white text-neutral-700 border border-neutral-200">
            {initialCalls.length} Call{initialCalls.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="divide-y divide-neutral-100">
          {error && (
            <div className="p-4 text-xs text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> Error loading calls: {error}
            </div>
          )}

          {!error && initialCalls.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              No missed calls logged yet. Incoming calls from your companion devices will appear here instantly.
            </div>
          ) : (
            initialCalls.map((call) => {
              const cleanPhone = call.phone_number.replace(/\D/g, "");
              const defaultMsg = encodeURIComponent("Hello! We missed your call at our shop. How can we help you today?");
              const isDropdownOpen = openDropdownId === call.id;

              return (
                <div key={call.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative hover:bg-neutral-50/50 transition-colors">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[#111214] shrink-0 mt-0.5 sm:mt-0 font-bold">
                      <PhoneMissed className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-xs text-[#111214] font-mono">{call.phone_number}</h4>
                        {call.contact_name && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 truncate">
                            {call.contact_name}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1 truncate">
                        <Smartphone className="w-3 h-3 shrink-0" />
                        <span className="truncate">{call.android_devices?.business_name || "Shop"} ({call.android_devices?.device_label || "Phone"})</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                    <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono">
                      <Clock className="w-3 h-3 shrink-0" />
                      {call.created_at ? new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                    </div>

                    {/* iOS-Styled Pill Follow-Up Button & Frosted Glass Menu */}
                    <div className="relative" ref={isDropdownOpen ? dropdownRef : undefined}>
                      <button
                        onClick={() => setOpenDropdownId(isDropdownOpen ? null : call.id)}
                        className="px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-[#111214] font-semibold text-[11px] transition-all flex items-center gap-1.5 border border-neutral-200 active:scale-95 shadow-2xs"
                      >
                        Follow Up <ChevronDown className={`w-3 h-3 text-neutral-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-neutral-200/80 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-2.5 py-1 text-[9px] font-mono uppercase tracking-widest text-neutral-400 border-b border-neutral-100 mb-1">
                            Quick Action
                          </div>
                          <a
                            href={`sms:${call.phone_number}?body=${defaultMsg}`}
                            className="w-full px-3 py-2 text-[11px] text-left text-[#111214] hover:bg-neutral-100/80 rounded-xl flex items-center gap-2.5 font-semibold transition-colors"
                            onClick={() => setOpenDropdownId(null)}
                          >
                            <span className="w-5 h-5 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0">
                              <MessageCircle className="w-3 h-3" />
                            </span>
                            Send SMS
                          </a>
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${defaultMsg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full px-3 py-2 text-[11px] text-left text-[#111214] hover:bg-neutral-100/80 rounded-xl flex items-center gap-2.5 font-semibold transition-colors mt-0.5"
                            onClick={() => setOpenDropdownId(null)}
                          >
                            <span className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Send className="w-3 h-3" />
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