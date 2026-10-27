import { ArrowUpRight, CalendarDays, Check, CheckCheck, Clock3, PhoneMissed, TrendingUp } from "lucide-react";

export function FeaturesSection() {
  return (
    <section className="section-space border-t border-line bg-soft" id="features" aria-labelledby="features-heading" data-reveal>
      <div className="page-container">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow mb-4"><span className="eyebrow-dot" />YOUR NEW UNFAIR ADVANTAGE</p><h2 id="features-heading" className="section-heading">A little automation.<br />A lot more business.</h2></div><p className="section-description max-w-[340px]">Your best front-desk employee. Always on, never overwhelmed, and built to keep the conversation going.</p></div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <article className="bento-card flex flex-col bg-white" data-reveal>
            <div className="feature-illustration flex items-center justify-center" role="img" aria-label="Example of an instant follow-up text sent after a missed call">
              <div className="w-full max-w-[290px] -rotate-2 rounded-xl border border-line bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-[9px] font-medium"><PhoneMissed size={13} />Missed call from Sarah</span><span className="font-mono text-[8px] text-muted">NOW</span></div>
                <div className="mt-4 flex gap-2.5"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-yellow text-[9px] font-bold">CB</span><div className="rounded-xl rounded-tl-sm bg-yellow-soft px-3 py-2.5 text-[10px] leading-5">Hey Sarah! Sorry we missed you. 👋 How can we help? Just send us a text.</div></div>
                <div className="mt-2 flex items-center justify-end gap-1 text-[8px] text-muted"><CheckCheck size={11} className="text-success" /> Follow-up sent</div>
              </div>
              <div className="absolute right-5 bottom-4 flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[8px]"><Clock3 size={10} /> The right message. Right away.</div>
            </div>
            <div className="flex flex-1 flex-col p-7"><p className="eyebrow mb-3 text-[8px] text-muted">01 / INSTANT FOLLOW-UP</p><h3 className="display-title text-[23px]">Missed call?<br />Meet the instant text-back.</h3><p className="mt-3 text-[12px] leading-7 text-muted">The moment a call is missed, a friendly, personalized text keeps the conversation alive.</p><a href="#how-it-works" className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-medium">Keep the conversation going <ArrowUpRight size={13} /></a></div>
          </article>
          <article className="bento-card flex flex-col bg-white" data-reveal>
            <div className="feature-illustration flex items-center justify-center" role="img" aria-label="Example of a booking confirmation for a Friday appointment">
              <div className="w-full max-w-[255px] rotate-2 rounded-xl border border-line bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between"><span className="flex items-center gap-1.5 text-[9px] font-medium"><CalendarDays size={12} /> A spot on your calendar</span><span className="size-1.5 rounded-full bg-success" /></div>
                <div className="flex gap-4"><div className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-line bg-soft py-2"><span className="font-mono text-[8px] text-muted">FRI</span><span className="mt-0.5 text-[27px] leading-none font-medium tracking-[-.05em]">18</span></div><div className="flex flex-col justify-center"><p className="text-[11px] font-medium">A fresh cut. A new customer.</p><p className="mt-1 text-[9px] text-muted">2:00 PM · Haircut & style</p><span className="mt-2 inline-flex items-center gap-1 text-[8px] text-success"><Check size={10} /> Appointment confirmed</span></div></div>
              </div>
              <div className="absolute right-4 bottom-4 rounded-xl rounded-tr-sm border border-line bg-yellow-soft px-3 py-2 text-[9px]">“Perfect. See you Friday!” <span className="ml-1">✌️</span></div>
            </div>
            <div className="flex flex-1 flex-col p-7"><p className="eyebrow mb-3 text-[8px] text-muted">02 / SMART CONVERSATIONS</p><h3 className="display-title text-[23px]">A natural conversation.<br />A real booking.</h3><p className="mt-3 text-[12px] leading-7 text-muted">Helpful replies guide customers toward an appointment — using your business’s voice, not a robot’s.</p><a href="#roi-calculator" className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-medium">Turn conversations into value <ArrowUpRight size={13} /></a></div>
          </article>
          <article className="bento-card flex flex-col bg-white" data-reveal>
            <div className="feature-illustration flex items-center justify-center" role="img" aria-label="Illustrative recovery report showing $2,840 in recovered revenue">
              <div className="w-full max-w-[270px] rounded-xl border border-line bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between"><span className="font-mono text-[8px] tracking-[.07em] text-muted">REVENUE RECOVERED</span><span className="rounded border border-line px-1.5 py-0.5 text-[7px] text-muted">EXAMPLE</span></div>
                <div className="mt-2 flex items-center justify-between"><span className="text-[29px] font-medium leading-none tracking-[-.05em]">$2,840</span><span className="flex items-center gap-1 rounded-full bg-success-soft px-2 py-1 text-[8px] text-success"><TrendingUp size={10} /> Looking up</span></div>
                <div className="mt-4 flex h-[58px] items-end gap-2 border-b border-line pb-0">{[24, 38, 31, 59, 45, 74, 98].map((height, index) => <div key={index} className={`flex-1 rounded-t-sm ${index === 6 ? "bg-yellow" : "bg-ink/10"}`} style={{ height: `${height}%` }} />)}</div>
                <div className="mt-2 flex justify-between font-mono text-[7px] text-muted"><span>MON</span><span>SUN</span></div>
              </div>
              <div className="absolute -right-1 bottom-3 flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-[8px] shadow-sm"><span className="grid size-4 place-items-center rounded-full bg-success-soft text-success"><Check size={10} /></span> More clarity. Less guesswork.</div>
            </div>
            <div className="flex flex-1 flex-col p-7"><p className="eyebrow mb-3 text-[8px] text-muted">03 / VISIBLE RESULTS</p><h3 className="display-title text-[23px]">Less guesswork.<br />More “look at that.”</h3><p className="mt-3 text-[12px] leading-7 text-muted">See the calls you recovered, the conversations you started, and the revenue that came back.</p><a href="#roi-calculator" className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-medium">See what you could recover <ArrowUpRight size={13} /></a></div>
          </article>
        </div>
      </div>
    </section>
  );
}
