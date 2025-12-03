"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

// Custom animations for feeling emojis
const feelingAnimations = `
  @keyframes energized-glow {
    0%, 100% { transform: scale(1); filter: brightness(1); }
    50% { transform: scale(1.15); filter: brightness(1.3); }
  }
  @keyframes calm-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  @keyframes okay-shrug {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-5deg); }
    75% { transform: rotate(5deg); }
  }
  @keyframes drained-melt {
    0%, 100% { transform: scaleY(1) translateY(0); opacity: 1; }
    50% { transform: scaleY(0.85) translateY(4px); opacity: 0.7; }
  }
  @keyframes overwhelmed-spin {
    0% { transform: rotate(0deg); }
    25% { transform: rotate(15deg); }
    50% { transform: rotate(0deg); }
    75% { transform: rotate(-15deg); }
    100% { transform: rotate(0deg); }
  }
  .animate-energized { animation: energized-glow 0.8s ease-in-out infinite; }
  .animate-calm { animation: calm-float 2s ease-in-out infinite; }
  .animate-okay { animation: okay-shrug 2s ease-in-out infinite; }
  .animate-drained { animation: drained-melt 2s ease-in-out infinite; }
  .animate-overwhelmed { animation: overwhelmed-spin 1s ease-in-out infinite; }
`;

