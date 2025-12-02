"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

// Feelings that suggest Elya should offer to listen
const needsSupportFeelings = ['drained', 'overwhelmed'];

export default function WellnessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [wellnessStats, setWellnessStats] = useState<any>(null);
  const [showFreeWritePrompt, setShowFreeWritePrompt] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

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
          hours_worked_this_week: thisWeekHours,
          rest_days_this_month: restDays,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Reload wellness data to update stats
        await loadWellnessData(userData.id);
        // Show Free Write prompt after check-in, especially for difficult feelings
        setJustCheckedIn(true);
        if (needsSupportFeelings.includes(feeling)) {
          setShowFreeWritePrompt(true);
        }
      } else {
        console.error("Error saving check-in:", data.error);
      }
    } catch (error) {
      console.error("Error saving check-in:", error);
    } finally {
      setSaving(false);
    }
  };

  // Get contextual message for Free Write based on current feeling
  const getFreeWriteMessage = () => {
    if (selectedFeeling === 'overwhelmed') {
      return "It sounds like you're carrying a lot right now. Would you like to talk it through?";
    } else if (selectedFeeling === 'drained') {
      return "Sometimes we need space to process. I'm here to listen if you want to share.";
    } else if (selectedFeeling === 'okay') {
      return "Even when things are okay, it can help to check in with yourself.";
    } else {
      return "Sometimes it helps to write things out, even when nothing specific is wrong.";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  // Simple mock data - will be replaced with real calculations
  const thisWeekHours = 28;
  const restDays = 2;
  const overallFeeling = "Doing well";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NavBar />

      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-8">
        {/* Simple Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
            Wellness
          </h1>
          <p className="text-slate-300">Check in with yourself</p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto">

          {/* How are you feeling? - Large box */}
          <div className="md:col-span-2 md:row-span-2 rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-transparent p-8">
            <h2 className="text-2xl font-bold text-slate-50 mb-6">How are you feeling?</h2>
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => handleFeelingClick('energized')}
                disabled={saving}
                className={`flex-1 py-6 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all ${
                  selectedFeeling === 'energized' ? 'border-emerald-500 bg-emerald-500/10 scale-105' : ''
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`text-4xl mb-2 ${selectedFeeling === 'energized' ? 'animate-bounce' : ''}`}>😊</div>
                <div className="text-sm text-slate-300">Energized</div>
              </button>
              <button
                onClick={() => handleFeelingClick('calm')}
                disabled={saving}
                className={`flex-1 py-6 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:border-teal-500 hover:bg-teal-500/10 transition-all ${
                  selectedFeeling === 'calm' ? 'border-teal-500 bg-teal-500/10 scale-105' : ''
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`text-4xl mb-2 ${selectedFeeling === 'calm' ? 'animate-pulse' : ''}`}>😌</div>
                <div className="text-sm text-slate-300">Calm</div>
              </button>
              <button
                onClick={() => handleFeelingClick('okay')}
                disabled={saving}
                className={`flex-1 py-6 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:border-amber-500 hover:bg-amber-500/10 transition-all ${
                  selectedFeeling === 'okay' ? 'border-amber-500 bg-amber-500/10 scale-105' : ''
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-4xl mb-2">😐</div>
                <div className="text-sm text-slate-300">Okay</div>
              </button>
              <button
                onClick={() => handleFeelingClick('drained')}
                disabled={saving}
                className={`flex-1 py-6 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:border-rose-500 hover:bg-rose-500/10 transition-all ${
                  selectedFeeling === 'drained' ? 'border-rose-500 bg-rose-500/10 scale-105' : ''
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`text-4xl mb-2 ${selectedFeeling === 'drained' ? 'animate-pulse' : ''}`}>😮‍💨</div>
                <div className="text-sm text-slate-300">Drained</div>
              </button>
              <button
                onClick={() => handleFeelingClick('overwhelmed')}
                disabled={saving}
                className={`flex-1 py-6 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:border-orange-500 hover:bg-orange-500/10 transition-all ${
                  selectedFeeling === 'overwhelmed' ? 'border-orange-500 bg-orange-500/10 scale-105' : ''
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`text-4xl mb-2 ${selectedFeeling === 'overwhelmed' ? 'animate-pulse' : ''}`}>😓</div>
                <div className="text-sm text-slate-300">Overwhelmed</div>
              </button>
            </div>
            {saving && (
              <p className="text-xs text-slate-500 mb-4 text-center">Saving your check-in...</p>
            )}
            {!saving && selectedFeeling && (
              <p className="text-xs text-emerald-400 mb-4 text-center">✓ Check-in saved</p>
            )}
            <p className="text-sm text-slate-300 italic">Your responses help us understand your wellness patterns</p>
          </div>

          {/* Free Write Card - Prominent when user needs support */}
          {showFreeWritePrompt && needsSupportFeelings.includes(selectedFeeling || '') ? (
            <div className="md:col-span-1 md:row-span-2 rounded-2xl border-2 border-rose-500/70 bg-gradient-to-br from-rose-500/20 to-purple-500/10 p-6 animate-pulse-slow">
              <div className="text-3xl mb-3">💭</div>
              <h3 className="text-lg font-semibold text-slate-50 mb-3">Talk to Elya</h3>
              <p className="text-sm text-slate-300 mb-4">
                {getFreeWriteMessage()}
              </p>
              <p className="text-xs text-slate-400 mb-4">
                No agenda. No action items. Just a safe space to process.
              </p>
              <button
                onClick={() => router.push(`/wellness/free-write?feeling=${selectedFeeling}`)}
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-400 hover:to-purple-400 text-white text-sm font-semibold transition-all"
              >
                Start Free Write
              </button>
              <button
                onClick={() => setShowFreeWritePrompt(false)}
                className="w-full mt-2 px-4 py-2 text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                Maybe later
              </button>
            </div>
          ) : (
            /* Free Write Card - Standard version always visible */
            <div className="rounded-2xl border border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-rose-500/5 p-6">
              <div className="text-3xl mb-3">✍️</div>
              <h3 className="text-lg font-semibold text-slate-50 mb-2">Free Write</h3>
              <p className="text-sm text-slate-300 mb-4">
                {justCheckedIn ? getFreeWriteMessage() : "Process thoughts that don't fit a box"}
              </p>
              <button
                onClick={() => router.push(`/wellness/free-write${selectedFeeling ? `?feeling=${selectedFeeling}` : ''}`)}
                className="text-sm text-purple-300 hover:text-purple-200 font-medium"
              >
                Open journal →
              </button>
            </div>
          )}

          {/* This week */}
          <div className="rounded-2xl border border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-transparent p-6">
            <p className="text-xs font-semibold text-violet-300 mb-2 uppercase tracking-wider">This Week</p>
            <p className="text-4xl font-bold text-slate-50 mb-1">{thisWeekHours}</p>
            <p className="text-sm text-slate-400">hours worked</p>
          </div>

          {/* Rest days */}
          <div className="rounded-2xl border border-teal-500/50 bg-gradient-to-br from-teal-500/10 to-transparent p-6">
            <p className="text-xs font-semibold text-teal-300 mb-2 uppercase tracking-wider">This Month</p>
            <p className="text-4xl font-bold text-slate-50 mb-1">{restDays}</p>
            <p className="text-sm text-slate-400">rest days</p>
          </div>

          {/* Quick reminder */}
          <div className="md:col-span-2 rounded-2xl border border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-transparent p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💙</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-50 mb-2">Remember to rest</h3>
                <p className="text-sm text-slate-300 mb-4">
                  You've worked {thisWeekHours} hours this week. Consider taking a break soon to recharge.
                </p>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="rounded-2xl border border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-transparent p-6">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-lg font-semibold text-slate-50 mb-2">Resources</h3>
            <p className="text-sm text-slate-300 mb-4">Self-care tips for interpreters</p>
            <button className="text-sm text-purple-300 hover:text-purple-200 font-medium">
              View guides →
            </button>
          </div>

          {/* Community support */}
          <div className="md:col-span-3 rounded-2xl border border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🤝</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-50 mb-2">Connect with the community</h3>
                <p className="text-sm text-slate-300 mb-4">
                  Join other interpreters in sharing wellness tips and supporting each other's professional journey.
                </p>
                <button
                  onClick={() => router.push('/community')}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition-all"
                >
                  Visit Community
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
