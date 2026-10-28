"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FileText, Sparkles, Save, MessageSquare, Send, CheckCircle2, AlertCircle, Building2, Edit3 } from "lucide-react";

export default function TemplatesPage() {
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [isEditingSms, setIsEditingSms] = useState(false);
  const [isEditingWhatsapp, setIsEditingWhatsapp] = useState(false);

  const [smsTemplate, setSmsTemplate] = useState("");
  const [whatsappTemplate, setWhatsappTemplate] = useState("");
  const [industry, setIndustry] = useState("Retail / Local Shop");
  const [businessName, setBusinessName] = useState("");
  const [genTarget, setGenTarget] = useState<"sms" | "whatsapp" | "both">("both");

  useEffect(() => {
    fetchBusinessData();
  }, []);

  async function fetchBusinessData() {
    setLoading(true);
    const { data } = await supabase.from("businesses").select("*").limit(1).single();
    if (data) {
      setBusiness(data);
      setBusinessName(data.name || "My Business");
      setIndustry(data.industry || "Retail / Local Shop");
      setSmsTemplate(data.sms_template || data.message_template || "Hi! Sorry we missed your call at [Business Name]. How can we assist you today?");
      setWhatsappTemplate(data.whatsapp_template || data.message_template || "Hello! We missed your call at [Business Name]. Let us know what you need and we'll get right back to you!");
    }
    setLoading(false);
  }

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
      setIsEditingSms(true);
    }
    if (genTarget === "whatsapp" || genTarget === "both") {
      setWhatsappTemplate(preset.whatsapp.replace(/\[Business Name\]/g, bName));
      setIsEditingWhatsapp(true);
    }

    setSuccessMsg(`Generated for ${genTarget.toUpperCase()}!`);
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

    let error;
    if (business?.id) {
      const res = await supabase.from("businesses").update(updatePayload).eq("id", business.id);
      error = res.error;
    } else {
      const res = await supabase.from("businesses").insert(updatePayload).select().single();
      if (res.data) setBusiness(res.data);
      error = res.error;
    }

    setSaving(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setIsEditingSms(false);
      setIsEditingWhatsapp(false);
      setSuccessMsg("Templates saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-xs text-[#686b73]">Loading...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-28 px-2 sm:px-0">
      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#111214]">Follow-up Message Templates</h2>
        <p className="text-[11px] sm:text-xs text-[#686b73] mt-0.5">
          Customize instant SMS and WhatsApp messages sent after a missed call.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
        {/* Business Context Card */}
        <div className="bg-white rounded-2xl border border-[#e7e7e9] p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-[#e7e7e9] pb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#111214]">Business Context & AI</h3>
              <p className="text-[11px] text-[#686b73]">Tailor automated messaging to your trade</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#686b73] block mb-1">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Shop Name"
                className="w-full px-3 py-2 rounded-xl border border-[#e7e7e9] bg-[#f7f7f5] text-xs text-[#111214] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#686b73] block mb-1">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e7e7e9] bg-[#f7f7f5] text-xs text-[#111214] focus:outline-none"
              >
                <option value="Retail / Local Shop">Retail / Local Shop</option>
                <option value="Salon & Beauty">Salon & Beauty</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Logistics & Delivery">Logistics & Delivery</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3 border-t border-[#e7e7e9]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#686b73]">Target:</span>
              <select
                value={genTarget}
                onChange={(e) => setGenTarget(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-[#e7e7e9] bg-[#f7f7f5] text-[11px] text-[#111214] focus:outline-none"
              >
                <option value="both">SMS & WhatsApp</option>
                <option value="sms">SMS Only</option>
                <option value="whatsapp">WhatsApp Only</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleAutoGenerate}
              className="w-full py-2.5 rounded-xl bg-[#f5c62e] text-[#111214] font-bold text-xs hover:bg-[#e6b825] transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-Generate Template
            </button>
          </div>
        </div>

        {/* SMS Template Card */}
        <div className="bg-white rounded-2xl border border-[#e7e7e9] p-4 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#e7e7e9] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#111214]">SMS Message</h3>
              </div>
            </div>
            {!isEditingSms ? (
              <button
                type="button"
                onClick={() => setIsEditingSms(true)}
                className="px-2.5 py-1 rounded-lg bg-[#f7f7f5] border border-[#e7e7e9] text-[11px] font-semibold text-[#111214] flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                Editing
              </span>
            )}
          </div>

          {!isEditingSms ? (
            <div className="p-3 rounded-xl bg-[#f7f7f5] border border-[#e7e7e9] text-[11px] text-[#111214] leading-relaxed font-mono">
              {smsTemplate}
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={3}
                value={smsTemplate}
                onChange={(e) => setSmsTemplate(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#e7e7e9] bg-[#f7f7f5] text-xs text-[#111214] focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditingSms(false)}
                  className="text-[11px] font-semibold text-[#686b73] hover:text-[#111214]"
                >
                  Done Editing
                </button>
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp Template Card */}
        <div className="bg-white rounded-2xl border border-[#e7e7e9] p-4 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#e7e7e9] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#111214]">WhatsApp Message</h3>
              </div>
            </div>
            {!isEditingWhatsapp ? (
              <button
                type="button"
                onClick={() => setIsEditingWhatsapp(true)}
                className="px-2.5 py-1 rounded-lg bg-[#f7f7f5] border border-[#e7e7e9] text-[11px] font-semibold text-[#111214] flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                Editing
              </span>
            )}
          </div>

          {!isEditingWhatsapp ? (
            <div className="p-3 rounded-xl bg-[#f7f7f5] border border-[#e7e7e9] text-[11px] text-[#111214] leading-relaxed font-mono">
              {whatsappTemplate}
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={3}
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#e7e7e9] bg-[#f7f7f5] text-xs text-[#111214] focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditingWhatsapp(false)}
                  className="text-[11px] font-semibold text-[#686b73] hover:text-[#111214]"
                >
                  Done Editing
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#111214] text-white font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Template Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}