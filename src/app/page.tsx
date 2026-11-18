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
import { Reveal } from "@/components/Reveal";

export default function HomePage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white text-[#111214] font-sans selection:bg-[#f5c62e] selection:text-[#111214]">
      <Navbar />
      <main id="main-content" className="w-full min-w-0 overflow-x-clip pb-12 sm:pb-16">
        <Hero />
        <Reveal><MetricStrip /></Reveal>
        <Reveal><ProblemSection /></Reveal>
        <Reveal><FeaturesSection /></Reveal>
        <Reveal><HowItWorksSection /></Reveal>
        <Reveal><RoiCalculatorSection /></Reveal>
        <Reveal><AudienceTags /></Reveal>
        <Reveal><OfferSection /></Reveal>
        <Reveal><FaqSection /></Reveal>
        <Reveal><FinalCta /></Reveal>
      </main>
      <Reveal><Footer /></Reveal>
    </div>
  );
}