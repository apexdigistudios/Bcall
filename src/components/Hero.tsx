"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, CirclePlay, Store } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "./Reveal";

const headlineWords = ["paying", "booked", "acquired", "paying"] as const;

export function Hero() {
  return (
    <section className="hero-section w-full overflow-x-clip box-border py-6 sm:py-16" aria-labelledby="hero-heading" id="live-demo">
      <div className="page-container mx-auto flex w-full max-w-7xl flex-col items-center gap-8 px-4 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-12">
        <div className="w-full min-w-0 space-y-4 text-center sm:space-y-6 lg:col-span-6 lg:text-left">
          <Reveal immediate delay={0}>
            <p className="mx-auto flex max-w-fit items-center justify-center gap-2 text-[11px] font-semibold text-amber-900 sm:text-xs lg:mx-0">
              <Store size={15} strokeWidth={1.8} aria-hidden="true" />
              Built for local businesses that can&apos;t afford to miss customers
            </p>
          </Reveal>

          <Reveal immediate delay={80}>
            <h1
              id="hero-heading"
              aria-label="We turn your missed calls into paying customers."
              className="font-sans text-3xl font-extrabold leading-[1.12] tracking-tight text-[#111214] sm:text-5xl lg:text-6xl"
            >
              <span className="block">We turn your missed</span>
              <span className="block">
                calls into{" "}
                <span className="inline-block h-[1.12em] w-[8ch] overflow-hidden align-bottom text-left text-[#CA8A04] dark:text-[#EAB308]">
                  <span className="hero-word-track flex flex-col" aria-hidden="true">
                    {headlineWords.map((word) => (
                      <span key={word} className="block h-[1.12em]">
                        {word}
                      </span>
                    ))}
                  </span>
                </span>
              </span>
              <span className="block">customers.</span>
            </h1>
          </Reveal>

          <Reveal immediate delay={160}>
            <p className="mx-auto max-w-lg px-2 text-xs leading-relaxed text-[#686b73] sm:px-0 sm:text-sm lg:mx-0 lg:text-base">
              Your next customer called. You were busy. Turn missed calls into real conversations and booked appointments — without lifting a finger.
            </p>
          </Reveal>

          <Reveal immediate delay={240}>
            <div className="flex w-full flex-col items-center justify-center gap-3 pt-2 sm:flex-row sm:gap-3.5 lg:justify-start">
              <Link
                href="/auth"
                className={buttonVariants({ variant: "primary", size: "lg", className: "w-full rounded-lg text-xs shadow-sm shadow-amber-900/10 sm:w-auto" })}
              >
                Start my 14-day free trial
              </Link>
              <a
                href="#how-it-works"
                className={buttonVariants({ variant: "neutral", size: "lg", className: "w-full border-zinc-300 text-center shadow-sm dark:border-[#3a3d3b] sm:w-auto" })}
              >
                <CirclePlay size={17} strokeWidth={1.6} /> See how it works
              </a>
            </div>
          </Reveal>

          <Reveal immediate delay={240}>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1 text-[11px] text-[#686b73] sm:text-xs lg:justify-start">
              <span className="inline-flex items-center gap-1.5"><Check size={12} strokeWidth={2} className="text-emerald-600" /> No credit card needed</span>
              <span className="inline-flex items-center gap-1.5"><Check size={12} strokeWidth={2} className="text-emerald-600" /> Works with your existing number</span>
            </div>
          </Reveal>
        </div>

        <Reveal immediate delay={240} className="w-full min-w-0 lg:col-span-6">
          <div className="flex w-full min-w-0 items-center justify-center overflow-hidden pt-2 lg:pt-0">
            <Image
              src="/mock.png"
              alt="Yelllo missed-call recovery dashboard alongside an SMS conversation that turns into a booked customer"
              width={1330}
              height={1182}
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 50vw"
              className="block h-auto w-full max-w-full rounded-2xl object-contain sm:rounded-3xl"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
