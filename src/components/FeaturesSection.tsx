import { ArrowUpRight, CalendarCheck2, ChartNoAxesCombined, MessageCircleText, PhoneMissed } from "lucide-react";

const features = [
  {
    number: "01",
    label: "INSTANT FOLLOW-UP",
    title: "Every missed call gets a response.",
    description: "A thoughtful text reaches out right away, so customers know you’re there—even when you’re with someone else.",
    icon: PhoneMissed,
    href: "#how-it-works",
    link: "Keep the conversation going",
  },
  {
    number: "02",
    label: "NATURAL CONVERSATIONS",
    title: "Turn a reply into a real booking.",
    description: "Helpful, on-brand conversations make it easy for customers to ask questions and take the next step.",
    icon: MessageCircleText,
    href: "#how-it-works",
    link: "See how it works",
  },
  {
    number: "03",
    label: "VISIBLE RESULTS",
    title: "Know what your calls are worth.",
    description: "See recovered calls, started conversations, and the revenue opportunities your team brought back.",
    icon: ChartNoAxesCombined,
    href: "#roi-calculator",
    link: "Estimate your opportunity",
  },
];

export function FeaturesSection() {
  return (
    <section className="section-space w-full overflow-x-hidden border-t border-line bg-soft" id="features" aria-labelledby="features-heading" data-reveal>
      <div className="page-container">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="eyebrow mb-4"><span className="eyebrow-dot" />YOUR NEW UNFAIR ADVANTAGE</p>
            <h2 id="features-heading" className="section-heading">A little automation.<br />A lot more business.</h2>
          </div>
          <p className="section-description max-w-[340px]">Your best front-desk employee. Always on, never overwhelmed, and built to keep the conversation going.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map(({ number, label, title, description, icon: Icon, href, link }) => (
            <article key={number} className="bento-card flex min-w-0 flex-col bg-white p-5 sm:p-7" data-reveal>
              <span className="mb-8 grid size-12 place-items-center rounded-xl border border-line bg-soft text-ink">
                <Icon size={21} strokeWidth={1.7} />
              </span>
              <p className="eyebrow mb-3 text-[9px] text-muted">{number} / {label}</p>
              <h3 className="display-title text-[clamp(1.25rem,2vw,1.5rem)]">{title}</h3>
              <p className="mt-3 flex-1 text-[13px] leading-7 text-muted">{description}</p>
              <a href={href} className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-[12px] font-medium">
                {link}<ArrowUpRight size={14} />
              </a>
            </article>
          ))}
          <article className="bento-card flex min-w-0 items-center gap-4 bg-yellow p-5 sm:col-span-2 sm:p-7 xl:hidden" data-reveal>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/70"><CalendarCheck2 size={20} strokeWidth={1.7} /></span>
            <p className="text-sm font-medium leading-6">More time for your customers. More of them on your calendar.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
