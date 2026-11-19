import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { AuditWizard } from "@/components/audit/AuditWizard";
import { BrandMark } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Free Business Revenue Leak Audit — y'elllo",
  description: "Get a personalized, assumption-led review of your missed-call revenue opportunity and public website signals.",
};

const included = [
  "A public homepage check, when you share a website",
  "A transparent missed-call opportunity estimate",
  "Practical next steps based on the information supplied",
];

export default function AuditPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#101211] dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white dark:border-[#282B29] dark:bg-[#191B1A]">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="y'elllo home">
            <BrandMark className="size-8" />
            <span className="text-sm font-bold tracking-tight">y&apos;elllo</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden items-center gap-1 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 sm:inline-flex">
              <ArrowLeft className="size-3.5" /> Back to y&apos;elllo
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:pt-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <span className="size-1.5 rounded-full bg-[#EAB308]" /> FREE BUSINESS REVENUE LEAK AUDIT
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
            See where missed calls could be costing you opportunities.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[13px] leading-6 text-zinc-600 dark:text-zinc-400">
            Answer a few quick questions for a clear, personalized audit. Estimates show their assumptions; anything we can&apos;t verify is marked plainly.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(230px,.7fr)] lg:gap-6">
          <AuditWizard />

          <aside className="space-y-4 lg:sticky lg:top-6">
            <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-[#282B29] dark:bg-[#191B1A] sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-500 dark:text-zinc-400">In about 2 minutes</p>
              <ul className="mt-3 space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[11px] leading-5 text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> {item}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl border border-zinc-200 bg-zinc-100/70 p-4 dark:border-[#282B29] dark:bg-[#141615] sm:p-5">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">A note on the numbers</p>
              <p className="mt-2 text-[11px] leading-5 text-zinc-600 dark:text-zinc-400">
                Revenue figures are illustrative estimates from the ranges you choose and a disclosed conversion assumption. They are not verified losses or promised results.
              </p>
            </section>
            <Button render={<Link href="/auth" />} variant="neutral" size="sm" className="w-full justify-between">
              Explore y&apos;elllo <ArrowRight className="size-3.5" />
            </Button>
          </aside>
        </div>
      </main>
    </div>
  );
}
