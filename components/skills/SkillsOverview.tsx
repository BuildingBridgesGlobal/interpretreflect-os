"use client";

import { useState } from "react";

type SkillStatus = "mastered" | "developing" | "needs-attention" | "not-started";

type Skill = {
  id: string;
  name: string;
  domain: string;
  status: SkillStatus;
  masteryPercentage: number;
  exercisesCompleted: number;
  totalExercises: number;
  debriefScore: number | null;
  lastPracticed: string | null;
};

const mockSkills: Skill[] = [
  // Linguistic Domain
  { id: "1", name: "Message Accuracy", domain: "Linguistic", status: "mastered", masteryPercentage: 92, exercisesCompleted: 15, totalExercises: 15, debriefScore: 9.2, lastPracticed: "2025-11-20" },
  { id: "2", name: "Register Shifting", domain: "Linguistic", status: "developing", masteryPercentage: 68, exercisesCompleted: 8, totalExercises: 12, debriefScore: 7.5, lastPracticed: "2025-11-25" },
  { id: "3", name: "Terminology Management", domain: "Linguistic", status: "needs-attention", masteryPercentage: 45, exercisesCompleted: 3, totalExercises: 10, debriefScore: 6.2, lastPracticed: "2025-10-15" },

  // Cultural Domain
  { id: "4", name: "Cultural Mediation", domain: "Cultural", status: "mastered", masteryPercentage: 88, exercisesCompleted: 12, totalExercises: 12, debriefScore: 8.8, lastPracticed: "2025-11-22" },
  { id: "5", name: "Cultural Navigation", domain: "Cultural", status: "developing", masteryPercentage: 72, exercisesCompleted: 9, totalExercises: 14, debriefScore: 7.8, lastPracticed: "2025-11-26" },
  { id: "6", name: "Community Knowledge", domain: "Cultural", status: "not-started", masteryPercentage: 0, exercisesCompleted: 0, totalExercises: 8, debriefScore: null, lastPracticed: null },

  // Cognitive Domain
  { id: "7", name: "Multitasking Capacity", domain: "Cognitive", status: "developing", masteryPercentage: 65, exercisesCompleted: 7, totalExercises: 12, debriefScore: 7.2, lastPracticed: "2025-11-24" },
  { id: "8", name: "Decision Making", domain: "Cognitive", status: "needs-attention", masteryPercentage: 52, exercisesCompleted: 4, totalExercises: 10, debriefScore: 6.5, lastPracticed: "2025-11-10" },
  { id: "9", name: "Information Processing", domain: "Cognitive", status: "developing", masteryPercentage: 70, exercisesCompleted: 8, totalExercises: 11, debriefScore: 7.6, lastPracticed: "2025-11-27" },

  // Interpersonal Domain
  { id: "10", name: "Professional Boundaries", domain: "Interpersonal", status: "mastered", masteryPercentage: 95, exercisesCompleted: 10, totalExercises: 10, debriefScore: 9.5, lastPracticed: "2025-11-18" },
  { id: "11", name: "Team Collaboration", domain: "Interpersonal", status: "developing", masteryPercentage: 78, exercisesCompleted: 9, totalExercises: 12, debriefScore: 8.1, lastPracticed: "2025-11-23" },
  { id: "12", name: "Ethical Reasoning", domain: "Interpersonal", status: "needs-attention", masteryPercentage: 58, exercisesCompleted: 5, totalExercises: 11, debriefScore: 6.8, lastPracticed: "2025-11-05" },
];

const statusConfig = {
  "mastered": {
    label: "Mastered",
    color: "teal",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
    textColor: "text-teal-400",
    dotColor: "bg-teal-400"
  },
  "developing": {
    label: "Developing",
    color: "blue",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
    dotColor: "bg-blue-400"
  },
  "needs-attention": {
    label: "Needs Attention",
    color: "amber",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
    dotColor: "bg-amber-400"
  },
  "not-started": {
    label: "Not Started",
    color: "slate",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-700",
    textColor: "text-slate-400",
    dotColor: "bg-slate-500"
  }
};

export default function SkillsOverview({ onSkillClick }: { onSkillClick: (skillId: string) => void }) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const domains = ["Linguistic", "Cultural", "Cognitive", "Interpersonal"];
  const filteredSkills = selectedDomain
    ? mockSkills.filter(s => s.domain === selectedDomain)
    : mockSkills;

  const domainStats = domains.map(domain => {
    const domainSkills = mockSkills.filter(s => s.domain === domain);
    const avgMastery = domainSkills.reduce((acc, s) => acc + s.masteryPercentage, 0) / domainSkills.length;
    return { domain, avgMastery: Math.round(avgMastery), skillCount: domainSkills.length };
  });

  return (
    <div className="space-y-6">
      {/* Domain Overview */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold text-slate-50 mb-4">Competency Domains</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {domainStats.map(({ domain, avgMastery, skillCount }) => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(selectedDomain === domain ? null : domain)}
              className={`p-4 rounded-lg border transition-all ${
                selectedDomain === domain
                  ? "border-teal-500 bg-teal-500/10"
                  : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
              }`}
            >
              <div className="text-left">
                <p className="text-sm text-slate-400 mb-1">{domain}</p>
                <p className="text-2xl font-bold text-slate-100 mb-2">{avgMastery}%</p>
                <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-teal-400 h-2 rounded-full transition-all"
                    style={{ width: `${avgMastery}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">{skillCount} skills</p>
              </div>
            </button>
          ))}
        </div>
        {selectedDomain && (
          <button
            onClick={() => setSelectedDomain(null)}
            className="mt-4 text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            ← Show all domains
          </button>
        )}
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkills.map((skill) => {
          const config = statusConfig[skill.status];
          return (
            <button
              key={skill.id}
              onClick={() => onSkillClick(skill.id)}
              className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-5 text-left hover:scale-[1.02] transition-all`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-100 mb-1">{skill.name}</h3>
                  <p className="text-xs text-slate-500">{skill.domain}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${config.dotColor} mt-1`} />
              </div>

              {/* Mastery Percentage */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Mastery</span>
                  <span className={`text-sm font-bold ${config.textColor}`}>{skill.masteryPercentage}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${config.dotColor}`}
                    style={{ width: `${skill.masteryPercentage}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Exercises:</span>
                  <span className="text-slate-300">{skill.exercisesCompleted}/{skill.totalExercises}</span>
                </div>
                {skill.debriefScore && (
                  <div className="flex justify-between">
                    <span>Avg Debrief Score:</span>
                    <span className="text-slate-300">{skill.debriefScore}/10</span>
                  </div>
                )}
                {skill.lastPracticed && (
                  <div className="flex justify-between">
                    <span>Last Practiced:</span>
                    <span className="text-slate-300">{new Date(skill.lastPracticed).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="mt-3 pt-3 border-t border-slate-700">
                <span className={`text-xs font-medium ${config.textColor}`}>
                  {config.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
