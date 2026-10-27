"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  PhoneCall, Smartphone, Settings, Building2, User, Plus, Check, ChevronsUpDown, 
  LayoutDashboard, X, ChevronRight, ChevronLeft, CreditCard, HelpCircle, LogOut, Sparkles, Camera
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Business Wizard Modal States
  const [businessModalOpen, setBusinessModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [bizForm, setBizForm] = useState({
    name: "",
    industry: "Retail / Local Shop",
    phone: "",
    message_template: "Hi! Sorry we missed your call. Let us know how we can assist you today!",
  });

  // User Footer Nested Menu & Profile Edit States
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileEditModal, setProfileEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    // Close profile menu on outside click
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchData() {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userData) {
        setUserProfile(userData);
        setEditName(userData.full_name || "");
        setEditPhone(userData.phone || "");
        setEditAvatar(userData.avatar_url || "");
      } else {
        const fallbackName = authUser.user_metadata?.full_name || authUser.email?.split("@")[0];
        setUserProfile({ full_name: fallbackName, email: authUser.email });
        setEditName(fallbackName);
      }
    }

    const { data: bizData } = await supabase.from("businesses").select("*");
    if (bizData && bizData.length > 0) {
      setBusinesses(bizData);
      setCurrentBusiness(bizData[0]);
    }
  }

  // Handle Business Wizard Submission
  async function handleCompleteWizard(e: React.FormEvent) {
    e.preventDefault();
    if (!bizForm.name.trim()) return;

    const { data, error } = await supabase
      .from("businesses")
      .insert({
        name: bizForm.name.trim(),
        industry: bizForm.industry,
        phone: bizForm.phone.trim(),
        message_template: bizForm.message_template.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setBusinesses([...businesses, data]);
      setCurrentBusiness(data);
      setBusinessModalOpen(false);
      setWizardStep(1);
      setBizForm({ name: "", industry: "Retail / Local Shop", phone: "", message_template: "" });
    }
  }

  // Handle Profile Update
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

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-[#e7e7e9]">
        {/* TOP HEADER: Business Switcher / Wizard Trigger */}
        <SidebarHeader className="border-b border-sidebar-border p-2">
          <div 
            onClick={() => { setWizardStep(1); setBusinessModalOpen(true); }}
            className="flex items-center gap-3 p-2 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent cursor-pointer transition-colors"
            title="Manage or Add Business"
          >
            <div className="w-8 h-8 rounded-lg bg-[#f5c62e] text-[#111214] flex items-center justify-center font-bold text-sm shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="truncate text-left flex-1 group-data-[collapsible=icon]:hidden">
              <p className="font-bold text-xs text-sidebar-foreground truncate">
                {currentBusiness?.name || "Add Business"}
              </p>
              <p className="text-[10px] text-sidebar-foreground/60 truncate">Setup & Customization</p>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-sidebar-foreground/60 shrink-0 group-data-[collapsible=icon]:hidden" />
          </div>
        </SidebarHeader>

        {/* MIDDLE CONTENT: Navigation */}
        <SidebarContent className="p-2">
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={pathname === "/dashboard"} onClick={() => router.push("/dashboard")} tooltip="Overview">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Overview</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={pathname === "/dashboard/calls"} onClick={() => router.push("/dashboard/calls")} tooltip="Missed Calls">
                    <PhoneCall className="w-4 h-4" />
                    <span>Missed Calls</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={pathname === "/dashboard/devices"} onClick={() => router.push("/dashboard/devices")} tooltip="Android Devices">
                    <Smartphone className="w-4 h-4" />
                    <span>Android Devices</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={pathname === "/dashboard/settings"} onClick={() => router.push("/dashboard/settings")} tooltip="Settings">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* BOTTOM FOOTER: User Profile with Nested Popup */}
        <SidebarFooter className="border-t border-sidebar-border p-2 relative" ref={menuRef}>
          <div 
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-sidebar-accent cursor-pointer transition-colors group"
            title="User Settings & Menu"
          >
            <div className="flex items-center gap-3 truncate">
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#f5c62e] text-[#111214] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
              <div className="text-xs truncate text-left group-data-[collapsible=icon]:hidden">
                <p className="font-bold text-sidebar-foreground truncate">{userProfile?.full_name || "Account Owner"}</p>
                <p className="text-sidebar-foreground/60 truncate">{userProfile?.email || "user@domain.com"}</p>
              </div>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-sidebar-foreground/60 shrink-0 group-data-[collapsible=icon]:hidden" />
          </div>

          {/* --- NESTED POPUP MENU (Right Next to Footer) --- */}
          {profileMenuOpen && (
            <div className="absolute bottom-full left-2 mb-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#e7e7e9] p-2 z-50 animate-in fade-in zoom-in-95 text-[#111214]">
              <div className="p-3 border-b border-[#e7e7e9] flex items-center gap-3">
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#f5c62e] text-[#111214] flex items-center justify-center font-bold text-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="truncate">
                  <p className="font-bold text-xs truncate">{userProfile?.full_name}</p>
                  <p className="text-[10px] text-[#686b73] truncate">{userProfile?.email}</p>
                </div>
              </div>

              <div className="py-1 space-y-0.5 text-xs">
                <button 
                  onClick={() => { setProfileEditModal(true); setProfileMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f7f7f5] font-medium text-left transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#686b73]" /> Edit Profile & Photo
                </button>
                <button 
                  onClick={() => { router.push("/dashboard/settings"); setProfileMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f7f7f5] font-medium text-left transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#686b73]" /> Subscription Plan
                </button>
                <button 
                  onClick={() => { router.push("/dashboard/settings"); setProfileMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f7f7f5] font-medium text-left transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#686b73]" /> Help & Support
                </button>
              </div>

              <div className="pt-1 border-t border-[#e7e7e9] mt-1">
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 font-medium text-left transition-colors text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      {/* --- 3-STEP BUSINESS SETUP & CUSTOMIZATION WIZARD MODAL --- */}
      {businessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-[#e7e7e9] space-y-5 animate-in fade-in zoom-in-95 text-[#111214]">
            <div className="flex items-center justify-between border-b border-[#e7e7e9] pb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#f5c62e] text-[#111214]">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-base">Business Setup & Customization</h3>
                  <p className="text-[11px] text-[#686b73]">Step {wizardStep} of 3</p>
                </div>
              </div>
              <button onClick={() => setBusinessModalOpen(false)} className="p-1 rounded-lg text-[#686b73] hover:bg-[#f7f7f5]">
                <X size={20} />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div className="w-full bg-[#f7f7f5] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#111214] h-full transition-all duration-300" 
                style={{ width: wizardStep === 1 ? "33%" : wizardStep === 2 ? "66%" : "100%" }}
              />
            </div>

            <form onSubmit={wizardStep === 3 ? handleCompleteWizard : (e) => { e.preventDefault(); setWizardStep(wizardStep + 1); }} className="space-y-4">
              {wizardStep === 1 && (
                <div className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="text-xs font-semibold text-[#686b73]">Business Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Accra Auto Spares"
                      value={bizForm.name}
                      onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#e7e7e9] bg-[#f7f7f5] text-xs focus:outline-none focus:border-[#111214]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#686b73]">Industry / Business Type</label>
                    <select
                      value={bizForm.industry}
                      onChange={(e) => setBizForm({ ...bizForm, industry: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#e7e7e9] bg-[#f7f7f5] text-xs focus:outline-none focus:border-[#111214]"
                    >
                      <option value="Retail / Local Shop">Retail / Local Shop</option>
                      <option value="Salon & Beauty">Salon & Beauty</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Professional Services">Professional Services</option>
                      <option value="Logistics & Delivery">Logistics & Delivery</option>
                    </select>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="text-xs font-semibold text-[#686b73]">Business Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+233 24 000 0000"
                      value={bizForm.phone}
                      onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#e7e7e9] bg-[#f7f7f5] text-xs focus:outline-none focus:border-[#111214]"
                    />
                    <p className="mt-1 text-[10px] text-[#686b73]">The primary line monitored by your Android gateway.</p>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="text-xs font-semibold text-[#686b73]">Automated Follow-up Message Template</label>
                    <textarea
                      rows={4}
                      required
                      value={bizForm.message_template}
                      onChange={(e) => setBizForm({ ...bizForm, message_template: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#e7e7e9] bg-[#f7f7f5] text-xs focus:outline-none focus:border-[#111214]"
                    />
                    <p className="mt-1 text-[10px] text-[#686b73]">This text will be sent automatically via SMS or WhatsApp when a call is missed.</p>
                  </div>
                </div>
              )}

              {/* Wizard Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#e7e7e9]">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(wizardStep - 1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#686b73] hover:bg-[#f7f7f5] flex items-center gap-1"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                ) : <div />}

                {wizardStep < 3 ? (
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#111214] text-white rounded-xl text-xs font-bold hover:bg-black flex items-center gap-1"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#f5c62e] text-[#111214] rounded-xl text-xs font-bold hover:bg-[#e6b825] shadow-sm"
                  >
                    Complete Setup
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT USER PROFILE MODAL --- */}
      {profileEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-[#e7e7e9] space-y-4 text-[#111214] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#e7e7e9] pb-3">
              <h3 className="font-bold text-base">Edit User Profile</h3>
              <button onClick={() => setProfileEditModal(false)} className="p-1 rounded-lg text-[#686b73] hover:bg-[#f7f7f5]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#686b73]">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#e7e7e9] bg-[#f7f7f5] text-xs focus:outline-none focus:border-[#111214]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#686b73]">Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+233 24 000 0000"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#e7e7e9] bg-[#f7f7f5] text-xs focus:outline-none focus:border-[#111214]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#686b73]">Avatar Image URL</label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#e7e7e9] bg-[#f7f7f5] text-xs focus:outline-none focus:border-[#111214]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e7e7e9]">
                <button
                  type="button"
                  onClick={() => setProfileEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#686b73] hover:bg-[#f7f7f5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#111214] text-white rounded-xl text-xs font-semibold hover:bg-black"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}