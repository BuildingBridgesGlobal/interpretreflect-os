"use client";
import React from "react";
import { supabase } from "@/lib/supabaseClient";

type Skill = { id: number; name: string; description?: string };

const skillDescriptions: Record<number, string> = {
  1: "Manage complex discourse across all interpreting contexts with accuracy and fluency",
  2: "Navigate ethical dilemmas, boundary decisions, and professional judgment calls with confidence",
  3: "Coordinate effectively with team interpreters and maintain consistency across handoffs",
  4: "Maintain professional boundaries and sustainable practice standards",
  5: "Regulate cognitive load and sustain focus during demanding assignments",
  6: "Navigate cultural and linguistic nuances with sensitivity and skill",
  7: "Develop specialized vocabulary and domain knowledge across settings",
  8: "Build consumer-centered practice and professional presence",
};

const professionalPractices = [
  { id: "prep", label: "I regularly prep before assignments", platform: "Assignment-specific prep prompts & vocabulary lists" },
  { id: "stress", label: "I have strategies to maintain focus under pressure", platform: "Real-time cognitive regulation techniques" },
  { id: "team", label: "I coordinate with my team before assignments", platform: "Team coordination & handoff tracking" },
  { id: "reflect", label: "I analyze my performance post-assignment", platform: "Structured performance analysis after every assignment" },
  { id: "track", label: "I track my skill development over time", platform: "Visual skill growth charts & competency tracking" },
  { id: "boundaries", label: "I maintain clear professional standards", platform: "Professional decision-making tools & scenarios" },
  { id: "ceu", label: "I stay on top of CEUs throughout the year", platform: "CEU tracker with deadline reminders" },
  { id: "recovery", label: "I have reset protocols between demanding assignments", platform: "Performance reset & transition protocols" },
];

type Step5SkillsPracticesProps = {
  selected_skill_ids?: number[];
  current_practices?: string[];
  onChange: (partial: { selected_skill_ids?: number[]; current_practices?: string[] }) => void;
};

export default function Step5SkillsPractices({ selected_skill_ids, current_practices, onChange }: Step5SkillsPracticesProps) {
  const [skillsCatalog, setSkillsCatalog] = React.useState<Skill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = React.useState<number[]>(selected_skill_ids || []);
  const [currentPractices, setCurrentPractices] = React.useState<string[]>(current_practices || []);

  React.useEffect(() => {
    const run = async () => {
      if (!supabase) {
        setSkillsCatalog([
          { id: 1, name: "Interpreting discourse management", description: skillDescriptions[1] },
          { id: 2, name: "Ethical decision-making", description: skillDescriptions[2] },
          { id: 3, name: "Team collaboration & handoffs", description: skillDescriptions[3] },
          { id: 4, name: "Professional boundaries & sustainability", description: skillDescriptions[4] },
          { id: 5, name: "Cognitive load regulation", description: skillDescriptions[5] },
          { id: 6, name: "Cultural & linguistic mediation", description: skillDescriptions[6] },
          { id: 7, name: "Vocabulary & domain knowledge", description: skillDescriptions[7] },
          { id: 8, name: "Consumer-centered practice", description: skillDescriptions[8] },
        ]);
        return;
      }
      const { data } = await supabase.from("skills").select("id,name,description").order("name", { ascending: true });
      setSkillsCatalog((data ?? []).map((d: any) => ({ id: d.id, name: d.name, description: d.description || skillDescriptions[d.id] })));
    };
    run();
  }, []);

  const toggleSkill = (id: number) => {
    let next = selectedSkillIds.includes(id) ? selectedSkillIds.filter((x) => x !== id) : [...selectedSkillIds, id];
    if (next.length > 2) next = next.slice(0, 2);
    setSelectedSkillIds(next);
    onChange({ selected_skill_ids: next });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-slate-200">Top two skills you want to grow</p>
          <p className="mt-1 text-[0.75rem] text-slate-400">Select up to 2 skills to track and develop on your dashboard</p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {skillsCatalog.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleSkill(s.id)}
              className={`rounded-xl border p-3 text-left transition-all ${
                selectedSkillIds.includes(s.id)
                  ? "border-teal-400 bg-teal-400/10"
                  : "border-slate-700 bg-slate-900/30 hover:border-slate-600"
              }`}
            >
              <p className={`text-sm font-medium ${selectedSkillIds.includes(s.id) ? "text-teal-300" : "text-slate-200"}`}>
                {s.name}
              </p>
              <p className="mt-1 text-[0.75rem] text-slate-400">{s.description}</p>
            </button>
          ))}
        </div>
      </div>

      {selectedSkillIds.length > 0 && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-200">Current practices: Check what you already do</p>
            <p className="mt-1 text-[0.75rem] text-slate-400">Be honest - this helps us show you what's missing from your routine</p>
          </div>

          <div className="space-y-2">
            {professionalPractices.map((practice) => {
              const isChecked = currentPractices.includes(practice.id);
              return (
                <button
                  key={practice.id}
                  onClick={() => {
                    const next = isChecked
                      ? currentPractices.filter((p) => p !== practice.id)
                      : [...currentPractices, practice.id];
                    setCurrentPractices(next);
                    onChange({ current_practices: next });
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    isChecked
                      ? "border-teal-400/50 bg-teal-400/5"
                      : "border-slate-700 bg-slate-900/30 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 h-5 w-5 rounded flex items-center justify-center border-2 transition-all ${
                        isChecked
                          ? "border-teal-400 bg-teal-400"
                          : "border-slate-600"
                      }`}
                    >
                      {isChecked && (
                        <svg className="w-3 h-3 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isChecked ? "text-teal-200" : "text-slate-200"}`}>
                        {practice.label}
                      </p>
                      {!isChecked && (
                        <p className="mt-1 text-[0.75rem] text-slate-400">
                          → {practice.platform}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-4 space-y-2">
            <p className="text-sm font-medium text-amber-200">
              {currentPractices.length === 0 && "You're not alone - most interpreters don't have these systems in place"}
              {currentPractices.length > 0 && currentPractices.length < 4 && `You're doing ${currentPractices.length} of these - the platform will help you build the rest`}
              {currentPractices.length >= 4 && currentPractices.length < 7 && "You're building good habits - let's make them effortless"}
              {currentPractices.length >= 7 && "You're ahead of the curve - let's streamline and level up what you're doing"}
            </p>
            <p className="text-[0.75rem] text-slate-300">
              The platform makes all of these practices easy, trackable, and built into your workflow - no extra effort required.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
