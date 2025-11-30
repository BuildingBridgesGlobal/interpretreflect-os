import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { InterpreterOS } from "@/components/InterpreterOS";
import { PrepWorkflow } from "@/components/PrepWorkflow";
import { OSPreview } from "@/components/OSPreview";
import { ValueStrip } from "@/components/ValueStrip";
import { DayInLife } from "@/components/DayInLife";
import { FeatureGrid } from "@/components/FeatureGrid";
import { ScienceSection } from "@/components/ScienceSection";
import { TeamsPrograms } from "@/components/TeamsPrograms";
import { Pricing } from "@/components/Pricing";
import { SocialProof } from "@/components/SocialProof";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Header />
      <main>
        {/* Hero: Career OS positioning */}
        <Hero primaryHref="/start" secondaryHref="#interpreter-os" />

        {/* The Interpreter OS: Lifecycle coverage + Copilot analogy */}
        <InterpreterOS />

        {/* Prep Workflow: The 30-minute demo */}
        <PrepWorkflow />

        {/* Value Strip */}
        <ValueStrip
          eyebrow="Why an operating system for your career?"
          title="Because exceptional work requires more than just showing up."
        />

        {/* OS Preview - Shows the system */}
        <OSPreview />

        {/* Day in Life */}
        <DayInLife
          title="A Day with Your Interpreter OS"
          subhead="Same schedule. Same assignments. The difference is you have a system handling the cognitive load so you can be fully present for the work itself."
        />

        {/* Features */}
        <FeatureGrid />

        {/* Science backing */}
        <ScienceSection />

        {/* Teams and Programs */}
        <TeamsPrograms />

        {/* Pricing */}
        <Pricing />

        {/* Social Proof */}
        <SocialProof />

        {/* Final CTA */}
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
