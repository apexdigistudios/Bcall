"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PhoneCall, Smartphone, Settings } from "lucide-react";

export default function MobileNavbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Missed Calls", href: "/dashboard/calls", icon: PhoneCall },
    { name: "Android Devices", href: "/dashboard/devices", icon: Smartphone },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <nav className="flex items-center gap-2 p-2 rounded-full bg-white/80 backdrop-blur-md border border-[#e7e7e9] shadow-xl shadow-black/10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.name}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? "bg-[#f5c62e] text-[#111214] scale-105 shadow-sm"
                  : "text-[#686b73] hover:text-[#111214] hover:bg-[#f7f7f5]"
              }`}
            >
              <Icon className="w-5 h-5" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}