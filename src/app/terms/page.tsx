import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { DemoButton } from "@/components/DemoButton";

export const metadata: Metadata = { title: "Terms of service — CallBackly", description: "Straightforward terms for using the CallBackly website, demo requests, and free-trial inquiries." };

export default function TermsPage() {
  return (
    <LegalPage title="A few ground rules." description="These terms cover your use of the CallBackly website and the demo or trial inquiries you submit. They don’t replace a separate service agreement.">
      <section><h2>Using this website</h2><p>You can browse the website, explore the interactive demonstration, use the revenue calculator, and submit a genuine demo or trial inquiry. Please don’t misuse the forms, submit someone else’s information without permission, or attempt to interfere with the website or its database.</p></section>
      <section><h2>Demo and trial inquiries</h2><p>Submitting a form records an inquiry and is not a purchase, paid subscription, or automatic activation of a service. A demo or trial is subject to availability, onboarding, and a separate confirmation of the terms that apply to your business.</p><p>The advertised 14-day trial is intended to let a business explore the product before making a commitment. No credit card is required to submit a trial inquiry, and no automatic charge is created by this website.</p></section>
      <section><h2>Illustrations and financial estimates</h2><p>The call flow, customer conversations, appointment bookings, and revenue chart shown on the website are product demonstrations, not live customer activity. The ROI calculator is a planning tool based on the values you enter and an assumption of 30 days per month.</p><p>Estimates are not a promise of earnings or bookings. Your actual outcomes depend on your call volume, customer value, business operations, response quality, and other factors.</p></section>
      <section><h2>Your information and messages</h2><p>Provide accurate information in your inquiry and obtain any required permission before sharing another person’s details. Don’t submit confidential or sensitive customer data. If you later use a communications service, you are responsible for complying with applicable messaging, consent, and privacy requirements.</p></section>
      <section><h2>Availability and limitations</h2><p>We aim to keep the website useful and available, but it may occasionally be interrupted for maintenance or technical reasons. The website and calculator are provided as-is, without a guarantee of particular business results. Nothing in these terms limits rights that can’t be excluded under applicable law.</p></section>
      <section><h2>Questions about these terms</h2><p>If you have a question before requesting a demo or trial, we’re happy to help. Send a message using the form below.</p><div className="mt-4"><DemoButton intent={{ source: "Terms question", kind: "demo" }}>Ask a question</DemoButton></div></section>
    </LegalPage>
  );
}
