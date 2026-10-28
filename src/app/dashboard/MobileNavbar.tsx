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
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <nav className="flex items-center gap-1.5 p-2 rounded-full bg-white/90 backdrop-blur-md border border-[#e7e7e9] shadow-xl shadow-black/10 overflow-x-auto max-w-[92vw]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.name}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
                isActive
                  ? "bg-[#f5c62e] text-[#111214] scale-105 shadow-sm"
                  : "text-[#686b73] hover:text-[#111214] hover:bg-[#f7f7f5]"
              }`}
            >
              <Icon className="w-4 h-4" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}