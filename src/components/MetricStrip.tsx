import { CalendarCheck2, MessageSquareText, PhoneMissed, Workflow } from "lucide-react";

const metrics = [
  { label: "missed call", detail: "An opportunity, not a dead end.", icon: PhoneMissed },
  { label: "follow-up", detail: "A personal text. Right on time.", icon: MessageSquareText },
  { label: "new booking", detail: "The next customer on your calendar.", icon: CalendarCheck2 },
  { label: "simple system", detail: "Working quietly in the background.", icon: Workflow },
];

export function MetricStrip() {
  return (
    <section className="page-container pb-2" aria-label="One simple missed-call recovery system" data-reveal>
      <div className="metric-strip grid grid-cols-2 lg:grid-cols-4">{metrics.map(({ label, detail, icon: Icon }, index) => <div key={label} className="metric-strip-item"><span className="font-mono text-[32px] font-normal tracking-[-.06em] text-yellow">0{index + 1}</span><div><h2 className="text-[14px] font-medium">1 {label}</h2><p className="mt-1.5 max-w-[170px] text-[9px] leading-4 text-white/50">{detail}</p></div><Icon size={15} strokeWidth={1.5} className="absolute top-5 right-5 hidden text-white/30 xl:block" /></div>)}</div>
    </section>
  );
}
