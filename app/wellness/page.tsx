"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

export default function WellnessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<"workload" | "performance" | "risk" | "recommendations">("workload");

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setUserData(profile);
      setLoading(false);
    };
    loadUserData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  // Mock data - will be replaced with real calculations from assignments/debriefs
  const workloadMetrics = {
    hoursThisWeek: 28,
    hoursThisMonth: 94,
    assignmentsThisWeek: 12,
    assignmentsThisMonth: 38,
    consecutiveDaysWorked: 9,
    restDaysThisMonth: 2,
    avgHoursPerWeek: 24,
    peakWorkload: "Week of Jan 15-21: 32 hours, 15 assignments"
  };

  const complexityDistribution = [
    { level: "High Complexity", count: 8, percentage: 21, type: "Legal, Medical Oncology" },
    { level: "Medium Complexity", count: 18, percentage: 47, type: "Medical General, Educational" },
    { level: "Low Complexity", count: 12, percentage: 32, type: "VRS, Community Events" }
  ];

  const performanceVsRecovery = {
    bestPerformanceAfter: "2+ rest days",
    avgScoreWithRest: 8.7,
    avgScoreWithoutRest: 7.2,
    optimalPattern: "3-4 assignments per week with 1 rest day between intensive sessions",
    prepTimeCorrelation: "+23% performance when prepped 60+ minutes",
    declineAfter: "7 consecutive days - performance drops 18%"
  };

  const burnoutRiskFactors = [
    {
      factor: "Consecutive Work Days",
      status: "warning",
      current: "9 days without rest",
      threshold: "7 days",
      impact: "Performance declining 15% over last week"
    },
    {
      factor: "Assignment Prep Time",
      status: "critical",
      current: "22 minutes average",
      threshold: "60 minutes recommended",
      impact: "Debrief scores 18% lower on unprepared assignments"
    },
    {
      factor: "High-Complexity Load",
      status: "healthy",
      current: "21% of assignments",
      threshold: "< 30%",
      impact: "Within sustainable range"
    },
    {
      factor: "Recovery Pattern",
      status: "warning",
      current: "2 rest days this month",
      threshold: "4-6 rest days recommended",
      impact: "Below peer average for your experience level"
    }
  ];

  const recommendations = [
    {
      priority: "high",
      title: "Schedule Immediate Rest Day",
      reason: "9 consecutive work days detected - performance declining",
      action: "Block tomorrow or next available day for recovery",
      impact: "Expected +12% performance improvement on return"
    },
    {
      priority: "high",
      title: "Increase Prep Time",
      reason: "Assignments with 60+ min prep score 23% higher",
      action: "Block 1 hour before each assignment for preparation",
      impact: "Could improve overall debrief scores from 7.2 to 8.7"
    },
    {
      priority: "medium",
      title: "Balance Assignment Complexity",
      reason: "3 high-complexity legal assignments clustered in 5 days",
      action: "Space intensive assignments with 2-3 days between",
      impact: "Reduce cognitive overload and maintain consistent performance"
    },
    {
      priority: "medium",
      title: "Adopt Sustainable Work Pattern",
      reason: "Your data shows best performance with specific pattern",
      action: "Aim for 3-4 assignments/week with rest day after intensive sessions",
      impact: "Match your historically highest performance periods"
    }
  ];

  const peerComparison = {
    yourHours: 94,
    peerAverage: 68,
    percentile: 82,
    sustainableRange: "60-75 hours/month",
    restDaysYou: 2,
    restDaysPeers: 5,
    message: "You're working 38% above peer average for interpreters with 3-5 years experience"
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      healthy: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400" },
      warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-400" },
      critical: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", dot: "bg-rose-400" }
    };
    return colors[status] || colors.healthy;
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "border-rose-500/40 bg-rose-500/10";
    if (priority === "medium") return "border-amber-500/40 bg-amber-500/10";
    return "border-slate-700 bg-slate-800/30";
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-50">Professional Sustainability</h1>
          <p className="mt-1 text-sm text-slate-400">Data-driven insights to maintain peak performance and prevent burnout</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-slate-800 overflow-x-auto">
          {[
            { key: "workload", label: "Workload Analysis" },
            { key: "performance", label: "Performance vs Recovery" },
            { key: "risk", label: "Burnout Risk Factors" },
            { key: "recommendations", label: "Recommendations" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                selectedTab === tab.key
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {selectedTab === "workload" && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-2xl font-bold text-violet-400">{workloadMetrics.hoursThisWeek}h</p>
                <p className="text-sm text-slate-400">This week</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-2xl font-bold text-teal-400">{workloadMetrics.hoursThisMonth}h</p>
                <p className="text-sm text-slate-400">This month</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-2xl font-bold text-amber-400">{workloadMetrics.consecutiveDaysWorked}</p>
                <p className="text-sm text-slate-400">Consecutive days</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-2xl font-bold text-rose-400">{workloadMetrics.restDaysThisMonth}</p>
                <p className="text-sm text-slate-400">Rest days (month)</p>
              </div>
            </div>

            {/* Workload Trend */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Workload Trend</h3>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Average weekly hours</span>
                  <span className="text-lg font-bold text-slate-100">{workloadMetrics.avgHoursPerWeek}h</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-500 to-violet-500 rounded-full" style={{ width: `${(workloadMetrics.avgHoursPerWeek / 40) * 100}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Sustainable range: 15-25 hours/week for your experience level</p>
              </div>

              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-300">
                  <strong>Peak workload detected:</strong> {workloadMetrics.peakWorkload}
                </p>
              </div>
            </div>

            {/* Assignment Complexity Distribution */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Assignment Complexity Distribution</h3>
              <div className="space-y-4">
                {complexityDistribution.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium text-slate-200">{item.level}</span>
                        <span className="text-xs text-slate-500 ml-2">({item.type})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400">{item.count} assignments</span>
                        <span className="text-sm font-bold text-slate-100">{item.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.level === "High Complexity" ? "bg-rose-500" :
                          item.level === "Medium Complexity" ? "bg-amber-500" :
                          "bg-emerald-500"
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peer Comparison */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Peer Comparison</h3>
              <p className="text-sm text-slate-400 mb-4">Anonymous comparison to interpreters with similar experience (3-5 years)</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2">Monthly hours</p>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <div className="text-center mb-2">
                        <p className="text-2xl font-bold text-violet-400">{peerComparison.yourHours}h</p>
                        <p className="text-xs text-slate-400">You</p>
                      </div>
                      <div className="h-32 bg-violet-500/20 rounded-t-lg relative">
                        <div className="absolute bottom-0 w-full h-full bg-violet-500 rounded-t-lg"></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-center mb-2">
                        <p className="text-2xl font-bold text-slate-400">{peerComparison.peerAverage}h</p>
                        <p className="text-xs text-slate-400">Peers</p>
                      </div>
                      <div className="h-32 bg-slate-700/20 rounded-t-lg relative">
                        <div className="absolute bottom-0 w-full bg-slate-600 rounded-t-lg" style={{ height: `${(peerComparison.peerAverage / peerComparison.yourHours) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-2">Rest days this month</p>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <div className="text-center mb-2">
                        <p className="text-2xl font-bold text-rose-400">{peerComparison.restDaysYou}</p>
                        <p className="text-xs text-slate-400">You</p>
                      </div>
                      <div className="h-32 bg-rose-500/20 rounded-t-lg relative">
                        <div className="absolute bottom-0 w-full bg-rose-500 rounded-t-lg" style={{ height: `${(peerComparison.restDaysYou / peerComparison.restDaysPeers) * 100}%` }}></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-center mb-2">
                        <p className="text-2xl font-bold text-emerald-400">{peerComparison.restDaysPeers}</p>
                        <p className="text-xs text-slate-400">Peers</p>
                      </div>
                      <div className="h-32 bg-emerald-500/20 rounded-t-lg relative">
                        <div className="absolute bottom-0 w-full h-full bg-emerald-500 rounded-t-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-300">{peerComparison.message}</p>
                <p className="text-xs text-slate-400 mt-2">Sustainable range: {peerComparison.sustainableRange}</p>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "performance" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Your Optimal Performance Pattern</h3>
              <p className="text-sm text-slate-400 mb-6">Analysis of your performance data reveals when you perform best</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-5 rounded-lg border border-slate-700 bg-slate-800/50">
                  <p className="text-xs text-slate-500 mb-2">Performance after rest</p>
                  <p className="text-3xl font-bold text-emerald-400 mb-1">{performanceVsRecovery.avgScoreWithRest}</p>
                  <p className="text-sm text-slate-300">{performanceVsRecovery.bestPerformanceAfter}</p>
                </div>
                <div className="p-5 rounded-lg border border-slate-700 bg-slate-800/50">
                  <p className="text-xs text-slate-500 mb-2">Performance without rest</p>
                  <p className="text-3xl font-bold text-amber-400 mb-1">{performanceVsRecovery.avgScoreWithoutRest}</p>
                  <p className="text-sm text-slate-300">Consecutive work days</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/30">
                  <p className="text-sm font-medium text-slate-100 mb-1">Optimal work pattern identified:</p>
                  <p className="text-sm text-violet-300">{performanceVsRecovery.optimalPattern}</p>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-sm font-medium text-slate-100 mb-1">Prep time correlation:</p>
                  <p className="text-sm text-blue-300">{performanceVsRecovery.prepTimeCorrelation}</p>
                </div>

                <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30">
                  <p className="text-sm font-medium text-slate-100 mb-1">Performance decline threshold:</p>
                  <p className="text-sm text-rose-300">{performanceVsRecovery.declineAfter}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Performance Trend Over Time</h3>
              <p className="text-sm text-slate-400 mb-4">Debrief scores correlated with workload and recovery</p>

              <div className="h-48 flex items-end justify-between gap-2">
                {[8.2, 8.5, 8.9, 8.1, 7.8, 7.5, 7.2, 7.0, 6.8, 7.1, 8.7, 8.9].map((score, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        score >= 8.5 ? "bg-emerald-500" :
                        score >= 7.5 ? "bg-teal-500" :
                        score >= 7.0 ? "bg-amber-500" :
                        "bg-rose-500"
                      }`}
                      style={{ height: `${(score / 10) * 100}%` }}
                    ></div>
                    <p className="text-xs text-slate-500 mt-2">{idx === 9 ? "↓ Rest" : ""}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-4">Last 12 assignments - Note performance improvement after rest day (position 10)</p>
            </div>
          </div>
        )}

        {selectedTab === "risk" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Burnout Risk Assessment</h3>
              <p className="text-sm text-slate-400 mb-6">Data-driven analysis of burnout risk factors based on your work patterns</p>

              <div className="space-y-4">
                {burnoutRiskFactors.map((risk, idx) => {
                  const colors = getStatusColor(risk.status);
                  return (
                    <div key={idx} className={`rounded-lg border ${colors.border} ${colors.bg} p-5`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${colors.dot}`}></div>
                            <h4 className="font-semibold text-slate-100">{risk.factor}</h4>
                            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${colors.text} ${colors.bg} border ${colors.border}`}>
                              {risk.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-slate-500">Current</p>
                              <p className="text-sm font-medium text-slate-200">{risk.current}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Threshold</p>
                              <p className="text-sm font-medium text-slate-200">{risk.threshold}</p>
                            </div>
                          </div>
                          <p className="text-sm text-slate-400">{risk.impact}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-sm text-slate-300">
                <strong className="text-slate-100">How this works:</strong> We analyze your assignment patterns, debrief scores, prep time, and recovery habits to identify burnout risk factors before they become problems. This is predictive analysis based on thousands of interpreter work patterns.
              </p>
            </div>
          </div>
        )}

        {selectedTab === "recommendations" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Personalized Recommendations</h3>
              <p className="text-sm text-slate-400 mb-6">Actionable steps to improve performance and maintain sustainability</p>

              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className={`rounded-lg border p-5 ${getPriorityColor(rec.priority)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {rec.priority === "high" && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-xs font-medium">
                              HIGH PRIORITY
                            </span>
                          )}
                          {rec.priority === "medium" && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-medium">
                              MEDIUM PRIORITY
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-slate-100 mb-2">{rec.title}</h4>
                        <p className="text-sm text-slate-400 mb-3">
                          <strong className="text-slate-300">Why:</strong> {rec.reason}
                        </p>
                        <p className="text-sm text-slate-400 mb-3">
                          <strong className="text-slate-300">Action:</strong> {rec.action}
                        </p>
                        <p className="text-sm text-emerald-400">
                          <strong>Impact:</strong> {rec.impact}
                        </p>
                      </div>
                    </div>
                    <button className="mt-3 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 text-sm font-medium hover:bg-teal-400 transition-colors">
                      Apply Recommendation
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
              <p className="text-sm text-slate-300">
                <strong className="text-slate-100">Connect with sustainable interpreters:</strong> Visit the Community page to connect with interpreters who maintain healthy work-life balance and can share their strategies.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
