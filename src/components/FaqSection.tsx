"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { DemoButton } from "./DemoButton";

const questions = [
  { question: "What exactly does y'elllo do?", answer: "y'elllo helps local businesses recover missed calls. When someone calls and you can’t answer, it starts a friendly text conversation on your behalf — helping that customer take the next step, instead of calling your competitor. Think of it as an extra pair of hands for your front desk." },
  { question: "Do I need to change my business phone number?", answer: "No. You keep the number your customers already know. We help you connect your existing mobile or landline through call forwarding, with no new hardware or second phone to manage. We’ll check your setup and compatibility during onboarding." },
  { question: "How quickly does the follow-up happen?", answer: "Follow-ups are designed to be sent shortly after a call is missed, while your business is still on the customer’s mind. The exact timing can be tailored to your business hours and preferences. Our interactive preview shows an illustrative missed-call-to-booking flow." },
  { question: "Will the messages sound like my business?", answer: "Yes. Your opening message, business information, and follow-up approach are personalized before you go live. You’re in control of the tone, the hours, and the questions customers are asked. The goal is a helpful conversation that feels like your team, not a script." },
  { question: "What happens after my 14-day free trial?", answer: "You decide what’s next. There’s no credit card required to request a trial, no automatic payment, and no obligation to keep going. We’ll talk through your results and the right plan for your business before you make a commitment." },
  { question: "Is my customer information safe?", answer: "We take privacy seriously. Inquiry details are stored securely and used to respond to your request. We don’t sell your information or use advertising cookies on this site. You can read the privacy policy or ask us about access and deletion through the inquiry form." },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="section-space" id="faq" aria-labelledby="faq-heading" data-reveal>
      <div className="page-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
        <div><p className="eyebrow mb-4"><span className="eyebrow-dot" />GOOD QUESTIONS. STRAIGHT ANSWERS.</p><h2 id="faq-heading" className="section-heading">A few things<br />you might be wondering.</h2><p className="mt-5 max-w-[300px] text-[13px] leading-7 text-muted">We like to keep things simple. If your question isn’t here, let’s have a conversation.</p><DemoButton variant="text" className="mt-4" intent={{ source: "FAQ", kind: "demo" }}>Ask us a question</DemoButton></div>
        <div>{questions.map(({ question, answer }, index) => <div key={question} className="faq-item"><h3><button type="button" id={`faq-question-${index}`} className="faq-trigger" aria-expanded={open === index} aria-controls={`faq-answer-${index}`} onClick={() => setOpen(open === index ? null : index)}>{question}<span className={`grid size-6 shrink-0 place-items-center rounded-full ${open === index ? "bg-yellow" : "bg-soft"}`}>{open === index ? <Minus size={13} /> : <Plus size={13} />}</span></button></h3><div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} hidden={open !== index} className="faq-answer animate-enter">{answer}</div></div>)}</div>
      </div>
    </section>
  );
}
