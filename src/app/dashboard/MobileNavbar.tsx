"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PhoneCall, Smartphone, FileText, BarChart3, Settings } from "lucide-react";

export default function MobileNavbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Missed Calls", href: "/dashboard/calls", icon: PhoneCall },
    { name: "Android Devices", href: "/dashboard/devices", icon: Smartphone },
    { name: "Templates", href: "/dashboard/templates", icon: FileText },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-24px)] max-w-[360px] -translate-x-1/2 md:hidden">
      <nav aria-label="Dashboard navigation" className="grid grid-cols-6 gap-1 rounded-2xl border border-neutral-200 bg-white/90 p-1.5 shadow-xl shadow-black/5 backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.name}
              aria-label={item.name}
              className={`flex h-11 w-full items-center justify-center rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-[#f5c62e] text-[#111214] shadow-xs font-bold"
                  : "text-neutral-500 hover:text-[#111214] hover:bg-neutral-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}