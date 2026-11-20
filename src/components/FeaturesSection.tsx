import Image from "next/image";
import { ArrowUpRight, CalendarCheck2, ChartNoAxesCombined, MessageCircleText, PhoneMissed } from "lucide-react";
import { Reveal } from "./Reveal";

const features = [
  {
    number: "01",
    label: "INSTANT FOLLOW-UP",
    image: "/card1.png",
    imageAlt: "Illustration of an instant missed-call follow-up",
    title: "Every missed call gets a response.",
    description: "A thoughtful text reaches out right away, so customers know you’re there—even when you’re with someone else.",
    icon: PhoneMissed,
    href: "#how-it-works",
    link: "Keep the conversation going",
  },
  {
    number: "02",
    label: "NATURAL CONVERSATIONS",
    image: "/card2.png",
    imageAlt: "Illustration of a customer conversation turning into a booking",
    title: "Turn a reply into a real booking.",
    description: "Helpful, on-brand conversations make it easy for customers to ask questions and take the next step.",
    icon: MessageCircleText,
    href: "#how-it-works",
    link: "See how it works",
  },
  {
    number: "03",
    label: "VISIBLE RESULTS",
    image: "/card3.png",
    imageAlt: "Illustration of recovered calls and business results",
    title: "Know what your calls are worth.",
    description: "See recovered calls, started conversations, and the revenue opportunities your team brought back.",
    icon: ChartNoAxesCombined,
    href: "#roi-calculator",
    link: "Estimate your opportunity",
  },
];

export function FeaturesSection() {
  return (
    <section className="section-space w-full overflow-x-hidden border-t border-line bg-soft" id="features" aria-labelledby="features-heading">
      <div className="page-container">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="eyebrow mb-4"><span className="eyebrow-dot" />YOUR NEW UNFAIR ADVANTAGE</p>
            <h2 id="features-heading" className="section-heading">A little automation.<br />A lot more business.</h2>
          </div>
          <p className="section-description max-w-[340px]">Your best front-desk employee. Always on, never overwhelmed, and built to keep the conversation going.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map(({ number, label, image, imageAlt, title, description, icon: Icon, href, link }, index) => (
            <Reveal key={number} className="min-w-0" delay={index * 70}>
              <article className="bento-card flex min-w-0 flex-col bg-white p-4 sm:p-5">
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg bg-soft">
                  <Image
                    src={image}
                    alt={imageAlt}
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                    className="object-contain p-2"
                  />
                </div>
                <div className="relative z-10 flex flex-1 flex-col rounded-lg bg-white pt-5 dark:bg-[#191B1A]">
                  <span className="mb-5 grid size-11 place-items-center rounded-xl border border-line bg-soft text-ink">
                    <Icon size={20} strokeWidth={1.7} />
                  </span>
                  <p className="eyebrow mb-3 text-[9px] text-muted">{number} / {label}</p>
                  <h3 className="display-title text-[clamp(1.25rem,2vw,1.5rem)]">{title}</h3>
                  <p className="mt-3 flex-1 text-[13px] leading-7 text-muted">{description}</p>
                  <a href={href} className="mt-5 inline-flex min-h-9 items-center gap-1.5 text-[11px] font-medium">
                    {link}<ArrowUpRight size={14} />
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
          <Reveal className="sm:col-span-2 xl:hidden" delay={features.length * 70}>
            <article className="bento-card flex min-w-0 items-center gap-4 bg-yellow p-5 sm:p-7">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/70"><CalendarCheck2 size={20} strokeWidth={1.7} /></span>
              <p className="text-sm font-medium leading-6">More time for your customers. More of them on your calendar.</p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
