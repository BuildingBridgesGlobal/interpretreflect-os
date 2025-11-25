import React from "react";

export const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="border-t border-slate-900/80 bg-slate-950/95">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.16em] text-teal-300/80">Pricing</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold text-slate-50 tracking-tight">Calm, clear pricing for individuals and programs.</h2>
          <p className="mt-3 text-base text-slate-300">Free forever for individual interpreters. Upgrade only if you need advanced insights and domain mapping. Programs get ethical, anonymized pattern-level dashboards.</p>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-slate-400">For Individual Interpreters</p>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-slate-50">Free</p>
              <span className="text-[0.75rem] text-slate-400">forever</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>• Quick Reflect</li>
              <li>• Tools Library</li>
              <li>• Affirmations</li>
              <li>• Basic Insights</li>
              <li>• Journal</li>
            </ul>
            <div className="mt-5 flex items-baseline gap-2">
              <p className="text-xl font-semibold text-slate-50">Pro</p>
              <span className="text-[0.85rem] text-slate-300">$12/mo or $99/yr</span>
            </div>
            <ul className="mt-2 space-y-2 text-sm text-slate-300">
              <li>• Full Insights</li>
              <li>• Burnout Drift</li>
              <li>• Domain mapping</li>
              <li>• Advanced tools</li>
              <li>• Reflection tagging</li>
              <li>• Early access to agents</li>
            </ul>
            <a href="#start" className="mt-6 inline-flex items-center rounded-lg bg-teal-400 text-slate-950 px-4 py-2 text-sm font-semibold hover:bg-teal-300">Start Free</a>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-slate-400">For Programs & Organizations</p>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-slate-50">Starting at $499/mo</p>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>• Team analytics</li>
              <li>• Anonymous emotional load dashboards</li>
              <li>• Supervisor insights</li>
              <li>• CEU alignment</li>
              <li>• Cohort reports</li>
            </ul>
            <a href="#contact" className="mt-6 inline-flex items-center rounded-lg border border-teal-400 text-teal-300 px-4 py-2 text-sm font-semibold hover:bg-teal-500/10">Talk to Sales</a>
          </div>
        </div>
      </div>
    </section>
  );
};
