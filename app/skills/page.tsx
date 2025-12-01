"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

type SkillModule = {
  id: string;
  module_code: string;
  title: string;
  subtitle: string;
  duration_minutes: number;
  order_in_series: number;
  has_video: boolean;
};

type ModuleProgress = {
  module_id: string;
  status: string;
  completed_at: string | null;
};

type SkillSeries = {
  id: string;
  series_code: string;
  title: string;
  description: string;
  ecci_domain: string;
  total_modules: number;
  estimated_total_minutes: number;
  icon_emoji: string;
  display_order: number;
  modules: SkillModule[];
  userProgress: ModuleProgress[];
};

type ECCIScore = {
  domain: string;
  modules_completed: number;
  engagement_level: number;
  trend: string;
};

export default function SkillsLibraryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [series, setSeries] = useState<SkillSeries[]>([]);
  const [ecciScores, setECCIScores] = useState<ECCIScore[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"learn" | "drill">("learn");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/signin");
      return;
    }

    setUser(session.user);

    // Load all series with their modules
    const { data: seriesData } = await (supabase as any)
      .from("skill_series")
      .select(`
        *,
        modules:skill_modules(
          id,
          module_code,
          title,
          subtitle,
          duration_minutes,
          order_in_series,
          has_video
        )
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (seriesData) {
      // Load user progress for all modules
      const { data: progressData } = await (supabase as any)
        .from("user_module_progress")
        .select("module_id, status, completed_at")
        .eq("user_id", session.user.id);

      // Attach progress to each series
      const enrichedSeries = seriesData.map((s: any) => ({
        ...s,
        modules: s.modules.sort((a: any, b: any) => a.order_in_series - b.order_in_series),
        userProgress: progressData?.filter((p: any) =>
          s.modules.some((m: any) => m.id === p.module_id)
        ) || []
      }));

      setSeries(enrichedSeries as any);
    }

    // Load ECCI competency scores
    const { data: scoresData } = await (supabase as any)
      .from("ecci_competency_scores")
      .select("*")
      .eq("user_id", session.user.id);

    if (scoresData) {
      setECCIScores(scoresData);
    }

    setLoading(false);
  };

  const getSeriesProgress = (seriesItem: SkillSeries) => {
    const completed = seriesItem.userProgress.filter(p => p.status === "completed").length;
    const total = seriesItem.modules.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getModuleStatus = (moduleId: string, seriesItem: SkillSeries) => {
    const progress = seriesItem.userProgress.find(p => p.module_id === moduleId);
    return progress?.status || "not_started";
  };

  const getECCIDomainColor = (domain: string) => {
    const colors: any = {
      "Self-Awareness": { border: "border-teal-500/30", bg: "bg-teal-500/10", text: "text-teal-400", accent: "bg-teal-500" },
      "Self-Management": { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400", accent: "bg-blue-500" },
      "Social Awareness": { border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-400", accent: "bg-purple-500" },
      "Relationship Management": { border: "border-violet-500/30", bg: "bg-violet-500/10", text: "text-violet-400", accent: "bg-violet-500" },
      "Decision Making": { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400", accent: "bg-amber-500" },
      "Language Processing": { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-400", accent: "bg-emerald-500" }
    };
    return colors[domain] || colors["Self-Awareness"];
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      "completed": { icon: "✓", text: "Completed", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      "in_progress": { icon: "•", text: "In Progress", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
      "not_started": { icon: "", text: "Start", color: "bg-slate-700/50 text-slate-400 border-slate-600" }
    };
    return badges[status] || badges["not_started"];
  };

  const filteredSeries = selectedDomain
    ? series.filter(s => s.ecci_domain === selectedDomain)
    : series;

  const allECCIDomains = Array.from(new Set(series.map(s => s.ecci_domain)));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading skills library...</div>
      </div>
    );
  }

  // Calculate overall stats
  const totalModules = series.reduce((sum, s) => sum + s.modules.length, 0);
  const completedModules = series.reduce((sum, s) => {
    const completed = s.userProgress.filter(p => p.status === "completed").length;
    return sum + completed;
  }, 0);
  const overallProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-8">
        {/* Dashboard Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-slate-50 mb-2">Skills Training</h1>
          <p className="text-slate-400">
            Build your interpreter competencies with micro-learning modules
          </p>
        </div>

        {/* Learn/Drill Tabs */}
        <div className="mb-8 flex gap-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("learn")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === "learn"
                ? "text-teal-400"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Learn
            {activeTab === "learn" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("drill")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === "drill"
                ? "text-teal-400"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Drill
            {activeTab === "drill" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400" />
            )}
          </button>
        </div>

        {/* Learn Tab Content */}
        {activeTab === "learn" && (
          <>
            {/* Overall Progress Card */}
            <div className="mb-8 rounded-xl border border-slate-700 bg-slate-900/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Your Progress</h2>
                  <p className="text-sm text-slate-400 mt-1">{completedModules} of {totalModules} modules completed</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-teal-400">{overallProgress}%</div>
                </div>
              </div>
              <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* Learning Paths */}
            <div className="space-y-6">
          {filteredSeries.length === 0 && (
            <div className="text-center py-12 rounded-xl border border-slate-800 bg-slate-900/50">
              <p className="text-slate-400">No series found in this domain.</p>
            </div>
          )}

          {filteredSeries.map((seriesItem) => {
            const progress = getSeriesProgress(seriesItem);
            const color = getECCIDomainColor(seriesItem.ecci_domain);
            const nextModule = seriesItem.modules.find((m, i) => {
              const status = getModuleStatus(m.id, seriesItem);
              const isLocked = i > 0 && getModuleStatus(seriesItem.modules[i - 1].id, seriesItem) !== "completed";
              return !isLocked && status !== "completed";
            });

            return (
              <div
                key={seriesItem.id}
                className="rounded-xl border border-slate-700 bg-slate-900/30 overflow-hidden hover:border-slate-600 transition-all"
              >
                {/* Series Header - Enhanced */}
                <div className="p-6 border-b border-slate-800">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-slate-50">{seriesItem.title}</h2>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${color.bg} ${color.text}`}>
                          {seriesItem.ecci_domain}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{seriesItem.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-slate-100 mb-1">{progress.percentage}%</div>
                      <div className="text-xs text-slate-400">{progress.completed}/{progress.total} complete</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-3">
                    <div
                      className={`h-full ${color.accent} transition-all duration-500`}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>

                  {/* Next Up */}
                  {nextModule && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Next up:</span>
                      <button
                        onClick={() => router.push(`/skills/${nextModule.module_code}`)}
                        className={`px-3 py-1.5 rounded-lg ${color.bg} ${color.text} hover:bg-opacity-80 transition-colors font-medium`}
                      >
                        Continue: {nextModule.title} →
                      </button>
                    </div>
                  )}
                  {progress.percentage === 100 && (
                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                      <span className="text-lg">✓</span>
                      <span className="font-medium">Series Complete!</span>
                    </div>
                  )}
                </div>

                {/* Module List - Always Visible, Simplified */}
                <div className="p-4 space-y-2">
                  {seriesItem.modules.map((module, index) => {
                    const status = getModuleStatus(module.id, seriesItem);
                    const isLocked = index > 0 && getModuleStatus(seriesItem.modules[index - 1].id, seriesItem) !== "completed";

                    return (
                      <div
                        key={module.id}
                        className={`group rounded-lg p-4 transition-all ${
                          isLocked
                            ? 'bg-slate-800/30 opacity-50 cursor-not-allowed'
                            : 'bg-slate-800/50 hover:bg-slate-800 cursor-pointer'
                        }`}
                        onClick={() => !isLocked && router.push(`/skills/${module.module_code}`)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Status Circle */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            status === "completed"
                              ? 'bg-emerald-500/20 border-2 border-emerald-500'
                              : status === "in_progress"
                              ? 'bg-amber-500/20 border-2 border-amber-500'
                              : 'bg-slate-700 border-2 border-slate-600'
                          }`}>
                            {status === "completed" ? (
                              <span className="text-emerald-400 text-lg">✓</span>
                            ) : isLocked ? (
                              <span className="text-slate-500 text-sm">🔒</span>
                            ) : (
                              <span className="text-slate-400 font-semibold">{module.order_in_series}</span>
                            )}
                          </div>

                          {/* Module Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium mb-1 ${
                              isLocked ? 'text-slate-500' : 'text-slate-100 group-hover:text-teal-400'
                            }`}>
                              {module.title}
                            </h3>
                            <p className="text-sm text-slate-500">{module.duration_minutes} min</p>
                          </div>

                          {/* Action */}
                          {!isLocked && (
                            <div className="text-slate-400 group-hover:text-teal-400 transition-colors">
                              →
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

            {/* Simple Attribution */}
            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-500">
                Content adapted from CATIE Center materials (CC BY 4.0)
              </p>
            </div>
          </>
        )}

        {/* Drill Tab Content */}
        {activeTab === "drill" && (
          <div className="space-y-6">
            {/* Readiness Score Card */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Your Readiness Score</h2>
                  <p className="text-sm text-slate-400 mt-1">Overall decision-making confidence</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-amber-400">--</div>
                  <p className="text-xs text-slate-500 mt-1">No drills completed yet</p>
                </div>
              </div>
            </div>

            {/* Quick Practice */}
            <button className="w-full rounded-xl border border-teal-500/30 bg-teal-500/10 p-6 hover:bg-teal-500/20 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-teal-400 mb-1">Quick Practice</h3>
                  <p className="text-sm text-slate-400">5 random drills to sharpen your skills</p>
                </div>
                <div className="text-teal-400 text-2xl group-hover:translate-x-1 transition-transform">→</div>
              </div>
            </button>

            {/* Drill Categories */}
            <div>
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Practice by Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ethical Judgment */}
                <div
                  onClick={() => router.push("/drills/ethical_judgment")}
                  className="rounded-xl border border-slate-700 bg-slate-900/30 p-5 hover:border-slate-600 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-100 group-hover:text-teal-400 transition-colors">
                        Ethical Judgment
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Navigate ethical dilemmas and boundary decisions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">1 drill available</span>
                    <span className="text-slate-400 group-hover:text-teal-400 transition-colors">Start →</span>
                  </div>
                </div>

                {/* Role Management */}
                <div
                  onClick={() => router.push("/drills/role_management")}
                  className="rounded-xl border border-slate-700 bg-slate-900/30 p-5 hover:border-slate-600 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-100 group-hover:text-teal-400 transition-colors">
                        Role Management
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Practice staying in role and managing boundaries
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">1 drill available</span>
                    <span className="text-slate-400 group-hover:text-teal-400 transition-colors">Start →</span>
                  </div>
                </div>

                {/* Situational Judgment */}
                <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-5 hover:border-slate-600 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-100 group-hover:text-teal-400 transition-colors">
                        Situational Judgment
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Make quick decisions in complex scenarios
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">0 drills completed</span>
                    <span className="text-slate-400 group-hover:text-teal-400 transition-colors">Start →</span>
                  </div>
                </div>

                {/* Intervention Decisions */}
                <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-5 hover:border-slate-600 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-100 group-hover:text-teal-400 transition-colors">
                        Intervention Decisions
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Know when to intervene and when to stay silent
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">0 drills completed</span>
                    <span className="text-slate-400 group-hover:text-teal-400 transition-colors">Start →</span>
                  </div>
                </div>

                {/* Self-Regulation */}
                <div
                  onClick={() => router.push("/drills/self_regulation")}
                  className="rounded-xl border border-slate-700 bg-slate-900/30 p-5 hover:border-slate-600 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-100 group-hover:text-teal-400 transition-colors">
                        Self-Regulation
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Manage stress and maintain professional composure
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">2 drills available</span>
                    <span className="text-slate-400 group-hover:text-teal-400 transition-colors">Start →</span>
                  </div>
                </div>

                {/* Terminology */}
                <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-5 hover:border-slate-600 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-100 group-hover:text-teal-400 transition-colors">
                        Terminology
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Quick terminology decisions and equivalents
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">0 drills completed</span>
                    <span className="text-slate-400 group-hover:text-teal-400 transition-colors">Start →</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">How Drills Work</h3>
              <p className="text-sm text-slate-300">
                Complete "Learn" modules to unlock related drills. Each drill presents real-world scenarios
                where you make decisions, rate your confidence, and get instant feedback. Track your accuracy,
                response time, and build streaks to improve your interpreter readiness.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
