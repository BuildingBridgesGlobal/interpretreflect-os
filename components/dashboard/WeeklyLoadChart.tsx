"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Assignment = {
  id: string;
  title: string;
  date: string | null;
  emotional_intensity?: string | null;
  completed?: boolean | null;
  assignment_type?: string | null;
};

type WeeklyLoadChartProps = {
  assignments: Assignment[];
};

// Map intensity to numeric values per spec
const intensityValues: Record<string, number> = {
  low: 1,
  moderate: 2,
  high: 3,
  very_high: 4,
};

// Get color based on total load (summed intensity)
const getLoadColor = (load: number, maxLoad: number): string => {
  if (load === 0) return "#334155"; // slate-700
  const ratio = load / Math.max(maxLoad, 1);
  if (ratio <= 0.25) return "#10b981"; // emerald-500
  if (ratio <= 0.5) return "#14b8a6"; // teal-500
  if (ratio <= 0.75) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
};

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-slate-200">{data.fullDay}</p>
        <p className="text-xs text-slate-400">
          {data.count} assignment{data.count !== 1 ? "s" : ""}
        </p>
        {data.hasIntensityData ? (
          <p className="text-xs text-teal-400">Load: {data.load}</p>
        ) : (
          <p className="text-xs text-slate-500">No intensity data</p>
        )}
      </div>
    );
  }
  return null;
};

export default function WeeklyLoadChart({ assignments }: WeeklyLoadChartProps) {
  // Get current week dates (Mon-Sun)
  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    // Adjust to get Monday (day 1) as start. If today is Sunday (0), go back 6 days
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date().toISOString().split("T")[0];

  // Check if any assignments have intensity data
  const hasAnyIntensityData = assignments.some(
    (a) => a.emotional_intensity && intensityValues[a.emotional_intensity]
  );

  // Calculate load for each day
  const calculateDailyData = () => {
    return weekDates.map((dateStr, index) => {
      const dayAssignments = assignments.filter((a) => a.date === dateStr);
      const count = dayAssignments.length;

      // Sum intensity for the day
      let load = 0;
      let hasIntensityData = false;

      dayAssignments.forEach((a) => {
        if (a.emotional_intensity && intensityValues[a.emotional_intensity]) {
          load += intensityValues[a.emotional_intensity];
          hasIntensityData = true;
        } else {
          // Default: null/not set = 1
          load += 1;
        }
      });

      const date = new Date(dateStr + "T00:00:00");
      const fullDay = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

      return {
        name: dayLabels[index],
        date: dateStr,
        fullDay,
        load,
        count,
        hasIntensityData,
        isToday: dateStr === today,
        isFuture: dateStr > today,
      };
    });
  };

  const dailyData = calculateDailyData();

  // Calculate stats
  const totalAssignments = dailyData.reduce((sum, d) => sum + d.count, 0);
  const totalLoad = dailyData.reduce((sum, d) => sum + d.load, 0);
  const maxDailyLoad = Math.max(...dailyData.map((d) => d.load), 1);
  const peakDay = dailyData.reduce(
    (max, d) => (d.load > max.load ? d : max),
    dailyData[0]
  );

  // Fallback mode: show count instead of load when no intensity data
  const showCountFallback = !hasAnyIntensityData && totalAssignments > 0;
  const chartData = dailyData.map((d) => ({
    ...d,
    displayValue: showCountFallback ? d.count : d.load,
  }));
  const maxDisplayValue = showCountFallback
    ? Math.max(...chartData.map((d) => d.displayValue), 1)
    : maxDailyLoad;

  return (
    <motion.div
      className="rounded-xl border border-slate-700 bg-slate-800/30 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span className="text-lg">📊</span> This Week's Load
        </h3>
        <div className="text-right text-[0.65rem] text-slate-500">
          <p>
            Assignments: <span className="text-slate-300">{totalAssignments}</span>
          </p>
          {!showCountFallback && totalLoad > 0 && (
            <p>
              Total load: <span className="text-teal-400">{totalLoad}</span>
            </p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl bg-slate-900/70 p-3 mb-3">
        {totalAssignments === 0 ? (
          <div className="h-32 flex items-center justify-center">
            <p className="text-sm text-slate-500">No assignments this week</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={({ x, y, payload }) => {
                  const item = chartData.find((d) => d.name === payload.value);
                  const isToday = item?.isToday;
                  return (
                    <text
                      x={x}
                      y={y + 12}
                      textAnchor="middle"
                      className={`text-[0.6rem] ${
                        isToday ? "fill-violet-400 font-semibold" : "fill-slate-500"
                      }`}
                    >
                      {payload.value}
                    </text>
                  );
                }}
              />
              <YAxis hide domain={[0, "auto"]} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.1)" }} />
              <Bar dataKey="displayValue" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getLoadColor(entry.displayValue, maxDisplayValue)}
                    opacity={entry.isFuture ? 0.5 : 1}
                    stroke={entry.isToday ? "#a78bfa" : "transparent"}
                    strokeWidth={entry.isToday ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Fallback notice */}
        {showCountFallback && (
          <p className="text-[0.6rem] text-slate-500 text-center mt-2">
            Showing assignment count (set emotional intensity for load tracking)
          </p>
        )}
      </div>

      {/* Stats & Suggestions */}
      {totalAssignments > 0 && !showCountFallback && (
        <div className="space-y-2">
          {/* Peak day indicator */}
          {peakDay.load > 0 && (
            <div className="flex items-center justify-between text-[0.7rem]">
              <span className="text-slate-400">Peak day:</span>
              <span
                className={`font-medium ${
                  peakDay.load >= maxDailyLoad * 0.75
                    ? "text-amber-400"
                    : "text-teal-400"
                }`}
              >
                {peakDay.name} (load: {peakDay.load})
              </span>
            </div>
          )}

          {/* High load warning */}
          {totalLoad > 14 && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2">
              <p className="text-[0.7rem] text-amber-200">
                <span className="font-medium">Heavy week ahead.</span> Consider
                spacing out high-intensity assignments.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty state CTA */}
      {totalAssignments === 0 && (
        <div className="text-center">
          <a
            href="/assignments"
            className="text-[0.7rem] text-teal-400 hover:text-teal-300"
          >
            + Add assignments →
          </a>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap gap-3 text-[0.6rem] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Low (1)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          Moderate (2)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          High (3)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Very High (4)
        </span>
      </div>
    </motion.div>
  );
}
