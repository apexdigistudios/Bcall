"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "./sidebar";
import MobileNavbar from "./MobileNavbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";
import { RefreshCw, User, ChevronsUpDown, CreditCard, HelpCircle, LogOut, X, Upload } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // User Profile & Dropdown States for Header
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileEditModal, setProfileEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  const headerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkUserSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        router.push("/auth");
      } else {
        // Fetch user data
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (userData) {
          setUserProfile(userData);
          setEditName(userData.full_name || "");
          setEditPhone(userData.phone || "");
          setEditAvatar(userData.avatar_url || "");
        } else {
          const fallbackName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0];
          setUserProfile({ full_name: fallbackName, email: session.user.email });
          setEditName(fallbackName);
        }

        setCheckingAuth(false);
      }
    }
    checkUserSession();

    function handleClickOutside(event: MouseEvent) {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [router]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { error } = await supabase
      .from("users")
      .update({ full_name: editName, phone: editPhone, avatar_url: editAvatar })
      .eq("id", authUser.id);

    if (!error) {
      setUserProfile({ ...userProfile, full_name: editName, phone: editPhone, avatar_url: editAvatar });
      setProfileEditModal(false);
      setProfileMenuOpen(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#141615] text-zinc-900 dark:text-zinc-100 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#EAB308]" />
        <p className="text-xs font-semibold">Verifying secure session...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="dashboard-shell flex h-screen min-h-0 w-full overflow-hidden bg-transparent text-zinc-900 dark:text-zinc-100">
        {/* Sidebar hidden on mobile screens via responsive classes */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Main Content Area */}
        <main className="dashboard-main flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain pb-28 md:pb-0">
          <header className="dashboard-header sticky top-0 z-50 flex min-h-16 w-full items-center justify-between gap-3 border-b border-zinc-200 dark:border-[#282B29] bg-white/90 dark:bg-[#191B1A]/90 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hidden md:inline-flex" />
              <h1 className="truncate font-bold text-sm sm:text-base lg:text-lg">y&apos;elllo Dashboard</h1>
            </div>

            <div className="flex min-w-0 items-center gap-3">
              <span className="hidden text-[11px] font-mono text-zinc-500 dark:text-zinc-400 sm:inline">
                Live Call Listener Active
              </span>
              <ThemeToggle />

              {/* Header User Profile Menu Button & Dropdown (Visible ONLY in mobile view mode) */}
              <div className="relative md:hidden" ref={headerMenuRef}>
                <Button
                  type="button"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  variant="neutral"
                  size="sm"
                  className="px-2 py-1"
                  title="User Profile Menu"
                >
                  <span className="w-7 h-7 rounded-md bg-zinc-900 dark:bg-zinc-800 text-[#EAB308] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-zinc-200 dark:border-[#282B29]">
                    {userProfile?.avatar_url ? (
                      <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <ChevronsUpDown className="w-3 h-3 text-zinc-400 shrink-0" />
                </Button>

                {/* DROPDOWN POPUP */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white/95 dark:bg-[#191B1A]/95 backdrop-blur-xl rounded-xl shadow-xl border border-zinc-200 dark:border-[#282B29] p-1.5 z-50 animate-in fade-in zoom-in-95 text-zinc-900 dark:text-zinc-100">
                    <div className="p-2.5 border-b border-zinc-100 dark:border-[#282B29] flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-800 text-[#EAB308] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-zinc-200 dark:border-[#282B29]">
                        {userProfile?.avatar_url ? (
                          <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-xs truncate text-zinc-900 dark:text-zinc-100">{userProfile?.full_name}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-mono">{userProfile?.email}</p>
                      </div>
                    </div>

                    <div className="py-1 space-y-0.5 text-xs font-medium">
                      <Button
                        onClick={() => { setProfileEditModal(true); setProfileMenuOpen(false); }}
                        variant="neutral"
                        size="sm"
                        className="w-full justify-start px-3 py-2 text-left"
                      >
                        <User className="w-3.5 h-3.5 text-zinc-500" /> Edit Profile & Photo
                      </Button>
                      <Button
                        onClick={() => { router.push("/dashboard/settings"); setProfileMenuOpen(false); }}
                        variant="neutral"
                        size="sm"
                        className="w-full justify-start px-3 py-2 text-left"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-zinc-500" /> Subscription Plan
                      </Button>
                      <Button
                        onClick={() => { router.push("/dashboard/settings"); setProfileMenuOpen(false); }}
                        variant="neutral"
                        size="sm"
                        className="w-full justify-start px-3 py-2 text-left"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-zinc-500" /> Help & Support
                      </Button>
                    </div>

                    <div className="pt-1 border-t border-zinc-100 dark:border-[#282B29] mt-1">
                      <Button
                        onClick={handleSignOut}
                        variant="neutral"
                        size="sm"
                        className="w-full justify-start px-3 py-2 text-left text-rose-700 dark:text-rose-400"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            {children}
          </div>
        </main>

        {/* Floating Mobile Navbar */}
        <MobileNavbar />

        {/* EDIT USER PROFILE & UPLOAD MODAL */}
        {profileEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3">
            <div className="bg-white dark:bg-[#191B1A] rounded-xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 dark:border-[#282B29] space-y-4 text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#282B29] pb-3.5">
                <h3 className="font-bold text-xs uppercase tracking-wider">Edit User Profile</h3>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Close profile editor" onClick={() => setProfileEditModal(false)} className="text-zinc-400">
                  <X size={18} />
                </Button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-zinc-900 dark:bg-zinc-800 text-[#EAB308] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-zinc-200 dark:border-[#282B29]">
                    {editAvatar ? (
                      <img src={editAvatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-1">Profile Photo</label>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-[#282B29] bg-zinc-50 dark:bg-[#141615] text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all active:scale-95 shadow-xs">
                      <Upload className="w-3 h-3 text-[#EAB308]" /> Upload Image
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-[#282B29] bg-zinc-50 dark:bg-[#141615] text-xs font-semibold focus:outline-none focus:border-zinc-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+233 24 000 0000"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-[#282B29] bg-zinc-50 dark:bg-[#141615] text-xs font-semibold focus:outline-none focus:border-zinc-500 text-zinc-900 dark:text-zinc-100 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-[#282B29]">
                  <Button
                    type="button"
                    onClick={() => setProfileEditModal(false)}
                    variant="neutral"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="px-3"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
}