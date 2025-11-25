"use client";
import React from "react";

export default function QuadrantBurnout({ redFlag }: { redFlag?: "no" | "maybe" | "yes" }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <p className="text-[0.75rem] text-slate-300">Burnout Drift</p>
      <div className="mt-3 h-24 rounded-xl bg-slate-950/90 px-3 py-2 flex items-end gap-1.5">
        {[20, 25, 30, 35, 40, 45].map((h, i) => (
          <div key={i} className="flex-1 rounded-full bg-gradient-to-t from-amber-900 via-amber-500/40 to-amber-300/80" style={{ height: `${h}%` }} />
        ))}
      </div>
      {redFlag === "yes" && <p className="mt-2 text-[0.75rem] text-amber-300">You’ve had “I can’t keep doing this like this” moments this week. That’s important, not dramatic.</p>}
      {redFlag !== "yes" && <p className="mt-2 text-[0.75rem] text-slate-400">Starting baseline</p>}
    </div>
  );
}
