import React from "react";

type ValueStripProps = {
  eyebrow?: string;
  title?: string;
};

const valueItems = [
  {
    label: "Less cognitive load",
    detail: "Stop carrying everything in your head. The OS handles prep, credentials, reflections, and growth tracking.",
    metric: "1",
    metricHint: "system for your whole career",
  },
  {
    label: "More presence",
    detail: "When you're not worried about what you forgot to prep, you can be fully present for the work itself.",
    metric: "100%",
    metricHint: "focus on interpretation",
  },
  {
    label: "Longer career",
    detail: "Catch drift before burnout. Build skills intentionally. Stay in the profession you love.",
    metric: "+5-10 yrs",
    metricHint: "career longevity target",
  },
];

export const ValueStrip: React.FC<ValueStripProps> = ({
  eyebrow = "Why an operating system for your career?",
  title = "Because exceptional work requires more than just showing up.",
}) => {
  return (
    <section id="value-strip" className="border-t border-slate-900/80 bg-slate-950/60">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-10 md:py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-teal-300/80">{eyebrow}</p>
            <p className="mt-2 text-base md:text-lg text-slate-300">{title}</p>
          </div>
          <p className="max-w-sm text-sm text-slate-500">
            InterpretReflect is a reliable operating system that respects the complexity of your work and helps you stay in it longer with less cost.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {valueItems.map((item) => (
            <div key={item.label} className="group rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.8)] hover:border-teal-400/60 hover:bg-slate-900 transition">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-base font-medium text-slate-50">{item.label}</p>
                <div className="text-right">
                  <p className="text-sm font-semibold text-teal-300">{item.metric}</p>
                  <p className="text-xs text-slate-500">{item.metricHint}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
