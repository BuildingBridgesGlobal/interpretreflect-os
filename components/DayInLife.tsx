import React from "react";

type DayInLifeProps = {
  title?: string;
  subhead?: string;
};

type TimelineItem = {
  time: string;
  label: string;
  context: string;
  osAction: string;
  tag: string;
};

const timeline: TimelineItem[] = [
  {
    time: "7:45 AM",
    label: "Pre-assignment centering",
    context: "You’re heading into a double medical block with a mix of outpatient and inpatient encounters.",
    osAction: "OS surfaces a 90-second body scan and one question: 'What am I assuming about today's work?' It then logs your baseline.",
    tag: "Pre-load check",
  },
  {
    time: "10:30 AM",
    label: "Mid-morning pivot",
    context: "First appointment runs long. Second is a tough family conference with high emotional intensity.",
    osAction: "Based on your schedule and recent drift data, the OS recommends a 2-minute reset instead of jumping straight into email or scrolling.",
    tag: "Micro-intervention",
  },
  {
    time: "2:15 PM",
    label: "Between assignments",
    context: "You're switching domains, from medical to a remote K-12 IEP meeting.",
    osAction: "The OS flags the domain switch and offers a quick cognitive transition: what needs to shift in language, power dynamics, and pace.",
    tag: "Domain shift",
  },
  {
    time: "6:40 PM",
    label: "Evening debrief",
    context: "You’re home, tired, and tempted to push the day away without looking at what it cost you.",
    osAction: "The OS gives you three guided prompts based on the day’s highest-load assignment and auto-saves reflections as CEU-ready evidence.",
    tag: "Guided debrief",
  },
  {
    time: "Weekend",
    label: "Pattern review",
    context: "You’re not in crisis, but the last few weeks feel heavier than usual.",
    osAction: "The OS shows drift across weeks, hotspots by domain, and suggests a tiny experiment: one type of assignment to reduce, one support to add.",
    tag: "Burnout drift view",
  },
];

export const DayInLife: React.FC<DayInLifeProps> = ({
  title = "A Day in the Life with an Interpreter OS",
  subhead = "Same schedule. Same demands. The difference is that your emotional and cognitive load is finally visible, supported, and adjustable.",
}) => {
  return (
    <section id="day-in-life" className="border-t border-slate-900/80 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950/95">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.16em] text-violet-300/80">How it actually feels in your day</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold text-slate-50 tracking-tight">{title}</h2>
          <p className="mt-3 text-base md:text-lg text-slate-300">{subhead}</p>
        </div>
        <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="relative">
            <div className="absolute left-3 md:left-4 top-1 bottom-1 w-px bg-gradient-to-b from-teal-400/60 via-slate-700 to-slate-900" />
            <div className="space-y-6">
              {timeline.map((item, index) => (
                <div key={item.time} className="relative pl-10 md:pl-12">
                  <div className="absolute left-0 md:left-1 top-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-teal-400/80 bg-slate-950">
                      <span className="h-2.5 w-2.5 rounded-full bg-teal-400" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 md:px-5 md:py-4 shadow-[0_14px_40px_rgba(15,23,42,0.85)]">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-xs font-medium text-teal-300">{item.time}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/90 px-2 py-0.5 text-[0.65rem] text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                        {item.tag}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-50">{item.label}</p>
                    <p className="mt-1 text-[0.8rem] text-slate-300">{item.context}</p>
                    <div className="mt-2 rounded-xl bg-slate-950/90 px-3 py-2">
                      <p className="text-[0.75rem] text-slate-400"><span className="font-semibold text-teal-300">OS response:</span> {item.osAction}</p>
                    </div>
                  </div>
                  {index === timeline.length - 1 && <div className="h-2" aria-hidden="true" />}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-[0.75rem] uppercase tracking-[0.16em] text-slate-400">Today · OS snapshot</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-950/90 p-3 border border-slate-800/80">
                  <p className="text-xs text-slate-400">Assignments</p>
                  <p className="mt-1 text-lg font-semibold text-slate-50">4</p>
                  <p className="text-[0.7rem] text-slate-400">2 medical · 1 education · 1 VRI</p>
                </div>
                <div className="rounded-xl bg-slate-950/90 p-3 border border-slate-800/80">
                  <p className="text-xs text-slate-400">Emotional intensity</p>
                  <p className="mt-1 text-lg font-semibold text-amber-300">High</p>
                  <p className="text-[0.7rem] text-slate-400">Family conference flagged as peak.</p>
                </div>
                <div className="rounded-xl bg-slate-950/90 p-3 border border-slate-800/80">
                  <p className="text-xs text-slate-400">Recovery window</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-300">45 min</p>
                  <p className="text-[0.7rem] text-slate-400">Spread across 3 micro-practices.</p>
                </div>
                <div className="rounded-xl bg-slate-950/90 p-3 border border-slate-800/80">
                  <p className="text-xs text-slate-400">Burnout drift today</p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">Stable</p>
                  <p className="text-[0.7rem] text-slate-400">No acute red flags, but trend still watched.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-[0.75rem] uppercase tracking-[0.16em] text-slate-400">What changes for you</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-400" /><span>You stop relying on memory and “pushing through” to track what this work is doing to you.</span></li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400" /><span>You get small, well-timed supports instead of another overwhelming self-care list.</span></li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" /><span>You can see patterns across weeks and advocate for changes with data, not just feelings.</span></li>
              </ul>
            </div>
            <p className="text-[0.7rem] text-slate-500">The point is not to gamify your stress. It's to give you a reliable operating system that respects the complexity of your work and helps you stay in it longer, with less cost.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
