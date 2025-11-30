"use client";

import { useState } from "react";

type LearnedPreferencesProps = {
  userData: any;
};

type Preference = {
  category: "prompts" | "workflow" | "feedback" | "scheduling";
  title: string;
  description: string;
  learnedFrom: string;
  confidence: number;
  active: boolean;
};

export default function LearnedPreferences({ userData }: LearnedPreferencesProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Mock learned preferences - will be generated from user behavior patterns
  const preferences: Preference[] = [
    {
      category: "prompts",
      title: "Prefer reflection prompts focused on emotional regulation",
      description: "You engage 3x more with prompts asking 'How did you manage intensity?' vs. technical skill questions. Elya now prioritizes emotional awareness prompts.",
      learnedFrom: "42 reflection sessions analyzed",
      confidence: 94,
      active: true
    },
    {
      category: "prompts",
      title: "Respond well to specific domain examples",
      description: "You provide 2.5x more detailed responses when prompts include specific domain context (e.g., 'In medical settings...' vs. generic 'During assignments...').",
      learnedFrom: "38 reflection sessions analyzed",
      confidence: 87,
      active: true
    },
    {
      category: "workflow",
      title: "Prefer voice debriefs immediately after assignments",
      description: "You complete voice debriefs within 30 minutes of assignment end 85% of the time. Text debriefs take 4+ hours. Elya now sends voice prompt notifications immediately.",
      learnedFrom: "24 debrief sessions analyzed",
      confidence: 91,
      active: true
    },
    {
      category: "feedback",
      title: "Value pattern recognition over individual praise",
      description: "You spend 3.2x more time reviewing cross-assignment patterns than single-assignment feedback. Elya now emphasizes pattern insights in weekly reports.",
      learnedFrom: "12 weeks of engagement data",
      confidence: 88,
      active: true
    },
    {
      category: "scheduling",
      title: "Need recovery time after double-block Wednesdays",
      description: "Burnout drift signals spike 40% after Wednesday double sessions. Elya suggests blocking Thursday mornings for recovery.",
      learnedFrom: "8 weeks of scheduling data",
      confidence: 92,
      active: true
    },
    {
      category: "prompts",
      title: "Prefer 'What worked?' over 'What went wrong?'",
      description: "Strength-based reflection prompts generate 1.8x longer, more detailed responses. Elya now frames challenges as 'growth opportunities.'",
      learnedFrom: "47 reflection sessions analyzed",
      confidence: 85,
      active: true
    }
  ];

  const activePreferences = preferences.filter(p => p.active);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "prompts":
        return {
          bg: "bg-violet-500/10",
          border: "border-violet-500/30",
          text: "text-violet-300"
        };
      case "workflow":
        return {
          bg: "bg-teal-500/10",
          border: "border-teal-500/30",
          text: "text-teal-300"
        };
      case "feedback":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          text: "text-amber-300"
        };
      case "scheduling":
        return {
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
          text: "text-emerald-300"
        };
      default:
        return {
          bg: "bg-slate-500/10",
          border: "border-slate-500/30",
          text: "text-slate-300"
        };
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-50">Learned Preferences</h2>
          <p className="text-sm text-slate-400 mt-1">How Elya adapts to you</p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2 rounded-lg bg-violet-500/20 text-violet-300 text-sm font-medium border border-violet-500/30 hover:bg-violet-500/30 transition-colors"
        >
          {showDetails ? "Hide Details" : "View All"}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/50 text-center">
          <p className="text-2xl font-bold text-teal-400">{activePreferences.length}</p>
          <p className="text-xs text-slate-500 mt-1">Active</p>
        </div>
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/50 text-center">
          <p className="text-2xl font-bold text-violet-400">
            {Math.round(preferences.reduce((sum, p) => sum + p.confidence, 0) / preferences.length)}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Avg Confidence</p>
        </div>
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/50 text-center">
          <p className="text-2xl font-bold text-amber-400">
            {preferences.filter(p => p.category === "prompts").length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Prompt Styles</p>
        </div>
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/50 text-center">
          <p className="text-2xl font-bold text-emerald-400">
            {preferences.filter(p => p.category === "workflow").length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Workflow Tweaks</p>
        </div>
      </div>

      {/* Preference List */}
      {showDetails && (
        <div className="space-y-3">
          {preferences.map((pref, idx) => {
            const colors = getCategoryColor(pref.category);

            return (
              <div
                key={idx}
                className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors.border} ${colors.text}`}>
                        {pref.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                        <span className="text-xs text-slate-500">{pref.confidence}% confidence</span>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200">{pref.title}</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pref.active}
                      onChange={() => {}}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                  </label>
                </div>

                <p className="text-sm text-slate-300 mb-2">{pref.description}</p>

                <p className="text-xs text-slate-500 italic">
                  Learned from: {pref.learnedFrom}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {!showDetails && (
        <div className="space-y-2">
          {activePreferences.slice(0, 3).map((pref, idx) => {
            const colors = getCategoryColor(pref.category);

            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/50"
              >
                <span className={`px-2 py-1 rounded text-xs font-medium border ${colors.border} ${colors.bg} ${colors.text}`}>
                  {pref.category}
                </span>
                <p className="text-sm text-slate-300 flex-1">{pref.title}</p>
                <span className="text-xs text-slate-500">{pref.confidence}%</span>
              </div>
            );
          })}
          <p className="text-center text-xs text-slate-500 pt-2">
            +{activePreferences.length - 3} more preferences active
          </p>
        </div>
      )}
    </div>
  );
}
