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

type DrillCategory = {
  id: string;
  category_code: string;
  title: string;
  description: string;
  icon_emoji: string;
  color_scheme: string;
  display_order: number;
  drillCount: number;
  userCompleted: number;
  userAccuracy: number;
};

type UserDrillStats = {
  readiness_score: number;
  total_attempts: number;
  correct_count: number;
  current_streak: number;
  longest_streak: number;
  total_practice_minutes: number;
};

type ScenarioDrill = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty_base: string;
  ecci_focus: string[];
  estimated_duration_minutes: number;
  play_count: number;
  avg_score: number | null;
  is_featured: boolean;
  user_progress: {
    unlocked_difficulties: string[];
    best_scores: Record<string, number>;
    total_completions: number;
  } | null;
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
  const [drillCategories, setDrillCategories] = useState<DrillCategory[]>([]);
  const [userDrillStats, setUserDrillStats] = useState<UserDrillStats | null>(null);
  const [scenarioDrills, setScenarioDrills] = useState<ScenarioDrill[]>([]);

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

    // Load all series with their modules (only active ones)
    const { data: seriesData } = await (supabase as any)
      .from("skill_series")
      .select(`
        *,
        modules:skill_modules!inner(
          id,
          module_code,
          title,
          subtitle,
          duration_minutes,
          order_in_series,
          has_video,
          is_active
        )
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    // Filter modules to only show active ones
    if (seriesData) {
      seriesData.forEach((s: any) => {
        s.modules = s.modules.filter((m: any) => m.is_active === true);
      });
    }

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

    // Load drill categories with drill counts
    const { data: categoriesData } = await (supabase as any)
      .from("drill_categories")
      .select(`
        *,
        drill_subcategories (
          id,
          drills (id)
        )
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (categoriesData) {
      // Get user's drill attempts to calculate per-category stats
      const { data: userAttempts } = await (supabase as any)
        .from("drill_attempts")
        .select(`
          drill_id,
          is_correct,
          drills!inner (
            subcategory_id,
            drill_subcategories!inner (
              category_id
            )
          )
        `)
        .eq("user_id", session.user.id);

      // Get user category stats
      const { data: categoryStats } = await (supabase as any)
        .from("user_category_stats")
        .select("*")
        .eq("user_id", session.user.id);

      const enrichedCategories = categoriesData.map((cat: any) => {
        // Count total drills in this category
        const drillCount = cat.drill_subcategories?.reduce((sum: number, sub: any) => {
          return sum + (sub.drills?.length || 0);
        }, 0) || 0;

        // Find user's stats for this category
        const catStats = categoryStats?.find((s: any) => s.category_id === cat.id);

        // Count unique drills completed in this category
        const categorySubIds = cat.drill_subcategories?.map((s: any) => s.id) || [];
        const completedDrills = userAttempts?.filter((a: any) =>
          categorySubIds.includes(a.drills?.subcategory_id)
        ) || [];
        const uniqueCompleted = new Set(completedDrills.map((a: any) => a.drill_id)).size;

        return {
          ...cat,
          drillCount,
          userCompleted: uniqueCompleted,
          userAccuracy: catStats?.accuracy_percentage || 0
        };
      });

      setDrillCategories(enrichedCategories);
    }

    // Load user's overall drill stats
    const { data: statsData } = await (supabase as any)
      .from("user_drill_stats")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (statsData) {
      setUserDrillStats(statsData);
    }

    // Load scenario drills
    try {
      const scenarioResponse = await fetch("/api/drills/scenario", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (scenarioResponse.ok) {
        const scenarioData = await scenarioResponse.json();
        setScenarioDrills(scenarioData.scenarios || []);
      }
    } catch (err) {
      console.error("Failed to load scenario drills:", err);
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
      "completed": { icon: "check", text: "Completed", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      "in_progress": { icon: "•", text: "In Progress", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
      "not_started": { icon: "", text: "Start", color: "bg-slate-700/50 text-slate-400 border-slate-600" }
    };
    return badges[status] || badges["not_started"];
  };

  const getCategoryColor = (colorScheme: string) => {
    const colors: any = {
      "amber": { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400", accent: "bg-amber-500" },
      "violet": { border: "border-violet-500/30", bg: "bg-violet-500/10", text: "text-violet-400", accent: "bg-violet-500" },
      "blue": { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400", accent: "bg-blue-500" },
      "emerald": { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-400", accent: "bg-emerald-500" },
      "rose": { border: "border-rose-500/30", bg: "bg-rose-500/10", text: "text-rose-400", accent: "bg-rose-500" },
      "teal": { border: "border-teal-500/30", bg: "bg-teal-500/10", text: "text-teal-400", accent: "bg-teal-500" }
    };
    return colors[colorScheme] || colors["teal"];
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-teal-400";
    if (score >= 40) return "text-amber-400";
    return "text-slate-400";
  };

  const getReadinessLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Building";
    if (score > 0) return "Starting";
    return "Not started";
  };

  // Calculate total drills available
  const totalDrillsAvailable = drillCategories.reduce((sum, cat) => sum + cat.drillCount, 0);
  const totalDrillsCompleted = drillCategories.reduce((sum, cat) => sum + cat.userCompleted, 0);

  const filteredSeries = selectedDomain
    ? series.filter(s => s.ecci_domain === selectedDomain)
    : series;

  const allECCIDomains = Array.from(new Set(series.map(s => s.ecci_domain)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Hero-style Background Effects */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)]" />

      <NavBar />
      <div className="container mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-8 relative">
        {/* Dashboard Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 mb-2">Skills Training</h1>
          <p className="text-slate-300">
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
            <div className="mb-8 rounded-xl border border-slate-600 bg-slate-900/50 p-6">
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
            // Find the first incomplete module (all modules are now open)
            const nextModule = seriesItem.modules.find((m) => {
              const status = getModuleStatus(m.id, seriesItem);
              return status !== "completed";
            });

            return (
              <div
                key={seriesItem.id}
                className="rounded-xl border border-slate-600 bg-slate-900/30 overflow-hidden hover:border-slate-500 transition-all"
              >
                {/* Series Header - Enhanced */}
                <div className="p-6 border-b border-slate-800">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-slate-50">{seriesItem.title}</h2>
                      </div>
                      <p className="text-sm text-slate-300">{seriesItem.description}</p>
                      <p className="text-xs text-slate-500 mt-2 italic">These skills form the foundation of a grounded and highly skilled interpreter</p>
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
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">Series Complete!</span>
                    </div>
                  )}
                </div>

                {/* Module List - Always Visible, All Open */}
                <div className="p-4 space-y-2">
                  {seriesItem.modules.map((module) => {
                    const status = getModuleStatus(module.id, seriesItem);

                    return (
                      <div
                        key={module.id}
                        className="group rounded-lg p-4 transition-all bg-slate-800/50 hover:bg-slate-800 cursor-pointer"
                        onClick={() => router.push(`/skills/${module.module_code}`)}
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
                              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="text-slate-400 font-semibold">{module.order_in_series}</span>
                            )}
                          </div>

                          {/* Module Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium mb-1 text-slate-100 group-hover:text-teal-400">
                              {module.title}
                            </h3>
                            <p className="text-sm text-slate-500">{module.duration_minutes} min</p>
                          </div>

                          {/* Action */}
                          <div className="text-slate-400 group-hover:text-teal-400 transition-colors">
                            →
                          </div>
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
            {/* Readiness Score Card - Enhanced */}
            <div className="rounded-xl border border-slate-600 bg-gradient-to-br from-slate-900/80 to-slate-800/50 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-100">Readiness Score</h2>
                      <p className="text-sm text-slate-400">Your interpreter decision-making proficiency</p>
                    </div>
                  </div>

                  {/* Stats Row */}
                  {userDrillStats && userDrillStats.total_attempts > 0 ? (
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="text-center p-3 rounded-lg bg-slate-800/50">
                        <div className="text-2xl font-bold text-teal-400">{userDrillStats.total_attempts}</div>
                        <div className="text-xs text-slate-500">Drills Done</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-slate-800/50">
                        <div className="text-2xl font-bold text-emerald-400">
                          {userDrillStats.total_attempts > 0
                            ? Math.round((userDrillStats.correct_count / userDrillStats.total_attempts) * 100)
                            : 0}%
                        </div>
                        <div className="text-xs text-slate-500">Accuracy</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-slate-800/50">
                        <div className="text-2xl font-bold text-amber-400">{userDrillStats.current_streak}</div>
                        <div className="text-xs text-slate-500">Day Streak</div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-400">
                      Complete your first drill to start tracking your readiness score!
                    </p>
                  )}
                </div>

                {/* Score Display */}
                <div className="text-center md:text-right">
                  <div className={`text-5xl font-bold ${userDrillStats ? getReadinessColor(userDrillStats.readiness_score) : 'text-slate-500'}`}>
                    {userDrillStats?.readiness_score || '--'}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {userDrillStats ? getReadinessLabel(userDrillStats.readiness_score) : 'Not started'}
                  </p>
                  {userDrillStats?.longest_streak && userDrillStats.longest_streak > 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                      Best streak: {userDrillStats.longest_streak} days
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Scenario Drills Section */}
            {scenarioDrills.length > 0 && (
              <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-violet-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-100">Scenario Drills</h2>
                      <p className="text-sm text-slate-400">Interactive branching scenarios under time pressure</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {scenarioDrills.map((drill) => {
                    const hasProgress = drill.user_progress && drill.user_progress.total_completions > 0;
                    const bestScore = drill.user_progress?.best_scores
                      ? Math.max(...Object.values(drill.user_progress.best_scores).filter(v => typeof v === 'number'), 0)
                      : null;

                    return (
                      <div
                        key={drill.id}
                        onClick={() => router.push(`/skills/drill/${drill.slug}`)}
                        className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 hover:border-violet-500/50 hover:bg-slate-800 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start gap-4">
                          {/* Category Badge */}
                          <div className="flex-shrink-0">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300 capitalize">
                              {drill.category}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-100 group-hover:text-violet-400 transition-colors">
                                {drill.title}
                              </h3>
                            </div>
                            {drill.subtitle && (
                              <p className="text-sm text-slate-400 mb-2">{drill.subtitle}</p>
                            )}

                            {/* Meta */}
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>{drill.estimated_duration_minutes} min</span>
                              <span>{drill.ecci_focus?.length || 0} skills assessed</span>
                              {hasProgress && bestScore && bestScore > 0 && (
                                <span className="text-emerald-400">Best: {bestScore}%</span>
                              )}
                              {drill.user_progress?.total_completions && drill.user_progress.total_completions > 0 && (
                                <span className="text-violet-400">
                                  {drill.user_progress.total_completions} {drill.user_progress.total_completions === 1 ? 'completion' : 'completions'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="flex-shrink-0 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Timer Info */}
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Timed decisions simulate real-world pressure. Debrief with Elya after each scenario.</span>
                </div>
              </div>
            )}

            {/* Quick Practice */}
            <button
              onClick={() => router.push("/drills/quick_practice")}
              className="w-full rounded-xl border border-teal-500/50 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 p-6 hover:from-teal-500/20 hover:to-emerald-500/20 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="text-left flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-teal-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-teal-400 mb-1">Quick Practice</h3>
                    <p className="text-sm text-slate-300">5 random drills to sharpen your skills</p>
                  </div>
                </div>
                <svg className="w-8 h-8 text-teal-400 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </div>
            </button>

            {/* Drill Categories - Dynamic */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Practice by Category</h2>
                <span className="text-sm text-slate-400">
                  {totalDrillsAvailable} scenarios available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drillCategories.map((category) => {
                  const color = getCategoryColor(category.color_scheme);
                  const hasProgress = category.userCompleted > 0;

                  return (
                    <div
                      key={category.id}
                      onClick={() => router.push(`/drills/${category.category_code}`)}
                      className={`rounded-xl border ${color.border} ${color.bg} p-5 hover:border-opacity-60 transition-all cursor-pointer group relative overflow-hidden`}
                    >
                      {/* Progress bar background */}
                      {hasProgress && (
                        <div
                          className={`absolute bottom-0 left-0 h-1 ${color.accent} opacity-50`}
                          style={{ width: `${(category.userCompleted / category.drillCount) * 100}%` }}
                        />
                      )}

                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg ${color.bg} border ${color.border} flex items-center justify-center`}>
                          <div className={`w-4 h-4 rounded-full ${color.accent}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold text-slate-100 group-hover:${color.text} transition-colors`}>
                            {category.title}
                          </h3>
                          <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                            {category.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">
                            {category.drillCount} {category.drillCount === 1 ? 'drill' : 'drills'}
                          </span>
                          {hasProgress && (
                            <span className={`${color.text} font-medium`}>
                              {category.userCompleted} done
                              {category.userAccuracy > 0 && ` • ${Math.round(category.userAccuracy)}% accuracy`}
                            </span>
                          )}
                        </div>
                        <span className={`${color.text} group-hover:translate-x-1 transition-transform`}>
                          {hasProgress ? 'Continue' : 'Start'} →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {drillCategories.length === 0 && (
                <div className="text-center py-12 rounded-xl border border-slate-800 bg-slate-900/50">
                  <p className="text-slate-400">Loading drill categories...</p>
                </div>
              )}
            </div>

            {/* How It Works - Enhanced */}
            <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-violet-500/10 p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">
                How Drills Work
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">Face Real Scenarios</p>
                    <p className="text-slate-400 text-xs mt-1">Each drill presents a realistic interpreting situation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-violet-400 font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">Make Your Decision</p>
                    <p className="text-slate-400 text-xs mt-1">Choose your response and rate your confidence</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">Learn & Grow</p>
                    <p className="text-slate-400 text-xs mt-1">Get detailed feedback and track your improvement</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
