import { ArrowRight, ArrowUpRight, CircleX, PhoneMissed, Voicemail } from "lucide-react";

export function ProblemSection() {
  return (
    <section className="section-space" id="the-problem" aria-labelledby="problem-heading" data-reveal>
      <div className="page-container">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="eyebrow mb-4"><span className="eyebrow-dot" />THE EXPENSIVE PROBLEM</p><h2 id="problem-heading" className="section-heading">Every missed call<br />has a price tag.</h2></div>
          <p className="section-description max-w-[350px]">You can’t always pick up. But when a customer gets voicemail, they don’t wait around. They call the next business.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-12">
          <div className="bento-card bg-soft p-7 sm:p-9 lg:col-span-7" data-reveal>
            <div className="mb-6 flex items-center gap-2 font-mono text-[9px] tracking-[.09em] text-muted"><span className="size-1.5 rounded-full bg-danger" />THE MISSED-CALL CYCLE</div>
            <h3 className="display-title text-[clamp(1.35rem,3vw,1.8125rem)]">You’re busy doing great work.<br className="hidden sm:block" /><span className="text-muted">They’re moving on.</span></h3>
            <div className="problem-flow">
              <div className="problem-flow-item"><div className="problem-flow-icon"><PhoneMissed size={23} strokeWidth={1.5} /></div><p className="text-[11px] font-medium">A call you can’t take</p><p className="mt-1 text-[9px] text-muted">The phone keeps ringing.</p></div>
              <ArrowRight className="mb-10 shrink-0 text-muted/50" size={17} strokeWidth={1.5} />
              <div className="problem-flow-item"><div className="problem-flow-icon"><Voicemail size={23} strokeWidth={1.5} /></div><p className="text-[11px] font-medium">Another voicemail</p><p className="mt-1 text-[9px] text-muted">“Leave a message…”</p></div>
              <ArrowRight className="mb-10 shrink-0 text-muted/50" size={17} strokeWidth={1.5} />
              <div className="problem-flow-item"><div className="problem-flow-icon"><CircleX size={23} strokeWidth={1.5} className="text-danger" /></div><p className="text-[11px] font-medium">A lost opportunity</p><p className="mt-1 text-[9px] text-muted">They try someone else.</p></div>
            </div>
          </div>
          <div className="bento-card relative flex flex-col justify-between bg-ink p-7 text-white sm:p-9 lg:col-span-5" data-reveal>
            <div className="flex items-start justify-between"><p className="font-mono text-[9px] tracking-[.09em] text-white/50">IT’S MORE THAN A MISSED RING.</p><ArrowUpRight className="text-yellow" size={23} strokeWidth={1.5} /></div>
            <div className="mt-6"><p className="text-[clamp(3rem,6vw,4rem)] leading-none font-medium tracking-[-.065em] text-yellow">$180<span className="ml-1.5 text-[25px] text-yellow/60">*</span></p><h3 className="mt-3 text-[19px] font-medium tracking-[-.03em]">One customer. A whole lot of potential.</h3><p className="mt-3 max-w-[330px] text-[12px] leading-[1.8] text-white/50">*An example, based on a $180 customer value. Now imagine that happening a few times a day.</p></div>
            <a href="#roi-calculator" className="mt-8 inline-flex items-center gap-2 text-[11px] font-medium text-white">What’s it costing your business?<ArrowRight size={14} /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
