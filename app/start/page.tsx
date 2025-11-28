import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export default function StartPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-12 md:py-20">
        <OnboardingWizard />
      </div>
    </div>
  );
}
