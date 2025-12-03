"use client";

import { useState } from "react";

interface EssenceProfileOnboardingProps {
  onComplete: (profileData: {
    display_name: string;
    bio: string;
    is_deaf_interpreter: boolean;
    open_to_mentoring: boolean;
    years_experience: string;
    primary_settings: string[];
    community_intent: string;
  }) => void;
  onSkip?: () => void;
  suggestedName?: string; // Pre-populated from user's account
  isVerifiedName?: boolean; // True if name came from a verified source (not email prefix)
}

/**
 * Simplified Community Profile Onboarding
 *
 * Philosophy: Trauma-informed, low-friction approach
 * - Minimal upfront data collection
 * - Gradual reveal through platform use
 * - ECCI domains auto-detected from debriefs
 * - Pod matching happens organically
 */
export default function EssenceProfileOnboarding({ onComplete, onSkip, suggestedName, isVerifiedName }: EssenceProfileOnboardingProps) {
  const [step, setStep] = useState(1);

  // Form state - minimal fields only
  const [displayName, setDisplayName] = useState(suggestedName || "");
  const [bio, setBio] = useState("");
  const [isDeafInterpreter, setIsDeafInterpreter] = useState(false);
  const [openToMentoring, setOpenToMentoring] = useState(false);
  const [yearsExperience, setYearsExperience] = useState("");
  const [primarySettings, setPrimarySettings] = useState<string[]>([]);
  const [communityIntent, setCommunityIntent] = useState("");

  const experienceOptions = [
    "New to the field",
    "1-3 years",
    "4-7 years",
    "8-15 years",
    "15+ years"
  ];

  const settingOptions = [
    "Medical",
    "Legal",
    "Educational",
    "Mental Health",
    "VRS",
    "Community"
  ];

  const intentOptions = [
    { value: "connect", label: "Connect with peers" },
    { value: "guidance", label: "Find guidance" },
    { value: "share", label: "Share expertise" },
    { value: "all", label: "All of the above" }
  ];

  const toggleSetting = (setting: string) => {
    if (primarySettings.includes(setting)) {
      setPrimarySettings(primarySettings.filter(s => s !== setting));
    } else if (primarySettings.length < 3) {
      setPrimarySettings([...primarySettings, setting]);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    onComplete({
      display_name: displayName,
      bio,
      is_deaf_interpreter: isDeafInterpreter,
      open_to_mentoring: openToMentoring,
      years_experience: yearsExperience,
      primary_settings: primarySettings,
      community_intent: communityIntent
    });
  };

  const canProceedStep1 = displayName.trim().length > 0 && yearsExperience.length > 0;
  const canProceedStep2 = primarySettings.length > 0;
  const canComplete = communityIntent.length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  stepNum === step
                    ? "bg-teal-500 text-slate-950"
                    : stepNum < step
                    ? "bg-teal-500/30 text-teal-400"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {stepNum < step ? "✓" : stepNum}
              </div>
              {stepNum < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                    stepNum < step ? "bg-teal-500/30" : "bg-slate-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-400 text-center">Step {step} of 3</p>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100 mb-2">
              Welcome to the Community
            </h2>
            <p className="text-slate-400">
              Let's start with the basics. You can always update this later.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Professional Name <span className="text-rose-400">*</span>
              </label>
              {isVerifiedName ? (
                <>
                  <div className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 flex items-center">
                    {displayName || "Loading your name..."}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    <strong className="text-slate-300">This is your real name from your account.</strong> It ensures professionalism and accountability in our community.
                  </p>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your full name (e.g., Jane Smith)"
                    className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    <strong className="text-slate-300">Please enter your real name.</strong> This ensures professionalism and accountability in our community.
                  </p>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Short Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A sentence or two about yourself (optional)"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <p className="text-xs text-slate-500 mt-1">Keep it simple - you can expand this anytime</p>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border border-slate-700 bg-slate-800/50">
              <input
                type="checkbox"
                id="deaf-interpreter"
                checked={isDeafInterpreter}
                onChange={(e) => setIsDeafInterpreter(e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-2 focus:ring-teal-400"
              />
              <label htmlFor="deaf-interpreter" className="text-sm text-slate-300 cursor-pointer">
                I'm a Deaf Interpreter
              </label>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
              <input
                type="checkbox"
                id="open-to-mentoring"
                checked={openToMentoring}
                onChange={(e) => setOpenToMentoring(e.target.checked)}
                className="w-5 h-5 rounded border-amber-600 bg-slate-900 text-amber-500 focus:ring-2 focus:ring-amber-400"
              />
              <div>
                <label htmlFor="open-to-mentoring" className="text-sm text-slate-200 cursor-pointer font-medium">
                  I'm open to mentoring others
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  You'll appear in the Mentors list for those seeking guidance
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Years of Experience <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {experienceOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setYearsExperience(option)}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                      yearsExperience === option
                        ? "border-teal-500 bg-teal-500/10 text-teal-400"
                        : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-teal-500/50 hover:text-teal-300"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            {onSkip && (
              <button
                onClick={onSkip}
                className="text-sm text-slate-400 hover:text-slate-300"
              >
                Skip for now
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceedStep1}
              className="ml-auto px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-semibold hover:bg-teal-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Primary Settings (1-3 max) */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100 mb-2">
              Where do you primarily work?
            </h2>
            <p className="text-slate-400">
              Pick 1-3 settings. We'll learn more about your specialties as you use the platform.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {settingOptions.map((setting) => {
              const isSelected = primarySettings.includes(setting);
              const canSelect = primarySettings.length < 3;

              return (
                <button
                  key={setting}
                  onClick={() => toggleSetting(setting)}
                  disabled={!isSelected && !canSelect}
                  className={`px-4 py-4 rounded-lg border text-sm font-medium transition-all ${
                    isSelected
                      ? "border-teal-500 bg-teal-500/10 text-teal-400"
                      : canSelect
                      ? "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-teal-500/50 hover:text-teal-300"
                      : "border-slate-700 bg-slate-800/30 text-slate-500 cursor-not-allowed opacity-50"
                  }`}
                >
                  {setting}
                </button>
              );
            })}
          </div>

          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
            <p className="text-sm text-slate-300">
              <strong className="text-slate-100">Note:</strong> Your strengths and growth areas
              will be automatically discovered through your debrief sessions. No need to guess!
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={handleBack}
              className="text-sm text-slate-400 hover:text-slate-300"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceedStep2}
              className="px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-semibold hover:bg-teal-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Community Intent */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100 mb-2">
              What brings you here?
            </h2>
            <p className="text-slate-400">
              This helps us personalize your experience. You can explore all features regardless of your choice.
            </p>
          </div>

          <div className="space-y-3">
            {intentOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setCommunityIntent(option.value)}
                className={`w-full px-6 py-4 rounded-lg border text-left transition-all ${
                  communityIntent === option.value
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-slate-700 bg-slate-800/50 hover:border-teal-500/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    communityIntent === option.value ? "bg-teal-500" : "bg-slate-700"
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${
                      communityIntent === option.value ? "bg-white" : "bg-slate-500"
                    }`} />
                  </div>
                  <span
                    className={`text-base font-medium ${
                      communityIntent === option.value ? "text-teal-400" : "text-slate-300"
                    }`}
                  >
                    {option.label}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-4">
            <h4 className="text-sm font-semibold text-violet-400 mb-2">
              How matching works
            </h4>
            <p className="text-sm text-slate-300">
              We'll suggest connections based on complementary strengths and growth areas.
              Pod matching happens organically as you engage with the platform - not through
              checkbox alignment.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={handleBack}
              className="text-sm text-slate-400 hover:text-slate-300"
            >
              ← Back
            </button>
            <button
              onClick={handleComplete}
              disabled={!canComplete}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-violet-500 text-white font-semibold hover:from-teal-400 hover:to-violet-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
