"use client";
import React from "react";

const goals = [
  { key: "burnout", title: "Maintain peak performance consistency.", desc: "Track performance patterns and optimize my workflow before issues compound." },
  { key: "recovery", title: "Master assignment-to-assignment transitions.", desc: "Build efficient reset protocols between demanding assignments." },
  { key: "growth", title: "Track measurable skill development.", desc: "See concrete progress across core competencies over time." },
  { key: "season", title: "Navigate a high-demand season.", desc: "Residency, grad school, a new role, or an intensive work period." },
];

export default function Step4Goals({ primary_goal, onChange }: { primary_goal?: "burnout" | "recovery" | "growth" | "season"; onChange: (partial: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-300 mb-4">
          Choose the focus that resonates most right now. You can adjust this anytime in your dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {goals.map((g) => (
          <button
            key={g.key}
            onClick={() => onChange({ primary_goal: g.key })}
            className={`rounded-2xl border p-4 text-left transition-all ${
              primary_goal === g.key
                ? "border-teal-400 bg-teal-400/10"
                : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
            }`}
          >
            <p className="text-sm font-semibold text-slate-50">{g.title}</p>
            <p className="mt-1 text-sm text-slate-300">{g.desc}</p>
          </button>
        ))}
      </div>

      {primary_goal && (
        <div className="rounded-lg border border-violet-400/30 bg-violet-400/5 p-4">
          <p className="text-[0.8rem] text-violet-200">
            ✓ Your dashboard will prioritize tools and reflections aligned with this goal
          </p>
        </div>
      )}
    </div>
  );
}
