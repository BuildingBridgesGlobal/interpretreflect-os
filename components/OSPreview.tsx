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
        <h2 className="text-4xl md:text-5xl font-semibold text-slate-50 tracking-tight">{title}</h2>
        <p className="mt-3 text-slate-300 text-lg md:text-xl">{subhead}</p>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Performance & Load</p>
              <p className="mt-1 text-sm text-slate-200">Weekly rhythm overview</p>
            </div>
            <div className="text-right text-[0.7rem] text-slate-400 flex-shrink-0">
              <p>Assignments: <span className="text-slate-200">11</span></p>
              <p>High-intensity: <span className="text-amber-300">4</span></p>
            </div>
          </div>
          <div className="mt-4 h-28 rounded-xl bg-slate-950/90 px-3 py-2 relative flex items-end gap-1.5">
            <div className="absolute inset-x-3 top-[25%] bottom-[35%] bg-teal-500/5 border-y border-teal-500/20 rounded" />
            {[40, 55, 80, 70, 65, 50, 30].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-1 relative z-10" style={{ minWidth: '12px' }}>
                <div
                  className="w-full rounded-full min-h-[8px]"
                  style={{
                    height: `${h}%`,
                    backgroundColor: h > 75 ? '#f59e0b' : '#14b8a6',
                    minHeight: '8px'
                  }}
                />
                <span className="text-[0.6rem] text-center text-slate-500">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 rounded-full bg-teal-400" />
              <p className="text-[0.7rem] text-slate-400">Target load: <span className="text-teal-300">65–75%</span></p>
            </div>
            <div className="rounded-lg bg-slate-950/70 border border-slate-800/70 px-3 py-2">
              <p className="text-[0.7rem] text-slate-300"><span className="text-amber-300">Wed spike:</span> Double medical block pushed you to 80%</p>
              <p className="text-[0.65rem] text-slate-400 mt-0.5">Consider adding recovery time after back-to-back high-stakes assignments</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Domains</p>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[0.65rem] text-slate-300">Top 3 this month</span>
          </div>
          <div className="mt-4 space-y-3">
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
              <div key={domain.label} className="rounded-xl bg-slate-950/70 p-3 border border-slate-800/70">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-100">{domain.label}</p>
                    <p className="mt-0.5 text-[0.7rem] text-slate-300">{domain.load}</p>
                    <p className="text-[0.7rem] text-slate-400">{domain.intensity}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] flex-shrink-0 ${domain.badgeColor}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {domain.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[0.7rem] text-slate-400">High emotional intensity domains are automatically flagged for additional support.</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Burnout Drift</p>
            <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.65rem] text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Slight upward trend
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-slate-950/90 px-3 py-3">
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
          <div className="mt-4 rounded-xl bg-violet-500/10 border border-violet-500/30 p-3">
            <p className="text-[0.7rem] font-medium text-violet-200">OS Suggestion</p>
            <p className="mt-1 text-[0.7rem] text-slate-300">Add one 5-minute decompression ritual after high-stakes medical assignments this week.</p>
            <p className="mt-1 text-[0.65rem] text-slate-400">Auto-scheduled to Support Stack</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.7rem] uppercase tracking-wide text-amber-300">Today's Support Stack</p>
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
          <div className="mt-5 space-y-3">
            {[
              { skill: "Language precision", level: 85, color: "teal" },
              { skill: "Cognitive load management", level: 70, color: "violet" },
              { skill: "Relational boundaries", level: 90, color: "emerald" },
              { skill: "Ethical decision-making", level: 75, color: "amber" },
            ].map((item) => (
              <div key={item.skill}>
                <div className="flex items-center justify-between text-[0.7rem] mb-1">
                  <span className="text-slate-300">{item.skill}</span>
                  <span className="text-slate-400">{item.level}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-950/80">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r from-${item.color}-600 to-${item.color}-400`}
                    style={{ width: `${item.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-300">Growth Timeline</p>
          <p className="mt-1 text-sm text-slate-300">Make improvement visible week by week, not just "I hope I'm better."</p>
          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-3 rounded-xl bg-slate-950/70 p-3 border border-slate-800/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <div className="text-[0.7rem]">
                <p className="text-slate-200 font-medium">Week 4: Medical vocabulary retention up 22%</p>
                <p className="text-slate-400 mt-0.5">Cardiology terms, oncology concepts</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-slate-950/70 p-3 border border-slate-800/70">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
              <div className="text-[0.7rem]">
                <p className="text-slate-200 font-medium">Week 2: Boundary-setting in family conferences</p>
                <p className="text-slate-400 mt-0.5">More consistent role clarification</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
