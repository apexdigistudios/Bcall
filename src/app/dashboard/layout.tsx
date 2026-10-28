"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "./sidebar";
import MobileNavbar from "./MobileNavbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";
import { RefreshCw } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkUserSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        router.push("/auth");
      } else {
        setCheckingAuth(false);
      }
    }
    checkUserSession();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f7f7f5] text-[#111214] gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#111214]" />
        <p className="text-xs font-semibold">Verifying secure session...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f7f7f5] text-[#111214]">
        {/* Sidebar hidden on mobile screens via responsive classes */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 pb-28 md:pb-0">
          <header className="h-16 border-b border-[#e7e7e9] bg-white px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-[#686b73] hover:text-[#111214] hidden md:inline-flex" />
              <h1 className="font-semibold text-base md:text-lg truncate">CallBackly Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#686b73] font-medium hidden sm:inline">
                Live Call Listener Active
              </span>
            </div>
          </header>

          <div className="p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* Floating Mobile Navbar */}
        <MobileNavbar />
      </div>
    </SidebarProvider>
  );
}