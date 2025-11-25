"use client";
import React from "react";

export default function FirstActionsStrip() {
  const actions = [
    { title: "Log one assignment from the last 48 hours", cta: "Open debrief" },
    { title: "Choose your preferred check-in rhythm", cta: "Set check-ins" },
    { title: "Bookmark one grounding tool that works", cta: "Choose support" },
  ];
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
      <p className="text-[0.75rem] uppercase tracking-[0.14em] text-slate-400">Your first 3 actions</p>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        {actions.map((a) => (
          <div key={a.title} className="rounded-xl bg-slate-950/80 p-4 border border-slate-800">
            <p className="text-sm text-slate-200">{a.title}</p>
            <button className="mt-2 inline-flex items-center rounded-lg bg-teal-400 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-teal-300">{a.cta}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
