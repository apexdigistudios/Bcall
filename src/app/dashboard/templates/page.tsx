"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Sparkles, Save, MessageSquare, Send, CheckCircle2, AlertCircle, Building2, Edit3, ArrowRight, ArrowLeft, Check, Layers, Wand2 } from "lucide-react";

export default function TemplatesPage() {
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Step wizard state (Step 1: Business Profile, Step 2: Choose Channel, Step 3: Customize Templates)
  const [currentStep, setCurrentStep] = useState(1);

  const [smsTemplate, setSmsTemplate] = useState("");
  const [whatsappTemplate, setWhatsappTemplate] = useState("");
  const [industry, setIndustry] = useState("Retail / Local Shop");
  const [businessName, setBusinessName] = useState("");
  const [genTarget, setGenTarget] = useState<"sms" | "whatsapp" | "both">("both");

  async function fetchBusinessData() {
    try {
      const { data, error } = await supabase.from("businesses").select("*").limit(1).single();
      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        setBusiness(data);
        setBusinessName(data.name || "My Business");
        setIndustry(data.industry || "Retail / Local Shop");
        setSmsTemplate(data.sms_template || data.message_template || "Hi! Sorry we missed your call at [Business Name]. How can we assist you today?");
        setWhatsappTemplate(data.whatsapp_template || data.message_template || "Hello! We missed your call at [Business Name]. Let us know what you need and we'll get right back to you!");
      }
    } catch (error) {
      console.error("Failed to load y'elllo message templates:", error);
      setErrorMsg(error instanceof Error ? error.message : "Could not load your saved templates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(fetchBusinessData);
  }, []);

  const industryPresets: Record<string, { sms: string; whatsapp: string }> = {
    "Retail / Local Shop": {
      sms: "Hi! Sorry we missed your call at [Business Name]. What items are you looking for today?",
      whatsapp: "Hello! Thanks for reaching out to [Business Name]. We missed your call. Tell us what you need and we'll sort you out! 😊"
    },
    "Salon & Beauty": {
      sms: "Hi there! Thanks for calling [Business Name]. Looking to book an appointment or check open slots?",
      whatsapp: "Hello from [Business Name]! Want to book a hair, nails, or spa session? Let us know your preferred time!"
    },
    "Real Estate": {
      sms: "Hello! Thank you for reaching out to [Business Name] regarding properties. How can we assist?",
      whatsapp: "Hi! Thanks for calling [Business Name]. Are you looking to rent, buy, or inspect? Drop your requirements here!"
    },
    "Professional Services": {
      sms: "Hello, thanks for calling [Business Name]. Please reply with details of your inquiry and we'll assist.",
      whatsapp: "Greetings from [Business Name]! How can we help with your professional service needs today?"
    },
    "Logistics & Delivery": {
      sms: "Hi! We missed your call at [Business Name]. Need a package picked up or delivered? Let us know.",
      whatsapp: "Hello! Thanks for calling [Business Name] Logistics. Tracking a package or booking a delivery? Send details here!"
    }
  };

  function handleAutoGenerate() {
    const preset = industryPresets[industry] || industryPresets["Retail / Local Shop"];
    const bName = businessName.trim() || "Our Shop";

    if (genTarget === "sms" || genTarget === "both") {
      setSmsTemplate(preset.sms.replace(/\[Business Name\]/g, bName));
    }
    if (genTarget === "whatsapp" || genTarget === "both") {
      setWhatsappTemplate(preset.whatsapp.replace(/\[Business Name\]/g, bName));
    }

    setSuccessMsg(`AI templates successfully generated for ${genTarget.toUpperCase()}!`);
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    const updatePayload = {
      name: businessName,
      industry,
      sms_template: smsTemplate,
      whatsapp_template: whatsappTemplate,
      message_template: smsTemplate
    };

    try {
      if (business?.id) {
        const { error } = await supabase.from("businesses").update(updatePayload).eq("id", business.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("businesses").insert(updatePayload).select().single();
        if (error) throw error;
        if (data) setBusiness(data);
      }
      setSuccessMsg("Template settings saved successfully with y'elllo!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error("Failed to save y'elllo message templates:", error);
      setErrorMsg(error instanceof Error ? error.message : "Could not save your templates.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="w-full py-16 text-center text-xs font-semibold text-[#686b73] bg-white" role="status">Loading y'elllo templates…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6 pb-28 px-4 sm:px-6 bg-white min-h-screen text-[#111214]">
      {/* Header */}
      <div className="pt-4 border-b border-neutral-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full w-fit mb-2">
          <Wand2 className="w-3.5 h-3.5 text-amber-600" /> y'elllo Automation Wizard
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111214]">Follow-Up Message Templates</h2>
        <p className="text-xs text-[#686b73] mt-1">
          Configure how y'elllo responds instantly over SMS and WhatsApp when a customer call is missed.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /> {errorMsg}
        </div>
      )}

      {/* iOS-Inspired Step Wizard Indicator */}
      <div className="grid grid-cols-3 gap-2 bg-[#f7f7f5] p-1.5 rounded-2xl border border-neutral-200">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            currentStep === 1 ? "bg-white text-[#111214] shadow-sm border border-neutral-200" : "text-[#686b73] hover:text-[#111214]"
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 1 ? "bg-[#f5c62e] text-[#111214]" : "bg-neutral-200 text-neutral-700"}`}>1</span>
          <span className="hidden sm:inline">Business Profile</span>
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            currentStep === 2 ? "bg-white text-[#111214] shadow-sm border border-neutral-200" : "text-[#686b73] hover:text-[#111214]"
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 2 ? "bg-[#f5c62e] text-[#111214]" : "bg-neutral-200 text-neutral-700"}`}>2</span>
          <span className="hidden sm:inline">Select Channel</span>
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            currentStep === 3 ? "bg-white text-[#111214] shadow-sm border border-neutral-200" : "text-[#686b73] hover:text-[#111214]"
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 3 ? "bg-[#f5c62e] text-[#111214]" : "bg-neutral-200 text-neutral-700"}`}>3</span>
          <span className="hidden sm:inline">Customize Editor</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Step 1: Business Context & AI Generator */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#111214]">Step 1: Define Your Business</h3>
                <p className="text-xs text-[#686b73]">Set your shop name and trade so y'elllo AI drafts the perfect reply.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111214]">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Accra Boutique"
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 bg-[#f7f7f5] text-xs font-semibold text-[#111214] focus:outline-none focus:border-[#111214]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111214]">Industry Category</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 bg-[#f7f7f5] text-xs font-semibold text-[#111214] focus:outline-none focus:border-[#111214]"
                >
                  <option value="Retail / Local Shop">Retail / Local Shop</option>
                  <option value="Salon & Beauty">Salon & Beauty</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Professional Services">Professional Services</option>
                  <option value="Logistics & Delivery">Logistics & Delivery</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 rounded-2xl bg-[#111214] text-white font-bold text-xs hover:bg-black flex items-center gap-2 shadow-sm transition-all"
              >
                Next: Select Channel <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Channel Selection Card */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#111214]">Step 2: Choose Messaging Channel</h3>
                <p className="text-xs text-[#686b73]">Pick whether y'elllo sends SMS, WhatsApp, or both automatically.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setGenTarget("both")}
                className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                  genTarget === "both" ? "border-[#111214] bg-amber-50/50 shadow-sm" : "border-neutral-200 bg-white hover:bg-neutral-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#111214]">SMS & WhatsApp</span>
                  {genTarget === "both" && <Check className="w-4 h-4 text-[#111214]" />}
                </div>
                <p className="text-[11px] text-[#686b73]">Maximum reach across all incoming missed calls.</p>
              </button>

              <button
                type="button"
                onClick={() => setGenTarget("sms")}
                className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                  genTarget === "sms" ? "border-[#111214] bg-amber-50/50 shadow-sm" : "border-neutral-200 bg-white hover:bg-neutral-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#111214]">SMS Only</span>
                  {genTarget === "sms" && <Check className="w-4 h-4 text-[#111214]" />}
                </div>
                <p className="text-[11px] text-[#686b73]">Instant text message sent to cellular numbers.</p>
              </button>

              <button
                type="button"
                onClick={() => setGenTarget("whatsapp")}
                className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                  genTarget === "whatsapp" ? "border-[#111214] bg-amber-50/50 shadow-sm" : "border-neutral-200 bg-white hover:bg-neutral-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#111214]">WhatsApp Only</span>
                  {genTarget === "whatsapp" && <Check className="w-4 h-4 text-[#111214]" />}
                </div>
                <p className="text-[11px] text-[#686b73]">Direct chat conversation link triggered instantly.</p>
              </button>
            </div>

            <div className="bg-[#f7f7f5] rounded-2xl p-4 border border-neutral-200 flex items-center justify-between flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-semibold text-[#111214]">Want y'elllo AI to instantly draft templates for your selection?</span>
              </div>
              <button
                type="button"
                onClick={handleAutoGenerate}
                className="px-4 py-2 rounded-xl bg-[#f5c62e] text-[#111214] font-bold text-xs hover:bg-[#e6b825] shadow-sm transition-all shrink-0"
              >
                Auto-Generate Now
              </button>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-3 rounded-2xl border border-neutral-200 text-xs font-bold text-[#111214] hover:bg-neutral-50 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 rounded-2xl bg-[#111214] text-white font-bold text-xs hover:bg-black flex items-center gap-2 shadow-sm transition-all"
              >
                Next: Customize Editor <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Separate Cards for SMS & WhatsApp Editor */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SMS Editor Card */}
              <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#f5c62e]/20 flex items-center justify-center text-[#111214] shrink-0 font-bold">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-[#111214]">SMS Message Editor</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-[#686b73]">Active</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#686b73]">Message Body</label>
                    <textarea
                      rows={5}
                      value={smsTemplate}
                      onChange={(e) => setSmsTemplate(e.target.value)}
                      className="w-full resize-y rounded-2xl border border-neutral-200 bg-[#f7f7f5] p-4 text-xs leading-relaxed text-[#111214] focus:outline-none focus:border-[#111214]"
                      placeholder="Type your automated SMS..."
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[#686b73] italic">Tip: Use [Business Name] to dynamically insert your shop name.</p>
              </div>

              {/* WhatsApp Editor Card */}
              <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 font-bold">
                        <Send className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-[#111214]">WhatsApp Message Editor</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-[#686b73]">Active</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#686b73]">Message Body</label>
                    <textarea
                      rows={5}
                      value={whatsappTemplate}
                      onChange={(e) => setWhatsappTemplate(e.target.value)}
                      className="w-full resize-y rounded-2xl border border-neutral-200 bg-[#f7f7f5] p-4 text-xs leading-relaxed text-[#111214] focus:outline-none focus:border-[#111214]"
                      placeholder="Type your automated WhatsApp message..."
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[#686b73] italic">Tip: Add emojis like 😊 or 👋 to make responses feel authentic.</p>
              </div>
            </div>

            {/* Navigation & Final Save */}
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm flex items-center justify-between flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-neutral-200 text-xs font-bold text-[#111214] hover:bg-neutral-50 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Channels
              </button>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#111214] text-white font-bold text-xs hover:bg-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? "Saving Changes..." : "Save Template Settings"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}