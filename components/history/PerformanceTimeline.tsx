"use client";

import { useState } from "react";

type Timeframe = "7d" | "30d" | "90d" | "6m" | "all";

type Milestone = {
  date: string;
  label: string;
  type: "first" | "achievement" | "breakthrough";
  description?: string;
};

type PerformanceTimelineProps = {
  userId: string;
  insights: any;
};

const mockPerformanceData = {
  "7d": [
    { day: "Mon", score: 82 },
    { day: "Tue", score: 84 },
    { day: "Wed", score: 83 },
    { day: "Thu", score: 86 },
    { day: "Fri", score: 88 },
    { day: "Sat", score: 87 },
    { day: "Sun", score: 89 }
  ],
  "30d": [
    { day: "Week 1", score: 78 },
    { day: "Week 2", score: 81 },
    { day: "Week 3", score: 84 },
    { day: "Week 4", score: 87 }
  ],
  "90d": [
    { day: "Month 1", score: 72 },
    { day: "Month 2", score: 78 },
    { day: "Month 3", score: 85 }
  ],
  "6m": [
    { day: "Jun", score: 65 },
    { day: "Jul", score: 68 },
    { day: "Aug", score: 72 },
    { day: "Sep", score: 76 },
    { day: "Oct", score: 81 },
    { day: "Nov", score: 87 }
  ],
  "all": [
    { day: "Jan", score: 52 },
    { day: "Feb", score: 56 },
    { day: "Mar", score: 60 },
    { day: "Apr", score: 62 },
    { day: "May", score: 64 },
    { day: "Jun", score: 65 },
    { day: "Jul", score: 68 },
    { day: "Aug", score: 72 },
    { day: "Sep", score: 76 },
    { day: "Oct", score: 81 },
    { day: "Nov", score: 87 }
  ]
};

export default function PerformanceTimeline({ userId, insights }: PerformanceTimelineProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("all");

  // Use real milestones from insights or fall back to empty array
  const milestones: Milestone[] = insights?.recentActivity?.milestones || [];

  const data = mockPerformanceData[selectedTimeframe];
  const maxScore = Math.max(...data.map(d => d.score));
  const minScore = Math.min(...data.map(d => d.score));
  const latestScore = data[data.length - 1].score;
  const firstScore = data[0].score;
  const improvement = latestScore - firstScore;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 mb-1">Performance Trajectory</h2>
          <p className="text-sm text-slate-400">Your professional growth over time</p>
        </div>
        <div className="text-right">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-teal-400">{latestScore}%</span>
            {improvement > 0 && (
              <span className="text-sm text-teal-400">+{improvement}%</span>
            )}
          </div>
          <p className="text-xs text-slate-500">Current Performance</p>
        </div>
      </div>

      {/* Timeframe Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "7d", label: "7 Days" },
          { key: "30d", label: "30 Days" },
          { key: "90d", label: "90 Days" },
          { key: "6m", label: "6 Months" },
          { key: "all", label: "All Time" }
        ].map((timeframe) => (
          <button
            key={timeframe.key}
            onClick={() => setSelectedTimeframe(timeframe.key as Timeframe)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedTimeframe === timeframe.key
                ? "bg-teal-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {timeframe.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="mb-6">
        <div className="h-64 flex items-end justify-between gap-3">
          {data.map((point, idx) => {
            const heightPercent = ((point.score - minScore) / (maxScore - minScore)) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div className="w-full relative" style={{ height: "100%" }}>
                  {/* Bar */}
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-teal-500 to-teal-400 transition-all hover:from-teal-400 hover:to-teal-300 cursor-pointer"
                    style={{ height: `${heightPercent}%`, position: "absolute", bottom: 0 }}
                    title={`${point.day}: ${point.score}%`}
                  />
                </div>
                {/* Labels */}
                <p className="text-xs text-slate-400 mt-2">{point.day}</p>
                <p className="text-xs font-medium text-slate-300">{point.score}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestones */}
      <div className="border-t border-slate-800 pt-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Key Milestones</h3>
        <div className="space-y-3">
          {milestones.map((milestone, idx) => {
            const typeConfig = {
              first: { icon: "🎯", color: "text-blue-400", bgColor: "bg-blue-500/10" },
              achievement: { icon: "🏆", color: "text-amber-400", bgColor: "bg-amber-500/10" },
              breakthrough: { icon: "⚡", color: "text-teal-400", bgColor: "bg-teal-500/10" }
            };
            const config = typeConfig[milestone.type];

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg border border-slate-800 ${config.bgColor}`}
              >
                <span className="text-2xl">{config.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${config.color}`}>{milestone.label}</p>
                  <p className="text-xs text-slate-500">{new Date(milestone.date).toLocaleDateString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