export default function WellnessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [wellnessStats, setWellnessStats] = useState<any>(null);
  const [hoursWorkedThisWeek, setHoursWorkedThisWeek] = useState(0);
  const [restDaysThisMonth, setRestDaysThisMonth] = useState(0);

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

      // Load wellness check-ins
      await loadWellnessData(session.user.id);

      setLoading(false);
    };
    loadUserData();
  }, [router]);

  const loadWellnessData = async (userId: string) => {
    try {
      const response = await fetch(`/api/wellness?user_id=${userId}&days=30`);
      const data = await response.json();
      if (data.success) {
        setWellnessStats(data.stats);
        // Set the most recent feeling if available
        if (data.mostRecent) {
          setSelectedFeeling(data.mostRecent.feeling);
        }
        // Set hours and rest days from real assignment data
        setHoursWorkedThisWeek(data.hoursWorkedThisWeek || 0);
        setRestDaysThisMonth(data.restDaysThisMonth || 0);
      }
    } catch (error) {
      console.error("Error loading wellness data:", error);
    }
  };

  const handleFeelingClick = async (feeling: string) => {
    setSelectedFeeling(feeling);
    setSaving(true);

    try {
      const response = await fetch("/api/wellness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userData.id,
          feeling,
          hours_worked_this_week: hoursWorkedThisWeek,
          rest_days_this_month: restDaysThisMonth,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Reload wellness data to update stats
        await loadWellnessData(userData.id);
      } else {
        console.error("Error saving check-in:", data.error);
      }
    } catch (error) {
      console.error("Error saving check-in:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: feelingAnimations }} />

      {/* Hero-style Background Effects */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)]" />

      <NavBar />

      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-8 relative">
        {/* Simple Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
            Wellness
          </h1>
          <p className="text-slate-300">Check in with yourself</p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-auto">

          {/* How are you feeling? - Large box */}
          <div className="md:col-span-3 rounded-xl border border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
            <h2 className="text-lg font-bold text-slate-50 mb-4">How are you feeling?</h2>
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => handleFeelingClick('energized')}
                disabled={saving}
                className={`flex-1 py-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all ${
                  selectedFeeling === 'energized' ? 'border-emerald-500 bg-emerald-500/10 scale-105' : ''
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`text-2xl mb-1 ${selectedFeeling === 'energized' ? 'animate-energized' : ''}`}>🤩</div>
                <div className="text-xs text-slate-300">Energized</div>
              </button>
              <button
                onClick={() => handleFeelingClick('calm')}
                disabled={saving}
                className={`flex-1 py-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-teal-500 hover:bg-teal-500/10 transition-all ${
                  selectedFeeling === 'calm' ? 'border-teal-500 bg-teal-500/10 scale-105' : ''
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`text-2xl mb-1 ${selectedFeeling === 'calm' ? 'animate-calm' : ''}`}>😌</div>
                <div className="text-xs text-slate-300">Calm</div>
              </button>
              <button
                onClick={() => handleFeelingClick('okay')}
                disabled={saving}
                className={`flex-1 py-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-amber-500 hover:bg-amber-500/10 transition-all ${
                  selectedFeeling === 'okay' ? 'border-amber-500 bg-amber-500/10 scale-105' : ''
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`text-2xl mb-1 ${selectedFeeling === 'okay' ? 'animate-okay' : ''}`}>😐</div>
                <div className="text-xs text-slate-300">Okay</div>
              </button>
              <button
                onClick={() => handleFeelingClick('drained')}
                disabled={saving}
                className={`flex-1 py-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-rose-500 hover:bg-rose-500/10 transition-all ${
                  selectedFeeling === 'drained' ? 'border-rose-500 bg-rose-500/10 scale-105' : ''
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`text-2xl mb-1 ${selectedFeeling === 'drained' ? 'animate-drained' : ''}`}>🫠</div>
                <div className="text-xs text-slate-300">Drained</div>
              </button>
              <button
                onClick={() => handleFeelingClick('overwhelmed')}
                disabled={saving}
                className={`flex-1 py-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-orange-500 hover:bg-orange-500/10 transition-all ${
                  selectedFeeling === 'overwhelmed' ? 'border-orange-500 bg-orange-500/10 scale-105' : ''
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`text-2xl mb-1 ${selectedFeeling === 'overwhelmed' ? 'animate-overwhelmed' : ''}`}>😵‍💫</div>
                <div className="text-xs text-slate-300">Overwhelmed</div>
              </button>
            </div>
            {saving && (
              <p className="text-xs text-slate-500 mb-2 text-center">Saving your check-in...</p>
            )}
            {!saving && selectedFeeling && (
              <p className="text-xs text-emerald-400 mb-2 text-center flex items-center justify-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Check-in saved
              </p>
            )}
            <p className="text-xs text-slate-400 italic">Noticing how you feel builds self-awareness</p>
          </div>

          {/* Stats Column */}
          <div className="flex flex-col gap-4">
            {/* This week */}
            <div className="rounded-xl border border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-transparent p-4">
              <p className="text-xs font-semibold text-violet-300 mb-1 uppercase tracking-wider">This Week</p>
              <p className="text-2xl font-bold text-slate-50">{hoursWorkedThisWeek}</p>
              <p className="text-xs text-slate-400">hours worked</p>
            </div>

            {/* Rest days */}
            <div className="rounded-xl border border-teal-500/50 bg-gradient-to-br from-teal-500/10 to-transparent p-4">
              <p className="text-xs font-semibold text-teal-300 mb-1 uppercase tracking-wider">This Month</p>
              <p className="text-2xl font-bold text-slate-50">{restDaysThisMonth}</p>
              <p className="text-xs text-slate-400">rest days</p>
            </div>
          </div>

          {/* Quick reminder */}
          <div className="md:col-span-2 rounded-xl border border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-transparent p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30 flex-shrink-0"></div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-50 mb-1">Remember to rest</h3>
                <p className="text-xs text-slate-300">
                  {hoursWorkedThisWeek > 0
                    ? `You've worked ${hoursWorkedThisWeek} hours this week. Consider taking a break soon.`
                    : "Taking time to recharge helps you show up at your best."}
                </p>
              </div>
            </div>
          </div>

          {/* Build Your Skills */}
          <div className="rounded-xl border border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-transparent p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg shadow-purple-500/30 flex-shrink-0"></div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-50 mb-1">Build Your Skills</h3>
                <p className="text-xs text-slate-300 mb-2">Nervous system regulation</p>
                <button
                  onClick={() => router.push('/skills')}
                  className="text-xs text-purple-300 hover:text-purple-200 font-medium"
                >
                  Explore →
                </button>
              </div>
            </div>
          </div>

          {/* Community support */}
          <div className="rounded-xl border border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 flex-shrink-0"></div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-50 mb-1">Community</h3>
                <p className="text-xs text-slate-300 mb-2">Connect with other interpreters</p>
                <button
                  onClick={() => router.push('/community')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-all"
                >
                  Visit
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
