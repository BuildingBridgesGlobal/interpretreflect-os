import React from "react";

type OSPreviewProps = {
  title?: string;
  subhead?: string;
};

type SupportItem = {
  label: string;
  detail: string;
  status: "done" | "active" | "queued";
};

export const OSPreview: React.FC<OSPreviewProps> = ({
  title = "Your Interpreter OS: Well-Being + Skills in One View",
  subhead = "Track emotional load and burnout, see your interpreting skills at a glance, and know exactly what to practice next.",
}) => {
  const support: SupportItem[] = [
    { label: "Pre-assignment centering (2 minutes)", detail: "Before your first medical assignment.", status: "done" },
    { label: "Micro-debrief (3 prompts)", detail: "Scheduled after the oncology family meeting.", status: "active" },
    { label: "Evening grounding check-in", detail: "Reflect on what you’re still carrying + what you can release.", status: "active" },
    { label: "Weekend load review", detail: "OS will summarize your week and suggest small adjustments.", status: "queued" },
  ];

  return (
    <section id="os-preview" className="container mx-auto max-w-6xl px-6 md:px-8 py-16 md:py-20 border-t border-slate-900/70">
      <div className="max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-semibold text-slate-50 tracking-tight">{title}</h2>
        <p className="mt-3 text-slate-300 text-base md:text-lg">{subhead}</p>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Performance & Load</p>
              <p className="mt-1 text-sm text-slate-200">Weekly rhythm overview</p>
            </div>
            <div className="text-right text-[0.7rem] text-slate-400">
              <p>Assignments this week: 11</p>
              <p>High-intensity: 4</p>
            </div>
          </div>
          <div className="mt-4 h-28 rounded-xl bg-slate-950/90 px-3 py-2 flex items-end gap-1.5">
            {[40, 55, 80, 70, 65, 50, 30].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-1">
                <div
                  className="w-full rounded-full bg-gradient-to-t from-teal-700 via-teal-400/70 to-teal-300"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[0.6rem] text-center text-slate-500">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[0.7rem] text-slate-400">
            <span>Target load: 65–75%</span>
            <span>OS notes: Thursday spike after double medical block.</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Domains</p>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[0.65rem] text-slate-300">Top 3 this month</span>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              {
                label: "Medical · Inpatient",
                load: "High load",
                intensity: "Emotional + cognitive",
                badge: "Watch",
                badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/40",
              },
              {
                label: "Education · K–12",
                load: "Moderate load",
                intensity: "Social + cognitive",
                badge: "Balanced",
                badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",
              },
              {
                label: "Remote / VRI",
                load: "Variable load",
                intensity: "Cognitive + screen fatigue",
                badge: "Monitor",
                badgeColor: "bg-sky-500/10 text-sky-300 border-sky-500/40",
              },
            ].map((domain) => (
              <div key={domain.label} className="rounded-xl bg-slate-950/70 p-3 border border-slate-800/70 flex flex-col justify-between">
                <p className="text-[0.8rem] font-medium text-slate-100">{domain.label}</p>
                <p className="mt-1 text-[0.7rem] text-slate-300">{domain.load}</p>
                <p className="text-[0.7rem] text-slate-400">{domain.intensity}</p>
                <span className={`mt-2 inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] ${domain.badgeColor}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {domain.badge}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[0.7rem] text-slate-400">Domains with repeated high emotional intensity are automatically flagged for additional support and reflection prompts.</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Burnout Drift · 6-week view</p>
            <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.65rem] text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Slight upward trend
            </div>
          </div>
          <div className="mt-4 h-28 rounded-xl bg-slate-950/90 px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-end gap-1.5 h-20">
                {[15, 18, 20, 26, 31, 35].map((h, i) => (
                  <div key={i} className="flex-1 rounded-full bg-gradient-to-t from-amber-900 via-amber-500/40 to-amber-300/80" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[0.6rem] text-slate-500">
                <span>Week 1</span>
                <span>Week 6</span>
              </div>
            </div>
            <div className="w-px h-20 bg-slate-800/80 mx-3" />
            <div className="w-32 text-[0.7rem] text-slate-300 space-y-1">
              <p className="font-medium text-slate-100">OS Suggestion</p>
              <p>Add one 5-minute decompression ritual after high-stakes medical assignments this week.</p>
              <p className="text-slate-400">Auto-scheduled into your Support Stack.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.7rem] uppercase tracking-wide text-amber-300">Today\'s Support Stack</p>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[0.65rem] text-slate-300">3 active · 1 completed</span>
          </div>
          <div className="space-y-3 text-sm">
            {support.map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-xl bg-slate-950/80 px-3 py-2">
                <div className="mt-1">
                  {item.status === "done" && (
                    <span className="inline-flex h-3 w-3 items-center justify-center rounded-full border border-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                  )}
                  {item.status === "active" && (
                    <span className="inline-flex h-3 w-3 items-center justify-center rounded-full border border-teal-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    </span>
                  )}
                  {item.status === "queued" && (
                    <span className="inline-flex h-3 w-3 items-center justify-center rounded-full border border-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-slate-100">{item.label}</p>
                  <p className="text-[0.7rem] text-slate-400">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-300">Competency Radar</p>
          <p className="mt-1 text-sm text-slate-300">See strengths and gaps across language, cognitive, relational, and ethical skills.</p>
          <div className="mt-4 h-32 rounded-xl bg-slate-950/80" />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-300">Growth Timeline</p>
          <p className="mt-1 text-sm text-slate-300">Make improvement visible week by week, not just \"I hope I\'m better.\"</p>
          <div className="mt-4 h-32 rounded-xl bg-slate-950/80" />
        </div>
      </div>
    </section>
  );
};
