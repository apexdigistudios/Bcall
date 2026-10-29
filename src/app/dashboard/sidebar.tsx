"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  PhoneCall, Smartphone, Settings, User, Plus, Check, ChevronsUpDown, 
  LayoutDashboard, X, ChevronRight, ChevronLeft, CreditCard, HelpCircle, LogOut, Sparkles, FileText, BarChart3, Upload
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

  // Business Switcher & Wizard Modal States
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);
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
  const bizMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    void Promise.resolve().then(fetchData);
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (bizMenuRef.current && !bizMenuRef.current.contains(event.target as Node)) {
        setBusinessMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-neutral-200 hidden md:block bg-white text-[#111214] font-sans overflow-visible">
        {/* TOP HEADER: Business Switcher Menu */}
        <SidebarHeader className="border-b border-neutral-100 p-2 relative z-50 overflow-visible" ref={bizMenuRef}>
          <div 
            onClick={() => setBusinessMenuOpen(!businessMenuOpen)}
            className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors border border-neutral-200/60 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5 relative"
            title="Switch Business"
          >
            <div className="w-8 h-8 rounded-full bg-black text-[#f5c62e] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs overflow-hidden">
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="truncate text-left flex-1 group-data-[collapsible=icon]:hidden">
              <p className="font-bold text-xs text-[#111214] truncate">
                {currentBusiness?.name || "y'elllo Shop"}
              </p>
              <p className="text-[9px] text-neutral-400 truncate">Switch Business</p>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-400 shrink-0 group-data-[collapsible=icon]:hidden" />
          </div>

          {/* BUSINESS SWITCHER POPUP MENU */}
          {businessMenuOpen && (
            <div className="absolute top-full left-2 mt-1 w-60 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-neutral-200 p-1.5 z-50 animate-in fade-in zoom-in-95 text-[#111214]">
              <div className="px-3 py-2 border-b border-neutral-100 text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                Select Business
              </div>
              <div className="py-1 max-h-48 overflow-y-auto space-y-0.5 text-xs font-medium">
                {businesses.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setCurrentBusiness(b); setBusinessMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${currentBusiness?.id === b.id ? "bg-black text-[#f5c62e] font-bold" : "hover:bg-neutral-100 text-[#111214]"}`}
                  >
                    <span className="truncate">{b.name}</span>
                    {currentBusiness?.id === b.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="pt-1 border-t border-neutral-100 mt-1">
                <button
                  onClick={() => { setBusinessMenuOpen(false); setWizardStep(1); setBusinessModalOpen(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-100 text-left transition-colors text-xs font-semibold text-[#111214]"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Business
                </button>
              </div>
            </div>
          )}
        </SidebarHeader>

        {/* MIDDLE CONTENT: Navigation */}
        <SidebarContent className="p-2">
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[10px] font-mono text-neutral-400 uppercase tracking-widest px-2 mb-1">y'elllo Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={pathname === "/dashboard"} 
                    onClick={() => router.push("/dashboard")} 
                    tooltip="Overview"
                    className={`rounded-xl transition-all font-semibold text-xs py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent! group-data-[collapsible=icon]:shadow-none! group-data-[collapsible=icon]:text-neutral-700 group-data-[collapsible=icon]:hover:bg-neutral-100 ${
                      pathname === "/dashboard" 
                        ? "bg-black text-[#f5c62e] shadow-xs group-data-[collapsible=icon]:text-[#111214]" 
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-[#111214]"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span>Overview</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={pathname === "/dashboard/calls"} 
                    onClick={() => router.push("/dashboard/calls")} 
                    tooltip="Missed Calls"
                    className={`rounded-xl transition-all font-semibold text-xs py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent! group-data-[collapsible=icon]:shadow-none! group-data-[collapsible=icon]:text-neutral-700 group-data-[collapsible=icon]:hover:bg-neutral-100 ${
                      pathname === "/dashboard/calls" 
                        ? "bg-black text-[#f5c62e] shadow-xs group-data-[collapsible=icon]:text-[#111214]" 
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-[#111214]"
                    }`}
                  >
                    <PhoneCall className="w-4 h-4 shrink-0" />
                    <span>Missed Calls</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={pathname === "/dashboard/devices"} 
                    onClick={() => router.push("/dashboard/devices")} 
                    tooltip="Android Devices"
                    className={`rounded-xl transition-all font-semibold text-xs py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent! group-data-[collapsible=icon]:shadow-none! group-data-[collapsible=icon]:text-neutral-700 group-data-[collapsible=icon]:hover:bg-neutral-100 ${
                      pathname === "/dashboard/devices" 
                        ? "bg-black text-[#f5c62e] shadow-xs group-data-[collapsible=icon]:text-[#111214]" 
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-[#111214]"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span>Android Devices</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={pathname === "/dashboard/templates"} 
                    onClick={() => router.push("/dashboard/templates")} 
                    tooltip="Templates"
                    className={`rounded-xl transition-all font-semibold text-xs py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent! group-data-[collapsible=icon]:shadow-none! group-data-[collapsible=icon]:text-neutral-700 group-data-[collapsible=icon]:hover:bg-neutral-100 ${
                      pathname === "/dashboard/templates" 
                        ? "bg-black text-[#f5c62e] shadow-xs group-data-[collapsible=icon]:text-[#111214]" 
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-[#111214]"
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>Templates</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={pathname === "/dashboard/analytics"} 
                    onClick={() => router.push("/dashboard/analytics")} 
                    tooltip="Analytics"
                    className={`rounded-xl transition-all font-semibold text-xs py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent! group-data-[collapsible=icon]:shadow-none! group-data-[collapsible=icon]:text-neutral-700 group-data-[collapsible=icon]:hover:bg-neutral-100 ${
                      pathname === "/dashboard/analytics" 
                        ? "bg-black text-[#f5c62e] shadow-xs group-data-[collapsible=icon]:text-[#111214]" 
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-[#111214]"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 shrink-0" />
                    <span>Analytics</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={pathname === "/dashboard/settings"} 
                    onClick={() => router.push("/dashboard/settings")} 
                    tooltip="Settings"
                    className={`rounded-xl transition-all font-semibold text-xs py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent! group-data-[collapsible=icon]:shadow-none! group-data-[collapsible=icon]:text-neutral-700 group-data-[collapsible=icon]:hover:bg-neutral-100 ${
                      pathname === "/dashboard/settings" 
                        ? "bg-black text-[#f5c62e] shadow-xs group-data-[collapsible=icon]:text-[#111214]" 
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-[#111214]"
                    }`}
                  >
                    <Settings className="w-4 h-4 shrink-0" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* BOTTOM FOOTER: User Profile Menu */}
        <SidebarFooter className="border-t border-neutral-100 p-2 relative overflow-visible bg-white" ref={menuRef}>
          <div 
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 cursor-pointer transition-colors group border border-transparent hover:border-neutral-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5 relative"
            title="User Settings"
          >
            <div className="flex items-center gap-2.5 truncate group-data-[collapsible=icon]:justify-center">
              <div className="w-8 h-8 rounded-full bg-black text-[#f5c62e] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs overflow-hidden">
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div className="text-xs truncate text-left group-data-[collapsible=icon]:hidden">
                <p className="font-bold text-[#111214] truncate">{userProfile?.full_name || "y'elllo User"}</p>
                <p className="text-[10px] text-neutral-400 truncate">{userProfile?.email || "owner@yelllo.com"}</p>
              </div>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-400 shrink-0 group-data-[collapsible=icon]:hidden" />
          </div>

          {/* NESTED POPUP MENU */}
          {profileMenuOpen && (
            <div className="absolute bottom-full left-2 mb-2 w-60 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-neutral-200 p-1.5 z-50 animate-in fade-in zoom-in-95 text-[#111214]">
              <div className="p-2.5 border-b border-neutral-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-black text-[#f5c62e] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="truncate">
                  <p className="font-bold text-xs truncate">{userProfile?.full_name}</p>
                  <p className="text-[10px] text-neutral-400 truncate">{userProfile?.email}</p>
                </div>
              </div>

              <div className="py-1 space-y-0.5 text-xs font-medium">
                <button 
                  onClick={() => { setProfileEditModal(true); setProfileMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-100 text-left transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-neutral-500" /> Edit Profile & Photo
                </button>
                <button 
                  onClick={() => { router.push("/dashboard/settings"); setProfileMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-100 text-left transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5 text-neutral-500" /> Subscription Plan
                </button>
                <button 
                  onClick={() => { router.push("/dashboard/settings"); setProfileMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-100 text-left transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-neutral-500" /> Help & Support
                </button>
              </div>

              <div className="pt-1 border-t border-neutral-100 mt-1">
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold text-left transition-colors text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      {/* BUSINESS SETUP WIZARD MODAL */}
      {businessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4 text-[#111214] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-black text-[#f5c62e]">
                  <Sparkles size={16} />
                </span>
                <div>
                  <h3 className="font-bold text-sm">y'elllo Business Wizard</h3>
                  <p className="text-[10px] text-neutral-400">Step {wizardStep} of 3</p>
                </div>
              </div>
              <button onClick={() => setBusinessModalOpen(false)} className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-100">
                <X size={18} />
              </button>
            </div>

            <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-black h-full transition-all duration-300" 
                style={{ width: wizardStep === 1 ? "33%" : wizardStep === 2 ? "66%" : "100%" }}
              />
            </div>

            <form onSubmit={wizardStep === 3 ? handleCompleteWizard : (e) => { e.preventDefault(); setWizardStep(wizardStep + 1); }} className="space-y-3.5">
              {wizardStep === 1 && (
                <div className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="text-[11px] font-bold text-[#111214] block mb-1">Business Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Accra Boutique"
                      value={bizForm.name}
                      onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#111214] block mb-1">Industry Category</label>
                    <select
                      value={bizForm.industry}
                      onChange={(e) => setBizForm({ ...bizForm, industry: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold focus:outline-none focus:border-black"
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
                    <label className="text-[11px] font-bold text-[#111214] block mb-1">Business Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+233 24 000 0000"
                      value={bizForm.phone}
                      onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold focus:outline-none focus:border-black"
                    />
                    <p className="mt-1 text-[10px] text-neutral-400">Primary phone line monitored by Android gateway.</p>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="text-[11px] font-bold text-[#111214] block mb-1">Automated Follow-up Template</label>
                    <textarea
                      rows={4}
                      required
                      value={bizForm.message_template}
                      onChange={(e) => setBizForm({ ...bizForm, message_template: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold focus:outline-none focus:border-black leading-relaxed"
                    />
                    <p className="mt-1 text-[10px] text-neutral-400">Sent instantly over SMS or WhatsApp when a call is missed.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(wizardStep - 1)}
                    className="px-3.5 py-2 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <ChevronLeft size={13} /> Back
                  </button>
                ) : <div />}

                {wizardStep < 3 ? (
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-black text-white text-xs font-bold hover:bg-neutral-800 flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
                  >
                    Next <ChevronRight size={13} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-black text-[#f5c62e] text-xs font-bold hover:bg-neutral-800 active:scale-95 transition-all shadow-sm"
                  >
                    Complete Setup
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER PROFILE & UPLOAD MODAL */}
      {profileEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 space-y-3.5 text-[#111214] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-sm">Edit User Profile</h3>
              <button onClick={() => setProfileEditModal(false)} className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              {/* Profile Image Preview & Upload */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-black text-[#f5c62e] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-neutral-200">
                  {editAvatar ? (
                    <img src={editAvatar} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">Profile Photo</label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 bg-neutral-50 text-xs font-semibold text-[#111214] hover:bg-neutral-100 cursor-pointer transition-all active:scale-95">
                    <Upload className="w-3 h-3" /> Upload Image
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+233 24 000 0000"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setProfileEditModal(false)}
                  className="px-3 py-1.5 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-black text-white text-xs font-bold hover:bg-neutral-800 shadow-2xs"
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