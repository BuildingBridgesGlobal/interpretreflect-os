"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import ElyaInterface from "@/components/dashboard/ElyaInterface";
import UpgradeModal from "@/components/UpgradeModal";
import PendingInvitationBanner from "@/components/PendingInvitationBanner";
import BurnoutDriftIndicator from "@/components/dashboard/BurnoutDriftIndicator";
import WellnessCheckinModal from "@/components/dashboard/WellnessCheckinModal";
import WeeklyLoadChart from "@/components/dashboard/WeeklyLoadChart";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonDashboard } from "@/components/ui/skeleton";

type Assignment = {
  id: string;
  title: string;
  assignment_type: string | null;
  date: string | null;
  time: string | null;
  completed: boolean | null;
  debriefed: boolean | null;
  prep_status: string | null;
  duration_minutes?: number | null;
  setting?: string | null;
  emotional_intensity?: string | null;
};

type CEUSummary = {
  total_earned: number;
  total_required: number;
  professional_studies_earned: number;
  certificates_count: number;
};

type DrillStats = {
  readiness_score: number | null;
  total_drills_attempted: number | null;
  current_streak_days: number | null;
};

type RecentConversation = {
  id: string;
  mode: string;
  created_at: string;
  // Optional fields from journal migration (may not exist)
  mood_emoji?: string | null;
  ai_title?: string | null;
};

