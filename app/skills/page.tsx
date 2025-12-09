"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

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

export default function SkillsPracticePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userTier, setUserTier] = useState<string>("free");
  const [drillCategories, setDrillCategories] = useState<DrillCategory[]>([]);
  const [userDrillStats, setUserDrillStats] = useState<UserDrillStats | null>(null);
  const [scenarioDrills, setScenarioDrills] = useState<ScenarioDrill[]>([]);
  const [selectedTab, setSelectedTab] = useState<"scenarios" | "categories">("scenarios");

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

    // Check user's subscription tier
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", session.user.id)
      .single();

    const tier = profile?.subscription_tier || "free";
    setUserTier(tier);

    // If FREE tier, don't load drill data (they'll see upgrade prompt)
    if (tier === "free") {
      setLoading(false);
      return;
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

  const getReadinessLevel = (score: number) => {
    if (score >= 80) return { label: "Expert", color: "text-emerald-400", bg: "bg-emerald-500" };
    if (score >= 60) return { label: "Proficient", color: "text-teal-400", bg: "bg-teal-500" };
    if (score >= 40) return { label: "Developing", color: "text-amber-400", bg: "bg-amber-500" };
    if (score > 0) return { label: "Beginner", color: "text-slate-400", bg: "bg-slate-500" };
    return { label: "New", color: "text-slate-500", bg: "bg-slate-600" };
  };

  // Calculate stats
  const totalDrillsAvailable = drillCategories.reduce((sum, cat) => sum + cat.drillCount, 0);
  const totalCompleted = drillCategories.reduce((sum, cat) => sum + cat.userCompleted, 0);
  const accuracy = userDrillStats && userDrillStats.total_attempts > 0
    ? Math.round((userDrillStats.correct_count / userDrillStats.total_attempts) * 100)
    : 0;
  const readiness = getReadinessLevel(userDrillStats?.readiness_score || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  // FREE tier upgrade prompt
  if (userTier === "free") {
    return (
      <div className="min-h-screen bg-slate-950">
        <NavBar />
        <div className="container mx-auto max-w-4xl px-4 md:px-6 py-6 md:py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Skills Practice</h1>
            </div>
            <p className="text-sm text-slate-400 ml-13">Build your interpreter decision-making skills</p>
          </div>

          {/* Upgrade Card */}
          <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Unlock Practice Drills</h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Practice drills are available for Growth and Pro subscribers. Build your decision-making skills with realistic scenarios.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => router.push("/settings?tab=billing")}
                className="px-6 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-medium transition-colors"
              >
                Upgrade to Growth - $15/mo
              </button>
              <button
                onClick={() => router.push("/settings?tab=billing")}
                className="px-6 py-2.5 rounded-lg border border-purple-500/50 text-purple-300 hover:bg-purple-500/10 font-medium transition-colors"
              >
                Go Pro - $30/mo
              </button>
            </div>
          </div>

          {/* What's Included */}
          <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h3 className="text-sm font-medium text-slate-300 mb-4">What's included:</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {[
                "Scenario-based practice drills",
                "Readiness score tracking",
                "Multiple skill categories",
                "Instant feedback & explanations"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-400">
                  <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        {/* Header with Readiness Score */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Skills Practice</h1>
            </div>
            <p className="text-sm text-slate-400">Build your interpreter decision-making skills</p>
          </div>

          {/* Readiness Score Card */}
          <div className="flex items-center gap-4 px-5 py-4 rounded-xl border border-slate-700 bg-slate-900/50">
            <div className="text-center">
              <div className={`text-3xl font-bold ${readiness.color}`}>
                {userDrillStats?.readiness_score || '--'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Readiness</div>
            </div>
            <div className="w-px h-10 bg-slate-700"></div>
            <div className="space-y-1">
              <div className={`text-sm font-medium ${readiness.color}`}>{readiness.label}</div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{userDrillStats?.total_attempts || 0} drills</span>
                <span>{accuracy}% accuracy</span>
                {userDrillStats?.current_streak ? (
                  <span className="text-amber-400">{userDrillStats.current_streak} day streak</span>
                ) : null}
              </div>
            </div>
            <button
              onClick={() => router.push("/drills/quick_practice")}
              className="ml-4 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Quick Practice
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 p-1 rounded-lg bg-slate-800/50 w-fit">
          {[
            { key: "scenarios", label: "Scenarios", count: scenarioDrills.length },
            { key: "categories", label: "Categories", count: drillCategories.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                selectedTab === tab.key
                  ? "bg-violet-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Scenarios Tab */}
        {selectedTab === "scenarios" && (
          <div className="space-y-3">
            {scenarioDrills.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-dashed border-slate-700 bg-slate-900/30">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-300 mb-1">No scenarios yet</h3>
                <p className="text-sm text-slate-500">Check back soon for interactive scenario drills</p>
              </div>
            ) : (
              scenarioDrills.map((drill) => {
                const hasProgress = drill.user_progress && drill.user_progress.total_completions > 0;
                const bestScore = drill.user_progress?.best_scores
                  ? Math.max(...Object.values(drill.user_progress.best_scores).filter(v => typeof v === 'number'), 0)
                  : null;

                return (
                  <div
                    key={drill.id}
                    onClick={() => router.push(`/skills/drill/${drill.slug}`)}
                    className="group rounded-xl border border-slate-700 bg-slate-900/50 p-4 hover:border-violet-500/50 hover:bg-slate-800/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {/* Play Icon */}
                      <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                        <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-100 group-hover:text-violet-300 transition-colors">
                            {drill.title}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700/50 text-slate-400 capitalize">
                            {drill.category}
                          </span>
                        </div>
                        {drill.subtitle && (
                          <p className="text-sm text-slate-400 line-clamp-1">{drill.subtitle}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {drill.estimated_duration_minutes} min
                          </span>
                          <span>{drill.ecci_focus?.length || 0} skills assessed</span>
                        </div>
                      </div>

                      {/* Progress/Score */}
                      <div className="flex items-center gap-3">
                        {hasProgress && bestScore && bestScore > 0 && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-emerald-400">{bestScore}%</div>
                            <div className="text-xs text-slate-500">best score</div>
                          </div>
                        )}
                        {drill.user_progress?.total_completions && drill.user_progress.total_completions > 0 && (
                          <div className="px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20">
                            <div className="text-sm font-medium text-violet-400">{drill.user_progress.total_completions}x</div>
                          </div>
                        )}
                        <svg className="w-5 h-5 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Categories Tab */}
        {selectedTab === "categories" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drillCategories.length === 0 ? (
              <div className="col-span-2 text-center py-16 rounded-xl border border-dashed border-slate-700 bg-slate-900/30">
                <p className="text-slate-400">Loading categories...</p>
              </div>
            ) : (
              drillCategories.map((category) => {
                const color = getCategoryColor(category.color_scheme);
                const hasProgress = category.userCompleted > 0;
                const progress = category.drillCount > 0
                  ? Math.round((category.userCompleted / category.drillCount) * 100)
                  : 0;

                return (
                  <div
                    key={category.id}
                    onClick={() => router.push(`/drills/${category.category_code}`)}
                    className={`group rounded-xl border ${color.border} ${color.bg} p-5 hover:border-opacity-60 transition-all cursor-pointer relative overflow-hidden`}
                  >
                    {/* Progress bar at bottom */}
                    {hasProgress && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/50">
                        <div
                          className={`h-full ${color.accent} opacity-60`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl ${color.bg} border ${color.border} flex items-center justify-center text-lg`}>
                        {category.icon_emoji || '📚'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-slate-100 group-hover:${color.text} transition-colors mb-1`}>
                          {category.title}
                        </h3>
                        <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                          {category.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-slate-500">{category.drillCount} drills</span>
                            {hasProgress && (
                              <>
                                <span className={color.text}>{category.userCompleted} done</span>
                                {category.userAccuracy > 0 && (
                                  <span className="text-emerald-400">{Math.round(category.userAccuracy)}%</span>
                                )}
                              </>
                            )}
                          </div>
                          <span className={`text-sm font-medium ${color.text} group-hover:translate-x-1 transition-transform`}>
                            {hasProgress ? 'Continue' : 'Start'} →
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* CEU Link */}
        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-200">Earn CEU Credits</p>
                <p className="text-sm text-slate-400">Complete RID-approved workshops for certification</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/ceu")}
              className="px-5 py-2.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 text-sm font-medium transition-colors"
            >
              Browse Workshops
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
