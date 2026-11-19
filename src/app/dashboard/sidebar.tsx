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
import { BrandMark } from "@/components/Brand";
import { Button } from "@/components/ui/button";

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
      <Sidebar collapsible="icon" className="border-r border-zinc-200 dark:border-[#282B29] hidden md:block bg-white dark:bg-[#191B1A] text-zinc-900 dark:text-zinc-100 font-sans overflow-visible">
        {/* TOP HEADER: Business Switcher Menu */}
        <SidebarHeader className="border-b border-zinc-200 dark:border-[#282B29] p-2.5 relative z-50 overflow-visible" ref={bizMenuRef}>
          <div className="flex justify-center px-2 py-1 group-data-[collapsible=icon]:px-0">
            <BrandMark />
          </div>
          <Button
            type="button"
            onClick={() => setBusinessMenuOpen(!businessMenuOpen)}
            variant="neutral"
            size="default"
            className="h-auto w-full justify-start gap-2.5 p-2 text-left group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5"
            title="Switch Business"
          >
            <span className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-800 text-[#EAB308] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs overflow-hidden border border-zinc-200 dark:border-[#282B29]">
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </span>
            <span className="truncate text-left flex-1 group-data-[collapsible=icon]:hidden">
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate font-mono">
                {currentBusiness?.name || "y'elllo Shop"}
              </span>
              <span className="block text-[9px] text-zinc-500 dark:text-zinc-400 truncate">Switch Business</span>
            </span>
            <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 group-data-[collapsible=icon]:hidden" />
          </Button>

          {/* BUSINESS SWITCHER POPUP MENU */}
          {businessMenuOpen && (
            <div className="absolute top-full left-2.5 mt-1.5 w-60 bg-white/95 dark:bg-[#191B1A]/95 backdrop-blur-xl rounded-xl shadow-xl border border-zinc-200 dark:border-[#282B29] p-1.5 z-50 animate-in fade-in zoom-in-95 text-zinc-900 dark:text-zinc-100">
              <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-[#282B29] text-[9px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Select Business
              </div>
              <div className="py-1 max-h-48 overflow-y-auto space-y-0.5 text-xs font-medium">
                {businesses.map((b) => (
                  <Button
                    key={b.id}
                    onClick={() => { setCurrentBusiness(b); setBusinessMenuOpen(false); }}
                    variant={currentBusiness?.id === b.id ? "primary" : "ghost"}
                    size="sm"
                    className={`w-full justify-between px-3 py-2 text-left ${currentBusiness?.id === b.id ? "font-bold" : "text-zinc-900 dark:text-zinc-100"}`}
                  >
                    <span className="truncate">{b.name}</span>
                    {currentBusiness?.id === b.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </Button>
                ))}
              </div>
              <div className="pt-1 border-t border-zinc-100 dark:border-[#282B29] mt-1">
                <Button
                  onClick={() => { setBusinessMenuOpen(false); setWizardStep(1); setBusinessModalOpen(true); }}
                  variant="neutral"
                  size="sm"
                  className="w-full justify-start px-3 py-2 text-left text-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#EAB308]" /> Add New Business
                </Button>
              </div>
            </div>
          )}
        </SidebarHeader>

        {/* MIDDLE CONTENT: Navigation */}
        <SidebarContent className="p-2">
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[9px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest px-2 mb-1">y'elllo Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {[
                  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
                  { label: "Missed Calls", href: "/dashboard/calls", icon: PhoneCall },
                  { label: "Android Devices", href: "/dashboard/devices", icon: Smartphone },
                  { label: "Templates", href: "/dashboard/templates", icon: FileText },
                  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
                  { label: "Settings", href: "/dashboard/settings", icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => router.push(item.href)}
                        tooltip={item.label}
                        className={`rounded-lg transition-all font-semibold text-xs py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent! group-data-[collapsible=icon]:shadow-none! group-data-[collapsible=icon]:text-zinc-700 dark:group-data-[collapsible=icon]:text-zinc-300 group-data-[collapsible=icon]:hover:bg-zinc-100 dark:group-data-[collapsible=icon]:hover:bg-zinc-800 ${
                          isActive
                            ? "bg-[#EAB308] text-zinc-950 font-bold shadow-xs group-data-[collapsible=icon]:text-zinc-900 dark:group-data-[collapsible=icon]:text-zinc-100"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* BOTTOM FOOTER: User Profile Menu */}
        <SidebarFooter className="border-t border-zinc-200 dark:border-[#282B29] p-2.5 relative overflow-visible bg-white dark:bg-[#191B1A]" ref={menuRef}>
          <Button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            variant="ghost"
            size="default"
            className="h-auto w-full justify-between p-2 text-left group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5"
            title="User Settings"
          >
            <span className="flex items-center gap-2.5 truncate group-data-[collapsible=icon]:justify-center">
              <span className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-800 text-[#EAB308] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs overflow-hidden border border-zinc-200 dark:border-[#282B29]">
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </span>
              <span className="text-xs truncate text-left group-data-[collapsible=icon]:hidden">
                <span className="block font-bold text-zinc-900 dark:text-zinc-100 truncate">{userProfile?.full_name || "y'elllo User"}</span>
                <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-mono">{userProfile?.email || "owner@yelllo.com"}</span>
              </span>
            </span>
            <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 group-data-[collapsible=icon]:hidden" />
          </Button>

          {/* NESTED POPUP MENU */}
          {profileMenuOpen && (
            <div className="absolute bottom-full left-2.5 mb-2 w-60 bg-white/95 dark:bg-[#191B1A]/95 backdrop-blur-xl rounded-xl shadow-xl border border-zinc-200 dark:border-[#282B29] p-1.5 z-50 animate-in fade-in zoom-in-95 text-zinc-900 dark:text-zinc-100">
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
        </SidebarFooter>
      </Sidebar>

      {/* BUSINESS SETUP WIZARD MODAL */}
      {businessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3">
          <div className="bg-white dark:bg-[#191B1A] rounded-xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-[#282B29] space-y-4 text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#282B29] pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-zinc-900 dark:bg-zinc-800 text-[#EAB308] border border-zinc-800">
                  <Sparkles size={16} />
                </span>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider">y'elllo Business Wizard</h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Step {wizardStep} of 3</p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Close business setup" onClick={() => setBusinessModalOpen(false)} className="text-zinc-400">
                <X size={18} />
              </Button>
            </div>

            <div className="w-full bg-zinc-100 dark:bg-[#141615] h-1.5 rounded-full overflow-hidden border border-zinc-200 dark:border-[#282B29]">
              <div
                className="bg-[#EAB308] h-full transition-all duration-300"
                style={{ width: wizardStep === 1 ? "33%" : wizardStep === 2 ? "66%" : "100%" }}
              />
            </div>

            <form onSubmit={wizardStep === 3 ? handleCompleteWizard : (e) => { e.preventDefault(); setWizardStep(wizardStep + 1); }} className="space-y-4">
              {wizardStep === 1 && (
                <div className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Business Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Accra Boutique"
                      value={bizForm.name}
                      onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-[#282B29] bg-zinc-50 dark:bg-[#141615] text-xs font-semibold focus:outline-none focus:border-zinc-500 text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Industry Category</label>
                    <select
                      value={bizForm.industry}
                      onChange={(e) => setBizForm({ ...bizForm, industry: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-[#282B29] bg-zinc-50 dark:bg-[#141615] text-xs font-semibold focus:outline-none focus:border-zinc-500 text-zinc-900 dark:text-zinc-100"
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
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Business Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+233 24 000 0000"
                      value={bizForm.phone}
                      onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-[#282B29] bg-zinc-50 dark:bg-[#141615] text-xs font-semibold focus:outline-none focus:border-zinc-500 text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                    <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">Primary phone line monitored by Android gateway.</p>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Automated Follow-up Template</label>
                    <textarea
                      rows={4}
                      required
                      value={bizForm.message_template}
                      onChange={(e) => setBizForm({ ...bizForm, message_template: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-[#282B29] bg-zinc-50 dark:bg-[#141615] text-xs font-semibold focus:outline-none focus:border-zinc-500 text-zinc-900 dark:text-zinc-100 leading-relaxed"
                    />
                    <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">Sent instantly over SMS or WhatsApp when a call is missed.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-[#282B29]">
                {wizardStep > 1 ? (
                  <Button
                    type="button"
                    onClick={() => setWizardStep(wizardStep - 1)}
                    variant="neutral"
                    size="sm"
                    className="px-3"
                  >
                    <ChevronLeft size={13} /> Back
                  </Button>
                ) : <div />}

                {wizardStep < 3 ? (
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="px-3"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="px-3"
                  >
                    Complete Setup
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

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
              {/* Profile Image Preview & Upload */}
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
    </>
  );
}