"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CircleAlert, LoaderCircle, Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auditInputSchema, type AuditFormInput } from "@/lib/schema";
import type { AuditReport } from "@/lib/report";

type FieldName = keyof AuditFormInput;

const initialForm: Record<FieldName, string> = {
  businessName: "",
  city: "",
  websiteUrl: "",
  missedCallsPerMonth: "",
  monthlyRevenue: "",
  averageCustomerValue: "",
  callToBookingRate: "",
  googleRating: "",
  googleReviewCount: "",
};

const stepFields: FieldName[][] = [
  ["businessName", "city", "websiteUrl"],
  ["missedCallsPerMonth", "monthlyRevenue", "averageCustomerValue", "callToBookingRate"],
  ["googleRating", "googleReviewCount"],
];

const steps = [
  { title: "Your business", description: "Tell us where to look for your public business information." },
  { title: "Your numbers", description: "Use your best estimate. Optional details make the results more useful." },
  { title: "Local reputation", description: "Optional: enter the Google rating and review count you can see publicly." },
];

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
      {error && <p className="mt-1.5 text-[11px] font-medium text-rose-700 dark:text-rose-300" role="alert">{error}</p>}
    </div>
  );
}

function AuditReportView({ report, onRestart }: { report: AuditReport; onRestart: () => void }) {
  const money = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const generatedAt = new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(report.generatedAt));
  const breakdown = [
    { title: "Missed calls", range: report.breakdown.calls },
    { title: "Website", range: report.breakdown.website },
    { title: "Reputation", range: report.breakdown.reputation },
  ];

  return (
    <article className="audit-print space-y-5" aria-labelledby="audit-report-title">
      <header className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-[#282B29] dark:bg-[#191B1A] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-500 dark:text-zinc-400">Revenue leak audit · {generatedAt}</p>
            <h2 id="audit-report-title" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">{report.businessName} · {report.city}</h2>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button type="button" variant="neutral" size="sm" onClick={() => window.print()}><Printer className="size-3.5" /> Print / Save as PDF</Button>
            <Button type="button" variant="neutral" size="sm" onClick={onRestart}><RotateCcw className="size-3.5" /> Start another</Button>
          </div>
        </div>
        <h1 className="mt-6 text-xl font-bold leading-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">{report.headline}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            Audit score {report.score}/100
          </span>
          {report.breakdown.capped && <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Estimate capped at 50% of stated monthly revenue.</span>}
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Leak breakdown">
        {breakdown.map(({ title, range }) => (
          <div key={title} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-[#282B29] dark:bg-[#191B1A]">
            <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{title} · expected / month</p>
            <p className="mt-2 text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">{money.format(range.expected)}</p>
            <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">Range: {money.format(range.low)}–{money.format(range.high)}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-[#282B29] dark:bg-[#191B1A] sm:p-5" aria-labelledby="audit-findings-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="audit-findings-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Executive summary and findings</h2>
          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            Deterministic analysis
          </span>
        </div>
        <p className="mt-3 text-[12px] leading-6 text-zinc-700 dark:text-zinc-300">{report.executiveSummary}</p>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <h3 className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">Missed-call lead recovery opportunity</h3>
          <p className="mt-1 text-[11px] leading-5 text-zinc-700 dark:text-zinc-300">{report.leadRecoverySummary}</p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">Website findings</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-5 text-zinc-600 dark:text-zinc-400">
              {report.websiteFindings.map((finding) => <li key={finding}>{finding}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">Google profile and local listing findings</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-5 text-zinc-600 dark:text-zinc-400">
              {report.listingFindings.map((finding) => <li key={finding}>{finding}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-[#282B29] dark:bg-[#191B1A] sm:p-5" aria-labelledby="website-audit-title">
        <h2 id="website-audit-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Website checks</h2>
        {report.website.status === "unavailable" ? (
          <p className="mt-2 text-[11px] leading-5 text-zinc-600 dark:text-zinc-400">{report.website.message}</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100 dark:divide-[#282B29]">
            {report.website.checks.map((check) => (
              <li key={check.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className={`mt-0.5 size-2 shrink-0 rounded-full ${check.pass ? "bg-emerald-500" : "bg-amber-500"}`} aria-label={check.pass ? "Pass" : "Needs attention"} />
                <div>
                  <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">{check.label}</p>
                  <p className="mt-0.5 text-[10px] leading-5 text-zinc-600 dark:text-zinc-400">{check.evidence}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-[#282B29] dark:bg-[#191B1A] sm:p-5" aria-labelledby="osm-audit-title">
        <h2 id="osm-audit-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">OpenStreetMap local listing</h2>
        <p className="mt-2 text-[11px] leading-5 text-zinc-600 dark:text-zinc-400">
          {report.openStreetMap.status === "found"
            ? `Listing found${report.openStreetMap.displayName ? `: ${report.openStreetMap.displayName}` : ""}. ${report.openStreetMap.message}`
            : report.openStreetMap.message}
        </p>
        {report.openStreetMap.status === "found" && (
          <ul className="mt-3 grid gap-2 text-[11px] text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
            <li>Phone: {report.openStreetMap.phone ?? "Not listed"}</li>
            <li>Website: {report.openStreetMap.website ?? "Not listed"}</li>
            <li>Opening hours: {report.openStreetMap.openingHours ?? "Not listed"}</li>
            {report.openStreetMap.phoneMatchesWebsite === false && <li className="font-semibold text-amber-800 dark:text-amber-300">Phone number differs from the website.</li>}
            {report.openStreetMap.websiteMatchesInput === false && <li className="font-semibold text-amber-800 dark:text-amber-300">Website address differs from the audited URL.</li>}
          </ul>
        )}
        {report.reputation.status !== "not-provided" && (
          <p className="mt-3 border-t border-zinc-100 pt-3 text-[11px] text-zinc-700 dark:border-[#282B29] dark:text-zinc-300">
            Self-reported reputation: {report.reputation.rating === undefined ? "rating not provided" : `${report.reputation.rating}/5`}
            {report.reputation.reviewCount === undefined ? "" : ` · ${report.reputation.reviewCount} reviews`}. {report.reputation.note}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-[#282B29] dark:bg-[#191B1A] sm:p-5" aria-labelledby="fixes-title">
        <h2 id="fixes-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Top priority recommendations, ranked by estimated impact</h2>
        <ol className="mt-3 space-y-3">
          {report.fixes.map((fix, index) => (
            <li key={`${fix.source}-${fix.title}`} className="flex gap-3 rounded-lg border border-zinc-200 p-3 dark:border-[#282B29]">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#EAB308] text-[10px] font-bold text-zinc-950">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{fix.title}</h3>
                  <span className="text-[10px] font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">{money.format(fix.expectedRecovery)}/mo estimated</span>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-zinc-600 dark:text-zinc-400">{fix.how}</p>
              </div>
            </li>
          ))}
          {report.fixes.length === 0 && <li className="text-[11px] text-zinc-600 dark:text-zinc-400">No specific website or reputation fixes were identified from the information available.</li>}
        </ol>
      </section>

      <details className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-[#282B29] dark:bg-[#191B1A] sm:p-5">
        <summary className="cursor-pointer text-xs font-semibold text-zinc-900 dark:text-zinc-100">Assumptions and data sources</summary>
        <ul className="mt-3 list-disc space-y-1 pl-4 text-[11px] leading-5 text-zinc-600 dark:text-zinc-400">
          {report.breakdown.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
          {report.dataSources.map((source) => <li key={source}>{source}</li>)}
          <li>OpenStreetMap does not provide ratings, reviews, or photos. Any rating and review count above were entered by you.</li>
        </ul>
      </details>

      <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-[10px] leading-5 text-zinc-600 dark:border-[#282B29] dark:bg-[#141615] dark:text-zinc-400">{report.disclaimer}</p>
    </article>
  );
}

export function AuditWizard() {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState("");
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLock = useRef(false);

  function updateField(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setFormError("");
  }

  function validate(fields: FieldName[]): boolean {
    const result = auditInputSchema.safeParse(form);
    if (result.success) {
      setFieldErrors({});
      return true;
    }
    const errors: Partial<Record<FieldName, string>> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0]) as FieldName;
      if (fields.includes(key) && errors[key] === undefined) errors[key] = issue.message;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    if (validate(stepFields[step])) setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submitAudit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current || !validate(stepFields.flat())) return;
    submissionLock.current = true;
    setIsSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json() as { report?: AuditReport; error?: string; fieldErrors?: Partial<Record<FieldName, string>> };
      if (!response.ok || !result.report) {
        setFieldErrors(result.fieldErrors ?? {});
        throw new Error(result.error ?? "The audit could not be completed. Please try again.");
      }
      setReport(result.report);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "The audit could not be completed. Please try again.");
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }

  function restart() {
    setReport(null);
    setStep(0);
    setForm(initialForm);
    setFieldErrors({});
    setFormError("");
  }

  if (report) return <AuditReportView report={report} onRestart={restart} />;

  const progress = ((step + 1) / steps.length) * 100;
  const inputClass = "form-input";
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-[#282B29] dark:bg-[#191B1A]">
      <div className="border-b border-zinc-200 p-5 dark:border-[#282B29] sm:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-500 dark:text-zinc-400">Step {step + 1} of {steps.length}</p>
        <h2 className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">{steps[step].title}</h2>
        <p className="mt-1 text-[11px] leading-5 text-zinc-600 dark:text-zinc-400">{steps[step].description}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-[#282B29]" role="progressbar" aria-label="Audit progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1}>
          <div className="h-full rounded-full bg-[#EAB308] transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form className="space-y-5 p-5 sm:p-7" onSubmit={submitAudit} noValidate>
        {formError && <div className="flex gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-[11px] leading-5 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300" role="alert"><CircleAlert className="mt-0.5 size-4 shrink-0" /> {formError}</div>}

        {step === 0 && (
          <>
            <Field id="businessName" label="Business name" error={fieldErrors.businessName}>
              <input id="businessName" name="businessName" className={inputClass} autoComplete="organization" maxLength={160} value={form.businessName} onChange={updateField} aria-invalid={Boolean(fieldErrors.businessName)} required />
            </Field>
            <Field id="city" label="City" error={fieldErrors.city}>
              <input id="city" name="city" className={inputClass} autoComplete="address-level2" maxLength={100} value={form.city} onChange={updateField} aria-invalid={Boolean(fieldErrors.city)} required />
            </Field>
            <Field id="websiteUrl" label="Website URL" error={fieldErrors.websiteUrl} hint="We check the public homepage only.">
              <input id="websiteUrl" name="websiteUrl" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" className={inputClass} placeholder="yourbusiness.com" maxLength={2048} value={form.websiteUrl} onChange={updateField} aria-invalid={Boolean(fieldErrors.websiteUrl)} required />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field id="missedCallsPerMonth" label="Missed calls per month" error={fieldErrors.missedCallsPerMonth}>
              <input id="missedCallsPerMonth" name="missedCallsPerMonth" type="number" min="0" step="1" className={inputClass} value={form.missedCallsPerMonth} onChange={updateField} aria-invalid={Boolean(fieldErrors.missedCallsPerMonth)} required />
            </Field>
            <Field id="monthlyRevenue" label="Monthly average revenue ($)" error={fieldErrors.monthlyRevenue}>
              <input id="monthlyRevenue" name="monthlyRevenue" type="number" min="0.01" step="any" className={inputClass} value={form.monthlyRevenue} onChange={updateField} aria-invalid={Boolean(fieldErrors.monthlyRevenue)} required />
            </Field>
            <Field id="averageCustomerValue" label="Average value per customer/job ($) · optional" error={fieldErrors.averageCustomerValue} hint="If blank, we estimate this as monthly revenue divided by 40 customers.">
              <input id="averageCustomerValue" name="averageCustomerValue" type="number" min="0.01" step="any" className={inputClass} value={form.averageCustomerValue} onChange={updateField} aria-invalid={Boolean(fieldErrors.averageCustomerValue)} />
            </Field>
            <Field id="callToBookingRate" label="Calls that become customers (%) · optional" error={fieldErrors.callToBookingRate} hint="Defaults to 30% if left blank.">
              <input id="callToBookingRate" name="callToBookingRate" type="number" min="0" max="100" step="any" className={inputClass} value={form.callToBookingRate} onChange={updateField} aria-invalid={Boolean(fieldErrors.callToBookingRate)} />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field id="googleRating" label="Google rating · optional" error={fieldErrors.googleRating} hint="Self-reported. OpenStreetMap does not provide review ratings.">
              <input id="googleRating" name="googleRating" type="number" min="0" max="5" step="0.1" className={inputClass} placeholder="4.6" value={form.googleRating} onChange={updateField} aria-invalid={Boolean(fieldErrors.googleRating)} />
            </Field>
            <Field id="googleReviewCount" label="Google review count · optional" error={fieldErrors.googleReviewCount}>
              <input id="googleReviewCount" name="googleReviewCount" type="number" min="0" step="1" className={inputClass} placeholder="42" value={form.googleReviewCount} onChange={updateField} aria-invalid={Boolean(fieldErrors.googleReviewCount)} />
            </Field>
            <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-[11px] leading-5 text-zinc-600 dark:border-[#282B29] dark:bg-[#141615] dark:text-zinc-400">
              Your answers are analyzed for this request only. They are not saved to an account or database.
            </p>
          </>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-[#282B29]">
          {step > 0 ? (
            <Button type="button" variant="neutral" size="sm" onClick={() => { setStep((current) => current - 1); setFormError(""); }}><ArrowLeft className="size-3.5" /> Back</Button>
          ) : <span />}
          {step < steps.length - 1 ? (
            <Button type="button" variant="primary" size="sm" onClick={nextStep}>Continue <ArrowRight className="size-3.5" /></Button>
          ) : (
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? <><LoaderCircle className="size-3.5 animate-spin" /> Generating…</> : "Generate my audit"}
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
