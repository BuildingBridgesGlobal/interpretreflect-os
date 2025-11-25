"use client";
import React from "react";

export default function Step3WeekState({ week_load_score, week_recovery_score, week_red_flag, onChange }: { week_load_score?: number; week_recovery_score?: number; week_red_flag?: "no" | "maybe" | "yes"; onChange: (partial: { week_load_score?: number; week_recovery_score?: number; week_red_flag?: "no" | "maybe" | "yes" }) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-200">How heavy has interpreting felt overall this past week?</p>
        <input type="range" min={0} max={10} value={week_load_score ?? 5} onChange={(e) => onChange({ week_load_score: Number(e.target.value) })} className="w-full" />
        <div className="mt-1 flex justify-between text-[0.75rem] text-slate-400"><span>Light</span><span>Full but manageable</span><span>Barely keeping up</span></div>
      </div>
      <div>
        <p className="text-sm text-slate-200">How well have you been able to come back down between assignments?</p>
        <input type="range" min={0} max={10} value={week_recovery_score ?? 5} onChange={(e) => onChange({ week_recovery_score: Number(e.target.value) })} className="w-full" />
        <div className="mt-1 flex justify-between text-[0.75rem] text-slate-400"><span>Not at all</span><span>Sometimes</span><span>Consistently</span></div>
      </div>
      <div>
        <p className="text-sm text-slate-200">In the last 7 days, have you thought “I can’t keep doing this like this”?</p>
        <div className="mt-2 flex gap-2">
          {["no", "maybe", "yes"].map((opt) => (
            <button key={opt} onClick={() => onChange({ week_red_flag: opt as any })} className={`rounded-lg border px-3 py-2 text-sm ${week_red_flag === opt ? "border-amber-400 text-amber-300" : "border-slate-700 text-slate-300"}`}>{opt[0].toUpperCase() + opt.slice(1)}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
