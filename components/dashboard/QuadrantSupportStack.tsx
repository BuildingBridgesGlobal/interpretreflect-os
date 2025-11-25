"use client";
import React from "react";

export default function QuadrantSupportStack() {
  const items = [
    { label: "Log today’s debrief", detail: "Capture one assignment." },
    { label: "Quick regulation check-in", detail: "90 seconds." },
    { label: "Save one affirmation", detail: "Use later today." },
  ];
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <p className="text-[0.75rem] text-slate-300">Today’s Support Stack</p>
      <div className="mt-3 space-y-2">
        {items.map((it) => (
          <div key={it.label} className="flex items-start gap-3 rounded-xl bg-slate-950/80 px-3 py-2">
            <div className="mt-1 inline-flex h-3 w-3 items-center justify-center rounded-full border border-teal-400"><span className="h-1.5 w-1.5 rounded-full bg-teal-400" /></div>
            <div>
              <p className="text-sm text-slate-100">{it.label}</p>
              <p className="text-[0.75rem] text-slate-400">{it.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
