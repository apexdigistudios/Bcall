import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { MetricStrip } from "@/components/MetricStrip";
import { ProblemSection } from "@/components/ProblemSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { RoiCalculatorSection } from "@/components/RoiCalculatorSection";
import { AudienceTags } from "@/components/AudienceTags";
import { OfferSection } from "@/components/OfferSection";
import { FaqSection } from "@/components/FaqSection";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white text-[#111214] font-sans selection:bg-[#f5c62e] selection:text-[#111214]">
      <Navbar />
      <main id="main-content" className="w-full min-w-0 overflow-x-hidden pb-12 sm:pb-16">
        <Hero />
        <MetricStrip />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <RoiCalculatorSection />
        <AudienceTags />
        <OfferSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}