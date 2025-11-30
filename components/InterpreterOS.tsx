import React from "react";

type InterpreterOSProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
};

const lifecyclePhases = [
  {
    phase: "Before",
    label: "Assignment Prep",
    items: [
      "Research participants and context",
      "Build domain mental models",
      "Generate vocabulary by field",
      "Coordinate with team interpreters",
    ],
    color: "teal",
  },
  {
    phase: "During",
    label: "In the Field",
    items: [
      "Quick reference materials",
      "Team handoff coordination",
      "Real-time support access",
      "Assignment notes capture",
    ],
    color: "violet",
  },
  {
    phase: "After",
    label: "Growth & Reflection",
    items: [
      "Structured debriefs",
      "Pattern recognition across assignments",
      "CEU-ready evidence",
      "Skill development tracking",
    ],
    color: "amber",
  },
  {
    phase: "Always",
    label: "Career Infrastructure",
    items: [
      "Portable credential vault",
      "Professional development path",
      "Burnout drift monitoring",
      "Support when you need it",
    ],
    color: "emerald",
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  teal: { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-300", dot: "bg-teal-400" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-300", dot: "bg-violet-400" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-300", dot: "bg-amber-400" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-300", dot: "bg-emerald-400" },
};

export const InterpreterOS: React.FC<InterpreterOSProps> = ({
  eyebrow = "The Interpreter Operating System",
  title = "Everything you need to do your best work.",
  subtitle = "One system that handles the cognitive load of your career so you can focus on what matters: the work itself.",
}) => {
  return (
    <section id="interpreter-os" className="border-t border-slate-900/80 bg-gradient-to-b from-slate-950 via-slate-900/20 to-slate-950">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-16 md:py-20">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-teal-300/80">{eyebrow}</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold text-slate-50 tracking-tight">{title}</h2>
          <p className="mt-3 text-lg md:text-xl text-slate-300">{subtitle}</p>
        </div>

        {/* Lifecycle Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {lifecyclePhases.map((phase) => {
            const colors = colorClasses[phase.color];
            return (
              <div
                key={phase.phase}
                className={`rounded-2xl border ${colors.border} ${colors.bg} p-5 transition hover:scale-[1.02]`}
              >
                <div className="mb-4">
                  <p className={`text-sm uppercase tracking-wide ${colors.text}`}>{phase.phase}</p>
                  <p className="text-base font-medium text-slate-100">{phase.label}</p>
                </div>
                <ul className="space-y-2">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${colors.dot} flex-shrink-0`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* The Analogy */}
        <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Think of it like this</p>
              <h3 className="mt-2 text-2xl md:text-3xl font-semibold text-slate-50">
                Microsoft Copilot for frontline employees.
              </h3>
              <p className="mt-3 text-base text-slate-300">
                Copilot doesn't replace workers or compete with employers. It removes friction so people can focus on their actual job.
              </p>
              <p className="mt-3 text-base text-slate-300">
                <span className="text-slate-100 font-medium">InterpretReflect does the same for interpreters.</span> We handle the cognitive overhead of preparation, coordination, credentials, and professional growth so you can focus entirely on the interpretation itself.
              </p>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-950/60 border border-slate-800/50 p-4">
                <p className="text-sm text-slate-400 uppercase tracking-wide">Without an OS</p>
                <p className="mt-2 text-base text-slate-300">
                  Prep scattered across notes, emails, and your head. Credentials re-uploaded to every platform. Growth tracked nowhere. Burnout invisible until it's too late.
                </p>
              </div>
              <div className="rounded-xl bg-teal-500/10 border border-teal-500/30 p-4">
                <p className="text-sm text-teal-300 uppercase tracking-wide">With InterpretReflect</p>
                <p className="mt-2 text-base text-slate-200">
                  One system that knows your history, prepares you for assignments, tracks your growth, and catches drift before it becomes burnout. You just show up and do great work.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Partnership Note */}
        <div className="mt-8 text-center">
          <p className="text-base text-slate-400">
            We work <span className="text-slate-200 font-medium">alongside</span> your agencies and employers, not against them.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Better-prepared interpreters benefit everyone: you, your team, and the people you serve.
          </p>
        </div>
      </div>
    </section>
  );
};
