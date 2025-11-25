import React from "react";

type ValueStripProps = {
  eyebrow?: string;
  title?: string;
};

const valueItems = [
  {
    label: "Less invisible load",
    detail: "Turn emotional + cognitive strain into visible, trackable signals.",
    metric: "-22%",
    metricHint: "self-reported overwhelm after 4 weeks*",
  },
  {
    label: "More grounded decisions",
    detail: "See patterns across domains, teams, and time instead of guessing.",
    metric: "3x",
    metricHint: "more reflective check-ins completed vs. generic apps*",
  },
  {
    label: "Protected longevity",
    detail: "Catch burnout drift early and adjust your work, not just your willpower.",
    metric: "+5–10 yrs",
    metricHint: "career longevity target the OS is built to support",
  },
];

export const ValueStrip: React.FC<ValueStripProps> = ({
  eyebrow = "Why an Interpreter OS (and not another wellness app)?",
  title = "Because your work blends ethics, emotion, and performance — and generic tools don’t.",
}) => {
  return (
    <section id="value-strip" className="border-t border-slate-900/80 bg-slate-950/60">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-10 md:py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="text-[0.75rem] font-medium uppercase tracking-[0.16em] text-teal-300/80">{eyebrow}</p>
            <p className="mt-2 text-sm md:text-base text-slate-300">{title}</p>
          </div>
          <p className="max-w-sm text-xs text-slate-500">
            The OS is built around interpreters’ real days: fluctuating demand, high-stakes assignments, and the emotional residue that lingers long after you log out.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {valueItems.map((item) => (
            <div key={item.label} className="group rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.8)] hover:border-teal-400/60 hover:bg-slate-900 transition">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-slate-50">{item.label}</p>
                <div className="text-right">
                  <p className="text-xs font-semibold text-teal-300">{item.metric}</p>
                  <p className="text-[0.65rem] text-slate-500">{item.metricHint}</p>
                </div>
              </div>
              <p className="mt-2 text-[0.8rem] text-slate-300">{item.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[0.65rem] text-slate-500">*Sample metrics shown for illustration. Your OS instance learns from your actual patterns over time.</p>
      </div>
    </section>
  );
};
