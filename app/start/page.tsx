import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import SupabaseStatus from "@/components/SupabaseStatus";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="container mx-auto max-w-2xl px-6 md:px-8 py-12 md:py-16">
        <SupabaseStatus />
        <OnboardingWizard />
      </div>
    </main>
  );
}
