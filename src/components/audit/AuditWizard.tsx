"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, CircleAlert, LoaderCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  auditBusinessTypes,
  jobValueRanges,
  missedCallRanges,
  monthlyCallRanges,
  type AuditField,
  type AuditFormData,
  type AuditReport,
  type AuditStatus,
} from "@/lib/audit/types";
import { validateAuditSubmission } from "@/lib/audit/validation";

const initialForm: AuditFormData = {
  businessName: "",
  websiteUrl: "",
  googleBusinessProfileUrl: "",
  businessType: "",
  monthlyCallsRange: "",
  missedCallsRange: "",
  averageJobValueRange: "",
  businessEmail: "",
};

const steps: Array<{ title: string; description: string; fields: AuditField[] }> = [
  {
    title: "About your business",
    description: "A few basics help us check the right public pages.",
    fields: ["businessName", "businessType", "websiteUrl", "googleBusinessProfileUrl"],
  },
  {
    title: "Your call activity",
    description: "Choose the ranges that are closest. Estimates will be labeled clearly.",
    fields: ["monthlyCallsRange", "missedCallsRange", "averageJobValueRange"],
  },
  {
    title: "Where to send the report",
    description: "Your report will appear here after it has been securely saved.",
    fields: ["businessEmail"],
  },
];

