"use client";

export default function PatternAnalysis() {
  const recurringStrengths = [
    {
      skill: "Rapport Building in Community Health",
      frequency: 12,
      evidence: "Consistently flagged as strength across 12 community health assignments. Clients report high satisfaction with interpersonal connection.",
      recentExample: "Nov 22 - Mental Health Crisis: 'Built trust rapidly with client in acute distress'"
    },
    {
      skill: "Medical Terminology Accuracy",
      frequency: 18,
      evidence: "98% average accuracy across all medical assignments. Oncology and cardiology terminology particularly strong.",
      recentExample: "Nov 20 - Oncology Consult: 'Flawless technical precision with compassionate delivery'"
    }
  ];

  const recurringChallenges = [
    {
      challenge: "Decision Fatigue in Extended Assignments",
      frequency: 7,
      pattern: "Performance dips after 2+ hours in high-intensity settings. Most common in ER and court testimony.",
      recommendation: "Build stamina through timed scenario practices. Consider prep protocols for long assignments.",
      trend: "improving"
    },
    {
      challenge: "Cognitive Load in Rapid-Fire VRS",
      frequency: 5,
      pattern: "Back-to-back VRS calls show 15% processing slowdown compared to in-person. Recovery time needed between calls.",
      recommendation: "Practice rapid context switching. Schedule buffer time between VRS blocks when possible.",
      trend: "stable"
    }
  ];

  const breakthroughs = [
    {
      date: "2025-11-22",
      skill: "Educational Terminology",
      before: "Conscious effort required, slowed processing",
      after: "Automatic recall, cognitive resources freed for message crafting",
      trigger: "Completed IEP terminology drill series + 3 consecutive educational assignments"
    },
    {
      date: "2025-09-10",
      skill: "Cognitive Load Management",
      before: "62% performance in high-stress settings",
      after: "78% performance - 16 point jump",
      trigger: "Breakthrough in stress regulation + medical simulation training completion"
    }
  ];

  const assignmentTypeAnalysis = [
    { type: "Medical", avgScore: 91, debriefs: 22, trend: "up", status: "Crushing it" },
    { type: "Legal", avgScore: 82, debriefs: 15, trend: "up", status: "Strong performance" },
    { type: "Educational", avgScore: 88, debriefs: 8, trend: "up", status: "Recent breakthrough" },
    { type: "VRS", avgScore: 74, debriefs: 12, trend: "stable", status: "Development area" },
    { type: "Community", avgScore: 95, debriefs: 10, trend: "stable", status: "Natural strength" }
  ];

  return (
    <div className="space-y-6">
      {/* Recurring Strengths */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Recurring Strengths</h2>
        <p className="text-sm text-slate-400 mb-6">Skills that consistently show up strong across multiple assignments</p>
        <div className="space-y-4">
          {recurringStrengths.map((strength, idx) => (
            <div key={idx} className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-teal-400">{strength.skill}</h3>
                <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-400 text-xs font-medium">
                  {strength.frequency} instances
                </span>
              </div>
              <p className="text-sm text-slate-300 mb-2">{strength.evidence}</p>
              <div className="border-l-2 border-teal-500 pl-3 mt-3">
                <p className="text-xs text-slate-400">Recent Example:</p>
                <p className="text-sm text-slate-300">{strength.recentExample}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recurring Challenges */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Recurring Challenges</h2>
        <p className="text-sm text-slate-400 mb-6">Patterns that keep appearing—actionable intelligence for growth</p>
        <div className="space-y-4">
          {recurringChallenges.map((challenge, idx) => (
            <div key={idx} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-amber-400">{challenge.challenge}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-medium">
                    {challenge.frequency} occurrences
                  </span>
                  {challenge.trend === "improving" ? (
                    <span className="text-teal-400 text-xs">↗ Improving</span>
                  ) : (
                    <span className="text-slate-400 text-xs">→ Stable</span>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-300 mb-3">{challenge.pattern}</p>
              <div className="border-l-2 border-amber-500 pl-3">
                <p className="text-xs text-amber-400 font-medium mb-1">Elya Recommendation:</p>
                <p className="text-sm text-slate-300">{challenge.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Breakthrough Moments */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Breakthrough Moments</h2>
        <p className="text-sm text-slate-400 mb-6">Instances where something shifted—what changed and how to replicate it</p>
        <div className="space-y-4">
          {breakthroughs.map((breakthrough, idx) => (
            <div key={idx} className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-purple-400 mb-1">{breakthrough.skill}</h3>
                  <p className="text-xs text-slate-500">{new Date(breakthrough.date).toLocaleDateString()}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-xs font-medium">
                  Breakthrough
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="rounded-lg bg-slate-800/50 p-3">
                  <p className="text-xs text-slate-500 mb-1">Before</p>
                  <p className="text-sm text-slate-300">{breakthrough.before}</p>
                </div>
                <div className="rounded-lg bg-purple-500/10 p-3">
                  <p className="text-xs text-purple-400 mb-1">After</p>
                  <p className="text-sm text-slate-200">{breakthrough.after}</p>
                </div>
              </div>

              <div className="border-l-2 border-purple-500 pl-3">
                <p className="text-xs text-purple-400 font-medium mb-1">What Triggered It:</p>
                <p className="text-sm text-slate-300">{breakthrough.trigger}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assignment Type Analysis */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Performance by Assignment Type</h2>
        <p className="text-sm text-slate-400 mb-6">Where you thrive and where you need targeted development</p>
        <div className="space-y-3">
          {assignmentTypeAnalysis.map((analysis, idx) => (
            <div key={idx} className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-slate-200">{analysis.type}</h3>
                  <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-400 text-xs">
                    {analysis.debriefs} debriefs
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {analysis.trend === "up" ? (
                    <span className="text-teal-400 text-xs">↗ Trending up</span>
                  ) : (
                    <span className="text-slate-400 text-xs">→ Stable</span>
                  )}
                  <span className="text-xl font-bold text-teal-400">{analysis.avgScore}%</span>
                </div>
              </div>

              <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${
                    analysis.avgScore >= 90 ? "bg-teal-400" :
                    analysis.avgScore >= 80 ? "bg-blue-400" :
                    "bg-amber-400"
                  }`}
                  style={{ width: `${analysis.avgScore}%` }}
                />
              </div>

              <p className="text-xs text-slate-400 italic">{analysis.status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison View */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Growth Comparison</h2>
        <p className="text-sm text-slate-400 mb-6">Concrete evidence of your development over time</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-xs text-slate-500 mb-1">30 Days Ago</p>
            <p className="text-2xl font-bold text-slate-300 mb-1">78%</p>
            <p className="text-xs text-slate-400">Average Performance</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-xs text-slate-500 mb-1">60 Days Ago</p>
            <p className="text-2xl font-bold text-slate-300 mb-1">72%</p>
            <p className="text-xs text-slate-400">Average Performance</p>
          </div>
          <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4">
            <p className="text-xs text-teal-400 mb-1">Current</p>
            <p className="text-2xl font-bold text-teal-400 mb-1">87%</p>
            <p className="text-xs text-slate-400">Average Performance</p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg border border-teal-500/30 bg-teal-500/5">
          <p className="text-sm font-medium text-teal-400 mb-2">What Drove This Growth:</p>
          <ul className="space-y-1 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-teal-400">•</span>
              Cognitive load management jumped from 62% → 78% (breakthrough in stress regulation)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-400">•</span>
              Educational terminology became automatic (completed IEP drill series)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-400">•</span>
              Medical accuracy improved through specialized oncology/cardiology training
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
