import React from "react";

type PrepWorkflowProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
};

const workflowSteps = [
  {
    time: "0:00",
    duration: "2 min",
    action: "Pull in assignment details",
    detail: "Import from your calendar, agency platform, or enter manually. The OS captures the basics: date, time, setting, participants. If you've worked with them before, previous interactions are surfaced automatically.",
    tag: "Import",
    color: "teal",
  },
  {
    time: "0:02",
    duration: "5 min",
    action: "Research the participants",
    detail: "AI surfaces relevant background on who you'll be working with: their work, their philosophy, their context. You understand WHO before you arrive.",
    tag: "Who",
    color: "violet",
  },
  {
    time: "0:07",
    duration: "8 min",
    action: "Build the mental model",
    detail: "Understand HOW the field actually works. Not just vocabulary, but the pipeline, the stakes, the power dynamics, the concepts that matter.",
    tag: "What",
    color: "amber",
  },
  {
    time: "0:15",
    duration: "5 min",
    action: "Generate domain vocabulary",
    detail: "Terms organized by concept, not alphabetically. Context for each term. The language you'll actually encounter, ready to reference.",
    tag: "Vocab",
    color: "emerald",
  },
  {
    time: "0:20",
    duration: "5 min",
    action: "Anticipate likely topics",
    detail: "Based on the setting, the participants, the field, what will probably come up? What should you be ready for?",
    tag: "Anticipate",
    color: "sky",
  },
  {
    time: "0:25",
    duration: "3 min",
    action: "Coordinate with your team",
    detail: "Share prep with your co-interpreter. Align on strategy, handoffs, and concerns before you're in the room together.",
    tag: "Team",
    color: "pink",
  },
  {
    time: "0:28",
    duration: "2 min",
    action: "Save and access anywhere",
    detail: "Everything tied to the assignment. Findable on any device. Ready for reflection after. Your prep becomes part of your professional record.",
    tag: "Save",
    color: "slate",
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  teal: { bg: "bg-teal-500/10", text: "text-teal-300", border: "border-teal-500/30", dot: "bg-teal-400" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-300", border: "border-violet-500/30", dot: "bg-violet-400" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/30", dot: "bg-amber-400" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  sky: { bg: "bg-sky-500/10", text: "text-sky-300", border: "border-sky-500/30", dot: "bg-sky-400" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-300", border: "border-pink-500/30", dot: "bg-pink-400" },
  slate: { bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/30", dot: "bg-slate-400" },
};

export const PrepWorkflow: React.FC<PrepWorkflowProps> = ({
  eyebrow = "See it in action",
  title = "30 minutes from assignment to fully prepared.",
  subtitle = "Here's what prep looks like when your OS actually helps.",
}) => {
  return (
    <section id="prep-workflow" className="border-t border-slate-900/80 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950/95">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-teal-300/80">{eyebrow}</p>
          <h2 className="mt-2 text-4xl md:text-5xl font-semibold text-slate-50 tracking-tight">{title}</h2>
          <p className="mt-3 text-lg md:text-xl text-slate-300">{subtitle}</p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-teal-400/60 via-violet-500/40 to-slate-700" />
            <div className="space-y-4">
              {workflowSteps.map((step) => {
                const colors = colorClasses[step.color];
                return (
                  <div key={step.time} className="relative pl-12">
                    <div className="absolute left-0 top-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-950">
                        <span className={`h-3 w-3 rounded-full ${colors.dot}`} />
                      </div>
                    </div>
                    <div className={`rounded-xl border ${colors.border} ${colors.bg} px-4 py-3`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-slate-400">{step.time}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                            {step.tag}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">{step.duration}</span>
                      </div>
                      <p className="mt-2 text-base font-medium text-slate-100">{step.action}</p>
                      <p className="mt-1 text-sm text-slate-400">{step.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pl-12">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-base font-medium text-emerald-300">Total: 30 minutes</span>
                </div>
                <p className="mt-1 text-sm text-slate-300">
                  You're not just ready. You understand the field, the people, and the stakes.
                </p>
              </div>
            </div>
          </div>

          {/* Example Card */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm uppercase tracking-wide text-slate-400">Example: Medical Specialist Consultation</p>
              <div className="mt-3 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-400">Setting</p>
                    <p className="text-base text-slate-200">Cardiology Clinic</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-400">Provider</p>
                    <p className="text-base text-slate-200">Dr. Chen</p>
                    <p className="text-sm text-slate-400">Interventional cardiologist</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-400">Patient</p>
                    <p className="text-base text-slate-200">Follow-up visit</p>
                    <p className="text-sm text-slate-400">Post-catheterization care</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-400">Team interpreter</p>
                    <p className="text-base text-slate-200">Alex</p>
                    <p className="text-sm text-slate-400">Shared medical vocab list</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm uppercase tracking-wide text-slate-400">What the OS helped you understand</p>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <p>• How cardiac catheterization procedures work</p>
                <p>• Post-procedure monitoring and recovery stages</p>
                <p>• Common complications and warning signs</p>
                <p>• Likely topics: medication changes, activity restrictions</p>
                <p>• Power dynamics in specialist consultations</p>
              </div>
            </div>

            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5">
              <p className="text-sm uppercase tracking-wide text-violet-300">After the assignment</p>
              <p className="mt-2 text-base text-slate-200">
                Flip to reflection mode. What worked? What surprised you? What would you do differently?
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Your reflections feed back into the system, making your next prep smarter. Your growth, documented.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
