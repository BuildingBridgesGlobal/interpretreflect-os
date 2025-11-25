import React from "react";

export const GrowthTimeline: React.FC = () => {
  return (
    <div className="h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">Growth timeline</p>
      <p className="mt-1 text-sm text-slate-300">Recent weeks of practice and skill changes, in one glance.</p>
      <div className="mt-4 h-32 rounded-xl bg-slate-950/80 text-xs text-slate-500 flex items-center justify-center">Timeline placeholder</div>
      <p className="mt-3 text-xs text-slate-400">Once data is flowing, this will show streaks, plateaus, and improvements.</p>
    </div>
  );
};
