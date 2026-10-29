"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PhoneCall, Smartphone, FileText, BarChart3, Settings } from "lucide-react";

export default function MobileNavbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", label: "Home", href: "/dashboard", icon: Home },
    { name: "Missed Calls", label: "Calls", href: "/dashboard/calls", icon: PhoneCall },
    { name: "Android Devices", label: "Devices", href: "/dashboard/devices", icon: Smartphone },
    { name: "Templates", label: "Templates", href: "/dashboard/templates", icon: FileText },
    { name: "Analytics", label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Settings", label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2 md:hidden">
      <nav aria-label="Dashboard navigation" className="grid grid-cols-6 gap-1 rounded-2xl border border-[#e7e7e9] bg-white/95 p-1.5 shadow-xl shadow-black/10 backdrop-blur-md">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.name}
              aria-label={item.name}
              className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-[8px] font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-[#f5c62e] text-[#111214] shadow-sm"
                  : "text-[#686b73] hover:text-[#111214] hover:bg-[#f7f7f5]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="w-full truncate text-center leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}