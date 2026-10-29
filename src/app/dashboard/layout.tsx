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
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white text-[#111214] gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#111214]" />
        <p className="text-xs font-semibold">Verifying secure session...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden bg-white text-[#111214]">
        {/* Sidebar hidden on mobile screens via responsive classes */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex min-w-0 w-full flex-1 flex-col overflow-x-hidden pb-28 md:pb-0">
          <header className="sticky top-0 z-40 flex min-h-16 w-full items-center justify-between gap-3 border-b border-[#e7e7e9] bg-white px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-[#686b73] hover:text-[#111214] hidden md:inline-flex" />
              <h1 className="truncate font-semibold text-sm sm:text-base lg:text-lg">y&apos;elllo Dashboard</h1>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <span className="hidden text-xs font-medium text-[#686b73] sm:inline">
                Live Call Listener Active
              </span>
            </div>
          </header>

          <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            {children}
          </div>
        </main>

        {/* Floating Mobile Navbar */}
        <MobileNavbar />
      </div>
    </SidebarProvider>
  );
}