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
    <section className="hero-section" aria-labelledby="hero-heading" id="live-demo" data-reveal>
      <div className="page-container hero-grid">
        <div>
          <div className="hero-pill"><span className="hero-pill-icon"><PhoneMissed size={12} strokeWidth={1.8} /></span><span>Built for businesses that can’t afford to miss customers</span></div>
          <h1 id="hero-heading" className="hero-title display-title mt-6"> <span className="hero-line">Turn missed calls</span><span className="hero-line">into <span className="hero-highlight">booked</span></span><span className="hero-line">customers.</span></h1>
          <p className="mt-6 max-w-[435px] text-[15px] leading-[1.85] text-muted">Your next customer called. You were busy. Turn missed calls into real conversations and booked appointments — without lifting a finger.</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link 
              href="/auth"
              className="btn btn-primary btn-lg"
            >
              Start my 14-day free trial
            </Link>
            <a href="#how-it-works" className="btn btn-light btn-lg"><CirclePlay size={17} strokeWidth={1.6} /> See how it works</a>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-muted"><span className="inline-flex items-center gap-1.5"><Check size={12} strokeWidth={2} /> No credit card needed</span><span className="inline-flex items-center gap-1.5"><Check size={12} strokeWidth={2} /> Works with your existing number</span></div>
        </div>

        <div className="hero-visual" aria-label="Interactive CallBackly recovery demonstration">
          <div className="preview-grid" aria-hidden="true" />
          <div className="preview-halo" aria-hidden="true" />
          <div className="absolute top-1 right-3 z-10 hidden -rotate-3 items-center gap-1.5 rounded-full border border-line bg-white px-3 py-2 text-[9px] text-muted lg:flex"><span className="live-dot" /> Your business, always on.</div>
          <div className="recovery-window">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2"><BrandMark className="brand-mark-small" /><span className="text-[12px] font-semibold tracking-[-0.03em]">CallBackly</span><span className="ml-1 rounded border border-line px-1.5 py-0.5 font-mono text-[7px] tracking-wide text-muted">LIVE DEMO</span></div>
              <button type="button" onClick={replay} disabled={playing} className="inline-flex items-center gap-1.5 text-[9px] text-muted hover:text-ink disabled:opacity-50" aria-label="Replay missed-call recovery flow"><RotateCcw size={11} className={playing ? "animate-spin" : ""} />{playing ? "Playing" : "Replay"}</button>
            </div>
            <div className="call-notice">
              <div className="call-notice-icon"><PhoneMissed size={19} strokeWidth={1.5} /></div>
              <div className="flex-1"><p className="text-[11px] font-medium">A call from Sarah Miller</p><p className="mt-1 text-[9px] text-muted">Missed call · Your business number</p></div>
              <span className="self-start pt-1 font-mono text-[8px] text-muted">10:42 AM</span>
            </div>
            <div className="mt-4 mb-3 flex items-center justify-between"><span className="font-mono text-[8px] tracking-widest text-muted">A LITTLE FOLLOW-UP GOES A LONG WAY</span><MessageCircle size={12} className="text-muted" strokeWidth={1.5} /></div>
            <div className="min-h-[197px]" aria-live="polite" aria-atomic="true">
              {stage === 0 ? (
                <div className="animate-enter flex min-h-[190px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-soft text-center"><span className="mb-3 grid size-10 place-items-center rounded-full bg-yellow-soft"><Sparkles size={19} strokeWidth={1.5} className={playing ? "animate-pulse-soft" : ""} /></span><p className="text-[12px] font-medium">A missed call. We’ve got it.</p><p className="mt-1.5 max-w-[230px] text-[10px] leading-5 text-muted">Your automatic follow-up is on its way.<br />No extra work on your end.</p></div>
              ) : (
                <div className="space-y-2.5">
                  <div key="outgoing" className="chat-bubble chat-bubble-outgoing animate-enter">Hi Sarah! Sorry we missed your call. 👋 Want to book a fresh cut? We’d love to fit you in.</div>
                  <div className="chat-bubble chat-bubble-incoming animate-enter">Hey! Yes, do you have anything Friday afternoon?</div>
                  {stage === 1 ? <div className="animate-enter flex items-center gap-2 pt-3 pl-2 text-[10px] text-muted"><span className="flex gap-0.5" aria-hidden="true"><span className="animate-pulse-soft">•</span><span className="animate-pulse-soft">•</span><span className="animate-pulse-soft">•</span></span> Checking the calendar, keeping the conversation going.</div> : <div className="animate-enter booked-message"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-success"><CalendarCheck2 size={17} strokeWidth={1.7} /></div><div className="flex-1"><p className="text-[10px] font-semibold text-success">Booked. Just like that.</p><p className="mt-0.5 text-[9px] text-muted">Friday, 2:00 PM · Haircut & style</p></div><CheckCircle2 size={16} strokeWidth={1.5} className="text-success" /></div>}
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">{flowSteps.map((label, index) => <button key={label} type="button" className="flow-tab" aria-label={`Show ${label.toLowerCase()} stage`} data-active={stage === index} aria-pressed={stage === index} onClick={() => { setPlaying(false); setStage(index); }}><span>{index + 1}</span>{label}{index < 2 && <ChevronRight size={10} className="ml-2 text-line" aria-hidden="true" />}</button>)}</div>
          </div>
          <div className="recovery-toast"><span className="grid size-10 place-items-center rounded-[10px] bg-yellow"><TrendingUp size={20} strokeWidth={1.8} /></span><div><p className="text-[9px] text-muted">One missed call. One new customer.</p><p className="mt-0.5 text-[18px] font-semibold tracking-[-0.04em]">$180 <span className="text-[10px] font-normal tracking-normal text-muted">in potential revenue</span></p></div><span className="ml-3 grid size-5 place-items-center rounded-full bg-success-soft text-success"><Check size={12} strokeWidth={2} /></span></div>
          <div className="absolute right-4 -bottom-4 hidden items-center gap-1.5 font-mono text-[8px] text-muted xl:flex"><span>EXAMPLE RECOVERY</span><ArrowUpRight size={10} /></div>
        </div>
      </div>
    </section>
  );
}