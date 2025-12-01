"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

export default function WellnessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

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
          <p className="text-slate-400">Check in with yourself</p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto">

          {/* How are you feeling? - Large box */}
          <div className="md:col-span-2 md:row-span-2 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-8">
            <h2 className="text-2xl font-bold text-slate-50 mb-6">How are you feeling?</h2>
            <div className="flex gap-4 mb-8">
              <button className="flex-1 py-6 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all">
                <div className="text-4xl mb-2">😊</div>
                <div className="text-sm text-slate-300">Great</div>
              </button>
              <button className="flex-1 py-6 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:border-teal-500 hover:bg-teal-500/10 transition-all">
                <div className="text-4xl mb-2">😌</div>
                <div className="text-sm text-slate-300">Good</div>
              </button>
              <button className="flex-1 py-6 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:border-amber-500 hover:bg-amber-500/10 transition-all">
                <div className="text-4xl mb-2">😐</div>
                <div className="text-sm text-slate-300">Okay</div>
              </button>
              <button className="flex-1 py-6 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:border-rose-500 hover:bg-rose-500/10 transition-all">
                <div className="text-4xl mb-2">😟</div>
                <div className="text-sm text-slate-300">Tired</div>
              </button>
            </div>
            <p className="text-sm text-slate-400 italic">Your responses help us understand your wellness patterns</p>
          </div>

          {/* This week */}
          <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-transparent p-6">
            <p className="text-xs font-semibold text-violet-300 mb-2 uppercase tracking-wider">This Week</p>
            <p className="text-4xl font-bold text-slate-50 mb-1">{thisWeekHours}</p>
            <p className="text-sm text-slate-400">hours worked</p>
          </div>

          {/* Rest days */}
          <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-transparent p-6">
            <p className="text-xs font-semibold text-teal-300 mb-2 uppercase tracking-wider">This Month</p>
            <p className="text-4xl font-bold text-slate-50 mb-1">{restDays}</p>
            <p className="text-sm text-slate-400">rest days</p>
          </div>

          {/* Quick reminder */}
          <div className="md:col-span-2 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💙</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-50 mb-2">Remember to rest</h3>
                <p className="text-sm text-slate-400 mb-4">
                  You've worked {thisWeekHours} hours this week. Consider taking a break soon to recharge.
                </p>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent p-6">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-lg font-semibold text-slate-50 mb-2">Resources</h3>
            <p className="text-sm text-slate-400 mb-4">Self-care tips for interpreters</p>
            <button className="text-sm text-purple-300 hover:text-purple-200 font-medium">
              View guides →
            </button>
          </div>

          {/* Community support */}
          <div className="md:col-span-3 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🤝</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-50 mb-2">Connect with the community</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Join other interpreters in sharing wellness tips and supporting each other's professional journey.
                </p>
                <button className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition-all">
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
