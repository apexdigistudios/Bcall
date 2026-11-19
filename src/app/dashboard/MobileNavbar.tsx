"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PhoneCall, Smartphone, FileText, BarChart3, Settings, Menu, X, Building2, Check, Plus, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button, buttonVariants } from "@/components/ui/button";

export default function MobileNavbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [businessModalOpen, setBusinessModalOpen] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<any>(null);

  useEffect(() => {
    async function fetchBiz() {
      const { data } = await supabase.from("businesses").select("*");
      if (data && data.length > 0) {
        setBusinesses(data);
        setCurrentBusiness(data[0]);
      }
    }
    void fetchBiz();
  }, []);

  const primaryNav = [
    { name: "Overview", href: "/dashboard", icon: Home },
    { name: "Missed Calls", href: "/dashboard/calls", icon: PhoneCall },
    { name: "Devices", href: "/dashboard/devices", icon: Smartphone },
    { name: "Templates", href: "/dashboard/templates", icon: FileText },
  ];

  const secondaryNav = [
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const isMoreActive = secondaryNav.some((item) => pathname === item.href);

  return (
    <>
      {/* Expanded Floating Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {menuOpen && (
        <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-32px)] max-w-[360px] -translate-x-1/2 md:hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-white/95 dark:bg-[#191B1A]/95 backdrop-blur-xl rounded-2xl p-2.5 shadow-2xl border border-zinc-200 dark:border-[#282B29] space-y-2 text-zinc-900 dark:text-zinc-100">

            {/* Mobile Business Switcher Banner */}
            <div
              onClick={() => { setMenuOpen(false); setBusinessModalOpen(true); }}
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-[#141615] border border-zinc-200 dark:border-[#282B29] cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-800 text-[#EAB308] flex items-center justify-center font-bold shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">Active Business</span>
                  <span className="font-bold text-xs truncate block font-mono">{currentBusiness?.name || "Select Business"}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
            </div>

            <div className="px-2 py-1 border-t border-zinc-100 dark:border-[#282B29] text-[9px] font-mono uppercase tracking-widest text-zinc-500 pt-2">
              More Navigation
            </div>

            <div className="space-y-1">
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={buttonVariants({
                      variant: isActive ? "primary" : "neutral",
                      size: "sm",
                      className: "w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-xs",
                    })}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Business Switcher Modal for Mobile */}
      {businessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 md:hidden">
          <div className="bg-white dark:bg-[#191B1A] rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-zinc-200 dark:border-[#282B29] space-y-3 text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#282B29] pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider">Switch Business</h3>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Close business switcher" onClick={() => setBusinessModalOpen(false)} className="text-zinc-400">
                <X size={18} />
              </Button>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto">
              {businesses.map((b) => (
                <Button
                  key={b.id}
                  onClick={() => { setCurrentBusiness(b); setBusinessModalOpen(false); }}
                  variant={currentBusiness?.id === b.id ? "primary" : "neutral"}
                  size="default"
                  className={`w-full justify-between px-3 py-2.5 text-xs font-medium ${
                    currentBusiness?.id === b.id
                      ? "font-bold"
                      : ""
                  }`}
                >
                  <span className="truncate">{b.name}</span>
                  {currentBusiness?.id === b.id && <Check className="w-4 h-4 shrink-0" />}
                </Button>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-[#282B29]">
              <Link
                href="/dashboard/settings"
                onClick={() => setBusinessModalOpen(false)}
                className={buttonVariants({ variant: "neutral", size: "sm", className: "w-full" })}
              >
                <Plus className="w-3.5 h-3.5 text-[#EAB308]" /> Manage Businesses
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main 5-Icon Bottom Bar */}
      <div className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-24px)] max-w-[360px] -translate-x-1/2 md:hidden">
        <nav aria-label="Dashboard navigation" className="grid grid-cols-5 gap-1 rounded-2xl border border-zinc-200 dark:border-[#282B29] bg-white/90 dark:bg-[#191B1A]/90 p-1.5 shadow-xl shadow-black/5 backdrop-blur-xl">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.name}
                aria-label={item.name}
                className={buttonVariants({
                  variant: isActive ? "primary" : "ghost",
                  size: "icon",
                  className: `h-9 w-full rounded-xl ${isActive ? "font-bold shadow-xs" : "text-zinc-500 dark:text-zinc-400"}`,
                })}
              >
                <Icon className="h-4 w-4 shrink-0" />
              </Link>
            );
          })}

          {/* 5th Slot: Hamburger / Close Trigger */}
          <Button
            onClick={() => setMenuOpen(!menuOpen)}
            title="More Menu"
            aria-label="More Menu"
            variant={isMoreActive || menuOpen ? "primary" : "ghost"}
            size="icon"
            className={`h-9 w-full rounded-xl ${
              isMoreActive || menuOpen
                ? "text-zinc-950 shadow-xs font-bold"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {menuOpen ? <X className="h-4 w-4 shrink-0" /> : <Menu className="h-4 w-4 shrink-0" />}
          </Button>
        </nav>
      </div>
    </>
  );
}