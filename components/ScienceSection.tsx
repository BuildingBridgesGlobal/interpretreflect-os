import React from "react";

export const ScienceSection: React.FC = () => {
  return (
    <section id="science" className="border-t border-slate-900/80 bg-gradient-to-b from-slate-950/95 via-slate-950 to-slate-950/95">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-violet-300/80">The science under the hood</p>
          <h2 className="mt-2 text-4xl md:text-5xl font-semibold text-slate-50 tracking-tight">Grounded in interpreter research, emotional intelligence, and trauma-informed design.</h2>
          <p className="mt-3 text-lg text-slate-300">This OS is not a generic wellness tracker re-labeled for interpreters. It's architected from the realities of high-stakes interpreting work: emotional residue, decision fatigue, power dynamics, and long-term career risk.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
            <p className="text-sm font-semibold tracking-[0.16em] uppercase text-violet-300">Emotional Intelligence & Nervous System</p>
            <p className="mt-2 text-base text-slate-300">Pulls from EI frameworks and nervous system science to pace reflections, avoid retraumatization, and keep your load visible without overwhelming you.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
            <p className="text-sm font-semibold tracking-[0.16em] uppercase text-violet-300">Interpreter-Specific Research</p>
            <p className="mt-2 text-base text-slate-300">Informed by studies on interpreter burnout, role-space, and consumer perceptions, so prompts and dashboards reflect the ethical and relational complexity you navigate.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
            <p className="text-sm font-semibold tracking-[0.16em] uppercase text-violet-300">Trauma-Informed UX</p>
            <p className="mt-2 text-base text-slate-300">Designed to be grounding, not triggering: no bright red alarm states, no gamified streak anxiety, no shame-based metrics. Just clear signals and small, doable next steps.</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-violet-500/40 bg-slate-900/85 p-6 shadow-[0_18px_52px_rgba(15,23,42,0.95)]">
            <p className="text-sm uppercase tracking-[0.16em] text-violet-300">Built from</p>
            <ul className="mt-4 space-y-3 text-base text-slate-200">
              <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-400 flex-shrink-0" /><span>Interpreting research on stress, burnout, and consumer/interpreter perceptions.</span></li>
              <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400 flex-shrink-0" /><span>Emotional intelligence models, nervous system regulation, and reflective practice.</span></li>
              <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-300 flex-shrink-0" /><span>Real interpreter narratives from medical, legal, education, mental health, and community work.</span></li>
            </ul>
            <div className="mt-5 rounded-xl bg-slate-950/95 border border-slate-800/80 px-4 py-3">
              <p className="text-sm text-slate-300"><span className="font-semibold text-teal-300">Design principle:</span> track just enough to see patterns and intervene. Not so much that tracking becomes a new burden.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6">
            <p className="text-sm uppercase tracking-[0.16em] text-slate-400">For leadership & programs</p>
            <p className="mt-3 text-base text-slate-300">When you roll this out across a cohort or team, you don't get access to anyone's private reflections.</p>
            <p className="mt-3 text-base text-slate-300">You get anonymized, pattern-level signals to support workload, supervision, and retention.</p>
            <div className="mt-5 flex gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <p className="text-base text-slate-400">No individual data access, only aggregate trends</p>
            </div>
            <div className="mt-2 flex gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
              <p className="text-base text-slate-400">Ethical oversight built into the architecture</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
