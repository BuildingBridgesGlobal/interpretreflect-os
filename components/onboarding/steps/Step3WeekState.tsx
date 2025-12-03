"use client";
import React, { useState } from "react";

const workloadOptions = [
  "1–5 assignments/week",
  "6–10 assignments/week",
  "11–20 assignments/week",
  "20+ assignments/week",
  "Varies widely",
];

const challengeOptions = [
  "Specialized vocabulary gaps",
  "Fast-paced or dense content",
  "Ethical decision-making",
  "Team coordination issues",
  "Sustaining peak performance",
  "Processing high-stakes content",
  "Managing workload volume",
  "Performance consistency",
  "Other",
];

const whatBroughtYouOptions = [
  "Want to level up my performance",
  "Track my skill development",
  "Starting a new role",
  "In a training program",
  "Need better prep systems",
  "Curious about the platform",
  "Other",
];

type Step3WeekStateProps = {
  typical_workload?: string;
  current_challenges?: string[];
  challenges_other?: string;
  what_brought_you?: string;
  what_brought_you_other?: string;
  onChange: (partial: {
    typical_workload?: string;
    current_challenges?: string[];
    challenges_other?: string;
    what_brought_you?: string;
    what_brought_you_other?: string;
  }) => void;
};

export default function Step3WeekState({
  typical_workload,
  current_challenges,
  challenges_other,
  what_brought_you,
  what_brought_you_other,
  onChange
}: Step3WeekStateProps) {
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>(current_challenges || []);
  const [challengesOtherText, setChallengesOtherText] = useState(challenges_other || "");
  const [broughtYouOtherText, setBroughtYouOtherText] = useState(what_brought_you_other || "");

  const toggleChallenge = (c: string) => {
    const next = selectedChallenges.includes(c)
      ? selectedChallenges.filter((x) => x !== c)
      : [...selectedChallenges, c];
    setSelectedChallenges(next);
    onChange({ current_challenges: next });
  };

  const handleChallengesOtherChange = (value: string) => {
    setChallengesOtherText(value);
    onChange({ challenges_other: value });
  };

  const handleBroughtYouOtherChange = (value: string) => {
    setBroughtYouOtherText(value);
    onChange({ what_brought_you_other: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-slate-200">What brought you here today?</p>
        <div className="grid grid-cols-1 gap-2">
          {whatBroughtYouOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => onChange({ what_brought_you: opt })}
              className={`rounded-lg border px-3 py-2.5 text-sm text-left ${
                what_brought_you === opt
                  ? "border-teal-400 text-teal-300 bg-teal-400/5"
                  : "border-slate-700 text-slate-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {what_brought_you === "Other" && (
          <input
            type="text"
            value={broughtYouOtherText}
            onChange={(e) => handleBroughtYouOtherChange(e.target.value)}
            placeholder="Tell us more..."
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
          />
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-200">Typical workload</p>
        <div className="grid grid-cols-1 gap-2">
          {workloadOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => onChange({ typical_workload: opt })}
              className={`rounded-lg border px-3 py-2 text-sm ${
                typical_workload === opt
                  ? "border-teal-400 text-teal-300"
                  : "border-slate-700 text-slate-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-200">Biggest challenges right now (select all that apply)</p>
        <div className="grid grid-cols-2 gap-2">
          {challengeOptions.map((c) => (
            <button
              key={c}
              onClick={() => toggleChallenge(c)}
              className={`rounded-lg border px-3 py-2 text-sm ${
                selectedChallenges.includes(c)
                  ? "border-teal-400 text-teal-300"
                  : "border-slate-700 text-slate-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {selectedChallenges.includes("Other") && (
          <input
            type="text"
            value={challengesOtherText}
            onChange={(e) => handleChallengesOtherChange(e.target.value)}
            placeholder="Please specify your challenges..."
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
          />
        )}
      </div>

      <div className="rounded-lg border border-violet-400/30 bg-violet-400/5 p-4">
        <p className="text-[0.8rem] text-violet-200">
          Based on your answers, we'll personalize your dashboard with resources, reflection prompts, and skill-building exercises tailored to your needs.
        </p>
      </div>
    </div>
  );
}
