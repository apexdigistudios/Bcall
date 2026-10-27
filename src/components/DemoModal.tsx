"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, CheckCircle2, LoaderCircle, LockKeyhole, X } from "lucide-react";
import { businessTypes, validateDemoSubmission, type DemoIntent } from "@/lib/demo";
import { BrandMark } from "./Brand";

type DemoModalProps = { intent: DemoIntent; onClose: () => void };

export function DemoModal({ intent, onClose }: DemoModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<{ reference: string; email: string; name: string } | null>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => panelRef.current?.querySelector<HTMLInputElement>("[data-autofocus]")?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const elements = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]') ?? []).filter((element) => element.getClientRects().length > 0);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    const fields = new FormData(event.currentTarget);
    const source = intent.estimate ? `${intent.source} · Estimated monthly recovery: $${intent.estimate.toLocaleString("en-US")}` : intent.source;
    const result = validateDemoSubmission({
      ...Object.fromEntries(fields),
      consent: fields.get("consent") === "on",
      kind: intent.kind,
      source: intent.industry ? `${source} · ${intent.industry}` : source,
    });
    if (!result.valid) { setError(result.error); return; }
    setSubmitting(true);
    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "We couldn’t save your request. Please try again.");
      setConfirmation({ reference: payload.reference, email: result.data.email, name: result.data.name.split(" ")[0] });
      requestAnimationFrame(() => panelRef.current?.focus());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const industryTypes: Record<string, string> = {
    "Salons": "Salon or barbershop",
    "Barbers": "Salon or barbershop",
    "Dentists": "Dental practice",
    "Clinics": "Medical clinic",
    "Auto shops": "Auto repair shop",
    "Home services": "Home services",
    "Spas & wellness": "Spa or wellness",
    "Pet care": "Pet care",
    "Fitness studios": "Fitness studio",
  };
  const initialIndustry = industryTypes[intent.industry ?? ""];

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="demo-modal-title" aria-describedby="demo-modal-description" tabIndex={-1} className="modal-panel">
        <button type="button" onClick={onClose} aria-label="Close inquiry form" className="absolute top-5 right-5 grid size-8 place-items-center rounded-full bg-soft text-muted transition-colors hover:text-ink"><X size={17} /></button>
        {confirmation ? (
          <div className="py-6 text-center" role="status" aria-live="polite">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-success-soft text-success"><CheckCircle2 size={30} strokeWidth={1.5} /></div>
            <p className="eyebrow mb-4">A GOOD CALL, ALREADY.</p>
            <h2 id="demo-modal-title" className="section-heading">You’re on the list,<br />{confirmation.name}.</h2>
            <p id="demo-modal-description" className="mx-auto mt-5 max-w-sm text-sm leading-7 text-muted">Your {intent.kind === "trial" ? "free-trial" : "demo"} request has been saved. We’ll use <strong className="font-medium text-ink">{confirmation.email}</strong> to follow up and help you get started.</p>
            <div className="my-7 rounded-lg bg-soft px-4 py-3 font-mono text-[10px] tracking-widest text-muted">REQUEST REFERENCE · CB-{confirmation.reference}</div>
            <button type="button" onClick={onClose} className="btn btn-dark w-full">Back to CallBackly <ArrowUpRight size={16} /></button>
          </div>
        ) : (
          <>
            <BrandMark className="mb-5" />
            <p className="eyebrow mb-3">{intent.kind === "trial" ? "14 DAYS. ZERO PRESSURE." : "LESS CHASING. MORE BOOKING."}</p>
            <h2 id="demo-modal-title" className="section-heading text-[34px]">{intent.kind === "trial" ? "Your next two weeks, on us." : "Let’s put missed calls to work."}</h2>
            <p id="demo-modal-description" className="mt-3 mb-6 text-[13px] leading-6 text-muted">{intent.kind === "trial" ? "Tell us a little about your business. We’ll help you get your 14-day free trial set up. No credit card needed." : "Tell us a little about your business. We’ll show you how CallBackly can turn missed calls into your next customers."}</p>
            <form onSubmit={handleSubmit}>
              <fieldset disabled={submitting} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="form-label" htmlFor="demo-name">Your name <span className="text-muted">*</span></label><input className="form-input" id="demo-name" name="name" autoComplete="name" placeholder="Alex Morgan" required minLength={2} maxLength={120} data-autofocus /></div>
                  <div><label className="form-label" htmlFor="demo-email">Work email <span className="text-muted">*</span></label><input className="form-input" id="demo-email" name="email" type="email" autoComplete="email" placeholder="alex@yourbusiness.com" required maxLength={254} /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="form-label" htmlFor="demo-business">Business name <span className="text-muted">*</span></label><input className="form-input" id="demo-business" name="businessName" autoComplete="organization" placeholder="Your business name" required minLength={2} maxLength={160} /></div>
                  <div><label className="form-label" htmlFor="demo-type">Business type <span className="text-muted">*</span></label><select className="form-input" id="demo-type" name="businessType" required defaultValue={initialIndustry ?? ""}><option value="" disabled>Select your industry</option>{businessTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
                </div>
                <div><label className="form-label" htmlFor="demo-phone">Phone number <span className="font-normal text-muted">(optional)</span></label><input className="form-input" id="demo-phone" name="phone" type="tel" autoComplete="tel" placeholder="(555) 123-4567" maxLength={40} inputMode="tel" /></div>
                <div className="hidden" aria-hidden="true"><label htmlFor="demo-website">Leave this field blank</label><input id="demo-website" name="website" tabIndex={-1} autoComplete="off" /></div>
                <div><label className="form-label" htmlFor="demo-message">Anything we should know? <span className="font-normal text-muted">(optional)</span></label><textarea className="form-input" id="demo-message" name="message" maxLength={2000} rows={2} placeholder="A busy season, a big goal, or a question. We’re all ears." defaultValue={intent.estimate ? `I’d like to recover an estimated $${intent.estimate.toLocaleString("en-US")} per month in missed-call revenue.` : ""} /></div>
                <label className="flex items-start gap-2.5 text-[11px] leading-5 text-muted"><input className="form-checkbox mt-0.5" type="checkbox" name="consent" required /><span>I agree to be contacted about my request. My details will be handled according to the <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2">privacy policy</a>.</span></label>
                {error && <p className="form-error" role="alert">{error}</p>}
                <button type="submit" className="btn btn-primary w-full">{submitting ? <><LoaderCircle className="animate-spin" size={16} /> Saving your request…</> : <>{intent.kind === "trial" ? "Start my 14-day free trial" : "Request my demo"}<ArrowUpRight size={16} /></>}</button>
              </fieldset>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-muted"><LockKeyhole size={11} /> Your details are safe with us. No spam, ever.</p>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
