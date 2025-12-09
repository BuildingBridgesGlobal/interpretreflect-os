"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ScenarioDrill from "@/components/ScenarioDrill";

type Difficulty = "practice" | "standard" | "pressure" | "expert";

interface AttemptResult {
  decisions_made: Array<{
    decision_point_id: string;
    option_chosen: string;
    time_taken_ms: number;
    timed_out: boolean;
  }>;
  consequence_flags: Record<string, boolean>;
  scores: Record<string, number>;
  total_score: number;
  percentage_score: number;
  ending_id: string;
  total_time_ms: number;
  timeouts_count: number;
}

export default function ScenarioDrillPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("practice");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<AttemptResult | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadScenario();
  }, [slug]);

  const loadScenario = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }

      const response = await fetch(`/api/drills/scenario?slug=${slug}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load scenario");
      }

      const data = await response.json();
      setScenario(data.scenario);
      setProgress(data.progress);
      setRecentAttempts(data.recent_attempts || []);

      // Set default difficulty to highest unlocked
      const unlocked = data.progress?.unlocked_difficulties || ["practice"];
      if (unlocked.includes("expert")) {
        setSelectedDifficulty("expert");
      } else if (unlocked.includes("pressure")) {
        setSelectedDifficulty("pressure");
      } else if (unlocked.includes("standard")) {
        setSelectedDifficulty("standard");
      } else {
        setSelectedDifficulty("practice");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = useCallback(async (result: AttemptResult) => {
    setLastResult(result);
    setIsPlaying(false);
    setShowResult(true);
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/drills/scenario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "complete",
          scenario_id: scenario.id,
          difficulty: selectedDifficulty,
          attempt_data: result,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Check for new unlocks
        if (data.progress_update?.new_unlocks?.length > 0) {
          // Reload progress to get updated unlocks
          await loadScenario();
        }
      }
    } catch (err) {
      console.error("Failed to save attempt:", err);
    } finally {
      setSaving(false);
    }
  }, [scenario, selectedDifficulty]);

  const handleExit = useCallback(() => {
    if (isPlaying) {
      // Confirm exit during gameplay
      if (confirm("Are you sure you want to exit? Your progress will be lost.")) {
        setIsPlaying(false);
        router.push("/skills?tab=drill");
      }
    } else {
      router.push("/skills?tab=drill");
    }
  }, [isPlaying, router]);

  const handleDebrief = useCallback(() => {
    // Navigate to Elya with debrief context
    router.push(`/dashboard?debrief=scenario&scenario_id=${scenario.id}`);
  }, [router, scenario]);

  const startScenario = () => {
    setIsPlaying(true);
    setShowResult(false);
    setLastResult(null);
  };

  const getDifficultyConfig = (diff: Difficulty) => {
    const configs = {
      practice: {
        label: "Practice",
        time: scenario?.timer_settings?.practice || 45,
        color: "emerald",
        description: "Learn the scenario with generous time",
      },
      standard: {
        label: "Standard",
        time: scenario?.timer_settings?.standard || 25,
        color: "blue",
        description: "Realistic decision timing",
      },
      pressure: {
        label: "Pressure",
        time: scenario?.timer_settings?.pressure || 15,
        color: "orange",
        description: "Test under time pressure",
      },
      expert: {
        label: "Expert",
        time: scenario?.timer_settings?.expert || 10,
        color: "red",
        description: "Split-second decisions",
      },
    };
    return configs[diff];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading scenario...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push("/skills?tab=drill")}
            className="text-teal-400 hover:text-teal-300"
          >
            &larr; Back to Skills
          </button>
        </div>
      </div>
    );
  }

  // Playing the scenario
  if (isPlaying && scenario) {
    return (
      <ScenarioDrill
        scenario={scenario}
        difficulty={selectedDifficulty}
        unlockedDifficulties={progress?.unlocked_difficulties || ["practice"]}
        onComplete={handleComplete}
        onExit={handleExit}
      />
    );
  }

  // Show result
  if (showResult && lastResult) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Scenario Complete!</h1>
            <p className="text-slate-400">{scenario?.title}</p>
          </div>

          {/* Score */}
          <div className="flex justify-center mb-8">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#374151"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={
                    lastResult.percentage_score >= 80
                      ? "#10b981"
                      : lastResult.percentage_score >= 60
                      ? "#f59e0b"
                      : "#ef4444"
                  }
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (lastResult.percentage_score / 100) * 440}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">
                  {Math.round(lastResult.percentage_score)}
                </span>
                <span className="text-sm text-slate-400">out of 100</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{lastResult.decisions_made.length}</p>
              <p className="text-sm text-slate-400">Decisions</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">
                {Math.round(lastResult.total_time_ms / 1000)}s
              </p>
              <p className="text-sm text-slate-400">Total Time</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{lastResult.timeouts_count}</p>
              <p className="text-sm text-slate-400">Timeouts</p>
            </div>
          </div>

          {saving && (
            <p className="text-center text-slate-400 mb-4">Saving your results...</p>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                setShowResult(false);
                setLastResult(null);
              }}
              className="flex-1 py-4 bg-slate-700 rounded-xl font-semibold hover:bg-slate-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleDebrief}
              className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all"
            >
              Debrief with Elya
            </button>
          </div>

          <button
            onClick={() => router.push("/skills?tab=drill")}
            className="w-full mt-4 py-3 text-slate-400 hover:text-white transition-colors"
          >
            &larr; Back to Drills
          </button>
        </div>
      </div>
    );
  }

  // Scenario selection/intro screen
  const unlockedDifficulties = progress?.unlocked_difficulties || ["practice"];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push("/skills?tab=drill")}
            className="text-slate-400 hover:text-white transition-colors"
          >
            &larr; Back to Drills
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Scenario Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-400 capitalize">
              {scenario?.category}
            </span>
            {scenario?.is_featured && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                Featured
              </span>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-2">{scenario?.title}</h1>
          {scenario?.subtitle && (
            <p className="text-xl text-slate-400">{scenario.subtitle}</p>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700">
            <p className="text-2xl font-bold text-slate-100">
              {scenario?.estimated_duration_minutes || 10}
            </p>
            <p className="text-sm text-slate-400">minutes</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700">
            <p className="text-2xl font-bold text-slate-100">
              {scenario?.scenario_data?.decision_points?.length || 5}
            </p>
            <p className="text-sm text-slate-400">decisions</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700">
            <p className="text-2xl font-bold text-slate-100">
              {progress?.total_completions || 0}
            </p>
            <p className="text-sm text-slate-400">completions</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700">
            <p className="text-2xl font-bold text-emerald-400">
              {progress?.best_scores?.[selectedDifficulty] || "--"}
            </p>
            <p className="text-sm text-slate-400">best score</p>
          </div>
        </div>

        {/* ECCI Focus */}
        {scenario?.ecci_focus?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-slate-400 mb-3">
              Skills Assessed
            </h3>
            <div className="flex flex-wrap gap-2">
              {scenario.ecci_focus.map((focus: string) => (
                <span
                  key={focus}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-sm capitalize"
                >
                  {focus.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Select Difficulty</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["practice", "standard", "pressure", "expert"] as Difficulty[]).map(
              (diff) => {
                const config = getDifficultyConfig(diff);
                const isUnlocked = unlockedDifficulties.includes(diff);
                const isSelected = selectedDifficulty === diff;
                const bestScore = progress?.best_scores?.[diff];

                return (
                  <button
                    key={diff}
                    onClick={() => isUnlocked && setSelectedDifficulty(diff)}
                    disabled={!isUnlocked}
                    className={`relative p-4 rounded-xl border transition-all ${
                      isSelected
                        ? `border-${config.color}-500 bg-${config.color}-500/10`
                        : isUnlocked
                        ? "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                        : "border-slate-800 bg-slate-900/50 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    {!isUnlocked && (
                      <div className="absolute top-2 right-2">
                        <svg
                          className="w-4 h-4 text-slate-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="text-left">
                      <p className={`font-semibold ${isSelected ? `text-${config.color}-400` : "text-slate-200"}`}>
                        {config.label}
                      </p>
                      <p className="text-sm text-slate-400">{config.time}s per choice</p>
                      {bestScore && (
                        <p className="text-xs text-emerald-400 mt-1">
                          Best: {bestScore}%
                        </p>
                      )}
                    </div>
                  </button>
                );
              }
            )}
          </div>

          {/* Unlock hints */}
          <div className="mt-4 text-sm text-slate-500">
            {!unlockedDifficulties.includes("standard") && (
              <p>Complete at Practice difficulty to unlock Standard</p>
            )}
            {unlockedDifficulties.includes("standard") &&
              !unlockedDifficulties.includes("pressure") && (
                <p>Score 70%+ on Standard to unlock Pressure</p>
              )}
            {unlockedDifficulties.includes("pressure") &&
              !unlockedDifficulties.includes("expert") && (
                <p>Score 80%+ on Pressure to unlock Expert</p>
              )}
          </div>
        </div>

        {/* Recent Attempts */}
        {recentAttempts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Recent Attempts</h3>
            <div className="space-y-2">
              {recentAttempts.map((attempt: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300 capitalize">
                      {attempt.difficulty}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {new Date(attempt.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span
                    className={`font-semibold ${
                      attempt.percentage_score >= 80
                        ? "text-emerald-400"
                        : attempt.percentage_score >= 60
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {Math.round(attempt.percentage_score)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={startScenario}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all transform hover:scale-[1.02] shadow-lg shadow-emerald-500/25"
        >
          Start Scenario
        </button>
      </div>
    </div>
  );
}
