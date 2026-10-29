import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { DemoButton } from "@/components/DemoButton";

export const metadata: Metadata = { title: "Privacy policy — y'elllo", description: "How y'elllo handles the information you share in a demo or free-trial inquiry." };

export default function PrivacyPage() {
  return (
    <LegalPage title="Your privacy matters." description="We believe in clear conversations, including about your data. Here’s what this website collects, why we collect it, and what you can ask us to do.">
      <section><h2>What we collect</h2><p>When you submit a demo or trial inquiry, we collect your name, email address, business name, business type, consent, and the time of submission. You can also choose to share a phone number or a message. We store the page or calculator that prompted your request so we can better understand your needs.</p><p>Our inquiry system may keep a short-lived record of submission frequency to limit spam. We don’t ask for payment information on this website.</p></section>
      <section><h2>How we use your information</h2><p>We use inquiry details to respond to your request, arrange a product demo or trial onboarding, and answer your questions. We don’t sell personal information or use it for unrelated advertising.</p><p>Submitting an inquiry does not enroll you in a paid plan. We only contact you about the request you submitted or a related business conversation you initiate.</p></section>
      <section><h2>Storage and security</h2><p>Inquiry details are stored in our application database. Access is limited to the people and systems needed to manage your inquiry. No website can guarantee absolute security, but we use reasonable technical controls and avoid exposing your inquiry to other visitors.</p><p>We retain inquiry details for as long as reasonably necessary to manage your request and meet applicable legal obligations. Optional information should not include payment details, medical records, or sensitive customer information.</p></section>
      <section><h2>Cookies and analytics</h2><p>This website does not use advertising cookies or third-party analytics trackers. Essential hosting and security tools may process basic connection information to deliver the website and prevent misuse.</p></section>
      <section><h2>Your choices</h2><p>You can ask to access, correct, or delete your inquiry details, or withdraw your consent to further contact. Use the form below to tell us what you need. We may ask you to verify ownership of the email address before acting on a request.</p><div className="mt-4"><DemoButton intent={{ source: "Privacy information request", kind: "demo" }}>Ask about my data</DemoButton></div></section>
      <section><h2>Product demonstrations and estimates</h2><p>The recovery flow and chart on our home page are illustrative examples. The ROI calculator runs in your browser. Calculator values are included with your inquiry only if you choose to submit the form.</p></section>
    </LegalPage>
  );
}
