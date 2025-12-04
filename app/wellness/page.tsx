"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import { motion } from "framer-motion";

const feelings = [
  { id: "energized", label: "Energized", color: "emerald", description: "Ready to take on the world" },
  { id: "calm", label: "Calm", color: "teal", description: "Feeling balanced and at peace" },
  { id: "okay", label: "Okay", color: "amber", description: "Neutral, getting by" },
  { id: "overwhelmed", label: "Overwhelmed", color: "orange", description: "Too much to process" },
  { id: "drained", label: "Drained", color: "rose", description: "Running on empty" },
];

const colorClasses: Record<string, { border: string; bg: string; text: string; hover: string; dot: string }> = {
  emerald: { border: "border-emerald-500/50", bg: "bg-emerald-500/10", text: "text-emerald-400", hover: "hover:border-emerald-500 hover:bg-emerald-500/20", dot: "bg-emerald-400" },
  teal: { border: "border-teal-500/50", bg: "bg-teal-500/10", text: "text-teal-400", hover: "hover:border-teal-500 hover:bg-teal-500/20", dot: "bg-teal-400" },
  amber: { border: "border-amber-500/50", bg: "bg-amber-500/10", text: "text-amber-400", hover: "hover:border-amber-500 hover:bg-amber-500/20", dot: "bg-amber-400" },
  rose: { border: "border-rose-500/50", bg: "bg-rose-500/10", text: "text-rose-400", hover: "hover:border-rose-500 hover:bg-rose-500/20", dot: "bg-rose-400" },
  orange: { border: "border-orange-500/50", bg: "bg-orange-500/10", text: "text-orange-400", hover: "hover:border-orange-500 hover:bg-orange-500/20", dot: "bg-orange-400" },
};

// Map feeling to color
const feelingToColor: Record<string, string> = {
  energized: "emerald",
  calm: "teal",
  okay: "amber",
  drained: "rose",
  overwhelmed: "orange",
};

// Map feeling to vertical position (for trend chart)
const feelingToPosition: Record<string, number> = {
  energized: 0,
  calm: 1,
  okay: 2,
  overwhelmed: 3,
  drained: 4,
};

type TrendDataPoint = {
  date: string;
  feeling: string | null;
  assignment_type: string | null;
};

