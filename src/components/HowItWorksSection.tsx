import { ArrowUpRight, CalendarCheck2, MessageSquareText, Phone, PhoneMissed } from "lucide-react";

const steps = [
  { number: "01", label: "MISSED CALL", title: "They call. You’re busy.", description: "A customer calls while you’re hands-on. CallBackly catches the call you couldn’t answer.", icon: PhoneMissed },
  { number: "02", label: "FOLLOW-UP", title: "We keep it going.", description: "A friendly, automatic text starts the conversation and helps them take the next step.", icon: MessageSquareText },
  { number: "03", label: "RECOVERY", title: "They’re on the books.", description: "A missed opportunity becomes a new booking. You get back to doing what you do best.", icon: CalendarCheck2 },
];

export function HowItWorksSection() {
  return (
    <section className="section-space" id="how-it-works" aria-labelledby="how-heading" data-reveal>
      <div className="page-container">
        <div className="mx-auto mb-14 max-w-[650px] text-center"><p className="eyebrow mb-4"><span className="eyebrow-dot" />THREE STEPS. ZERO EXTRA EFFORT.</p><h2 id="how-heading" className="section-heading">From “sorry we missed you”<br />to “see you soon.”</h2><p className="mx-auto mt-5 max-w-[400px] text-[14px] leading-7 text-muted">No complicated setup. No new habits to learn.<br />Just a smarter way to make every call count.</p></div>
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map(({ number, label, title, description, icon: Icon }, index) => <div key={number} className="relative text-center" data-reveal><div className="relative mb-6"><span className={`relative z-10 mx-auto grid size-[58px] place-items-center rounded-[15px] border border-line ${index === 1 ? "bg-yellow" : "bg-soft"}`}><Icon size={26} strokeWidth={1.4} /></span>{index !== 2 && <div className="step-connector" aria-hidden="true" />}</div><p className="eyebrow mb-3 text-[9px] text-muted">{number} — {label}</p><h3 className="display-title text-[21px]">{title}</h3><p className="mx-auto mt-3 max-w-[300px] text-[12px] leading-7 text-muted">{description}</p></div>)}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-5 rounded-xl border border-line bg-soft px-6 py-5 sm:flex-row"><p className="flex items-center gap-3 text-[11px] text-muted"><Phone size={17} className="shrink-0 text-ink" strokeWidth={1.5} /><span>Your existing number. Your own voice. <span className="font-medium text-ink">A whole lot less work.</span></span></p><a href="#live-demo" className="inline-flex shrink-0 items-center gap-2 text-[11px] font-medium">Try the live demo <ArrowUpRight size={14} /></a></div>
      </div>
    </section>
  );
}
