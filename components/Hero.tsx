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
  subhead = "Meet Elya, your AI companion for prep, debriefs, and reflection. Earn RID-approved CEUs with interactive workshops. Track wellness, build skills, prevent burnout—all in one place.",
  primary = { label: "Get Started Free", href: "/start" },
  secondary = { label: "See How It Works", href: "#interpreter-os" },
  microcopy = "Basic plan is free forever. No credit card required.",
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-slate-50 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">{headline}</h1>

            <h2 className="text-slate-300 text-xl md:text-2xl font-medium">{slogan}</h2>

            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl">{subhead}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={pHref}
              className="inline-flex items-center justify-center rounded-lg bg-teal-400 text-slate-950 px-8 py-4 text-base font-semibold shadow-lg shadow-teal-400/30 hover:bg-teal-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 transition"
            >
              {primary.label}
            </a>
            <a
              href={sHref}
              className="inline-flex items-center justify-center rounded-lg border-2 border-slate-600 text-slate-200 px-8 py-4 text-base font-semibold hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 transition"
            >
              {secondary.label}
            </a>
          </div>

          <div className="space-y-3">
            <p className="text-slate-500 text-sm">{microcopy}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
              <div className="inline-flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400" />
                <span>Elya AI Companion</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400" />
                <span>CEU Workshops</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>RID Compliance Tracking</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)] opacity-80 blur-3xl" />

            <div className="grid gap-4 grid-cols-2">
              {/* Elya AI */}
              <div className="rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/5 to-transparent p-5">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-1">AI Companion</p>
                  <p className="text-base font-semibold text-slate-100">Elya</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-1 w-1 rounded-full bg-teal-400 flex-shrink-0" />
                    <span>Assignment prep</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-1 w-1 rounded-full bg-teal-400 flex-shrink-0" />
                    <span>Debrief sessions</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-1 w-1 rounded-full bg-teal-400 flex-shrink-0" />
                    <span>Free-write journaling</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-1 w-1 rounded-full bg-teal-400 flex-shrink-0" />
                    <span>Process emotions</span>
                  </div>
                </div>
              </div>

              {/* CEU Workshops */}
              <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-transparent p-5">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1">Pro Feature</p>
                  </div>
                  <p className="text-base font-semibold text-slate-100">CEU Workshops</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-1 w-1 rounded-full bg-violet-400 flex-shrink-0" />
                    <span>RID-approved content</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-1 w-1 rounded-full bg-violet-400 flex-shrink-0" />
                    <span>Interactive modules</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-1 w-1 rounded-full bg-violet-400 flex-shrink-0" />
                    <span>Certificates on completion</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-1 w-1 rounded-full bg-violet-400 flex-shrink-0" />
                    <span>0.2 CEUs/month</span>
                  </div>
                </div>
              </div>

              {/* Wellness & Skills */}
              <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent p-5">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">Always On</p>
                  <p className="text-base font-semibold text-slate-100">Wellness & Skills</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-1 w-1 rounded-full bg-amber-400 flex-shrink-0" />
                    <span>Wellness check-ins</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-1 w-1 rounded-full bg-amber-400 flex-shrink-0" />
                    <span>Burnout drift tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-1 w-1 rounded-full bg-amber-400 flex-shrink-0" />
                    <span>Skill development drills</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-1 w-1 rounded-full bg-amber-400 flex-shrink-0" />
                    <span>RID compliance tracking</span>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="rounded-xl border border-slate-600/50 bg-gradient-to-br from-slate-700/20 to-transparent p-5 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Simple Pricing</p>
                  <p className="text-base font-semibold text-slate-100 mb-2">Basic: Free Forever</p>
                  <p className="text-xs text-slate-400">Pro: $30/mo for CEU workshops</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-teal-300 font-semibold">Start free.</span> Upgrade when ready.
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