export default function WellnessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [wasUpdated, setWasUpdated] = useState(false);
  const [hoursWorkedThisWeek, setHoursWorkedThisWeek] = useState(0);
  const [restDaysThisMonth, setRestDaysThisMonth] = useState(0);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [todayCheckin, setTodayCheckin] = useState<any>(null);
  const [cooldown, setCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

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
        // Set the most recent feeling if available
        if (data.todayCheckin) {
          setSelectedFeeling(data.todayCheckin.feeling);
          setTodayCheckin(data.todayCheckin);
        } else if (data.mostRecent) {
          setSelectedFeeling(data.mostRecent.feeling);
        }
        // Set hours and rest days from real assignment data
        setHoursWorkedThisWeek(data.hoursWorkedThisWeek || 0);
        setRestDaysThisMonth(data.restDaysThisMonth || 0);
        // Set trend data for chart
        if (data.trendData) {
          setTrendData(data.trendData);
        }
        // Set insights
        if (data.insights) {
          setInsights(data.insights);
        }
      }
    } catch (error) {
      console.error("Error loading wellness data:", error);
    }
  };

  const handleFeelingClick = async (feeling: string) => {
    // Prevent spam clicking - require 5 second cooldown between changes
    if (cooldown || saving) return;

    setSelectedFeeling(feeling);
    setSaving(true);
    setWasUpdated(false);

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
        setWasUpdated(data.updated);
        setTodayCheckin(data.checkin);

        // Immediately update the trend data locally for today's entry
        // Use the last entry in trendData (which is always "today" from the API)
        setTrendData(prevTrend => {
          if (prevTrend.length === 0) return prevTrend;
          // Update the last point (today) in the trend data
          const updated = [...prevTrend];
          updated[updated.length - 1] = { ...updated[updated.length - 1], feeling };
          return updated;
        });

        // Start cooldown timer (5 seconds)
        setCooldown(true);
        setCooldownSeconds(5);
        const timer = setInterval(() => {
          setCooldownSeconds(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              setCooldown(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Reload wellness data to get fresh stats
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

  // Format date for trend chart
  const formatTrendDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
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
      {/* Hero-style Background Effects - matching other pages */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-400/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(16,185,129,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.08)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)]" />

      <NavBar />

      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-8 relative">
        {/* Hero Header - consistent with other pages */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
            Wellness
          </h1>
          <p className="text-slate-300 text-lg">
            Taking care of yourself helps you show up for others. Check in with how you're feeling.
          </p>
        </motion.div>

        {/* Main Layout: Two Column */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Main Content Area */}
          <div className="flex-1 space-y-6">

            {/* Daily Check-In Card */}
            <motion.div
              className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-50">How are you feeling today?</h2>
                  {todayCheckin && (
                    <p className="text-xs text-slate-400 mt-1">
                      You can change your answer anytime today
                    </p>
                  )}
                </div>
                {selectedFeeling && !saving && (
                  <span className="flex items-center gap-2 text-xs text-emerald-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {cooldown ? `Change in ${cooldownSeconds}s` : wasUpdated ? "Updated" : "Saved"}
                  </span>
                )}
                {saving && (
                  <span className="flex items-center gap-2 text-xs text-slate-400">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {feelings.map((feeling) => {
                  const colors = colorClasses[feeling.color];
                  const isSelected = selectedFeeling === feeling.id;
                  const isDisabled = saving || (cooldown && !isSelected);

                  return (
                    <motion.button
                      key={feeling.id}
                      onClick={() => handleFeelingClick(feeling.id)}
                      disabled={isDisabled}
                      className={`relative p-4 rounded-xl border transition-all ${
                        isSelected
                          ? `${colors.border} ${colors.bg} ring-2 ring-${feeling.color}-400/50`
                          : `border-slate-700 bg-slate-800/50 ${isDisabled ? '' : colors.hover}`
                      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      whileHover={isDisabled ? {} : { scale: 1.02 }}
                      whileTap={isDisabled ? {} : { scale: 0.98 }}
                    >
                      <div className={`text-sm font-semibold mb-1 ${isSelected ? colors.text : 'text-slate-200'}`}>
                        {feeling.label}
                      </div>
                      <div className="text-xs text-slate-400">
                        {feeling.description}
                      </div>
                      {isSelected && (
                        <motion.div
                          className={`absolute top-2 right-2 w-2 h-2 rounded-full ${colors.dot}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <p className="text-xs text-slate-500 mt-4 italic">
                Check-ins are limited to once per day to help you build a consistent practice.
              </p>
            </motion.div>

            {/* Talk to Elya Card */}
            <motion.div
              className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 shadow-lg shadow-violet-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-50 mb-2">Need to talk?</h3>
                  <p className="text-sm text-slate-300 mb-4">
                    {selectedFeeling === 'drained' || selectedFeeling === 'overwhelmed'
                      ? "It sounds like you're carrying a lot. Elya is here to help you process what you're feeling."
                      : "Elya can help you process your day, work through difficult assignments, or just be a space to reflect."}
                  </p>
                  <motion.button
                    onClick={() => router.push('/dashboard?mode=free-write')}
                    className="px-5 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-500/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Open Free Write
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Weekly Insights Card */}
            <motion.div
              className="rounded-xl border border-slate-700 bg-slate-800/30 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-slate-50 mb-4">This Week</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-4">
                  <p className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-1">Hours Worked</p>
                  <p className="text-3xl font-bold text-slate-50">{hoursWorkedThisWeek}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {hoursWorkedThisWeek > 30 ? "Consider taking a break" : "Balanced workload"}
                  </p>
                </div>

                <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-4">
                  <p className="text-xs font-semibold text-teal-300 uppercase tracking-wider mb-1">Rest Days This Month</p>
                  <p className="text-3xl font-bold text-slate-50">{restDaysThisMonth}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {restDaysThisMonth < 4 ? "Schedule some rest" : "Good self-care!"}
                  </p>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Right Sidebar */}
          <motion.div
            className="lg:w-80 space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {/* Mood Trend Chart */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Last 14 Days</h4>

              {/* Simple dot chart */}
              <div className="relative h-24 mb-2">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-slate-500 py-1">
                  <span>Great</span>
                  <span></span>
                  <span>Okay</span>
                  <span></span>
                  <span>Tough</span>
                </div>

                {/* Chart area */}
                <div className="ml-16 h-full flex items-end gap-1">
                  {trendData.length > 0 ? (
                    trendData.map((point, index) => {
                      const hasData = point.feeling !== null;
                      const position = hasData ? feelingToPosition[point.feeling!] : null;
                      const color = hasData ? feelingToColor[point.feeling!] : null;
                      const dotColor = color ? colorClasses[color]?.dot : 'bg-slate-600';

                      // Calculate vertical position (0 = top, 4 = bottom)
                      const bottomPercent = hasData && position !== null ? (100 - (position * 25)) : 0;

                      // Position tooltip to avoid edge cutoff
                      const isLeftEdge = index < 3;
                      const isRightEdge = index > trendData.length - 4;
                      const tooltipPosition = isLeftEdge
                        ? 'left-0'
                        : isRightEdge
                          ? 'right-0'
                          : 'left-1/2 -translate-x-1/2';

                      return (
                        <div key={index} className="flex-1 relative h-full group">
                          {hasData ? (
                            <motion.div
                              className={`absolute w-2 h-2 rounded-full ${dotColor} left-1/2 -translate-x-1/2`}
                              style={{ bottom: `${bottomPercent}%` }}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: index * 0.03 }}
                            />
                          ) : (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-slate-700" />
                          )}
                          {/* Tooltip with edge-aware positioning */}
                          <div className={`absolute bottom-full ${tooltipPosition} mb-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none`}>
                            {new Date(point.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {hasData && <span className="ml-1 capitalize">- {point.feeling}</span>}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                      Check in to start tracking
                    </div>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700">
                {feelings.map((f) => (
                  <div key={f.id} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${colorClasses[f.color].dot}`}></div>
                    <span className="text-xs text-slate-400">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights Card - only show if we have insights */}
            {insights.length > 0 && (
              <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-purple-400">Patterns</h4>
                </div>
                <ul className="space-y-2">
                  {insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-purple-400 mt-0.5">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Reminder Card */}
            <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-50 mb-1">Remember</h4>
                  <p className="text-xs text-slate-300">
                    {hoursWorkedThisWeek > 25
                      ? `You've worked ${hoursWorkedThisWeek} hours this week. Consider scheduling some rest.`
                      : "Taking time to recharge helps you show up at your best for each assignment."}
                  </p>
                </div>
              </div>
            </div>

            {/* Build Skills Card */}
            <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg shadow-purple-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-50 mb-1">Build Your Skills</h4>
                  <p className="text-xs text-slate-300 mb-3">
                    Learn techniques for nervous system regulation and vicarious trauma prevention.
                  </p>
                  <button
                    onClick={() => router.push('/skills')}
                    className="text-xs text-purple-300 hover:text-purple-200 font-medium transition-colors"
                  >
                    Explore Skills Library →
                  </button>
                </div>
              </div>
            </div>

            {/* Community Support Card */}
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-50 mb-1">Connect with Peers</h4>
                  <p className="text-xs text-slate-300 mb-3">
                    Sometimes the best support comes from those who understand the work.
                  </p>
                  <button
                    onClick={() => router.push('/community')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-all"
                  >
                    Visit Community
                  </button>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
