"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAuthenticatedHeaders } from "@/lib/client-auth";
import type { SailupSender } from "@/lib/sailup";

export function SenderIdOverviewCard() {
  const [sender, setSender] = useState<SailupSender | null>(null);
  const [status, setStatus] = useState("Loading");

  useEffect(() => {
    let cancelled = false;
    async function loadSender() {
      try {
        const response = await fetch("/api/sailup/senders", {
          cache: "no-store",
          headers: await getAuthenticatedHeaders(),
        });
        const result = await response.json() as { senders?: SailupSender[]; error?: string };
        if (!response.ok) throw new Error(result.error || "Sender ID status unavailable.");
        const senders = result.senders ?? [];
        const active = senders.find((item) => item.status === "active" && item.is_default)
          ?? senders.find((item) => item.status === "active")
          ?? null;
        if (!cancelled) {
          setSender(active ?? senders[0] ?? null);
          setStatus(active ? "Active" : senders[0]?.status ? senders[0].status[0].toUpperCase() + senders[0].status.slice(1) : "Not configured");
        }
      } catch {
        if (!cancelled) setStatus("Status unavailable");
      }
    }
    void loadSender();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-4 bg-white dark:bg-[#191B1A] rounded-xl border border-zinc-200 dark:border-[#282B29] shadow-sm flex flex-col justify-between">
      <div className="min-w-0">
        <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">SMS Sender ID</span>
        <h4 className="font-bold text-[11px] mt-1 truncate text-zinc-900 dark:text-zinc-100">{sender?.name || "Not configured"}</h4>
        <p className="text-[10px] mt-0.5 truncate text-zinc-500 dark:text-zinc-400">Sender ID: {sender?.id || "—"}</p>
        <p className={`text-[9px] mt-1 font-medium ${status === "Active" ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>{status}</p>
      </div>
      <Button render={<Link href="/dashboard/templates" />} variant="neutral" size="sm" className="mt-3 w-full rounded-lg px-2.5 text-[11px]">View</Button>
    </div>
  );
}
