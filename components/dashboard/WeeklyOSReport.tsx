"use client";

import { useState } from "react";

type WeeklyReportProps = {
  userData: any;
};

type WeeklyReport = {
  weekEnding: string;
  assignments: {
    total: number;
    byDomain: { domain: string; count: number }[];
  };
  skills: {
    developed: string[];
    needsWork: string[];
  };
  drift: {
    level: "stable" | "slight" | "moderate" | "high";
    trend: "improving" | "stable" | "worsening";
    signals: string[];
  };
  ceuHours: number;
  insights: string[];
};

export default function WeeklyOSReport({ userData }: WeeklyReportProps) {
  const [showReport, setShowReport] = useState(false);

  // Mock weekly report - will be generated from database
  const weeklyReport: WeeklyReport = {
    weekEnding: "2025-01-21",
    assignments: {
      total: 11,
      byDomain: [
        { domain: "Medical", count: 5 },
        { domain: "Education", count: 3 },
        { domain: "Legal", count: 2 },
        { domain: "VRI", count: 1 }
      ]
    },
    skills: {
      developed: ["Medical terminology (Cardiology)", "Boundary-setting in family conferences", "Team handoff coordination"],
      needsWork: ["Legal vocabulary retention", "Managing multi-party VRI dynamics"]
    },
    drift: {
      level: "slight",
      trend: "stable",
      signals: [
        "Recovery time between assignments has decreased 15%",
        "Emotional intensity averaging 7.2/10 (up from 6.8)",
        "Sleep quality reported as 'poor' 3 times this week"
      ]
    },
    ceuHours: 4.5,
    insights: [
      "Your medical interpreting confidence has increased 22% over the past month, particularly in cardiology settings.",
      "Pattern detected: Wednesday double-blocks consistently spike your load. Consider requesting recovery time on Thursdays.",
      "You're establishing stronger boundaries in education settings - 3 successful role clarifications this week."
    ]
  };

  const getDriftColor = (level: string) => {
    switch (level) {
      case "stable":
        return { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-300" };
      case "slight":
        return { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-300" };
      case "moderate":
        return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-300" };
      case "high":
        return { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-300" };
      default:
        return { bg: "bg-slate-500/10", border: "border-slate-500/30", text: "text-slate-300" };
    }
  };

  const driftColors = getDriftColor(weeklyReport.drift.level);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-50">Weekly OS Report</h2>
          <p className="text-sm text-slate-400 mt-1">Week ending {new Date(weeklyReport.weekEnding).toLocaleDateString()}</p>
        </div>
        <button
          onClick={() => setShowReport(!showReport)}
          className="px-4 py-2 rounded-lg bg-violet-500/20 text-violet-300 text-sm font-medium border border-violet-500/30 hover:bg-violet-500/30 transition-colors"
        >
          {showReport ? "Hide Report" : "View This Week"}
        </button>
      </div>

      {showReport && (
        <div className="space-y-4 mt-6">
          {/* Assignments Summary */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <h3 className="text-base font-semibold text-slate-200 mb-3">Assignments ({weeklyReport.assignments.total})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {weeklyReport.assignments.byDomain.map((item) => (
                <div key={item.domain} className="text-center p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <p className="text-2xl font-bold text-teal-400">{item.count}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.domain}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Development */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <h3 className="text-base font-semibold text-slate-200 mb-3">Skills Development</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-emerald-400 uppercase tracking-wide mb-2">Developed This Week</p>
                <ul className="space-y-1.5">
                  {weeklyReport.skills.developed.map((skill, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <span>{skill}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-amber-400 uppercase tracking-wide mb-2">Focus Areas</p>
                <ul className="space-y-1.5">
                  {weeklyReport.skills.needsWork.map((skill, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <span>{skill}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Burnout Drift */}
          <div className={`rounded-xl border ${driftColors.border} ${driftColors.bg} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-slate-200">Burnout Drift</h3>
              <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${driftColors.border} ${driftColors.text}`}>
                {weeklyReport.drift.level} - {weeklyReport.drift.trend}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Signals detected:</p>
              <ul className="space-y-1.5">
                {weeklyReport.drift.signals.map((signal, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className={`h-1.5 w-1.5 rounded-full ${driftColors.text.replace('text-', 'bg-')} mt-1.5 flex-shrink-0`} />
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CEU Hours */}
          <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-teal-400 uppercase tracking-wide">CEU Hours This Week</p>
                <p className="text-3xl font-bold text-teal-300 mt-1">{weeklyReport.ceuHours}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-300">All reflections are</p>
                <p className="text-sm font-semibold text-teal-300">CEU-ready</p>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
            <h3 className="text-base font-semibold text-violet-200 mb-3">Elya's Insights</h3>
            <ul className="space-y-3">
              {weeklyReport.insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-violet-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-violet-300">{idx + 1}</span>
                  </div>
                  <p className="text-sm text-slate-300 flex-1">{insight}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Email Report */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-200">Email me this report</p>
              <p className="text-xs text-slate-400 mt-0.5">Get your Weekly OS Report every Sunday</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-teal-500/20 text-teal-300 text-sm font-medium border border-teal-500/30 hover:bg-teal-500/30 transition-colors">
              Send Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
