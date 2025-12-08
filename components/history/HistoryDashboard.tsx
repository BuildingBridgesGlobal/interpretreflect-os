"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import PerformanceTimeline from "./PerformanceTimeline";
import DebriefLog from "./DebriefLog";
import PatternAnalysis from "./PatternAnalysis";
import ExportReports from "./ExportReports";

type HistoryDashboardProps = {
  userId: string;
};

export function HistoryDashboard({ userId }: HistoryDashboardProps) {
  const [activeTab, setActiveTab] = useState<"timeline" | "debriefs" | "patterns" | "reports">("timeline");
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch("/api/insights", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const data = await res.json();
        setInsights(data);
      } catch (error) {
        console.error("Error fetching insights:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, [userId]);

  // Quick stats that persist across all tabs
  const quickStats = loading
    ? [
        { label: "Assignments Debriefed", value: "..." },
        { label: "Performance Score", value: "..." },
        { label: "Active Goals", value: "..." },
        { label: "Primary Setting", value: "..." },
        { label: "Growth Trend", value: "...", highlight: true },
      ]
    : [
        {
          label: "Assignments Debriefed",
          value: insights?.summary?.totalSessionsThisMonth?.toString() || "0",
        },
        {
          label: "Avg Performance",
          value: `${insights?.summary?.avgPerformance || 0}%`,
        },
        {
          label: "Active Goals",
          value: insights?.summary?.activeGoalsCount?.toString() || "0",
        },
        {
          label: "Primary Setting",
          value: insights?.summary?.primarySetting || "Various",
        },
        {
          label: "Top Strength",
          value: insights?.summary?.topStrength?.substring(0, 30) || "Active learning",
          highlight: true,
        },
      ];

  return (
    <div className="space-y-6">
      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {quickStats.map((stat, idx) => (
          <div
            key={idx}
            className={`rounded-xl border p-4 ${
              stat.highlight
                ? "border-teal-500/30 bg-teal-500/5"
                : "border-slate-800 bg-slate-900/50"
            }`}
          >
            <p className={`text-2xl font-bold mb-1 ${stat.highlight ? "text-teal-400" : "text-slate-200"}`}>
              {stat.value}
            </p>
            <p className="text-sm text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`px-6 py-2 rounded-t-lg font-medium transition-all ${
            activeTab === "timeline"
              ? "bg-slate-800 text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Performance Timeline
        </button>
        <button
          onClick={() => setActiveTab("debriefs")}
          className={`px-6 py-2 rounded-t-lg font-medium transition-all ${
            activeTab === "debriefs"
              ? "bg-slate-800 text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Debrief Log
        </button>
        <button
          onClick={() => setActiveTab("patterns")}
          className={`px-6 py-2 rounded-t-lg font-medium transition-all ${
            activeTab === "patterns"
              ? "bg-slate-800 text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Pattern Analysis
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-6 py-2 rounded-t-lg font-medium transition-all ${
            activeTab === "reports"
              ? "bg-slate-800 text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Export Reports
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "timeline" && <PerformanceTimeline userId={userId} insights={insights} />}
      {activeTab === "debriefs" && <DebriefLog />}
      {activeTab === "patterns" && <PatternAnalysis />}
      {activeTab === "reports" && <ExportReports />}
    </div>
  );
}
