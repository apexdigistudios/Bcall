import { Check, Sparkles } from "lucide-react";
import { DemoButton } from "./DemoButton";

export function OfferSection() {
  return (
    <section className="section-space border-t border-line pt-0!" id="free-trial" aria-labelledby="offer-heading" data-reveal>
      <div className="page-container pt-20">
        <div className="bento-card grid bg-soft lg:grid-cols-[1.2fr_1fr]" data-reveal>
          <div className="p-5 sm:p-8 lg:p-12"><p className="eyebrow mb-5"><span className="eyebrow-dot" />LESS RISK. MORE REWARD.</p><h2 id="offer-heading" className="section-heading">Two weeks to see<br />what you’ve been missing.</h2><p className="mt-5 max-w-[400px] text-[14px] leading-7 text-muted">Try the full y&apos;elllo experience, on us. See the conversations start and the opportunities come back. Then decide.</p><ul className="mt-7 space-y-3.5 text-[12px] text-muted">{["Set up with the number you already have", "Follow-ups that sound like your business", "Real people to help you get started"].map((item) => <li key={item} className="flex items-center gap-2.5"><span className="grid size-4 place-items-center rounded-full bg-white"><Check size={10} strokeWidth={2} /></span>{item}</li>)}</ul><div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center"><DemoButton variant="dark" className="btn-lg w-full sm:w-auto" intent={{ source: "14-day trial offer", kind: "trial" }}>Start my 14-day free trial</DemoButton><span className="text-[10px] text-muted">No credit card.<br />No pressure.</span></div></div>
          <div className="relative m-2 mt-0 flex flex-col rounded-xl bg-yellow p-8 sm:p-10 lg:mt-2 lg:ml-0 lg:p-11">
            <div className="flex items-center justify-between"><p className="font-mono text-[9px] tracking-widest">A LITTLE TIME. A BIG DIFFERENCE.</p><Sparkles size={21} strokeWidth={1.3} /></div>
            <div className="mt-8 flex items-end gap-6"><span className="offer-number">14</span><span className="pb-2 text-[23px] leading-[1.1] font-medium tracking-[-.035em]">days.<br />On us.</span></div>
            <div className="mt-9 space-y-4 border-t border-ink/15 pt-6">{[{ day: "DAY 01", title: "Get connected. Get ready." }, { day: "DAY 02–13", title: "Let the follow-ups do their thing." }, { day: "DAY 14", title: "See the opportunities you brought back." }].map(({ day, title }) => <div key={day} className="flex items-center gap-4"><span className="w-[72px] shrink-0 font-mono text-[8px] tracking-[.06em]">{day}</span><span className="text-[11px] font-medium">{title}</span></div>)}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
