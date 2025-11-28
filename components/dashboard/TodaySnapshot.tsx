"use client";
import React from "react";

type Data = {
  role?: string;
  years_experience?: string;
  settings?: string[];
  week_load_score?: number;
  primary_goal?: "burnout" | "recovery" | "growth" | "season";
};

export default function TodaySnapshot({ data }: { data: Data | null }) {
  const heavy = (data?.week_load_score ?? 0) >= 7;
  const goalLabel =
    data?.primary_goal === "burnout"
      ? "Focus: Early burnout signals"
      : data?.primary_goal === "recovery"
      ? "Focus: Recovery"
      : data?.primary_goal === "growth"
      ? "Focus: Growth"
      : data?.primary_goal === "season"
      ? "Focus: Season support"
      : undefined;
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
      <h2 className="text-lg font-semibold text-slate-50">This is your starting point, not a grade.</h2>
      <p className="mt-2 text-sm text-slate-300">{heavy ? "Your last week has been heavy. Let’s keep this OS gentle and doable." : "Your demand is currently in the manageable range. We’ll watch for drift and subtle shifts."}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {goalLabel && <span className="rounded-full bg-slate-800 px-3 py-1 text-[0.75rem] text-teal-300">{goalLabel}</span>}
        {data?.role && data?.years_experience && <span className="rounded-full bg-slate-800 px-3 py-1 text-[0.75rem] text-slate-300">{data.role} · {data.years_experience}</span>}
        {(data?.settings ?? []).slice(0, 3).map((s) => (
          <span key={s} className="rounded-full bg-slate-800 px-3 py-1 text-[0.75rem] text-slate-300">{s}</span>
        ))}
      </div>
    </section>
  );
}
