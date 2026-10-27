"use client";

import { useState } from "react";
import { ArrowUpRight, CarFront, Dumbbell, HeartPulse, House, PawPrint, Scissors, Sparkles, Stethoscope } from "lucide-react";
import { DemoButton } from "./DemoButton";

const industries = [
  { label: "Salons", icon: Scissors, detail: "Hands on with a client? Keep the next one coming in, without reaching for your phone." },
  { label: "Barbers", icon: Scissors, detail: "Your chair stays busy. CallBackly keeps the next appointment in the conversation." },
  { label: "Dentists", icon: Stethoscope, detail: "More time for your patients. Less time chasing the calls your front desk couldn’t take." },
  { label: "Clinics", icon: HeartPulse, detail: "Give your team the breathing room to care, while new patients find their way to your calendar." },
  { label: "Auto shops", icon: CarFront, detail: "You’re under the hood. We’re on the phone, helping your next customer get back on the road." },
  { label: "Home services", icon: House, detail: "From the job site to the next job. Turn calls you miss on the go into work worth coming back for." },
  { label: "Spas & wellness", icon: Sparkles, detail: "Keep the calm in your day. Let missed-call follow-ups quietly fill your appointment book." },
  { label: "Pet care", icon: PawPrint, detail: "Focused on the furry ones? We’ll make sure their humans don’t slip through the cracks." },
  { label: "Fitness studios", icon: Dumbbell, detail: "Keep your energy on the class. Turn the next inquiry into your next regular member." },
];

export function AudienceTags() {
  const [selected, setSelected] = useState(0);
  const current = industries[selected];
  return (
    <section className="section-space" id="industries" aria-labelledby="audience-heading" data-reveal>
      <div className="page-container text-center">
        <p className="eyebrow mb-4"><span className="eyebrow-dot" />LOCAL BUSINESS. BIG POSSIBILITIES.</p>
        <h2 id="audience-heading" className="section-heading">Built for your kind of busy.</h2>
        <p className="mx-auto mt-4 max-w-[490px] text-[14px] leading-7 text-muted">For the people who answer to customers, not dashboards.<br className="hidden sm:block" /> If your phone rings while you work, you’re in the right place.</p>
        <div className="mx-auto mt-9 flex max-w-[930px] flex-wrap justify-center gap-3">{industries.map(({ label, icon: Icon }, index) => <button key={label} type="button" className="industry-tag" data-active={selected === index} aria-pressed={selected === index} onClick={() => setSelected(index)}><Icon size={17} strokeWidth={1.5} />{label}</button>)}</div>
        <div className="mx-auto mt-7 flex max-w-[750px] flex-col items-center justify-between gap-4 rounded-xl border border-line bg-soft px-6 py-4 text-left sm:flex-row" aria-live="polite"><p className="text-[12px] leading-6 text-muted">{current.detail}</p><DemoButton variant="text" arrow={false} className="shrink-0 text-[11px]" intent={{ source: "Industry selector", industry: current.label, kind: "demo" }}>Sounds like us <ArrowUpRight size={14} /></DemoButton></div>
      </div>
    </section>
  );
}
