"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, Plus, Trash2, AlertCircle, Copy, KeyRound, Clock, Check, Terminal } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-5 max-w-4xl mx-auto px-2 sm:px-0 bg-transparent min-h-screen text-zinc-900 dark:text-zinc-100 font-sans pb-20 text-[11px]">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-[#282B29] pb-4 flex items-center justify-between">
        <div>
          <span className="text-[9px] font-mono tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">y&apos;elllo / Gateway</span>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Android Devices</h2>
        </div>
        <span className="text-[9px] px-2.5 py-1 rounded-md bg-white dark:bg-[#191B1A] text-zinc-700 dark:text-zinc-300 font-mono border border-zinc-200 dark:border-[#282B29]">
          {initialDevices.length} Connected
        </span>
      </div>

      {/* Success Banner: Pairing Code */}
      {rawCode && !isExpired && (
        <div className="p-4 bg-zinc-900 dark:bg-[#191B1A] text-zinc-100 rounded-xl shadow-md border border-zinc-800 dark:border-[#282B29] space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-[#EAB308]">
              <KeyRound className="w-4 h-4 shrink-0" />
              <h3 className="font-semibold text-xs uppercase tracking-wider">Pairing Code Active</h3>
            </div>
            {timeLeft !== null && (
              <div className="flex items-center gap-1.5 text-[10px] bg-white/10 px-2.5 py-0.5 rounded-md text-zinc-300 font-mono">
                <Clock className="w-3 h-3 text-[#EAB308]" />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>
          <p className="text-[11px] text-zinc-300">
            Enter inside your y&apos;elllo app for <span className="font-bold text-white">{decodeURIComponent(bizName || "Shop")}</span>.
          </p>
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-lg font-mono text-xl tracking-widest text-[#EAB308] font-bold">
              {rawCode}
            </div>
            {/* Signature Yellow Pill Button */}
            <Button
              onClick={copyCode}
              variant="neutral"
              size="sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Code"}
            </Button>
          </div>
        </div>
      )}

      {/* Expired Notification */}
      {isExpired && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 rounded-xl text-[11px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          Pairing code expired. Generate a new one below.
        </div>
      )}

      {/* Generate Pairing Code Box */}
      <div className="p-4 bg-white dark:bg-[#191B1A] rounded-xl border border-zinc-200 dark:border-[#282B29] shadow-sm space-y-3">
        <div>
          <h3 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Pair New Phone</h3>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Generate a 10-minute secure pairing code.</p>
        </div>
        <form action={handleGenerateCode} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="text"
            name="businessName"
            placeholder="Business Name (e.g. Acme Shop)"
            required
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#282B29] text-[11px] bg-zinc-50/50 dark:bg-[#141615] focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 flex-1 font-medium text-zinc-900 dark:text-zinc-100"
          />
          {/* Signature Yellow Button */}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="shrink-0 rounded-lg text-[11px]"
          >
            <Plus className="w-3.5 h-3.5" /> Generate Code
          </Button>
        </form>
      </div>

      {/* Connected Devices List */}
      <div className="bg-white dark:bg-[#191B1A] rounded-xl border border-zinc-200 dark:border-[#282B29] overflow-hidden shadow-sm">
        <div className="p-3.5 border-b border-zinc-200 dark:border-[#282B29] bg-zinc-50/50 dark:bg-[#141615]/50 flex items-center justify-between">
          <div>
            <h3 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Connected Devices</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Active monitoring gateways</p>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white dark:bg-[#191B1A] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#282B29]">
            {initialDevices.length}
          </span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-[#282B29]">
          {error && (
            <div className="p-4 text-[11px] text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> Error: {error}
            </div>
          )}

          {!error && initialDevices.length === 0 ? (
            <div className="p-10 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
              No Android devices paired yet. Generate a pairing code above to connect your first phone.
            </div>
          ) : (
            initialDevices.map((device) => (
              <div key={device.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/60 dark:hover:bg-[#141615]/40 transition-colors">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#141615] border border-zinc-200 dark:border-[#282B29] flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0 font-bold">
                    <Smartphone className="w-3.5 h-3.5 text-[#EAB308]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-[11px] text-zinc-900 dark:text-zinc-100 truncate font-mono">{device.device_label || "Shop Phone"}</h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      {device.business_name} • Last seen {device.last_seen_at ? new Date(device.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Never"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-[#282B29]">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-semibold font-mono ${
                      device.status === "active"
                        ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20"
                        : "bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20"
                    }`}
                  >
                    {device.status}
                  </span>
                  {device.status === "active" && (
                    <form action={handleRevokeDevice}>
                      <input type="hidden" name="deviceId" value={device.id} />
                      <Button
                        type="submit"
                        variant="destructive-outline"
                        size="xs"
                        className="text-rose-700 dark:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" /> Revoke
                      </Button>
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