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

  // Setup Realtime subscription to auto-update when a phone connects
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

  // Handle countdown timer for code expiration
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
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#111214]">Android Companion Devices</h2>
        <p className="text-xs text-[#686b73] mt-0.5">
          Pair your shop phone running MTN or Telecel to automatically detect and sync missed calls.
        </p>
      </div>

      {/* SUCCESS BANNER: Displays the generated pairing code with countdown & auto-hide on expiration */}
      {rawCode && !isExpired && (
        <div className="p-6 bg-[#111214] text-white rounded-2xl shadow-xl border border-[#f5c62e]/30 space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#f5c62e]">
              <KeyRound className="w-5 h-5" />
              <h3 className="font-bold text-sm">Pairing Code Generated Successfully</h3>
            </div>
            {timeLeft !== null && (
              <div className="flex items-center gap-1.5 text-xs bg-white/10 px-2.5 py-1 rounded-full text-gray-300 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#f5c62e]" />
                Expires in {formatTime(timeLeft)}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-300">
            Enter this secure code inside your installed CallBackly Android app for{" "}
            <span className="font-semibold text-white">{decodeURIComponent(bizName || "your shop")}</span>.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <div className="bg-white/10 border border-white/20 px-5 py-2.5 rounded-xl font-mono text-2xl tracking-widest text-[#f5c62e] font-bold">
              {rawCode}
            </div>
            <button
              onClick={copyCode}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center gap-2 border border-white/10"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
        </div>
      )}

      {/* EXPIRED CODE NOTIFICATION */}
      {isExpired && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          Previous pairing code has expired. Generate a new one below to connect your device.
        </div>
      )}

      {/* Generate Pairing Code Box */}
      <div className="p-5 md:p-6 bg-white rounded-2xl border border-[#e7e7e9] shadow-sm space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-[#111214]">Pair a New Phone</h3>
          <p className="text-xs text-[#686b73] mt-1">
            Generate a 10-minute secure pairing code. Enter this code inside your installed CallBackly Android companion app.
          </p>
        </div>
        <form action={handleGenerateCode} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            name="businessName"
            placeholder="Business / Shop Name"
            required
            className="px-3.5 py-2.5 rounded-xl border border-[#e7e7e9] text-sm bg-[#f7f7f5] focus:outline-none focus:border-[#111214] flex-1 text-[#111214]"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#f5c62e] text-[#111214] font-semibold text-xs hover:bg-[#e6b825] transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Generate Pairing Code
          </button>
        </form>
      </div>

      {/* Connected Devices List */}
      <div className="bg-white rounded-2xl border border-[#e7e7e9] overflow-hidden shadow-sm">
        <div className="p-5 md:p-6 border-b border-[#e7e7e9] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#111214]">Connected Devices</h3>
            <p className="text-xs text-[#686b73]">Active Android phones monitoring incoming calls</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f7f7f5] text-[#111214] border border-[#e7e7e9]">
            {initialDevices.length} Device{initialDevices.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="divide-y divide-[#e7e7e9]">
          {error && (
            <div className="p-6 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Error loading devices: {error}
            </div>
          )}

{!error && initialDevices.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#686b73]">
              No Android devices paired yet. Generate a pairing code above to connect your phone.
            </div>
          ) : (
            initialDevices.map((device) => (
              <div key={device.id} className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f7f7f5] border border-[#e7e7e9] flex items-center justify-center text-[#111214] shrink-0 mt-0.5 sm:mt-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#111214]">{device.device_label || "Shop Phone"}</h4>
                    <p className="text-xs text-[#686b73] mt-0.5">
                      Business: {device.business_name} • Last seen:{" "}
                      {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : "Never"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e7e7e9]">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      device.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {device.status}
                  </span>
                  {device.status === "active" && (
                    <form action={handleRevokeDevice}>
                      <input type="hidden" name="deviceId" value={device.id} />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                      >
                        Revoke
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