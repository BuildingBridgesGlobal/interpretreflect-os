"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import ElyaInterface from "@/components/dashboard/ElyaInterface";
import UpgradeModal from "@/components/UpgradeModal";
import PendingInvitationBanner from "@/components/PendingInvitationBanner";
import { motion } from "framer-motion";
import { SkeletonDashboard } from "@/components/ui/skeleton";
import { FadeIn, ListItem } from "@/components/ui/motion";

type Assignment = {
  id: string;
  title: string;
  assignment_type: string | null;
  date: string | null;
  time: string | null;
  completed: boolean | null;
  debriefed: boolean | null;
  prep_status: string | null;
};

type CEUSummary = {
  total_earned: number;
  total_required: number;
  professional_studies_earned: number;
  certificates_count: number;
};

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [elyaPreFillMessage, setElyaPreFillMessage] = useState<string>("");
  const [nextAssignment, setNextAssignment] = useState<Assignment | null>(null);
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [ceuSummary, setCeuSummary] = useState<CEUSummary | null>(null);

  // Check for mode parameter (e.g., ?mode=free-write)
  const initialMode = searchParams.get('mode') === 'free-write' ? 'free-write' : 'chat';

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
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      // Find incomplete assignments that should be auto-completed
      const { data: pastAssignments } = await supabase
        .from("assignments")
        .select("id, date, time")
        .eq("user_id", session.user.id)
        .eq("completed", false);

      if (pastAssignments && pastAssignments.length > 0) {
        const toComplete = pastAssignments.filter(a => {
          if (!a.date) return false;
          // If date is in the past, mark complete
          if (a.date < today) return true;
          // If date is today and time has passed, mark complete
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

      // Fetch upcoming assignment (next one that's not completed)
      const { data: upcomingData } = await supabase
        .from("assignments")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("completed", false)
        .gte("date", today)
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(1);

      if (upcomingData && upcomingData.length > 0) {
        setNextAssignment(upcomingData[0]);
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

      // Fetch CEU summary
      try {
        const ceuResponse = await fetch('/api/ceu?action=summary');
        if (ceuResponse.ok) {
          const ceuData = await ceuResponse.json();
          setCeuSummary(ceuData);
        }
      } catch (error) {
        console.error('Error fetching CEU summary:', error);
      }

      setLoading(false);
    };

    loadUserData();
  }, [router]);

  // Helper function to format date nicely
  const formatDate = (dateStr: string, timeStr?: string | null) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Check if it's today or tomorrow
    if (date.toDateString() === today.toDateString()) {
      if (timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const time = new Date();
        time.setHours(parseInt(hours), parseInt(minutes));
        return `Today, ${time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      }
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      if (timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const time = new Date();
        time.setHours(parseInt(hours), parseInt(minutes));
        return `Tomorrow, ${time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      }
      return 'Tomorrow';
    }

    // For other dates
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':');
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes));
      return `${dayName}, ${time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    return monthDay;
  };

  // Helper to format short date for recent sessions
  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <NavBar />
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NavBar />

      {/* Pending Invitation Banner - Shown when interpreter has pending agency invitations */}
      <PendingInvitationBanner />

      {/* Upgrade Banner - Show for Basic users */}
      {userData?.subscription_tier === "basic" && (
        <div className="sticky top-0 z-10 bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-purple-500/10 border-b border-teal-500/30 backdrop-blur-lg">
          <div className="container mx-auto max-w-7xl px-4 md:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-teal-300 font-semibold">BASIC PLAN</span>
                <span className="text-xs text-slate-400">
                  Upgrade to Pro for CEU workshops & unlimited features
                </span>
              </div>
              <button
                onClick={() => setShowUpgrade(true)}
                className="px-4 py-1.5 bg-teal-400 hover:bg-teal-300 text-slate-950 text-sm font-semibold rounded-lg transition-all"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout: Chat-First with Sidebar */}
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-180px)]">

          {/* MAIN AREA: ELYA CHAT (70-80% width on desktop) */}
          <motion.div
            className="flex-1 lg:w-[70%] flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Welcome Header with Elya Introduction */}
            <div className="mb-4">
              <motion.h1
                className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                Hi{userData?.full_name ? `, ${userData.full_name.split(' ')[0]}` : ''}!
              </motion.h1>
              <motion.p
                className="text-sm text-slate-400 mt-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                I'm <span className="text-violet-400 font-medium">Elya</span>, your AI companion for interpreting work. I can help you prep for assignments, debrief after tough sessions, or just process your thoughts through free writing.
              </motion.p>
            </div>

            {/* Elya Chat Interface - Takes full remaining height */}
            <div className="flex-1">
              <ElyaInterface
                userData={userData}
                preFillMessage={elyaPreFillMessage}
                onMessageSent={() => setElyaPreFillMessage("")}
                initialMode={initialMode as "chat" | "free-write"}
                recentAssignments={[
                  ...(nextAssignment ? [{
                    id: nextAssignment.id,
                    title: nextAssignment.title,
                    assignment_type: nextAssignment.assignment_type || "general",
                    date: formatShortDate(nextAssignment.date || ""),
                    completed: nextAssignment.completed || false
                  }] : []),
                  ...recentAssignments.map(a => ({
                    id: a.id,
                    title: a.title,
                    assignment_type: a.assignment_type || "general",
                    date: formatShortDate(a.date || ""),
                    completed: a.completed || false
                  }))
                ]}
              />
            </div>
          </motion.div>

          {/* SIDEBAR: Context & Quick Actions (20-30% width on desktop) */}
          <motion.div
            className="lg:w-[30%] flex flex-col gap-4 lg:mt-[88px]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          >

            {/* Next Assignment - Compact Card */}
            {nextAssignment ? (
              <motion.div
                className="rounded-xl border border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-transparent p-4 shadow-lg"
                whileHover={{ scale: 1.02, borderColor: "rgba(139, 92, 246, 0.7)" }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-violet-300 mb-1">UP NEXT</p>
                    <p className="text-xs text-slate-400">{formatDate(nextAssignment.date || "", nextAssignment.time)}</p>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-violet-500/20 text-violet-300 text-xs font-semibold border border-violet-500/30">
                    {nextAssignment.assignment_type || 'Assignment'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-50 mb-3">{nextAssignment.title}</h3>
                <motion.button
                  onClick={() => setElyaPreFillMessage(`Help me prep for my ${nextAssignment.assignment_type || ''} assignment: ${nextAssignment.title}`)}
                  className="w-full px-4 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-500/20"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start Prep
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                className="rounded-xl border border-slate-700 bg-slate-800/30 p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Animated radar/ripple effect */}
                <div className="relative w-16 h-16 mx-auto mb-4">
                  {/* Outer ripple rings */}
                  <div className="absolute inset-0 rounded-full border border-violet-500/20 animate-[ping_3s_ease-in-out_infinite]" />
                  <div className="absolute inset-2 rounded-full border border-violet-500/30 animate-[ping_3s_ease-in-out_infinite_0.5s]" />
                  <div className="absolute inset-4 rounded-full border border-violet-500/40 animate-[ping_3s_ease-in-out_infinite_1s]" />
                  {/* Center dot */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 shadow-lg shadow-violet-500/30" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-slate-400 mb-2 text-center">NO UPCOMING ASSIGNMENTS</p>
                <p className="text-sm text-slate-300 mb-3 text-center">Tell Elya about your next assignment to get started!</p>
                <motion.button
                  onClick={() => setElyaPreFillMessage("I have a new assignment coming up")}
                  className="w-full px-4 py-2.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-sm font-semibold transition-all border border-violet-500/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  + Add Assignment
                </motion.button>
              </motion.div>
            )}

            {/* Recent Sessions - Compact List */}
            <motion.div
              className="rounded-xl border border-slate-600 bg-slate-800/30 p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Recent Sessions</h3>
              {recentAssignments.length > 0 ? (
              <div className="space-y-2">
                {recentAssignments.slice(0, 3).map((assignment, index) => (
                  <motion.div
                    key={assignment.id}
                    className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-slate-700/30 transition-all group"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-100 truncate">{assignment.title}</h4>
                      <p className="text-xs text-slate-500">{formatShortDate(assignment.date || "")}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {assignment.debriefed ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-xs border border-emerald-500/30">
                          ✓
                        </span>
                      ) : (
                        <motion.button
                          onClick={() => setElyaPreFillMessage(`Help me debrief my ${assignment.title} assignment`)}
                          className="px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs border border-amber-500/30 transition-all opacity-0 group-hover:opacity-100"
                          whileTap={{ scale: 0.95 }}
                        >
                          Debrief
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No completed sessions yet</p>
              )}
            </motion.div>

            {/* CEU Progress Widget - Different for Basic vs Pro users */}
            {userData?.subscription_tier === "pro" ? (
              // PRO USER: Show actual CEU progress or prompt to start
              <motion.div
                className="rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-transparent p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-teal-300 uppercase tracking-wider">CEU Progress</h3>
                  <a
                    href="/ceu"
                    className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    View All →
                  </a>
                </div>

                {ceuSummary ? (
                  <>
                    <div className="mb-3">
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-2xl font-bold text-slate-100">{ceuSummary.total_earned.toFixed(1)}</span>
                        <span className="text-sm text-slate-400">/ {ceuSummary.total_required} CEUs</span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((ceuSummary.total_earned / ceuSummary.total_required) * 100, 100)}%` }}
                          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-slate-800/50 rounded-lg p-2">
                        <div className="text-lg font-semibold text-slate-100">{ceuSummary.professional_studies_earned.toFixed(1)}</div>
                        <div className="text-xs text-slate-400">Prof. Studies</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-2">
                        <div className="text-lg font-semibold text-slate-100">{ceuSummary.certificates_count}</div>
                        <div className="text-xs text-slate-400">Certificates</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">🎓</div>
                    <p className="text-sm text-slate-400 mb-2">Start earning CEUs for your RID certification</p>
                    <a
                      href="/ceu"
                      className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      Browse Workshops →
                    </a>
                  </div>
                )}
              </motion.div>
            ) : (
              // BASIC USER: Show upgrade prompt to drive Pro conversion
              <motion.div
                className="rounded-xl border border-slate-600 bg-gradient-to-br from-slate-800/50 to-transparent p-4 relative overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CEU Workshops</h3>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-medium">
                    PRO
                  </span>
                </div>

                <div className="text-center py-2">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-300 mb-1">Earn CEUs for RID certification</p>
                  <p className="text-xs text-slate-500 mb-3">2 workshops/month included with Pro</p>
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-semibold rounded-lg transition-all"
                  >
                    Upgrade to Pro
                  </button>
                </div>
              </motion.div>
            )}

          </motion.div>
        </div>
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}

// Loading fallback for Suspense
function DashboardPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6">
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
