"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type WellnessCheckin = {
  id: string;
  feeling: "energized" | "calm" | "okay" | "drained" | "overwhelmed";
  created_at: string;
};

type BurnoutDriftIndicatorProps = {
  checkins: WellnessCheckin[];
  onAddCheckin?: () => void;
};

// Map feelings to numeric scores per spec (lower is better)
const feelingScores: Record<string, number> = {
  energized: 1, // best
  calm: 2,
  okay: 3,
  drained: 4,
  overwhelmed: 5, // worst
};

const feelingLabels: Record<string, string> = {
  energized: "Energized",
  calm: "Calm",
  okay: "Okay",
  drained: "Drained",
  overwhelmed: "Overwhelmed",
};

const feelingEmojis: Record<string, string> = {
  energized: "🟢",
  calm: "🔵",
  okay: "🟡",
  drained: "🟠",
  overwhelmed: "🔴",
};

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-slate-200">{data.label}</p>
        {data.average !== null ? (
          <>
            <p className="text-xs text-teal-400">
              Avg score: {data.average.toFixed(1)}
            </p>
            <p className="text-xs text-slate-400">
              {data.count} check-in{data.count !== 1 ? "s" : ""}
            </p>
          </>
        ) : (
          <p className="text-xs text-slate-500">No data</p>
        )}
      </div>
    );
  }
  return null;
};

