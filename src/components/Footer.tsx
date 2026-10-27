import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Brand } from "./Brand";
import { DemoButton } from "./DemoButton";

export function Footer() {
  return (
    <footer className="border-t border-line bg-white" data-reveal>
      <div className="page-container py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Brand />
            <p className="mt-4 max-w-[245px] text-[12px] leading-6 text-muted">You do the work.<br />We make sure the next customer comes back.</p>
            <span className="eyebrow mt-5 text-[8px] text-muted"><span className="size-1 rounded-full bg-success" />MADE FOR LOCAL BUSINESSES.</span>
          </div>
          <div>
            <h3 className="mb-4 text-[11px] font-semibold">The product</h3>
            <nav className="flex flex-col items-start gap-3 text-[11px] text-muted" aria-label="Product footer navigation">
              <Link href="/#how-it-works" className="hover:text-ink">How it works</Link>
              <Link href="/#features" className="hover:text-ink">Features</Link>
              <Link href="/#roi-calculator" className="hover:text-ink">ROI calculator</Link>
              <Link href="/#faq" className="hover:text-ink">FAQs</Link>
            </nav>
          </div>
          <div>
            <h3 className="mb-4 text-[11px] font-semibold">Your business</h3>
            <nav className="flex flex-col items-start gap-3 text-[11px] text-muted" aria-label="Business footer navigation">
              <Link href="/#industries" className="hover:text-ink">Who it’s for</Link>
              <Link href="/#free-trial" className="hover:text-ink">14-day free trial</Link>
              <DemoButton variant="text" className="min-h-0! p-0! text-[11px]! font-normal! text-muted!" arrow={false} intent={{ source: "Footer", kind: "demo" }}>Book a demo <ArrowUpRight size={12} /></DemoButton>
            </nav>
          </div>
          <div>
            <h3 className="mb-4 text-[11px] font-semibold">Let’s talk</h3>
            <p className="text-[11px] leading-6 text-muted">Good questions deserve<br />a real conversation.</p>
            <DemoButton variant="text" className="mt-2" intent={{ source: "Footer contact", kind: "demo" }}>Get in touch</DemoButton>
          </div>
        </div>
        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-line pt-6 text-[9px] text-muted sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} CallBackly. Every call is an opportunity.</p>
          <nav aria-label="Legal navigation" className="flex gap-5">
            <Link href="/privacy" className="hover:text-ink">Privacy policy</Link>
            <Link href="/terms" className="hover:text-ink">Terms of service</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
