"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarCheck2, Check, CheckCircle2, ChevronRight, CirclePlay, MessageCircle, PhoneMissed, RotateCcw, Sparkles, TrendingUp } from "lucide-react";
import { BrandMark } from "./Brand";

const flowSteps = ["Missed call", "Follow-up", "Booked"];

export function Hero() {
  const [stage, setStage] = useState(2);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const followUp = setTimeout(() => setStage(1), 1200);
    const booking = setTimeout(() => setStage(2), 3000);
    const finish = setTimeout(() => setPlaying(false), 3300);
    return () => { clearTimeout(followUp); clearTimeout(booking); clearTimeout(finish); };
  }, [playing]);

  function replay() { setStage(0); setPlaying(true); }

  return (
    <section className="hero-section py-6 sm:py-16 w-full overflow-x-hidden box-border" aria-labelledby="hero-heading" id="live-demo" data-reveal>
      <div className="page-container max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Copy Column */}
        <div className="w-full lg:col-span-6 space-y-4 sm:space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] sm:text-xs font-semibold mx-auto lg:mx-0">
            <PhoneMissed size={12} strokeWidth={1.8} /> Built for businesses that can’t afford to miss customers
          </div>
          
          <h1 id="hero-heading" className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#111214] leading-[1.12]">
            <span className="block">Turn missed calls</span>
            <span className="block">into <span className="underline decoration-[#f5c62e] decoration-wavy">booked</span></span>
            <span className="block">customers.</span>
          </h1>
          
          <p className="text-xs sm:text-sm lg:text-base text-[#686b73] max-w-lg mx-auto lg:mx-0 leading-relaxed px-2 sm:px-0">
            Your next customer called. You were busy. Turn missed calls into real conversations and booked appointments — without lifting a finger.
          </p>
          
          {/* Mobile-optimized full-width buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2 w-full">
            <Link 
              href="/auth"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#f5c62e] text-[#111214] font-bold text-xs sm:text-sm hover:bg-[#e6b825] transition-all shadow-lg shadow-amber-500/10 active:scale-95 text-center"
            >
              Start my 14-day free trial
            </Link>
            <a 
              href="#how-it-works" 
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white border border-[#e7e7e9] font-bold text-xs sm:text-sm text-[#111214] hover:bg-[#f7f7f5] transition-all flex items-center justify-center gap-2 shadow-sm text-center"
            >
              <CirclePlay size={17} strokeWidth={1.6} /> See how it works
            </a>
          </div>
          
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-[11px] sm:text-xs text-[#686b73] pt-1">
            <span className="inline-flex items-center gap-1.5"><Check size={12} strokeWidth={2} className="text-emerald-600" /> No credit card needed</span>
            <span className="inline-flex items-center gap-1.5"><Check size={12} strokeWidth={2} className="text-emerald-600" /> Works with your existing number</span>
          </div>
        </div>

        {/* Right iPhone & Mobile Stack Column */}
        <div className="w-full lg:col-span-6 flex flex-col items-center justify-center gap-4 relative pt-2 lg:pt-0">
          
          {/* Authentic iPhone Frame Mockup */}
          <div className="relative w-full max-w-[320px] sm:max-w-[380px] bg-[#111214] rounded-[44px] sm:rounded-[48px] p-3 sm:p-4 shadow-2xl border-4 border-[#333] box-border">
            
            {/* iPhone Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#1a1a1a] mr-2" />
              <div className="w-10 h-1.5 rounded-full bg-[#2a2a2a]" />
            </div>

            {/* Screen Container */}
            <div className="bg-[#f7f7f5] rounded-[32px] sm:rounded-[36px] pt-8 pb-4 px-3 sm:px-4 text-[#111214] relative overflow-hidden min-h-[420px] sm:min-h-[460px] flex flex-col justify-between box-border">
              
              <div>
                {/* Header */}
                <div className="mb-3 sm:mb-4 flex items-center justify-between border-b border-[#e7e7e9] pb-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <BrandMark className="brand-mark-small w-5 h-5 shrink-0" />
                    <span className="text-[11px] font-bold tracking-tight truncate">CallBackly</span>
                    <span className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-mono text-[7px] text-amber-800 font-semibold shrink-0">LIVE</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={replay} 
                    disabled={playing} 
                    className="inline-flex items-center gap-1 text-[10px] text-[#686b73] hover:text-[#111214] disabled:opacity-50 font-medium bg-white px-2 py-1 rounded-lg border border-[#e7e7e9] shrink-0" 
                    aria-label="Replay missed-call recovery flow"
                  >
                    <RotateCcw size={11} className={playing ? "animate-spin" : ""} />
                    {playing ? "Playing" : "Replay"}
                  </button>
                </div>

                {/* Call Notice Card */}
                <div className="bg-white rounded-2xl border border-[#e7e7e9] p-2.5 sm:p-3 shadow-sm flex items-center gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                    <PhoneMissed size={16} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold truncate text-[#111214]">Sarah Miller</p>
                    <p className="text-[9px] text-[#686b73] truncate">Missed call · Shop line</p>
                  </div>
                  <span className="font-mono text-[8px] text-[#686b73] shrink-0">10:42 AM</span>
                </div>

                <div className="mt-3 mb-2 flex items-center justify-between">
                  <span className="font-mono text-[8px] tracking-wider text-[#686b73] uppercase font-semibold">Automated Follow-up</span>
                  <MessageCircle size={12} className="text-[#686b73]" strokeWidth={1.5} />
                </div>

                {/* Chat Flow Area */}
                <div className="min-h-40 sm:min-h-[170px] text-[11px]" aria-live="polite" aria-atomic="true">
                  {stage === 0 ? (
                    <div className="animate-enter flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#e7e7e9] bg-white text-center p-3">
                      <span className="mb-2 grid size-7 place-items-center rounded-full bg-amber-100 text-amber-800">
                        <Sparkles size={15} strokeWidth={1.8} className={playing ? "animate-pulse" : ""} />
                      </span>
                      <p className="text-[11px] font-bold">Missed call detected.</p>
                      <p className="mt-1 max-w-[200px] text-[9px] leading-relaxed text-[#686b73]">
                        Instant SMS & WhatsApp follow-up deploying automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div key="outgoing" className="bg-white border border-[#e7e7e9] rounded-2xl rounded-tl-sm p-2.5 sm:p-3 text-[11px] shadow-sm leading-relaxed animate-enter">
                        Hi Sarah! Sorry we missed your call. 👋 Want to book a fresh cut? We’d love to fit you in.
                      </div>
                      <div key="incoming" className="bg-[#111214] text-white rounded-2xl rounded-tr-sm p-2.5 sm:p-3 text-[11px] shadow-sm leading-relaxed ml-4 sm:ml-6 animate-enter">
                        Hey! Yes, do you have anything Friday afternoon?
                      </div>
                      {stage === 1 ? (
                        <div className="animate-enter flex items-center gap-1.5 pt-1.5 pl-1 text-[10px] text-[#686b73]">
                          <span className="flex gap-0.5 text-amber-600 font-bold" aria-hidden="true">
                            <span className="animate-pulse">•</span><span className="animate-pulse">•</span><span className="animate-pulse">•</span>
                          </span> 
                          Checking calendar & booking...
                        </div>
                      ) : (
                        <div className="animate-enter bg-emerald-50 border border-emerald-200 rounded-2xl p-2 sm:p-2.5 flex items-center gap-2">
                          <div className="grid size-6 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white">
                            <CalendarCheck2 size={13} strokeWidth={1.8} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-emerald-900 truncate">Booked successfully!</p>
                            <p className="text-[9px] text-emerald-700 truncate">Friday, 2:00 PM</p>
                          </div>
                          <CheckCircle2 size={13} strokeWidth={1.8} className="text-emerald-600 shrink-0" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* iPhone Flow Tabs Footer */}
              <div className="mt-3 flex items-center justify-between border-t border-[#e7e7e9] pt-2.5">
                {flowSteps.map((label, index) => (
                  <button 
                    key={label} 
                    type="button" 
                    className="flex items-center gap-1 text-[9px] font-semibold text-[#686b73] data-[active=true]:text-[#111214] data-[active=true]:bg-white data-[active=true]:shadow-sm px-1.5 sm:px-2 py-1 rounded-lg transition-all" 
                    data-active={stage === index} 
                    aria-pressed={stage === index} 
                    onClick={() => { setPlaying(false); setStage(index); }}
                  >
                    <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#e7e7e9] data-[active=true]:bg-[#f5c62e] data-[active=true]:text-[#111214] flex items-center justify-center text-[8px] font-bold shrink-0" data-active={stage === index}>
                      {index + 1}
                    </span>
                    <span className="text-[9px]">{label}</span>
                    {index < 2 && <ChevronRight size={9} className="text-[#ccc] hidden sm:inline" aria-hidden="true" />}
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Clean Mobile-First Revenue Card (Replaces awkward floating absolute toast on small screens) */}
          <div className="w-full max-w-[320px] sm:max-w-[380px] bg-white border border-[#e7e7e9] rounded-2xl p-3 shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="grid size-9 place-items-center rounded-xl bg-[#f5c62e] text-[#111214] shrink-0 font-bold">
                <TrendingUp size={16} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[#686b73] truncate font-medium">1 missed call recovered</p>
                <p className="text-sm font-bold tracking-tight text-[#111214]">$180 <span className="text-[10px] font-normal text-[#686b73]">in potential revenue</span></p>
              </div>
            </div>
            <span className="grid size-5 place-items-center rounded-full bg-emerald-100 text-emerald-700 shrink-0 ml-auto">
              <Check size={11} strokeWidth={2.5} />
            </span>
          </div>

        </div>

      </div>
    </section>
  );
}