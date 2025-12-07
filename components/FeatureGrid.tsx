import React from "react";

type Feature = {
  name: string;
  tagline: string;
  body: string;
  badge?: string;
};

const features: Feature[] = [
  {
    name: "Elya AI Companion",
    tagline: "Your personal interpreter coach.",
    body: "AI-powered prep and debrief sessions tailored to your assignments. Process tough sessions, prepare for complex contexts, and reflect on your practice.",
    badge: "AI-Powered",
  },
  {
    name: "CEU Workshops",
    tagline: "RID-approved continuing education.",
    body: "Complete interactive workshops and earn CEUs toward your certification. Track Professional Studies, PPO, and General Studies all in one place.",
    badge: "Pro",
  },
  {
    name: "Wellness Check-ins",
    tagline: "Catch burnout drift before crisis.",
    body: "Quick daily check-ins track emotional intensity, recovery, and workload over time. See patterns and get support when you need it.",
    badge: "Wellness",
  },
  {
    name: "Assignment Prep",
    tagline: "Walk in prepared, not panicked.",
    body: "Research participants, build domain mental models, generate field-specific vocabulary, and coordinate with team interpreters before you arrive.",
    badge: "Workflow",
  },
  {
    name: "Skill Development",
    tagline: "Targeted growth, not random practice.",
    body: "Drills and modules focused on interpreter-specific skills. Track progress and build competence in areas that matter for your career.",
    badge: "Skills",
  },
  {
    name: "RID Compliance Tracking",
    tagline: "Never miss a deadline.",
    body: "Automatically track CEUs toward your certification cycle. See what you've earned, what you need, and when your cycle ends.",
    badge: "Pro",
  },
];

export const FeatureGrid: React.FC = () => {
  return (
    <section id="features" className="border-t border-slate-900/80 bg-slate-950/90">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-teal-300/80">What lives inside your OS</p>
          <h2 className="mt-2 text-4xl md:text-5xl font-semibold text-slate-50 tracking-tight">Not an app, but a calm control center for your interpreting life.</h2>
          <p className="mt-3 text-lg md:text-xl text-slate-300">Each module is built around one job: show you what this work is doing to your mind, body, and career, and help you respond without burning out.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {features.map((f) => (
            <div key={f.name} className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-[0_16px_44px_rgba(15,23,42,0.9)] transition hover:border-teal-400/70 hover:bg-slate-900">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold text-slate-50">{f.name}</h3>
                {f.badge && (
                  <span className="inline-flex items-center rounded-full bg-slate-950/90 px-2 py-0.5 text-xs text-slate-300 border border-slate-700/80">{f.badge}</span>
                )}
              </div>
              <p className="mt-1 text-base text-teal-300">{f.tagline}</p>
              <p className="mt-2 text-sm text-slate-300">{f.body}</p>
              <div className="mt-4 h-px w-full bg-gradient-to-r from-teal-400 via-violet-400 to-amber-300 opacity-60 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
