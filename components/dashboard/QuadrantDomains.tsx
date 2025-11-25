"use client";
import React from "react";

export default function QuadrantDomains({ domains }: { domains: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <p className="text-[0.75rem] text-slate-300">Domains</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {domains.length === 0 && <p className="text-sm text-slate-400">Choose domains during onboarding to personalize this.</p>}
        {domains.map((d) => (
          <span key={d} className="rounded-xl bg-slate-950/80 px-3 py-2 text-sm text-slate-200 border border-slate-800">{d}</span>
        ))}
      </div>
      <p className="mt-2 text-[0.75rem] text-slate-400">These are the domains we’ll watch. As you log debriefs, we’ll highlight where the real cost is.</p>
    </div>
  );
}
