import { PhoneMissed } from "lucide-react";
import { DemoButton } from "./DemoButton";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-yellow py-16 sm:py-20" aria-labelledby="final-cta-heading" data-reveal>
      <div className="page-container relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center lg:gap-16"><div><p className="eyebrow mb-5"><span className="size-1.5 rounded-full bg-ink" />YOUR NEXT CUSTOMER IS CALLING.</p><h2 id="final-cta-heading" className="section-heading max-w-[790px] text-[clamp(2.4rem,4vw,3.6rem)]">How many customers are you<br className="hidden sm:block" /> losing to missed calls?</h2><p className="mt-5 text-[13px]">Let’s turn your next “sorry we missed you” into “see you soon.”</p></div><div className="shrink-0"><DemoButton variant="dark" className="btn-lg" intent={{ source: "Final call to action", kind: "trial" }}>Get my next customer back</DemoButton><p className="mt-3 text-center text-[10px] text-ink/65">14 days free. No pressure. Just possibilities.</p></div></div>
      <PhoneMissed aria-hidden="true" size={290} strokeWidth={.6} className="absolute -right-14 -bottom-20 rotate-[-20deg] text-ink/5" />
    </section>
  );
}