export default function BurnoutDriftIndicator({
  checkins,
  onAddCheckin,
}: BurnoutDriftIndicatorProps) {
  // Get checkins from past 28 days and calculate weekly averages (4 weeks)
  const getWeeklyAverages = () => {
    const now = new Date();
    const twentyEightDaysAgo = new Date(now);
    twentyEightDaysAgo.setDate(now.getDate() - 28);

    // Filter to last 28 days only
    const recentCheckins = checkins.filter((c) => {
      const date = new Date(c.created_at);
      return date >= twentyEightDaysAgo;
    });

    // Create 4 week buckets (Week 1 = oldest, Week 4 = most recent)
    const weeks: { weekNum: number; label: string; scores: number[] }[] = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (4 - i) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      weeks.push({
        weekNum: i + 1,
        label: `Week ${i + 1}`,
        scores: [],
      });
    }

    // Place each checkin in its week bucket
    recentCheckins.forEach((checkin) => {
      const checkinDate = new Date(checkin.created_at);
      const daysAgo = Math.floor(
        (now.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Week 4 = 0-6 days ago, Week 3 = 7-13 days ago, etc.
      const weekIndex = 3 - Math.floor(daysAgo / 7);
      if (weekIndex >= 0 && weekIndex < 4) {
        weeks[weekIndex].scores.push(feelingScores[checkin.feeling] || 3);
      }
    });

    // Calculate averages
    return weeks.map((week) => ({
      ...week,
      average:
        week.scores.length > 0
          ? week.scores.reduce((a, b) => a + b, 0) / week.scores.length
          : null,
      count: week.scores.length,
    }));
  };

  const weeklyData = getWeeklyAverages();
  const totalCheckins = checkins.length;
  const recentCheckins = weeklyData.reduce((sum, w) => sum + w.count, 0);

  // Determine trend per spec: compare Week 1 (oldest) to Week 4 (newest)
  const getTrend = (): "improving" | "stable" | "drifting" => {
    const week1 = weeklyData[0];
    const week4 = weeklyData[3];

    // Need data in both weeks to compare
    if (week1.average === null || week4.average === null) {
      return "stable";
    }

    const diff = week4.average - week1.average;

    // Per spec: improving if latest < oldest (score went down = better)
    if (diff < -0.5) return "improving";
    // Per spec: drifting if latest > oldest (score went up = worse)
    if (diff > 0.5) return "drifting";
    return "stable";
  };

  const trend = getTrend();

  // Get last checkin info
  const lastCheckin = checkins.length > 0 ? checkins[0] : null;
  const lastCheckinDate = lastCheckin
    ? new Date(lastCheckin.created_at)
    : null;
  const daysSinceLastCheckin = lastCheckinDate
    ? Math.floor(
        (Date.now() - lastCheckinDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  // Empty state - no check-ins at all
  if (totalCheckins === 0) {
    return (
      <>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <span className="text-lg">💫</span> Burnout Drift
          </h3>
        </div>
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
            <span className="text-2xl">🌱</span>
          </div>
          <p className="text-sm text-slate-400 mb-3">
            Start tracking your emotional wellness to see your burnout drift
            over time.
          </p>
          {onAddCheckin && (
            <button
              onClick={onAddCheckin}
              className="px-4 py-2 rounded-lg bg-violet-500/20 text-violet-400 text-sm font-medium border border-violet-500/30 hover:bg-violet-500/30 transition-all"
            >
              Add First Check-in
            </button>
          )}
        </div>
      </>
    );
  }

  // Not enough data state - less than 4 check-ins
  if (recentCheckins < 4) {
    return (
      <>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <span className="text-lg">💫</span> Burnout Drift
          </h3>
        </div>

        {/* Show last check-in */}
        {lastCheckin && (
          <div className="mb-4 p-3 rounded-lg bg-slate-800/30">
            <p className="text-xs text-slate-400 mb-1">Last check-in</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">{feelingEmojis[lastCheckin.feeling]}</span>
              <span className="text-sm text-slate-200">
                {feelingLabels[lastCheckin.feeling]}
              </span>
              {daysSinceLastCheckin !== null && daysSinceLastCheckin > 0 && (
                <span className="text-xs text-slate-500">
                  ({daysSinceLastCheckin}d ago)
                </span>
              )}
            </div>
          </div>
        )}

        <div className="text-center py-4">
          <p className="text-sm text-slate-400 mb-3">
            Keep checking in to see your trend
          </p>
          <p className="text-xs text-slate-500 mb-3">
            {recentCheckins} of 4 check-ins needed
          </p>
          {onAddCheckin && (
            <button
              onClick={onAddCheckin}
              className="px-4 py-2 rounded-lg bg-violet-500/20 text-violet-400 text-sm font-medium border border-violet-500/30 hover:bg-violet-500/30 transition-all"
            >
              + Add Check-in
            </button>
          )}
        </div>
      </>
    );
  }

  // Prepare chart data - only include weeks with data for the line
  const chartData = weeklyData.map((week) => ({
    ...week,
    displayValue: week.average,
  }));

  // Get trend badge colors and text
  const getTrendBadge = () => {
    switch (trend) {
      case "improving":
        return {
          text: "Improving ↓",
          bgClass: "bg-emerald-500/20",
          textClass: "text-emerald-400",
          borderClass: "border-emerald-500/30",
          dotClass: "bg-emerald-400",
        };
      case "drifting":
        return {
          text: "Drifting toward burnout ↑",
          bgClass: "bg-rose-500/20",
          textClass: "text-rose-400",
          borderClass: "border-rose-500/30",
          dotClass: "bg-rose-400",
        };
      default:
        return {
          text: "Stable",
          bgClass: "bg-slate-700/50",
          textClass: "text-slate-400",
          borderClass: "border-slate-600",
          dotClass: "bg-slate-400",
        };
    }
  };

  const trendBadge = getTrendBadge();

  // Get line color based on trend
  const getLineColor = () => {
    switch (trend) {
      case "improving":
        return "#10b981"; // emerald
      case "drifting":
        return "#f43f5e"; // rose
      default:
        return "#14b8a6"; // teal
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span className="text-lg">💫</span> Burnout Drift
        </h3>
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${trendBadge.bgClass} ${trendBadge.textClass} border ${trendBadge.borderClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${trendBadge.dotClass}`} />
          {trendBadge.text}
        </div>
      </div>

      {/* Last check-in summary */}
      {lastCheckin && (
        <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
          <span>Last:</span>
          <span className="text-sm">{feelingEmojis[lastCheckin.feeling]}</span>
          <span className="text-slate-300">{feelingLabels[lastCheckin.feeling]}</span>
          {daysSinceLastCheckin !== null && daysSinceLastCheckin > 0 && (
            <span className="text-slate-600">({daysSinceLastCheckin}d ago)</span>
          )}
        </div>
      )}

      {/* Line Chart */}
      <div className="rounded-xl bg-slate-800/30 p-3 mb-3">
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 10 }}
            />
            <YAxis
              hide
              domain={[1, 5]}
              reversed={false}
            />
            {/* Reference line at "okay" level (3) */}
            <ReferenceLine y={3} stroke="#334155" strokeDasharray="3 3" />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="displayValue"
              stroke={getLineColor()}
              strokeWidth={2}
              dot={{ fill: getLineColor(), strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: getLineColor() }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Y-axis labels */}
        <div className="flex justify-between text-[0.6rem] text-slate-600 mt-1 px-1">
          <span>4 weeks ago</span>
          <span>This week</span>
        </div>
      </div>

      {/* Scale explanation */}
      <div className="flex items-center justify-between text-[0.6rem] text-slate-500 mb-2">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Better (1-2)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          Okay (3)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          Worse (4-5)
        </span>
      </div>

      {/* Nudge to add check-in */}
      {daysSinceLastCheckin !== null && daysSinceLastCheckin >= 3 && onAddCheckin && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <button
            onClick={onAddCheckin}
            className="w-full py-2 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-medium border border-violet-500/20 hover:bg-violet-500/20 transition-all"
          >
            + Add Check-in (it's been {daysSinceLastCheckin} days)
          </button>
        </div>
      )}
    </>
  );
}
