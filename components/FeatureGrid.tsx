import React from "react";

type Feature = {
  name: string;
  tagline: string;
  body: string;
  badge?: string;
};

const features: Feature[] = [
  {
    name: "Burnout Drift Map",
    tagline: "See when ‘I’m fine’ starts to slip.",
    body: "Tracks emotional intensity, recovery, and demand over weeks so you catch burnout drift early instead of waking up in crisis.",
    badge: "Long-term",
  },
  {
    name: "Domain Load Dashboard",
    tagline: "Medical ≠ education ≠ legal.",
    body: "Shows which settings are quietly costing you the most — across medical, legal, mental health, K–12, VRS, and more.",
    badge: "Pattern view",
  },
  {
    name: "Support Stack",
    tagline: "Tiny, well-timed interventions.",
    body: "Suggests micro-practices matched to your load, not random self-care. 90 seconds, not 90 minutes.",
    badge: "Micro-support",
  },
  {
    name: "Reflection Engine",
    tagline: "Interpreting-specific debriefs.",
    body: "Guided prompts tailored to assignment type, power dynamics, and emotional charge — not generic journaling templates.",
    badge: "Interpreter-only",
  },
  {
    name: "Affirmations & EQ Micro-Coach",
    tagline: "Language that actually fits your work.",
    body: "Pulls from interpreter-grounded affirmations and EQ cues to help you stay grounded, not bypass the hard moments.",
    badge: "EQ-focused",
  },
  {
    name: "CEU-Ready Records",
    tagline: "Turn growth into credit.",
    body: "Compile reflections and patterns into evidence you can bring to supervision, mentoring, or CEU documentation.",
    badge: "Optional",
  },
];

export const FeatureGrid: React.FC = () => {
  return (
    <section id="features" className="border-t border-slate-900/80 bg-slate-950/90">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.16em] text-teal-300/80">What lives inside your OS</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold text-slate-50 tracking-tight">Not an app — a calm control center for your interpreting life.</h2>
          <p className="mt-3 text-base md:text-lg text-slate-300">Each module is built around one job: show you what this work is doing to your mind, body, and career — and help you respond without burning out.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {features.map((f) => (
            <div key={f.name} className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-[0_16px_44px_rgba(15,23,42,0.9)] transition hover:border-teal-400/70 hover:bg-slate-900">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-50">{f.name}</h3>
                {f.badge && (
                  <span className="inline-flex items-center rounded-full bg-slate-950/90 px-2 py-0.5 text-[0.65rem] text-slate-300 border border-slate-700/80">{f.badge}</span>
                )}
              </div>
              <p className="mt-1 text-sm text-teal-300">{f.tagline}</p>
              <p className="mt-2 text-[0.85rem] text-slate-300">{f.body}</p>
              <div className="mt-4 h-px w-full bg-gradient-to-r from-teal-400 via-violet-400 to-amber-300 opacity-60 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
