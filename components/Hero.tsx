import React from "react";

type CTA = { label: string; href: string };

type HeroProps = {
  headline?: string;
  slogan?: string;
  subhead?: string;
  primary?: CTA;
  secondary?: CTA;
  microcopy?: string;
  primaryHref?: string;
  secondaryHref?: string;
};

export const Hero: React.FC<HeroProps> = ({
  headline = "InterpretReflect",
  slogan = "The operating system for interpreters",
  subhead = "A calm, science‑based OS that tracks your emotional load, builds core interpreting skills, and gives you a multi‑agent coaching team for every assignment.",
  primary = { label: "Start Free", href: "/start" },
  secondary = { label: "See How It Works", href: "#os-preview" },
  microcopy = "Free during beta for individual interpreters. No credit card required.",
  primaryHref,
  secondaryHref,
}) => {
  const pHref = primaryHref || primary.href;
  const sHref = secondaryHref || secondary.href;

  return (
    <section id="hero" className="container mx-auto max-w-6xl px-6 md:px-8 py-20 md:py-28">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-center">
        <div className="md:col-span-5 space-y-6">
          <h1 className="text-slate-50 text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">{headline}</h1>

          <h2 className="text-slate-200 text-xl md:text-2xl font-medium">{slogan}</h2>

          <p className="text-slate-300 text-lg md:text-xl leading-relaxed">{subhead}</p>

          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href={pHref}
              className="inline-flex items-center justify-center rounded-lg bg-teal-400 text-slate-950 px-6 py-3 text-sm md:text-base font-semibold shadow-lg shadow-teal-400/30 hover:bg-teal-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition"
            >
              {primary.label}
            </a>
            <a
              href={sHref}
              className="inline-flex items-center justify-center rounded-lg border border-violet-400/80 text-violet-200 px-6 py-3 text-sm md:text-base font-semibold hover:bg-violet-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition"
            >
              {secondary.label}
            </a>
          </div>

          <p className="text-slate-400 text-sm">{microcopy}</p>

          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <div className="inline-flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Designed with interpreters, not generic wellness.</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>Tracks stress, domains, and recovery over time.</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-7">
          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)] opacity-80 blur-3xl" />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.8)]">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Performance & Load</p>
                    <p className="mt-1 text-sm text-slate-200">Today · 3 assignments</p>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[0.65rem] text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Stable
                  </div>
                </div>

                <div className="mt-4 flex items-end gap-1.5 h-20">
                  {[60, 75, 45, 90, 70, 50, 65].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full bg-gradient-to-t from-slate-800 via-teal-500/40 to-teal-400/80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-[0.7rem] text-slate-400">
                  <span>Last 7 days</span>
                  <span>Avg load: 71%</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Burnout Drift</p>
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[0.65rem] text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Watch · Slight increase
                  </div>
                </div>

                <div className="mt-4 h-20 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 px-3 py-2">
                  <div className="flex items-end gap-1.5 h-full">
                    {[20, 25, 30, 35, 40, 48, 55].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-full bg-gradient-to-t from-amber-900 via-amber-500/40 to-amber-300/80"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-400">Trend nudging up over the last 2 weeks. OS suggests shorter debriefs after medical assignments.</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Today\'s Debrief Saved</p>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[0.65rem] text-slate-300">1 new</span>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="text-slate-100">“Family conference, oncology clinic. Felt pulled between provider and patient.”</p>
                  <div className="flex flex-wrap gap-2 text-[0.7rem] text-slate-300">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5">Medical · Inpatient</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5">Emotional intensity: High</span>
                  </div>
                  <p className="text-[0.7rem] text-slate-400">OS flagged this for follow-up reflection and a brief grounding routine.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
                <div>
                  <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Today\'s Support Stack</p>
                  <p className="mt-1 text-sm text-slate-200">Micro-support woven into your day — not another task list.</p>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-400" />
                    <div>
                      <p className="text-slate-100">1-minute nervous system check</p>
                      <p className="text-[0.7rem] text-slate-400">After your second assignment.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400" />
                    <div>
                      <p className="text-slate-100">3-prompt debrief</p>
                      <p className="text-[0.7rem] text-slate-400">Scheduled for this evening — auto-saved, CEU-ready.</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl bg-slate-950/80 px-3 py-2">
                    <p className="text-[0.75rem] text-amber-100">“I can honor the emotional weight of this work without carrying it alone.”</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