const statusClasses: Record<AuditStatus, string> = {
  Good: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  "Needs improvement": "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  Critical: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
  "Unable to verify": "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-[#282B29] dark:bg-[#191B1A] dark:text-zinc-300",
};

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="form-label text-zinc-800 dark:text-zinc-200">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] leading-5 text-zinc-500 dark:text-zinc-400">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1.5 text-[11px] font-medium text-rose-700 dark:text-rose-300" role="alert">{error}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: AuditStatus }) {
  return <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClasses[status]}`}>{status}</span>;
}

function AuditReportView({ report, onRestart }: { report: AuditReport; onRestart: () => void }) {
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(report.auditDate));
  const currency = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <article className="space-y-5" aria-labelledby="audit-report-title">
      <header className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-[#282B29] dark:bg-[#191B1A] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-500 dark:text-zinc-400">Revenue leak audit · {date}</p>
            <h2 id="audit-report-title" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">{report.businessName}</h2>
          </div>
          <Button type="button" variant="neutral" size="sm" onClick={onRestart}><RotateCcw className="size-3.5" /> Start another audit</Button>
        </div>
        <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-[#282B29] dark:bg-[#141615]">
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Overall score not shown</p>
          <p className="mt-1 text-[11px] leading-5 text-zinc-600 dark:text-zinc-400">{report.scoreExplanation}</p>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Revenue opportunity estimate">
        <Metric label="Representative monthly calls" value={report.revenue.representativeMonthlyCalls.toLocaleString()} />
        <Metric
          label="Estimated missed calls / month"
          value={report.revenue.estimatedMonthlyMissedCalls === null ? "Not estimated" : report.revenue.estimatedMonthlyMissedCalls.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        />
        <Metric
          label="Potential monthly revenue opportunity"
          value={report.revenue.estimatedMonthlyOpportunity === null ? "Not estimated" : currency.format(report.revenue.estimatedMonthlyOpportunity)}
        />
      </section>

      <section className="rounded-xl border border-amber-300/70 bg-amber-50/70 p-4 dark:border-amber-500/25 dark:bg-amber-500/5" aria-labelledby="assumptions-title">
        <h2 id="assumptions-title" className="text-xs font-bold text-zinc-900 dark:text-zinc-100">How the estimate was calculated</h2>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-5 text-zinc-700 dark:text-zinc-300">
          {report.revenue.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="audit-sections-title">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-500 dark:text-zinc-400">What we could check</p>
          <h2 id="audit-sections-title" className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">Your audit findings</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {report.sections.map((section) => (
            <section key={section.id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-[#282B29] dark:bg-[#191B1A] sm:p-5" aria-labelledby={`section-${section.id}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 id={`section-${section.id}`} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{section.title}</h3>
                <StatusBadge status={section.status} />
              </div>
              <p className="mt-2 text-[11px] leading-5 text-zinc-600 dark:text-zinc-400">{section.summary}</p>
              <ul className="mt-4 divide-y divide-zinc-100 dark:divide-[#282B29]">
                {section.findings.map((item) => (
                  <li key={item.label} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">{item.label}</p>
                      <p className="mt-1 text-[11px] leading-5 text-zinc-600 dark:text-zinc-400">{item.detail}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-[#282B29] dark:bg-[#191B1A] sm:p-5" aria-labelledby="recommendations-title">
        <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-500 dark:text-zinc-400">Your next steps</p>
        <h2 id="recommendations-title" className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">Top 3 recommendations</h2>
        <ol className="mt-4 space-y-3">
          {report.recommendations.map((recommendation, index) => (
            <li key={recommendation.title} className="flex gap-3 rounded-lg border border-zinc-200 p-3 dark:border-[#282B29]">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#EAB308] text-[10px] font-bold text-zinc-950">{index + 1}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{recommendation.title}</h3>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{recommendation.priority} priority</span>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-zinc-600 dark:text-zinc-400">{recommendation.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-[10px] leading-5 text-zinc-600 dark:border-[#282B29] dark:bg-[#141615] dark:text-zinc-400">{report.disclaimer}</p>

      <section className="rounded-xl border border-zinc-200 bg-zinc-950 p-5 text-white dark:border-[#282B29] sm:p-7" aria-labelledby="yello-conversion-title">
        <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#EAB308]">A clearer path from call to customer</p>
        <h2 id="yello-conversion-title" className="mt-2 max-w-2xl text-xl font-semibold leading-tight sm:text-2xl">Stop losing potential customers because you couldn&apos;t answer the phone.</h2>
        <p className="mt-3 max-w-2xl text-[12px] leading-6 text-zinc-300">Yello is designed to help recover missed enquiries, automate follow-ups, and move leads toward booked jobs. The current app captures calls and supports manual follow-up; automated messaging and booking integrations are not enabled yet.</p>
        <Button render={<a href="/auth" />} variant="primary" size="sm" className="mt-5">
          See How Yello Can Help My Business <ArrowRight className="size-3.5" />
        </Button>
      </section>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-[#282B29] dark:bg-[#191B1A]">
      <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">{value}</p>
    </div>
  );
}

export function AuditWizard() {
  const [form, setForm] = useState<AuditFormData>(initialForm);
  const [step, setStep] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<AuditField, string>>>({});
  const [formError, setFormError] = useState("");
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const idempotencyKey = useRef("");

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const field = event.target.name as AuditField;
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  function validateFields(fields: AuditField[]): boolean {
    const validation = validateAuditSubmission(form);
    if (validation.valid) {
      setFieldErrors({});
      return true;
    }
    const errors = Object.fromEntries(
      Object.entries(validation.fieldErrors).filter(([field]) => fields.includes(field as AuditField)),
    ) as Partial<Record<AuditField, string>>;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function goNext() {
    if (!validateFields(steps[step].fields)) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submitAudit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current || !validateFields(steps.flatMap((item) => item.fields))) return;
    submissionLock.current = true;
    setIsSubmitting(true);
    setFormError("");

    try {
      idempotencyKey.current ||= crypto.randomUUID();
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, idempotencyKey: idempotencyKey.current }),
      });
      const result = await response.json() as { report?: AuditReport; error?: string; fieldErrors?: Partial<Record<AuditField, string>> };
      if (!response.ok || !result.report) {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        throw new Error(result.error || "We couldn't generate and save your audit. Please try again.");
      }
      setReport(result.report);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "We couldn't generate and save your audit. Please try again.");
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }

  function restart() {
    setForm(initialForm);
    setStep(0);
    setFieldErrors({});
    setFormError("");
    setReport(null);
    idempotencyKey.current = "";
  }

  if (report) return <AuditReportView report={report} onRestart={restart} />;

  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-[#282B29] dark:bg-[#191B1A]">
      <div className="border-b border-zinc-200 p-5 dark:border-[#282B29] sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-500 dark:text-zinc-400">Step {step + 1} of {steps.length}</p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">{currentStep.title}</h2>
          </div>
          <span className="hidden items-center gap-1.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 sm:inline-flex"><ShieldCheck className="size-3.5" /> Private &amp; secure</span>
        </div>
        <p className="mt-1 text-[11px] leading-5 text-zinc-600 dark:text-zinc-400">{currentStep.description}</p>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-[#282B29]" role="progressbar" aria-label="Audit progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1}>
          <div className="h-full rounded-full bg-[#EAB308] transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2" aria-hidden="true">
          {steps.map((item, index) => (
            <div key={item.title} className={`text-[9px] font-semibold ${index <= step ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}`}>
              {index < step ? <Check className="mr-1 inline size-3 text-emerald-600 dark:text-emerald-400" /> : null}
              {item.title}
            </div>
          ))}
        </div>
      </div>

      <form className="space-y-5 p-5 sm:p-7" onSubmit={submitAudit} noValidate>
        {formError && (
          <div className="flex gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-[11px] leading-5 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300" role="alert">
            <CircleAlert className="mt-0.5 size-4 shrink-0" /> {formError}
          </div>
        )}

        {step === 0 && (
          <>
            <Field id="businessName" label="Business name" error={fieldErrors.businessName}>
              <input id="businessName" name="businessName" className="form-input" autoComplete="organization" maxLength={160} value={form.businessName} onChange={updateField} aria-invalid={Boolean(fieldErrors.businessName)} aria-describedby={fieldErrors.businessName ? "businessName-error" : undefined} required />
            </Field>
            <Field id="businessType" label="Business type" error={fieldErrors.businessType}>
              <select id="businessType" name="businessType" className="form-input" value={form.businessType} onChange={updateField} aria-invalid={Boolean(fieldErrors.businessType)} aria-describedby={fieldErrors.businessType ? "businessType-error" : undefined} required>
                <option value="">Select a business type</option>
                {auditBusinessTypes.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>
            <Field id="websiteUrl" label="Website URL (optional)" error={fieldErrors.websiteUrl} hint="We check only the public homepage. Use a domain or full URL.">
              <input id="websiteUrl" name="websiteUrl" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" className="form-input" placeholder="yourbusiness.com" maxLength={2048} value={form.websiteUrl} onChange={updateField} aria-invalid={Boolean(fieldErrors.websiteUrl)} aria-describedby={fieldErrors.websiteUrl ? "websiteUrl-error" : undefined} />
            </Field>
            <Field id="googleBusinessProfileUrl" label="Google Business Profile URL (optional)" error={fieldErrors.googleBusinessProfileUrl} hint="We will not access private metrics or review data.">
              <input id="googleBusinessProfileUrl" name="googleBusinessProfileUrl" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" className="form-input" placeholder="Google Maps or profile link" maxLength={2048} value={form.googleBusinessProfileUrl} onChange={updateField} aria-invalid={Boolean(fieldErrors.googleBusinessProfileUrl)} aria-describedby={fieldErrors.googleBusinessProfileUrl ? "googleBusinessProfileUrl-error" : undefined} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field id="monthlyCallsRange" label="Average monthly calls" error={fieldErrors.monthlyCallsRange}>
              <select id="monthlyCallsRange" name="monthlyCallsRange" className="form-input" value={form.monthlyCallsRange} onChange={updateField} aria-invalid={Boolean(fieldErrors.monthlyCallsRange)} aria-describedby={fieldErrors.monthlyCallsRange ? "monthlyCallsRange-error" : undefined} required>
                <option value="">Select a call range</option>
                {monthlyCallRanges.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>
            <Field id="missedCallsRange" label="Estimated missed calls" error={fieldErrors.missedCallsRange} hint="Choose “I don't know” if you are unsure; we will omit the revenue estimate.">
              <select id="missedCallsRange" name="missedCallsRange" className="form-input" value={form.missedCallsRange} onChange={updateField} aria-invalid={Boolean(fieldErrors.missedCallsRange)} aria-describedby={fieldErrors.missedCallsRange ? "missedCallsRange-error" : undefined} required>
                <option value="">Select a missed-call range</option>
                {missedCallRanges.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>
            <Field id="averageJobValueRange" label="Average job value" error={fieldErrors.averageJobValueRange}>
              <select id="averageJobValueRange" name="averageJobValueRange" className="form-input" value={form.averageJobValueRange} onChange={updateField} aria-invalid={Boolean(fieldErrors.averageJobValueRange)} aria-describedby={fieldErrors.averageJobValueRange ? "averageJobValueRange-error" : undefined} required>
                <option value="">Select an average job value</option>
                {jobValueRanges.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>
          </>
        )}

        {step === 2 && (
          <Field id="businessEmail" label="Business email" error={fieldErrors.businessEmail} hint="Your report will be shown on this page. The current app does not email reports.">
            <input id="businessEmail" name="businessEmail" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" className="form-input" maxLength={254} value={form.businessEmail} onChange={updateField} aria-invalid={Boolean(fieldErrors.businessEmail)} aria-describedby={fieldErrors.businessEmail ? "businessEmail-error" : undefined} required />
          </Field>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-[#282B29]">
          {step > 0 ? (
            <Button type="button" variant="neutral" size="sm" onClick={() => { setStep((current) => current - 1); setFormError(""); }}>
              <ArrowLeft className="size-3.5" /> Back
            </Button>
          ) : <span />}
          {step < steps.length - 1 ? (
            <Button type="button" variant="primary" size="sm" onClick={goNext}>
              Continue <ArrowRight className="size-3.5" />
            </Button>
          ) : (
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting} className="min-w-44">
              {isSubmitting ? <><LoaderCircle className="size-3.5 animate-spin" /> Generating…</> : "Generate My Free Audit"}
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
