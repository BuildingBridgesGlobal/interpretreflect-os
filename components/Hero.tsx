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
  slogan = "The operating system for your interpreting career.",
  subhead = "One place for prep, reflection, credentials, and growth. We handle the cognitive load so you can focus on what matters: doing exceptional work.",
  primary = { label: "Try Free for 7 Days", href: "/start" },
  secondary = { label: "See How It Works", href: "#interpreter-os" },
  microcopy = "7-day free trial. No credit card required.",
  primaryHref,
  secondaryHref,
}) => {
  const pHref = primaryHref || primary.href;
  const sHref = secondaryHref || secondary.href;

  return (
    <section id="hero" className="relative container mx-auto max-w-6xl px-6 md:px-8 py-20 md:py-28">
      {/* AI Motif Background */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(6,182,212,0.12)_2px,transparent_2px),linear-gradient(90deg,rgba(6,182,212,0.12)_2px,transparent_2px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)]" />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-center">
        <div className="md:col-span-5 space-y-6">
          <h1 className="text-slate-50 text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight">{headline}</h1>

          <h2 className="text-slate-200 text-2xl md:text-3xl font-medium">{slogan}</h2>

          <p className="text-slate-300 text-xl md:text-2xl leading-relaxed">{subhead}</p>

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

          <p className="text-slate-400 text-base">{microcopy}</p>

          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <div className="inline-flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400" />
              <span>AI-powered assignment prep</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400" />
              <span>Portable credential vault</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>CEU-ready reflections</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-7">
          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)] opacity-80 blur-3xl" />

            <div className="grid gap-4 md:grid-cols-2">
              {/* Before: Assignment Prep */}
              <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.8)]">
                <div>
                  <p className="text-[0.7rem] uppercase tracking-wide text-teal-400/80">Before</p>
                  <p className="mt-1 text-sm text-slate-200">Assignment Prep</p>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    <span className="text-slate-300">Research participants</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    <span className="text-slate-300">Build domain mental models</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    <span className="text-slate-300">Generate vocab by field</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    <span className="text-slate-300">Coordinate with team</span>
                  </div>
                </div>
              </div>

              {/* After: Reflection */}
              <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4">
                <div>
                  <p className="text-[0.7rem] uppercase tracking-wide text-violet-400/80">After</p>
                  <p className="mt-1 text-sm text-slate-200">Growth & Reflection</p>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                    <span className="text-slate-300">Structured debriefs</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                    <span className="text-slate-300">Pattern recognition</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                    <span className="text-slate-300">CEU-ready evidence</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                    <span className="text-slate-300">Skill development path</span>
                  </div>
                </div>
              </div>

              {/* Always: Career Infrastructure */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div>
                  <p className="text-[0.7rem] uppercase tracking-wide text-amber-400/80">Always</p>
                  <p className="mt-1 text-sm text-slate-200">Career Infrastructure</p>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="text-slate-300">Portable credentials</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="text-slate-300">Professional development</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="text-slate-300">Burnout drift monitoring</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="text-slate-300">Support when needed</span>
                  </div>
                </div>
              </div>

              {/* The OS Benefit */}
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 flex flex-col justify-between">
                <div>
                  <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">The Result</p>
                  <p className="mt-1 text-sm font-medium text-slate-100">You focus on interpretation.</p>
                  <p className="mt-1 text-sm text-slate-300">We handle everything else.</p>
                </div>
                <div className="mt-4 rounded-xl bg-slate-950/80 px-3 py-3">
                  <p className="text-[0.75rem] text-slate-300">
                    <span className="text-teal-300 font-medium">Less cognitive load.</span> More presence. Better outcomes for everyone you serve.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
