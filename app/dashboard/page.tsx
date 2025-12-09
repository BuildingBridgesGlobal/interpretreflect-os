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
import Link from "next/link";
import {
  Plus, Calendar, BookOpen, Award
} from "lucide-react";

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
  description?: string | null;
  location_type?: string | null;
};

type UserProfile = {
  id: string;
  full_name?: string | null;
  subscription_tier?: string | null;
  ceu_credits_remaining?: number | null;
  ceu_credits_used?: number | null;
};

type ElyaConversation = {
  id: string;
  mode: string;
  mood_emoji: string | null;
  ai_title: string | null;
  created_at: string;
  message_count: number;
};

// Upgrade Banner Component - Inline style (not sticky bar)
function UpgradeBanner({ tier, onUpgrade }: { tier: string; onUpgrade: () => void }) {
  if (tier === 'pro') return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-transparent border border-teal-500/20">
      <div className="flex items-center gap-3">
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30">
          {tier === 'free' ? 'Basic' : 'Growth'}
        </span>
        <span className="text-sm text-slate-400">
          Upgrade to Pro for CEU workshops & unlimited features
        </span>
      </div>
      <button
        onClick={onUpgrade}
        className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-semibold transition-colors shadow-lg shadow-teal-500/20"
      >
        Upgrade to Pro
      </button>
    </div>
  );
}

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [elyaPreFillMessage, setElyaPreFillMessage] = useState<string>("");
  const [elyaMode, setElyaMode] = useState<"chat" | "free-write" | "prep" | "debrief" | "research" | "patterns">("chat");
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [recentReflections, setRecentReflections] = useState<ElyaConversation[]>([]);
  const [lockedAssignmentData, setLockedAssignmentData] = useState<Assignment | null>(null);

  // Check for mode, message, assignment, and conversation parameters (e.g., ?mode=debrief&assignment=abc123)
  const initialMode = searchParams.get('mode');
  const initialMessage = searchParams.get('message');
  const initialAssignmentId = searchParams.get('assignment');
  const initialConversationId = searchParams.get('conversation');
  const [lockedAssignment, setLockedAssignment] = useState<string | null>(null);

  useEffect(() => {
    if (initialMode === 'free-write') {
      setElyaMode('free-write');
    } else if (initialMode === 'prep') {
      setElyaMode('prep');
    } else if (initialMode === 'debrief') {
      setElyaMode('debrief');
    } else if (initialMode === 'research') {
      setElyaMode('research');
    } else if (initialMode === 'patterns') {
      setElyaMode('patterns');
    }

    // If a message parameter is provided, pre-fill Elya's input
    if (initialMessage) {
      setElyaPreFillMessage(decodeURIComponent(initialMessage));
    }

    // If an assignment parameter is provided, lock to that assignment
    if (initialAssignmentId) {
      setLockedAssignment(initialAssignmentId);
    }
  }, [initialMode, initialMessage, initialAssignmentId]);

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

      // Auto-complete past assignments
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

      // Fetch upcoming assignments
      const { data: upcomingData } = await supabase
        .from("assignments")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("completed", false)
        .gte("date", today)
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(5);

      if (upcomingData) {
        setUpcomingAssignments(upcomingData);
      }

      // Fetch recent completed assignments
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

      // Fetch recent Elya conversations for journal preview
      const { data: reflectionsData } = await supabase
        .from("elya_conversations")
        .select("id, mode, created_at, message_count")
        .eq("user_id", session.user.id)
        .eq("is_active", false)
        .order("created_at", { ascending: false })
        .limit(4);

      if (reflectionsData) {
        setRecentReflections(reflectionsData as unknown as ElyaConversation[]);
      }

      // If there's a locked assignment ID, fetch that specific assignment
      if (initialAssignmentId) {
        const { data: lockedData } = await supabase
          .from("assignments")
          .select("*")
          .eq("id", initialAssignmentId)
          .single();

        if (lockedData) {
          setLockedAssignmentData(lockedData);
        }
      }

      setLoading(false);
    };

    loadUserData();
  }, [router, initialAssignmentId]);

  // Helper functions
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDaysUntil = (dateStr: string | null) => {
    if (!dateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr + 'T00:00:00');
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      chat: 'Chat',
      prep: 'Prep',
      debrief: 'Debrief',
      research: 'Research',
      patterns: 'Patterns',
      'free-write': 'Free Write'
    };
    return labels[mode] || 'Chat';
  };

  const getModeColor = (mode: string) => {
    const colors: Record<string, string> = {
      chat: 'bg-violet-500',
      prep: 'bg-teal-500',
      debrief: 'bg-blue-500',
      research: 'bg-amber-500',
      patterns: 'bg-fuchsia-500',
      'free-write': 'bg-rose-500'
    };
    return colors[mode] || 'bg-violet-500';
  };

  const getReflectionTitle = (reflection: ElyaConversation) => {
    if (reflection.ai_title) return reflection.ai_title;
    return `${getModeLabel(reflection.mode)} session`;
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatShortDate(dateStr.split('T')[0]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <NavBar />
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  const firstName = userData?.full_name?.split(' ')[0] || 'there';
  const subscriptionTier = userData?.subscription_tier || 'free';
  const ceuCredits = userData?.ceu_credits_remaining || 0;

  // Combine upcoming, recent, and locked assignments for Elya
  const allAssignmentsForElya = [
    // Include locked assignment first if it exists (and isn't already in the lists)
    ...(lockedAssignmentData && !upcomingAssignments.some(a => a.id === lockedAssignmentData.id) && !recentAssignments.some(a => a.id === lockedAssignmentData.id) ? [{
      id: lockedAssignmentData.id,
      title: lockedAssignmentData.title,
      assignment_type: lockedAssignmentData.assignment_type || "general",
      date: lockedAssignmentData.date || "",
      time: lockedAssignmentData.time,
      completed: lockedAssignmentData.completed || false,
      setting: lockedAssignmentData.setting,
      description: lockedAssignmentData.description,
      duration_minutes: lockedAssignmentData.duration_minutes,
      location_type: lockedAssignmentData.location_type
    }] : []),
    ...upcomingAssignments.map(a => ({
      id: a.id,
      title: a.title,
      assignment_type: a.assignment_type || "general",
      date: a.date || "",
      time: a.time,
      completed: a.completed || false,
      setting: a.setting,
      description: a.description,
      duration_minutes: a.duration_minutes,
      location_type: a.location_type
    })),
    ...recentAssignments.slice(0, 3).map(a => ({
      id: a.id,
      title: a.title,
      assignment_type: a.assignment_type || "general",
      date: a.date || "",
      time: a.time,
      completed: a.completed || false,
      setting: a.setting,
      description: a.description,
      duration_minutes: a.duration_minutes,
      location_type: a.location_type
    }))
  ];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <NavBar />

      <PendingInvitationBanner />

      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 relative">

        {/* Upgrade Banner - Inline card style */}
        {subscriptionTier !== 'pro' && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <UpgradeBanner tier={subscriptionTier} onUpgrade={() => setShowUpgrade(true)} />
          </motion.div>
        )}

        {/* Welcome Header with Elya intro - Hero style */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: subscriptionTier !== 'pro' ? 0.05 : 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="text-teal-400">Hi, {firstName}!</span>
          </h1>
          <p className="text-slate-400 mt-1">
            I'm <span className="text-violet-400 font-medium">Elya</span>, your AI companion for interpreting work. I can help you prep for assignments, debrief after tough sessions, or just process your thoughts through free writing.
          </p>
        </motion.div>

        {/* TWO-COLUMN LAYOUT - Elya on left, Sidebar on right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

          {/* ===== MAIN CONTENT (Left Column) - Elya Interface ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="min-h-[720px]"
          >
            <ElyaInterface
              userData={userData}
              preFillMessage={elyaPreFillMessage}
              onMessageSent={() => setElyaPreFillMessage("")}
              initialMode={elyaMode}
              recentAssignments={allAssignmentsForElya}
              lockedAssignmentId={lockedAssignment}
              continueConversationId={initialConversationId}
            />
          </motion.div>

          {/* ===== SIDEBAR (Right Column) ===== */}
          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">

            {/* No Upcoming Assignments / Upcoming List - Hero style card */}
            <motion.div
              className="p-5 rounded-xl bg-slate-900 border border-slate-800"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {upcomingAssignments.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-100 text-sm uppercase tracking-wider">Upcoming Assignments</h3>
                    <Link href="/assignments" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                      View all
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {upcomingAssignments.slice(0, 3).map(assignment => {
                      const days = getDaysUntil(assignment.date);
                      return (
                        <Link
                          key={assignment.id}
                          href={`/assignments/${assignment.id}`}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-teal-500/20 transition-all group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-200 truncate group-hover:text-teal-300 transition-colors">
                              {assignment.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDate(assignment.date)}
                              {assignment.time && ` at ${formatTime(assignment.time)}`}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            days === 0 ? 'bg-amber-500/20 text-amber-400' :
                            days === 1 ? 'bg-cyan-500/20 text-cyan-400' :
                            'bg-slate-700/50 text-slate-400'
                          }`}>
                            {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-teal-400" />
                  </div>
                  <h3 className="font-semibold text-slate-100 text-sm uppercase tracking-wider mb-2">No Upcoming Assignments</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Tell Elya about your next assignment to get started!
                  </p>
                  <Link
                    href="/assignments?new=true"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-semibold transition-colors w-full justify-center shadow-lg shadow-teal-500/20"
                  >
                    <Plus className="w-4 h-4" /> Add Assignment
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Past Assignments - for debriefing */}
            <motion.div
              className="p-5 rounded-xl bg-slate-900 border border-slate-800"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-100 text-sm uppercase tracking-wider">Past Assignments</h3>
                <Link href="/assignments?filter=completed" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                  View all
                </Link>
              </div>
              {recentAssignments.length > 0 ? (
                <div className="space-y-2">
                  {recentAssignments.slice(0, 3).map(assignment => (
                    <button
                      key={assignment.id}
                      onClick={() => {
                        setElyaMode("debrief");
                        setElyaPreFillMessage(`I'd like to debrief about my ${assignment.assignment_type || 'interpreting'} assignment: "${assignment.title}" from ${formatDate(assignment.date)}.`);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-blue-500/20 transition-all group text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate group-hover:text-blue-300 transition-colors">
                          {assignment.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500">{formatShortDate(assignment.date)}</span>
                          {!assignment.debriefed && (
                            <span className="text-xs text-blue-400">Ready to debrief</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500">No completed assignments yet</p>
                  <p className="text-xs text-slate-600 mt-1">Complete an assignment to debrief with Elya</p>
                </div>
              )}
            </motion.div>

            {/* CEU Workshops - Hero style card */}
            <motion.div
              className="p-5 rounded-xl bg-slate-900 border border-slate-800"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-100 text-sm uppercase tracking-wider">CEU Workshops</h3>
                {subscriptionTier === 'pro' && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30">PRO</span>
                )}
              </div>
              {subscriptionTier === 'pro' ? (
                <>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-100">{ceuCredits}</p>
                      <p className="text-xs text-slate-500">credits remaining</p>
                    </div>
                  </div>
                  <Link
                    href="/ceu"
                    className="text-teal-400 text-sm hover:text-teal-300 transition-colors inline-flex items-center gap-1"
                  >
                    Browse workshops <span className="text-teal-400/60">→</span>
                  </Link>
                </>
              ) : (
                <div className="text-center py-2">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-400 mb-1">Earn CEUs for RID certification</p>
                  <p className="text-xs text-slate-500 mb-3">0.2 CEUs/month included with Pro</p>
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-600 text-slate-200 hover:border-teal-500/50 hover:text-teal-300 transition-colors"
                  >
                    Upgrade to Pro
                  </button>
                </div>
              )}
            </motion.div>

          </div>
        </div>

      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}

function DashboardPageLoading() {
  return (
    <div className="min-h-screen">
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
