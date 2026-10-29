"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { MessageSquare, Send, Check, Sparkles, RefreshCw } from "lucide-react";

export default function TemplatesPage() {
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"sms" | "whatsapp">("sms");
  const [successMsg, setSuccessMsg] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [smsTemplate, setSmsTemplate] = useState("");
  const [whatsappTemplate, setWhatsappTemplate] = useState("");
  const [templateIndex, setTemplateIndex] = useState(0);

  const smsLibrary = [
    "Hi [Business Name] here! Sorry we missed your call. What can we get sorted out for you today?",
    "Hello! We missed your call at [Business Name]. Are you looking to make a purchase or booking? Let us know!",
    "Hey there! Thanks for calling [Business Name]. Drop your inquiry here and our team will respond right away.",
    "Hi! Sorry we couldn't answer your call at [Business Name] just now. How can we assist you today?",
    "Greetings from [Business Name]! We missed you. Reply with what you need and we'll get right on it."
  ];

  const whatsappLibrary = [
    "Hello! Thanks for reaching out to [Business Name]. We missed your call—tell us what you need and we'll sort you out right away! 😊",
    "Hi from [Business Name]! Sorry we missed you. Drop your request or questions here and we'll reply instantly! 🚀",
    "Greetings! Thanks for calling [Business Name]. Looking for a quote, booking, or product info? Let us know below!",
    "Hi there! We missed your live call at [Business Name]. How can we help make things easier? Let's chat 👇",
    "Hello! [Business Name] team here. Sorry we were away from the phone. Send your message here and we'll assist!"
  ];

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase.from("businesses").select("*").limit(1).single();
    if (data) {
      setBusiness(data);
      setBusinessName(data.name || "My Business");
      setSmsTemplate(data.sms_template || smsLibrary[0]);
      setWhatsappTemplate(data.whatsapp_template || whatsappLibrary[0]);
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (business?.id) {
      await supabase.from("businesses").update({
        name: businessName,
        sms_template: smsTemplate,
        whatsapp_template: whatsappTemplate
      }).eq("id", business.id);
    }
    setSaving(false);
    setSuccessMsg("Saved");
    setTimeout(() => setSuccessMsg(""), 2000);
  }

  function handleShuffleTemplate() {
    if (activeTab === "sms") {
      const nextIdx = (templateIndex + 1) % smsLibrary.length;
      setTemplateIndex(nextIdx);
      setSmsTemplate(smsLibrary[nextIdx]);
    } else {
      const nextIdx = (templateIndex + 1) % whatsappLibrary.length;
      setTemplateIndex(nextIdx);
      setWhatsappTemplate(whatsappLibrary[nextIdx]);
    }
    setSuccessMsg("Loaded");
    setTimeout(() => setSuccessMsg(""), 1500);
  }

  function insertTag(tag: string) {
    if (activeTab === "sms") {
      setSmsTemplate((prev) => prev + " " + tag);
    } else {
      setWhatsappTemplate((prev) => prev + " " + tag);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-xs font-medium text-neutral-400 bg-white">Loading...</div>;
  }

  const currentText = activeTab === "sms" ? smsTemplate : whatsappTemplate;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pb-20 px-3 sm:px-4 bg-white min-h-screen text-[#111214] font-sans">
      {/* iOS Header */}
      <div className="pt-4 border-b border-neutral-100 pb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase">y'elllo / Automation</span>
          <h2 className="text-lg font-bold tracking-tight text-[#111214]">Templates</h2>
        </div>
        {successMsg && (
          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-black text-[#f5c62e] flex items-center gap-1 animate-in fade-in">
            <Check className="w-3 h-3" /> {successMsg}
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* iOS Glass Segmented Tab Control */}
        <div className="grid grid-cols-2 gap-1 bg-neutral-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("sms")}
            className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "sms" 
                ? "bg-white text-[#111214] shadow-sm" 
                : "text-neutral-500 hover:text-[#111214]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> SMS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("whatsapp")}
            className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "whatsapp" 
                ? "bg-white text-[#111214] shadow-sm" 
                : "text-neutral-500 hover:text-[#111214]"
            }`}
          >
            <Send className="w-3.5 h-3.5" /> WhatsApp
          </button>
        </div>

        {/* Business Name Input */}
        <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-3 flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold text-neutral-600">[Business Name] tag:</span>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Shop Name"
            className="w-44 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-[#111214] focus:outline-none focus:border-black"
          />
        </div>

        {/* Editor & Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Editor */}
          <div className="md:col-span-7 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Message Editor</label>
              {/* Reduced size generate pill */}
              <button
                type="button"
                onClick={handleShuffleTemplate}
                className="text-[10px] font-medium text-[#111214] bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 border border-neutral-200"
              >
                <RefreshCw className="w-2.5 h-2.5 text-neutral-600" /> Generate
              </button>
            </div>

            <textarea
              rows={4}
              value={currentText}
              onChange={(e) => (activeTab === "sms" ? setSmsTemplate(e.target.value) : setWhatsappTemplate(e.target.value))}
              className="w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 text-xs font-normal leading-relaxed text-[#111214] focus:outline-none focus:border-black"
              placeholder="Type template..."
            />

            {/* Tags */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-neutral-400">Insert:</span>
              <button
                type="button"
                onClick={() => insertTag("[Business Name]")}
                className="px-2 py-1 rounded-md border border-neutral-200 bg-white text-[10px] font-medium text-neutral-700 hover:bg-neutral-50"
              >
                [Business Name]
              </button>
              <button
                type="button"
                onClick={() => insertTag("[Time]")}
                className="px-2 py-1 rounded-md border border-neutral-200 bg-white text-[10px] font-medium text-neutral-700 hover:bg-neutral-50"
              >
                [Time]
              </button>
            </div>
          </div>

          {/* iOS-Style Live Preview */}
          <div className="md:col-span-5 flex flex-col">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-2.5">Live Preview</span>
            <div className="flex-1 bg-neutral-100 rounded-2xl border border-neutral-200/60 p-3 flex flex-col justify-center relative overflow-hidden min-h-[130px]">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-neutral-300 rounded-full" />
              
              <div className="mt-2 bg-white rounded-xl p-2.5 shadow-sm border border-neutral-200/50 space-y-1">
                <div className="flex items-center justify-between text-[8px] text-neutral-400 font-mono">
                  <span>{businessName || "y'elllo"}</span>
                  <span>Now</span>
                </div>
                <p className="text-[11px] font-normal text-[#111214] leading-snug wrap-break-word">
                  {currentText.replace(/\[Business Name\]/g, businessName || "Our Shop")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="pt-3 border-t border-neutral-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-black text-white font-medium text-xs hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {saving ? "Saving..." : "Save Templates"}
          </button>
        </div>
      </form>
    </div>
  );
}