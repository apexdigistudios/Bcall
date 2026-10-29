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
    <div className="min-h-screen w-full bg-[#f7f7f5] text-[#111214] font-sans selection:bg-[#f5c62e] selection:text-[#111214] overflow-x-hidden box-border">
      <Navbar />
      
      <main id="main-content" className="w-full overflow-x-hidden space-y-12 sm:space-y-24 pb-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 box-border space-y-12 sm:space-y-24">
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
        </div>
      </main>

      <Footer />
    </div>
  );
}