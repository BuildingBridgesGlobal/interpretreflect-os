"use client";
import React from "react";

export default function QuadrantPerformance({ seed }: { seed: number }) {
  const vals = [seed - 2, seed, seed + 1, seed + 2, seed - 1, seed, seed - 3].map((v) => Math.max(0, Math.min(10, v)));
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <p className="text-[0.75rem] text-slate-300">Performance & Demand</p>
      <div className="mt-3 h-28 rounded-xl bg-slate-950/90 px-3 py-2 flex items-end gap-1.5">
        {vals.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end gap-1">
            <div className="w-full rounded-full bg-gradient-to-t from-teal-700 via-teal-400/70 to-teal-300" style={{ height: `${(h / 10) * 100}%` }} />
          </div>
        ))}
      </div>
      <p className="mt-2 text-[0.75rem] text-slate-400">We’ll start plotting from today. For now, this is a rough estimate based on your last 7 days.</p>
    </div>
  );
}
