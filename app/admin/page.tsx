"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<"overview" | "pipeline" | "competency" | "community" | "wellness" | "compliance">("overview");

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

      // Check if user is admin
      if ((profile as any)?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

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

  // Mock aggregate data - will be replaced with real queries
  const toplineMetrics = {
    activeInterpreters: 127,
    assignmentReadinessRate: 84,
    debriefCompletionRate: 71,
    mentorConnectionsThisMonth: 34
  };

  const pipelineData = {
    itpGraduates: 52,
    activeInterpreters: 127,
    nowMentoring: 18,
    avgTimeToComplex: "8.3 months",
    dropOffPoints: [
      { stage: "First assignment", rate: "12%" },
      { stage: "After 3 months", rate: "8%" },
      { stage: "Complex assignments", rate: "5%" }
    ]
  };

  const competencyGrowth = {
    domains: [
      { name: "Linguistic", average: 72, trend: "+8%", status: "improving" },
      { name: "Cultural", average: 64, trend: "+12%", status: "improving" },
      { name: "Cognitive", average: 78, trend: "+5%", status: "stable" },
      { name: "Interpersonal", average: 69, trend: "+7%", status: "improving" }
    ],
    topGrowthAreas: [
      { skill: "Medical Terminology", improvement: "+12%" },
      { skill: "Cultural Navigation", improvement: "+15%" },
      { skill: "Decision Making", improvement: "+9%" }
    ],
    strugglingAreas: [
      { skill: "Legal Register Shifting", avg: 58 },
      { skill: "Community Knowledge", avg: 61 }
    ]
  };

  const communityActivity = {
    totalConnections: 156,
    activeConversations: 43,
    topContributors: [
      { name: "Sarah Johnson", helped: 12, domain: "Medical" },
      { name: "Dr. Patricia Williams", helped: 9, domain: "Educational" },
      { name: "Marcus Chen", helped: 8, domain: "Legal" }
    ],
    connectionAcceptanceRate: 78,
    avgResponseTime: "4.2 hours"
  };

  const wellnessIndicators = {
    distribution: {
      healthy: 89,
      warning: 28,
      critical: 10
    },
    checkInCompletionRate: 76,
    trendThisMonth: "improving",
    flaggedInterpreters: 10,
    interventionsSent: 5
  };

  const complianceData = {
    totalCEUHours: 342.5,
    avgCEUPerInterpreter: 2.7,
    completionByType: [
      { type: "Medical", completed: 89, total: 127 },
      { type: "Legal", completed: 67, total: 127 },
      { type: "Educational", completed: 78, total: 127 }
    ],
    ridCompliant: 94
  };

  const roiMetrics = [
    {
      finding: "Prep completion impact",
      stat: "23% higher debrief satisfaction",
      description: "Interpreters who completed assignment prep scored 23% higher on post-assignment debrief satisfaction"
    },
    {
      finding: "Mentor connection impact",
      stat: "40% lower burnout risk",
      description: "Interpreters with active mentor connections show 40% lower burnout risk scores"
    },
    {
      finding: "Competency acceleration",
      stat: "2.3 ECCI levels in 6 months",
      description: "Average competency growth of 2.3 ECCI levels in first 6 months (vs 1.1 industry average)"
    },
    {
      finding: "Retention improvement",
      stat: "18% reduction in turnover",
      description: "Platform users show 18% lower turnover rate compared to state average"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-50">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">NC program oversight and ROI analytics</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-slate-800 overflow-x-auto">
          {[
            { key: "overview", label: "Overview" },
            { key: "pipeline", label: "Pipeline Health" },
            { key: "competency", label: "Competency Growth" },
            { key: "community", label: "Community Activity" },
            { key: "wellness", label: "Wellness Indicators" },
            { key: "compliance", label: "Compliance & CEUs" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedView(tab.key as any)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                selectedView === tab.key
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {selectedView === "overview" && (
          <div className="space-y-6">
            {/* Top Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5">
                <p className="text-3xl font-bold text-violet-400">{toplineMetrics.activeInterpreters}</p>
                <p className="text-sm text-slate-300 mt-1">Active Interpreters</p>
                <p className="text-xs text-slate-500 mt-1">Platform engagement proof</p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <p className="text-3xl font-bold text-emerald-400">{toplineMetrics.assignmentReadinessRate}%</p>
                <p className="text-sm text-slate-300 mt-1">Assignment Readiness</p>
                <p className="text-xs text-slate-500 mt-1">Prep completion rate</p>
              </div>
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
                <p className="text-3xl font-bold text-blue-400">{toplineMetrics.debriefCompletionRate}%</p>
                <p className="text-sm text-slate-300 mt-1">Debrief Completion</p>
                <p className="text-xs text-slate-500 mt-1">Reflection happening</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                <p className="text-3xl font-bold text-amber-400">{toplineMetrics.mentorConnectionsThisMonth}</p>
                <p className="text-sm text-slate-300 mt-1">Mentor Connections</p>
                <p className="text-xs text-slate-500 mt-1">This month</p>
              </div>
            </div>

            {/* ROI Proof - The Killer Feature */}
            <div className="rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-blue-500/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Intervention Tracking - ROI Proof</h3>
                  <p className="text-sm text-slate-400 mt-1">Measurable impact on interpreter outcomes</p>
                </div>
                <button className="px-4 py-2 rounded-lg border border-teal-500/50 text-teal-400 hover:bg-teal-500/10 transition-colors text-sm">
                  Export Report
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roiMetrics.map((metric, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-700 bg-slate-900/50 p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2"></div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{metric.finding}</p>
                        <p className="text-2xl font-bold text-emerald-400 mb-2">{metric.stat}</p>
                        <p className="text-sm text-slate-400">{metric.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Pipeline Health</h4>
                <p className="text-xl font-bold text-slate-100 mb-1">{pipelineData.itpGraduates} → {pipelineData.activeInterpreters} → {pipelineData.nowMentoring}</p>
                <p className="text-xs text-slate-500">ITP Grads → Active → Mentoring</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Wellness Status</h4>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">{wellnessIndicators.distribution.healthy} Healthy</span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">{wellnessIndicators.distribution.warning} Warning</span>
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-sm">{wellnessIndicators.distribution.critical} Critical</span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Compliance</h4>
                <p className="text-xl font-bold text-slate-100 mb-1">{complianceData.ridCompliant}% RID Compliant</p>
                <p className="text-xs text-slate-500">{complianceData.totalCEUHours}h CEUs earned total</p>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline Health Tab */}
        {selectedView === "pipeline" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">New Interpreter Pipeline</h3>
              <p className="text-sm text-slate-400 mb-6">Are our new interpreters becoming competent?</p>

              {/* Pipeline Funnel */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1 text-center">
                    <div className="w-full bg-violet-500/20 border border-violet-500/30 rounded-lg p-4">
                      <p className="text-3xl font-bold text-violet-400">{pipelineData.itpGraduates}</p>
                      <p className="text-sm text-slate-300 mt-1">ITP Graduates</p>
                    </div>
                  </div>
                  <div className="w-12 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="w-full bg-teal-500/20 border border-teal-500/30 rounded-lg p-4">
                      <p className="text-3xl font-bold text-teal-400">{pipelineData.activeInterpreters}</p>
                      <p className="text-sm text-slate-300 mt-1">Active on Platform</p>
                    </div>
                  </div>
                  <div className="w-12 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="w-full bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4">
                      <p className="text-3xl font-bold text-emerald-400">{pipelineData.nowMentoring}</p>
                      <p className="text-sm text-slate-300 mt-1">Now Mentoring</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-sm text-blue-300">
                    <strong>Average time to complex assignments:</strong> {pipelineData.avgTimeToComplex}
                  </p>
                </div>
              </div>

              {/* Drop-off Points */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Drop-off Analysis</h4>
                <div className="space-y-2">
                  {pipelineData.dropOffPoints.map((point, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                      <span className="text-sm text-slate-300">{point.stage}</span>
                      <span className="text-sm font-medium text-rose-400">{point.rate} drop-off</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Competency Growth Tab */}
        {selectedView === "competency" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">ECCI Domain Performance</h3>
              <p className="text-sm text-slate-400 mb-6">What skills are improving across our workforce?</p>

              <div className="space-y-4 mb-6">
                {competencyGrowth.domains.map((domain, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">{domain.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-100">{domain.average}%</span>
                        <span className="text-sm text-emerald-400">{domain.trend}</span>
                      </div>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-violet-500 rounded-full"
                        style={{ width: `${domain.average}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <h4 className="text-sm font-medium text-slate-100 mb-3">Top Growth Areas</h4>
                  <div className="space-y-2">
                    {competencyGrowth.topGrowthAreas.map((skill, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">{skill.skill}</span>
                        <span className="text-sm font-medium text-emerald-400">{skill.improvement}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <h4 className="text-sm font-medium text-slate-100 mb-3">Need Attention</h4>
                  <div className="space-y-2">
                    {competencyGrowth.strugglingAreas.map((skill, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">{skill.skill}</span>
                        <span className="text-sm font-medium text-amber-400">{skill.avg}% avg</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Community Activity Tab */}
        {selectedView === "community" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Community Engagement</h3>
              <p className="text-sm text-slate-400 mb-6">Is the mentorship network actually working?</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-slate-800/50">
                  <p className="text-2xl font-bold text-violet-400">{communityActivity.totalConnections}</p>
                  <p className="text-xs text-slate-400 mt-1">Total Connections</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-800/50">
                  <p className="text-2xl font-bold text-teal-400">{communityActivity.activeConversations}</p>
                  <p className="text-xs text-slate-400 mt-1">Active Conversations</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-800/50">
                  <p className="text-2xl font-bold text-emerald-400">{communityActivity.connectionAcceptanceRate}%</p>
                  <p className="text-xs text-slate-400 mt-1">Acceptance Rate</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-800/50">
                  <p className="text-2xl font-bold text-blue-400">{communityActivity.avgResponseTime}</p>
                  <p className="text-xs text-slate-400 mt-1">Avg Response Time</p>
                </div>
              </div>

              <div className="p-5 rounded-lg bg-violet-500/10 border border-violet-500/30">
                <h4 className="text-sm font-medium text-slate-100 mb-3">Top Contributors</h4>
                <div className="space-y-3">
                  {communityActivity.topContributors.map((contributor, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-400">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{contributor.name}</p>
                          <p className="text-xs text-slate-500">{contributor.domain}</p>
                        </div>
                      </div>
                      <span className="text-sm text-emerald-400">{contributor.helped} interpreters helped</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wellness Indicators Tab */}
        {selectedView === "wellness" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Wellness & Burnout Prevention</h3>
              <p className="text-sm text-slate-400 mb-6">Are we catching burnout early?</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-3xl font-bold text-emerald-400">{wellnessIndicators.distribution.healthy}</p>
                  <p className="text-sm text-slate-300 mt-1">Healthy Status</p>
                  <p className="text-xs text-slate-500 mt-1">Low burnout risk</p>
                </div>
                <div className="p-5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-3xl font-bold text-amber-400">{wellnessIndicators.distribution.warning}</p>
                  <p className="text-sm text-slate-300 mt-1">Warning Status</p>
                  <p className="text-xs text-slate-500 mt-1">Monitoring needed</p>
                </div>
                <div className="p-5 rounded-lg bg-rose-500/10 border border-rose-500/30">
                  <p className="text-3xl font-bold text-rose-400">{wellnessIndicators.distribution.critical}</p>
                  <p className="text-sm text-slate-300 mt-1">Critical Status</p>
                  <p className="text-xs text-slate-500 mt-1">Intervention sent</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-800/50">
                  <p className="text-sm text-slate-400 mb-2">Check-in completion rate</p>
                  <p className="text-2xl font-bold text-slate-100">{wellnessIndicators.checkInCompletionRate}%</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50">
                  <p className="text-sm text-slate-400 mb-2">Wellness trend this month</p>
                  <p className="text-2xl font-bold text-emerald-400 capitalize">{wellnessIndicators.trendThisMonth}</p>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30">
                <p className="text-sm text-slate-300">
                  <strong className="text-rose-400">{wellnessIndicators.flaggedInterpreters} interpreters flagged</strong> - {wellnessIndicators.interventionsSent} supervisors notified for intervention
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Compliance & CEUs Tab */}
        {selectedView === "compliance" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Compliance & CEU Tracking</h3>
                  <p className="text-sm text-slate-400 mt-1">Can we prove this to our funders?</p>
                </div>
                <button className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors">
                  Export PDF Report
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/30">
                  <p className="text-3xl font-bold text-violet-400">{complianceData.totalCEUHours}h</p>
                  <p className="text-xs text-slate-400 mt-1">Total CEU Hours</p>
                </div>
                <div className="p-4 rounded-lg bg-teal-500/10 border border-teal-500/30">
                  <p className="text-3xl font-bold text-teal-400">{complianceData.avgCEUPerInterpreter}h</p>
                  <p className="text-xs text-slate-400 mt-1">Avg Per Interpreter</p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-3xl font-bold text-emerald-400">{complianceData.ridCompliant}%</p>
                  <p className="text-xs text-slate-400 mt-1">RID Compliant</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-3xl font-bold text-blue-400">100%</p>
                  <p className="text-xs text-slate-400 mt-1">Tracked & Verified</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Completion by Domain</h4>
                <div className="space-y-3">
                  {complianceData.completionByType.map((type, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300">{type.type}</span>
                        <span className="text-sm text-slate-400">{type.completed}/{type.total} interpreters</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${(type.completed / type.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
