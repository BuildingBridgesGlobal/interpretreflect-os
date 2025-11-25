import React from "react";

export const CompetencyRadar: React.FC = () => {
  return (
    <div className="h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">Competency radar</p>
      <p className="mt-1 text-sm text-slate-300">Snapshot of your strengths and growth edges across key interpreting skills.</p>
      <div className="mt-4 flex h-48 items-center justify-center rounded-xl bg-slate-950/80 text-xs text-slate-500">Radar chart placeholder</div>
    </div>
  );
};
