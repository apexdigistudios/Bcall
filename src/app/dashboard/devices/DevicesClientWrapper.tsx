"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, Plus, Trash2, AlertCircle, Copy, KeyRound, Clock, Check } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

interface DevicesClientWrapperProps {
  initialDevices: any[];
  error: string | null;
  rawCode?: string;
  bizName?: string;
  expiresAt?: string;
  handleGenerateCode: (formData: FormData) => Promise<void>;
  handleRevokeDevice: (formData: FormData) => Promise<void>;
}

export default function DevicesClientWrapper({
  initialDevices,
  error,
  rawCode,
  bizName,
  expiresAt,
  handleGenerateCode,
  handleRevokeDevice,
}: DevicesClientWrapperProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    if (!supabaseUrl || !supabaseAnonKey) return;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const channel = supabase
      .channel("android-devices-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "android_devices" },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  useEffect(() => {
    if (!expiresAt) return;
    const expiryTime = new Date(expiresAt).getTime();
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        setIsExpired(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const copyCode = () => {
    if (rawCode) {
      navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="space-y-3.5 max-w-2xl mx-auto px-2 sm:px-0 bg-white min-h-screen text-[#111214] font-sans pb-20">
      {/* Header */}
      <div className="pt-2 border-b border-neutral-100 pb-3 flex items-center justify-between">
        <div>
          <span className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase">y'elllo / Gateway</span>
          <h2 className="text-lg font-bold tracking-tight text-[#111214]">Android Devices</h2>
        </div>
      </div>

      {/* Success Banner: Pairing Code */}
      {rawCode && !isExpired && (
        <div className="p-4 bg-black text-white rounded-2xl shadow-md border border-neutral-800 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-[#f5c62e]">
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <h3 className="font-semibold text-xs">Pairing Code Active</h3>
            </div>
            {timeLeft !== null && (
              <div className="flex items-center gap-1 text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-neutral-300 font-mono">
                <Clock className="w-3 h-3 text-[#f5c62e]" />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>
          <p className="text-[10px] text-neutral-300">
            Enter inside your y'elllo app for <span className="font-bold text-white">{decodeURIComponent(bizName || "Shop")}</span>.
          </p>
          <div className="flex items-center gap-2.5 pt-0.5 flex-wrap">
            <div className="bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-xl font-mono text-lg tracking-widest text-[#f5c62e] font-bold">
              {rawCode}
            </div>
            {/* iOS Styled Pill Button */}
            <button
              onClick={copyCode}
              className="px-3.5 py-1.5 rounded-full bg-white text-black text-[11px] font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 hover:bg-neutral-100"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy Code"}
            </button>
          </div>
        </div>
      )}

      {/* Expired Notification */}
      {isExpired && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[11px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          Pairing code expired. Generate a new one below.
        </div>
      )}

      {/* Generate Pairing Code Box */}
      <div className="p-3.5 bg-neutral-50/50 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-2.5">
        <div>
          <h3 className="text-[11px] font-semibold text-[#111214] uppercase tracking-wide">Pair New Phone</h3>
          <p className="text-[10px] text-neutral-500">Generate a 10-minute secure pairing code.</p>
        </div>
        <form action={handleGenerateCode} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            name="businessName"
            placeholder="Business Name"
            required
            className="px-3 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:border-black flex-1 font-medium text-[#111214]"
          />
          {/* iOS Styled Pill Button */}
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-black text-[#f5c62e] font-semibold text-xs hover:bg-neutral-800 transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Generate Code
          </button>
        </form>
      </div>

      {/* Connected Devices List */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs">
        <div className="p-3.5 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-[11px] font-semibold text-[#111214] uppercase tracking-wide">Connected Devices</h3>
            <p className="text-[10px] text-neutral-500">Active monitoring gateways</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white text-neutral-700 border border-neutral-200">
            {initialDevices.length}
          </span>
        </div>

        <div className="divide-y divide-neutral-100">
          {error && (
            <div className="p-3 text-xs text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> Error: {error}
            </div>
          )}

          {!error && initialDevices.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-400">
              No Android devices paired yet.
            </div>
          ) : (
            initialDevices.map((device) => (
              <div key={device.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-neutral-50/40 transition-colors">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[#111214] shrink-0 font-bold">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs text-[#111214] truncate">{device.device_label || "Shop Phone"}</h4>
                    <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                      {device.business_name} • {device.last_seen_at ? new Date(device.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Never"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-semibold font-mono ${
                      device.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {device.status}
                  </span>
                  {device.status === "active" && (
                    <form action={handleRevokeDevice}>
                      <input type="hidden" name="deviceId" value={device.id} />
                      {/* iOS Styled Pill Button with Icon */}
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700 text-[10px] font-semibold hover:bg-neutral-100 transition-all flex items-center gap-1 active:scale-95"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" /> Revoke
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}