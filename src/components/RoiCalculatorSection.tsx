"use client";

import { useState, type CSSProperties } from "react";
import { ArrowUpRight, Info, TrendingUp } from "lucide-react";
import { DemoButton } from "./DemoButton";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

type RangeFieldProps = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  lowLabel: string;
  highLabel: string;
  onChange: (value: number) => void;
};

function RangeField({ id, label, value, min, max, step, prefix, suffix, lowLabel, highLabel, onChange }: RangeFieldProps) {
  const progress = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between gap-3"><label htmlFor={id} className="text-[12px] font-medium">{label}</label><div className="flex items-center rounded-md border border-line bg-white px-2.5"><span className="font-mono text-[11px] text-muted">{prefix}</span><input id={id} type="number" inputMode="decimal" className="calculator-input w-[58px] border-0! px-1!" value={value} min={min} max={max} step={step} onChange={(event) => { const next = Number(event.target.value); if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next))); }} /><span className="font-mono text-[11px] text-muted">{suffix}</span></div></div>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={`${label} slider`} onChange={(event) => onChange(Number(event.target.value))} className="range-control" style={{ "--range-progress": `${progress}%` } as CSSProperties} />
      <div className="mt-1 flex justify-between font-mono text-[8px] text-muted"><span>{lowLabel}</span><span>{highLabel}</span></div>
    </div>
  );
}

export function RoiCalculatorSection() {
  const [missedCalls, setMissedCalls] = useState(8);
  const [customerValue, setCustomerValue] = useState(150);
  const [recoveryRate, setRecoveryRate] = useState(30);
  const expectedBookings = missedCalls * 30 * (recoveryRate / 100);
  const bookings = Math.round(expectedBookings);
  const monthlyRevenue = Math.round(expectedBookings * customerValue);
  const annualRevenue = monthlyRevenue * 12;

  return (
    <section className="section-space bg-soft" id="roi-calculator" aria-labelledby="roi-heading" data-reveal>
      <div className="page-container">
        <div className="bento-card grid overflow-hidden bg-white lg:grid-cols-[1.1fr_1fr]" data-reveal>
          <div className="px-7 py-9 sm:px-10 lg:px-12 lg:py-11">
            <p className="eyebrow mb-4"><span className="eyebrow-dot" />LET’S PUT A NUMBER ON IT</p>
            <h2 id="roi-heading" className="section-heading">Your missed calls.<br />Your next revenue stream.</h2>
            <p className="mt-4 max-w-[380px] text-[13px] leading-7 text-muted">A few quick numbers. A clearer picture of what’s waiting on the other end of your phone.</p>
            <div className="mt-8 space-y-7">
              <RangeField id="missed-calls" label="Missed calls per day" value={missedCalls} min={0} max={50} step={1} lowLabel="0 calls" highLabel="50 calls" onChange={setMissedCalls} />
              <RangeField id="customer-value" label="Average customer value" value={customerValue} min={0} max={1000} step={25} prefix="$" lowLabel="$0" highLabel="$1,000" onChange={setCustomerValue} />
              <RangeField id="recovery-rate" label="Estimated recovery rate" value={recoveryRate} min={0} max={100} step={5} suffix="%" lowLabel="0%" highLabel="100%" onChange={setRecoveryRate} />
            </div>
            <p className="mt-6 flex items-start gap-1.5 text-[9px] leading-5 text-muted"><Info size={11} className="mt-1 shrink-0" /> Adjust the numbers to reflect your business. All amounts are in USD.</p>
          </div>
          <div className="m-2 mt-0 flex flex-col rounded-xl bg-ink p-7 text-white sm:p-9 lg:mt-2 lg:ml-0 lg:p-10">
            <div className="flex items-center justify-between gap-3"><p className="font-mono text-[9px] tracking-[.1em] text-white/50">YOUR MONTHLY OPPORTUNITY</p><span className="flex items-center gap-1.5 rounded-full border border-white/15 px-2 py-1 text-[8px] text-yellow"><span className="size-1 rounded-full bg-yellow" /> LIVE ESTIMATE</span></div>
            <div className="mt-8" aria-live="polite" aria-atomic="true"><p className="flex items-center gap-2 text-[11px] text-white/60"><TrendingUp size={15} strokeWidth={1.5} /> Revenue you could recover</p><output htmlFor="missed-calls customer-value recovery-rate" id="revenue-estimate" className="mt-3 block text-[clamp(2.8rem,5.1vw,4.5rem)] leading-none font-medium tracking-[-.065em] text-yellow">{currency.format(monthlyRevenue)}</output><p className="mt-3 text-[12px] text-white/50">Every month. From calls you already get.</p></div>
            <div className="my-7 grid grid-cols-2 divide-x divide-white/15 border-y border-white/15 py-5"><div><p className="text-[26px] font-medium tracking-[-.04em]">{number.format(bookings)}</p><p className="mt-1 text-[10px] text-white/50">potential bookings / month</p></div><div className="pl-7"><p className="text-[clamp(1.1rem,2.1vw,1.625rem)] font-medium tracking-[-.04em] tabular-nums">{currency.format(annualRevenue)}</p><p className="mt-1 text-[10px] text-white/50">potential revenue / year</p></div></div>
            <p className="mb-5 text-[11px] leading-6 text-white/60">That’s a lot of possibility, sitting in a missed call. Let’s help you bring it back.</p>
            <DemoButton variant="primary" className="mt-auto w-full" intent={{ source: "ROI calculator", kind: "demo", estimate: monthlyRevenue }}>Let’s make this real <ArrowUpRight size={15} className="hidden" /></DemoButton>
            <p className="mt-3 text-center text-[8px] leading-5 text-white/40">Based on 30 days per month. Estimates are illustrative, not guarantees.</p>
          </div>
        </div>
        <p className="mt-5 text-center font-mono text-[9px] tracking-[.04em] text-muted">{missedCalls} MISSED CALLS / DAY × 30 DAYS × {currency.format(customerValue)} / CUSTOMER × {recoveryRate}% RECOVERY = YOUR OPPORTUNITY</p>
      </div>
    </section>
  );
}
