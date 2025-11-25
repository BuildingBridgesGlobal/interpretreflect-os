import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
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
        <Hero primaryHref="/start" secondaryHref="#os-preview" />
        <OSPreview />
        <ValueStrip />
        <DayInLife />
        <FeatureGrid />
        <ScienceSection />
        <TeamsPrograms />
        <Pricing />
        <SocialProof />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