type WellnessCheckin = {
  id: string;
  feeling: "energized" | "calm" | "okay" | "drained" | "overwhelmed";
  created_at: string;
};

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showElya, setShowElya] = useState(false);
  const [elyaPreFillMessage, setElyaPreFillMessage] = useState<string>("");
  const [elyaMode, setElyaMode] = useState<"chat" | "free-write" | "prep" | "debrief">("chat");
  const [todayAssignments, setTodayAssignments] = useState<Assignment[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [ceuSummary, setCeuSummary] = useState<CEUSummary | null>(null);
  const [drillStats, setDrillStats] = useState<DrillStats | null>(null);
  const [conversationCount, setConversationCount] = useState(0);
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [wellnessCheckins, setWellnessCheckins] = useState<WellnessCheckin[]>([]);
  const [showWellnessModal, setShowWellnessModal] = useState(false);
  const [weekAssignments, setWeekAssignments] = useState<Assignment[]>([]);

  // Check for mode parameter (e.g., ?mode=free-write)
  const initialMode = searchParams.get('mode');

  useEffect(() => {
    // If URL has mode param, open Elya with that mode
    if (initialMode === 'free-write') {
      setElyaMode('free-write');
      setShowElya(true);
    }
  }, [initialMode]);

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

      // Auto-complete past assignments whose time has passed
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);

      const { data: pastAssignments } = await supabase
        .from("assignments")
        .select("id, date, time")
        .eq("user_id", session.user.id)
        .eq("completed", false);

      if (pastAssignments && pastAssignments.length > 0) {
        const toComplete = pastAssignments.filter(a => {
          if (!a.date) return false;
          if (a.date < today) return true;
          if (a.date === today && a.time && a.time <= currentTime) return true;
          return false;
        });

        if (toComplete.length > 0) {
          const idsToComplete = toComplete.map(a => a.id);
          await supabase
            .from("assignments")
            .update({ completed: true, completed_at: now.toISOString() })
            .in("id", idsToComplete);
        }
      }

      // Fetch TODAY's assignments
      const { data: todayData } = await supabase
        .from("assignments")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("date", today)
        .order("time", { ascending: true });

      if (todayData) {
        setTodayAssignments(todayData);
      }

      // Fetch upcoming assignments (next 7 days, excluding today)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      const { data: upcomingData } = await supabase
        .from("assignments")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("completed", false)
        .gt("date", today)
        .lte("date", nextWeekStr)
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(5);

      if (upcomingData) {
        setUpcomingAssignments(upcomingData);
      }

      // Fetch recent completed assignments (last 5)
      const { data: recentData } = await supabase
        .from("assignments")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("completed", true)
        .order("date", { ascending: false })
        .limit(5);

      if (recentData) {
        setRecentAssignments(recentData);
      }

      // Fetch all assignments for the current week (Mon-Sun for weekly load chart)
      const currentDay = now.getDay();
      // Get Monday as start: if today is Sunday (0), go back 6 days
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + mondayOffset);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Sunday
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      const { data: weekData } = await supabase
        .from("assignments")
        .select("id, title, date, emotional_intensity, completed, assignment_type")
        .eq("user_id", session.user.id)
        .gte("date", weekStartStr)
        .lte("date", weekEndStr)
        .order("date", { ascending: true });

      if (weekData) {
        setWeekAssignments(weekData as Assignment[]);
      }

      // Fetch conversation count for this month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count } = await supabase
        .from("elya_conversations")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", session.user.id)
        .gte("created_at", startOfMonth);

      setConversationCount(count || 0);

      // Fetch recent conversations for journal preview (last 3)
      // Note: mood_emoji and ai_title may not exist if journal migration hasn't run
      const { data: recentConvos } = await supabase
        .from("elya_conversations")
        .select("id, mode, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (recentConvos) {
        setRecentConversations(recentConvos as RecentConversation[]);
      }

      // Fetch drill stats
      const { data: drillStatsData } = await supabase
        .from("user_drill_stats")
        .select("readiness_score, total_drills_attempted, current_streak_days")
        .eq("user_id", session.user.id)
        .single();

      if (drillStatsData) {
        setDrillStats(drillStatsData);
      }

      // Fetch wellness check-ins (last 28 days for burnout drift)
      const twentyEightDaysAgo = new Date();
      twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
      const { data: wellnessData } = await supabase
        .from("wellness_checkins")
        .select("id, feeling, created_at")
        .eq("user_id", session.user.id)
        .gte("created_at", twentyEightDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (wellnessData) {
        setWellnessCheckins(wellnessData as WellnessCheckin[]);
      }

      // Fetch CEU summary (requires auth token)
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.access_token) {
          const ceuResponse = await fetch('/api/ceu?action=summary', {
            headers: {
              'Authorization': `Bearer ${currentSession.access_token}`,
              'Content-Type': 'application/json',
            },
          });
          if (ceuResponse.ok) {
            const ceuData = await ceuResponse.json();
            setCeuSummary(ceuData);
          }
        }
      } catch (error) {
        console.error('Error fetching CEU summary:', error);
      }

      setLoading(false);
    };

    loadUserData();
  }, [router]);

  // Helper function to format time nicely
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Helper to format date for upcoming
  const formatUpcomingDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Open Elya with context
  const openElyaWithContext = (mode: "chat" | "prep" | "debrief" | "free-write", message?: string) => {
    setElyaMode(mode);
    if (message) setElyaPreFillMessage(message);
    setShowElya(true);
  };

  // Reload wellness checkins after adding a new one
  const reloadWellnessCheckins = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
    const { data: wellnessData } = await supabase
      .from("wellness_checkins")
      .select("id, feeling, created_at")
      .eq("user_id", session.user.id)
      .gte("created_at", sixWeeksAgo.toISOString())
      .order("created_at", { ascending: false });

    if (wellnessData) {
      setWellnessCheckins(wellnessData as WellnessCheckin[]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <NavBar />
        <div className="container mx-auto max-w-6xl px-4 md:px-6 py-6">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  const firstName = userData?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NavBar />

      {/* Pending Invitation Banner */}
      <PendingInvitationBanner />

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 md:px-6 py-6">

        {/* Welcome Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
            {getGreeting()}, {firstName}!
          </h1>
          <p className="text-slate-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        {/* TODAY'S ASSIGNMENTS - Primary Focus */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <span className="text-xl">📅</span> Today's Assignments
            </h2>
            <button
              onClick={() => router.push('/assignments')}
              className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
            >
              View All →
            </button>
          </div>

          {todayAssignments.length > 0 ? (
            <div className="space-y-3">
              {todayAssignments.map((assignment, index) => (
                <motion.div
                  key={assignment.id}
                  className={`rounded-xl border p-4 transition-all ${
                    assignment.completed
                      ? 'border-slate-700 bg-slate-800/30'
                      : 'border-violet-500/50 bg-gradient-to-r from-violet-500/10 to-purple-500/10'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {assignment.time && (
                          <span className={`text-sm font-medium ${assignment.completed ? 'text-slate-500' : 'text-violet-400'}`}>
                            {formatTime(assignment.time)}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          assignment.completed
                            ? 'bg-slate-700 text-slate-400'
                            : 'bg-violet-500/20 text-violet-300'
                        }`}>
                          {assignment.assignment_type || 'General'}
                        </span>
                        {assignment.completed && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                            Completed
                          </span>
                        )}
                      </div>
                      <h3 className={`text-base font-semibold ${assignment.completed ? 'text-slate-400' : 'text-slate-100'}`}>
                        {assignment.title}
                      </h3>
                      {assignment.setting && (
                        <p className="text-sm text-slate-500 mt-1">{assignment.setting}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {!assignment.completed ? (
                        <button
                          onClick={() => openElyaWithContext('prep', `Help me prep for my ${assignment.assignment_type || ''} assignment: ${assignment.title}`)}
                          className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-medium transition-all"
                        >
                          Prep with Elya
                        </button>
                      ) : !assignment.debriefed ? (
                        <button
                          onClick={() => openElyaWithContext('debrief', `Help me debrief my ${assignment.title} assignment`)}
                          className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-medium border border-amber-500/30 transition-all"
                        >
                          Debrief
                        </button>
                      ) : (
                        <span className="px-4 py-2 text-emerald-400 text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Done
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              className="rounded-xl border border-dashed border-slate-700 bg-slate-800/20 p-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                <span className="text-2xl">🎉</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No assignments today</h3>
              <p className="text-sm text-slate-500 mb-4">Take some time for self-care or skill practice!</p>
              <button
                onClick={() => router.push('/assignments')}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition-all"
              >
                + Add Assignment
              </button>
            </motion.div>
          )}
        </motion.section>

        {/* QUICK ACTIONS - 2x3 Grid */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
            <span className="text-xl">🎯</span> Quick Actions
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {/* Row 1 */}
            <button
              onClick={() => openElyaWithContext('debrief')}
              className="p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-300">Start Debrief</span>
            </button>

            <button
              onClick={() => openElyaWithContext('free-write')}
              className="p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-300">Free Write</span>
            </button>

            <button
              onClick={() => router.push('/journal')}
              className="p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-300">View Journal</span>
            </button>

            {/* Row 2 */}
            <button
              onClick={() => router.push('/skills')}
              className="p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-300">Practice Skills</span>
            </button>

            <button
              onClick={() => router.push('/ceu')}
              className="p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-300">View CEUs</span>
            </button>

            <button
              onClick={() => router.push('/assignments')}
              className="p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-300">Assignments</span>
            </button>
          </div>
        </motion.section>

        {/* TWO COLUMN LAYOUT: Upcoming + Progress */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* UPCOMING THIS WEEK */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
              <span className="text-xl">📆</span> Coming Up
            </h2>
            <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
              {upcomingAssignments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer"
                      onClick={() => router.push('/assignments')}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-200 truncate">{assignment.title}</p>
                        <p className="text-xs text-slate-500">
                          {formatUpcomingDate(assignment.date || '')}
                          {assignment.time && ` at ${formatTime(assignment.time)}`}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-full bg-slate-700 text-slate-400 text-xs">
                        {assignment.assignment_type || 'General'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-500">No upcoming assignments this week</p>
                </div>
              )}
            </div>
          </motion.section>

          {/* YOUR PROGRESS */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
              <span className="text-xl">📊</span> Your Progress
            </h2>
            <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Reflections */}
                <div className="text-center p-3 rounded-lg bg-slate-800/50">
                  <div className="text-2xl font-bold text-violet-400">{conversationCount}</div>
                  <div className="text-xs text-slate-500">Reflections</div>
                  <div className="text-[10px] text-slate-600">this month</div>
                </div>

                {/* Readiness Score */}
                <div className="text-center p-3 rounded-lg bg-slate-800/50">
                  <div className={`text-2xl font-bold ${
                    drillStats?.readiness_score && drillStats.readiness_score >= 70 ? 'text-emerald-400' :
                    drillStats?.readiness_score && drillStats.readiness_score >= 40 ? 'text-amber-400' :
                    'text-slate-400'
                  }`}>
                    {drillStats?.readiness_score || '--'}
                  </div>
                  <div className="text-xs text-slate-500">Readiness</div>
                  <div className="text-[10px] text-slate-600">score</div>
                </div>

                {/* Streak */}
                <div className="text-center p-3 rounded-lg bg-slate-800/50">
                  <div className="text-2xl font-bold text-amber-400">
                    {drillStats?.current_streak_days || 0}
                  </div>
                  <div className="text-xs text-slate-500">Day Streak</div>
                  <div className="text-[10px] text-slate-600">🔥</div>
                </div>
              </div>

              {/* CEU Progress - Shows for all users */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">CEU Progress</span>
                  <a href="/ceu" className="text-xs text-teal-400 hover:text-teal-300">View →</a>
                </div>
                {userData?.subscription_tier === "pro" && ceuSummary ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all"
                        style={{ width: `${Math.min((ceuSummary.total_earned / ceuSummary.total_required) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-300">
                      {ceuSummary.total_earned.toFixed(1)}/{ceuSummary.total_required}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="w-full flex items-center gap-3"
                  >
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full w-0 bg-slate-600 rounded-full" />
                    </div>
                    <span className="text-xs text-teal-400 hover:text-teal-300 whitespace-nowrap">
                      Go Pro →
                    </span>
                  </button>
                )}
              </div>
            </div>
          </motion.section>
        </div>

        {/* WELLNESS & LOAD TRACKING */}
        <motion.section
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
            <span className="text-xl">💫</span> Wellness & Load Tracking
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <WeeklyLoadChart assignments={weekAssignments} />
            <BurnoutDriftIndicator
              checkins={wellnessCheckins}
              onAddCheckin={() => setShowWellnessModal(true)}
            />
          </div>
        </motion.section>

        {/* GETTING STARTED - Show for new users with no activity */}
        {recentConversations.length === 0 && recentAssignments.length === 0 && (
          <motion.section
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
              <span className="text-xl">🚀</span> Getting Started
            </h2>
            <div className="rounded-xl border border-dashed border-teal-500/30 bg-gradient-to-br from-teal-500/5 to-slate-900/50 p-6">
              <p className="text-slate-300 mb-4">
                Welcome to InterpretReflect! Here are some ways to get the most out of your experience:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => openElyaWithContext('chat')}
                  className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-teal-500/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">💬</span>
                    <span className="text-sm font-medium text-slate-200 group-hover:text-teal-300">Meet Elya</span>
                  </div>
                  <p className="text-xs text-slate-400">Your AI wellness companion. Ask questions, get support, or just chat.</p>
                </button>
                <button
                  onClick={() => router.push('/assignments')}
                  className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-teal-500/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📅</span>
                    <span className="text-sm font-medium text-slate-200 group-hover:text-teal-300">Add Assignment</span>
                  </div>
                  <p className="text-xs text-slate-400">Track your upcoming work to get prep reminders and debrief prompts.</p>
                </button>
                <button
                  onClick={() => openElyaWithContext('free-write')}
                  className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-teal-500/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">✍️</span>
                    <span className="text-sm font-medium text-slate-200 group-hover:text-teal-300">Start Journaling</span>
                  </div>
                  <p className="text-xs text-slate-400">Free write to process your day. Elya holds space without judgment.</p>
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 text-center">
                  Your reflections build insights over time. The more you share, the more personalized Elya becomes.
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* RECENT JOURNAL ENTRIES */}
        {recentConversations.length > 0 && (
          <motion.section
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <span className="text-xl">📓</span> Recent Reflections
              </h2>
              <a href="/journal" className="text-xs text-teal-400 hover:text-teal-300">View all →</a>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
              <div className="space-y-2">
                {recentConversations.map((convo) => (
                  <a
                    key={convo.id}
                    href={`/journal?conversation=${convo.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0">{convo.mood_emoji || '💭'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {convo.ai_title || (convo.mode === 'debrief' ? 'Debrief Session' : convo.mode === 'prep' ? 'Prep Session' : convo.mode === 'free-write' ? 'Free Writing' : 'Reflection')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(convo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${
                      convo.mode === 'debrief' ? 'bg-amber-500/20 text-amber-400' :
                      convo.mode === 'prep' ? 'bg-violet-500/20 text-violet-400' :
                      convo.mode === 'free-write' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {convo.mode === 'free-write' ? 'free write' : convo.mode}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* RECENT ASSIGNMENTS ACTIVITY */}
        {recentAssignments.length > 0 && (
          <motion.section
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
              <span className="text-xl">🕐</span> Recent Assignments
            </h2>
            <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
              <div className="space-y-2">
                {recentAssignments.slice(0, 3).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        assignment.debriefed ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-slate-200">{assignment.title}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(assignment.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {!assignment.debriefed && (
                      <button
                        onClick={() => openElyaWithContext('debrief', `Help me debrief my ${assignment.title} assignment`)}
                        className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Debrief
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </div>

      {/* FLOATING ELYA BUTTON */}
      <motion.button
        onClick={() => setShowElya(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 flex items-center justify-center z-40 hover:scale-110 transition-transform"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-2xl">💬</span>
      </motion.button>

      {/* ELYA SLIDE-IN PANEL */}
      <AnimatePresence>
        {showElya && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowElya(false)}
            />

            {/* Panel */}
            <motion.div
              className="fixed right-0 top-0 h-full w-full max-w-xl bg-slate-900 border-l border-slate-700 z-50 shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <span className="text-lg">✨</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">Elya</h3>
                    <p className="text-xs text-slate-400">Your AI companion</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowElya(false)}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Elya Interface */}
              <div className="h-[calc(100%-73px)]">
                <ElyaInterface
                  userData={userData}
                  preFillMessage={elyaPreFillMessage}
                  onMessageSent={() => setElyaPreFillMessage("")}
                  initialMode={elyaMode}
                  recentAssignments={[
                    ...todayAssignments.map(a => ({
                      id: a.id,
                      title: a.title,
                      assignment_type: a.assignment_type || "general",
                      date: a.date || "",
                      completed: a.completed || false
                    })),
                    ...recentAssignments.slice(0, 3).map(a => ({
                      id: a.id,
                      title: a.title,
                      assignment_type: a.assignment_type || "general",
                      date: a.date || "",
                      completed: a.completed || false
                    }))
                  ]}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
      <WellnessCheckinModal
        isOpen={showWellnessModal}
        onClose={() => setShowWellnessModal(false)}
        onCheckinAdded={reloadWellnessCheckins}
      />
    </div>
  );
}

// Loading fallback for Suspense
function DashboardPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-6xl px-4 md:px-6 py-6">
        <SkeletonDashboard />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardPageLoading />}>
      <DashboardPageContent />
    </Suspense>
  );
}
