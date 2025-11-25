import React from "react";

export const TeamsPrograms: React.FC = () => {
  return (
    <section id="teams-programs" className="border-t border-slate-900/80 bg-slate-950/95">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.16em] text-teal-300/80">For programs, cohorts, and agencies</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold text-slate-50 tracking-tight">Give interpreters a real support OS — and leadership clear, ethical signals.</h2>
          <p className="mt-3 text-base text-slate-300">The same OS that supports individual interpreters can run across cohorts, teams, and whole programs — without turning human experience into surveillance.</p>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 text-sm">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-slate-400">Interpreter education</p>
            <p className="mt-2 text-sm text-slate-200">Support students through practicum, internships, and early career with structured reflection and burnout drift visibility.</p>
            <ul className="mt-3 space-y-1.5 text-[0.8rem] text-slate-300">
              <li>• Course and cohort-level signal summaries</li>
              <li>• CEU- and credential-aligned reflection templates</li>
              <li>• No access to private journal entries</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-slate-400">Agencies & colleges</p>
            <p className="mt-2 text-sm text-slate-200">See anonymized emotional load trends and domain hotspots to support staffing, teaming, and retention.</p>
            <ul className="mt-3 space-y-1.5 text-[0.8rem] text-slate-300">
              <li>• Domain stress heatmaps (anonymous)</li>
              <li>• Reflection culture signals (frequency, timing)</li>
              <li>• Burnout risk indicators without personal stories</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-slate-400">Leadership & supervisors</p>
            <p className="mt-2 text-sm text-slate-200">Get pattern-level insights that respect privacy while guiding supervision, workload, and ethical support.</p>
            <ul className="mt-3 space-y-1.5 text-[0.8rem] text-slate-300">
              <li>• Early drift detection across cohorts</li>
              <li>• Program-level recovery window metrics</li>
              <li>• Suggested micro-interventions at scale</li>
            </ul>
          </div>
        </div>
        <p className="mt-8 text-[0.75rem] text-slate-500">Organizations see patterns — never personal data.</p>
      </div>
    </section>
  );
};
