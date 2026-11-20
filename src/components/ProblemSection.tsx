import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal } from "./Reveal";

export function ProblemSection() {
  return (
    <section className="section-space" id="the-problem" aria-labelledby="problem-heading">
      <div className="page-container">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="eyebrow mb-4"><span className="eyebrow-dot" />THE EXPENSIVE PROBLEM</p><h2 id="problem-heading" className="section-heading">Every missed call<br />has a price tag.</h2></div>
          <p className="section-description max-w-[350px]">You can’t always pick up. But when a customer gets voicemail, they don’t wait around. They call the next business.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-1 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <div className="bento-card flex h-full items-center justify-center bg-soft p-0">
              <Image
                src="/pain.png"
                alt="A business owner notices a missed call while busy, illustrating lost leads, missed follow-ups, and lost revenue"
                width={1882}
                height={836}
                sizes="(max-width: 1023px) 100vw, (max-width: 1279px) 58vw, 700px"
                className="block h-auto w-full max-w-full object-contain"
              />
            </div>
          </Reveal>
          <Reveal className="lg:col-span-5" delay={70}>
            <div className="bento-card relative flex h-full flex-col justify-between bg-ink p-7 text-white sm:p-9">
              <div className="flex items-start justify-between"><p className="font-mono text-[9px] tracking-[.09em] text-white/50">IT’S MORE THAN A MISSED RING.</p><ArrowUpRight className="text-yellow" size={23} strokeWidth={1.5} /></div>
              <div className="mt-6"><p className="text-[clamp(3rem,6vw,4rem)] leading-none font-medium tracking-[-.065em] text-yellow">$180<span className="ml-1.5 text-[25px] text-yellow/60">*</span></p><h3 className="mt-3 text-[19px] font-medium tracking-[-.03em]">One customer. A whole lot of potential.</h3><p className="mt-3 max-w-[330px] text-[12px] leading-[1.8] text-white/50">*An example, based on a $180 customer value. Now imagine that happening a few times a day.</p></div>
              <a href="#roi-calculator" className="mt-8 inline-flex items-center gap-2 text-[11px] font-medium text-white">What’s it costing your business?<ArrowRight size={14} /></a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
