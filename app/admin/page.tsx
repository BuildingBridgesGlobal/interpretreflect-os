"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AdminNavBar from "@/components/AdminNavBar";
import CEUAdminDashboard from "@/components/admin/CEUAdminDashboard";
import WorkshopManager from "@/components/admin/WorkshopManager";

// Types
type Organization = {
  id: string;
  name: string;
  subscription_tier: string;
  created_at: string;
};

type AgencyCode = {
  id: string;
  code: string;
  organization_name: string;
  organization_id: string | null;
  status: "pending" | "used" | "expired" | "revoked";
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
  notes: string | null;
  created_at: string;
};

type ElyaFeedback = {
  id: string;
  user_id: string;
  mode: string;
  title: string | null;
  mood_emoji: string | null;
  sentiment: string | null;
  user_feedback: string | null;
  message_count: number;
  created_at: string;
  ended_at: string | null;
  user?: { full_name: string | null; email: string | null };
};

// Consolidated view types - reduced from 12 to 6
type AdminView = "overview" | "ceu" | "users" | "orgs" | "content" | "community";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<AdminView>("overview");

  // Sub-tab states for consolidated views
  const [usersSubTab, setUsersSubTab] = useState<"pipeline" | "competency" | "wellness" | "credentials">("pipeline");
  const [communitySubTab, setCommunitySubTab] = useState<"activity" | "elya" | "moderation">("activity");

  // Community moderation state
  const [moderationUsers, setModerationUsers] = useState<any[]>([]);
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [loadingModeration, setLoadingModeration] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banReason, setBanReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDays, setSuspendDays] = useState(7);
  const [processingAction, setProcessingAction] = useState(false);
  const [moderationSearch, setModerationSearch] = useState("");
  const [moderationFilter, setModerationFilter] = useState<"all" | "banned" | "suspended" | "warned" | "active">("all");

  // Organization management state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [agencyCodes, setAgencyCodes] = useState<AgencyCode[]>([]);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [showCreateAgencyCodeModal, setShowCreateAgencyCodeModal] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [creatingAgencyCode, setCreatingAgencyCode] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", subscription_tier: "standard" });
  const [newAgencyCode, setNewAgencyCode] = useState({ organization_name: "", notes: "", expires_days: 30 });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Elya Feedback state
  const [elyaFeedback, setElyaFeedback] = useState<ElyaFeedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState<"all" | "helpful" | "okay" | "not-helpful" | "with-text">("all");

  // Overview metrics state - real data from API
  const [overviewMetrics, setOverviewMetrics] = useState({
    activeUsers: 0,
    ceuEarned: 0,
    workshopsCompleted: 0,
    avgRating: 0,
  });
  const [pipelineData, setPipelineData] = useState({
    itpGraduates: 0,
    activeInterpreters: 0,
    nowMentoring: 0,
    totalUsers: 0,
  });
  const [competencyGrowth, setCompetencyGrowth] = useState({
    domains: [
      { name: "Linguistic", average: 0, trend: "N/A" },
      { name: "Cultural", average: 0, trend: "N/A" },
      { name: "Cognitive", average: 0, trend: "N/A" },
      { name: "Interpersonal", average: 0, trend: "N/A" },
    ],
  });
  const [wellnessIndicators, setWellnessIndicators] = useState({
    distribution: { healthy: 0, warning: 0, critical: 0 },
    checkInCompletionRate: 0,
  });
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Credentials stats state - real data from database
  const [credentialsStats, setCredentialsStats] = useState({
    activeCredentials: 0,
    expiringSoon: 0,
    expired: 0,
    totalInterpreters: 0,
    byType: [] as { type: string; count: number }[],
  });
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  // Community activity stats state - real data from database
  const [communityStats, setCommunityStats] = useState({
    totalPosts: 0,
    totalComments: 0,
    activeUsers: 0,
    postsThisWeek: 0,
  });
  const [loadingCommunityStats, setLoadingCommunityStats] = useState(false);

  const SUPER_ADMIN_EMAILS = [
    "maddox@interpretreflect.com",
    "admin@interpretreflect.com",
    "sarah@interpretreflect.com",
  ];

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }

      const userEmail = session.user.email?.toLowerCase() || "";
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(userEmail);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      const hasAdminRole = (profile as any)?.role === "admin" || (profile as any)?.role === "super_admin";

      if (!isSuperAdmin && !hasAdminRole) {
        if ((profile as any)?.role === "agency_admin") {
          router.push("/agency");
        } else {
          router.push("/dashboard");
        }
        return;
      }

      setUserData(profile);
      setAuthorized(true);
      setLoading(false);
    };
    loadUserData();
  }, [router]);

  // Load data based on selected view
  useEffect(() => {
    if (selectedView === "overview" || selectedView === "users") loadOverviewData();
    if (selectedView === "orgs") loadAgencyData();
    if (selectedView === "community" && communitySubTab === "elya") loadElyaFeedback();
    if (selectedView === "community" && communitySubTab === "moderation") loadModerationData();
    if (selectedView === "community" && communitySubTab === "activity") loadCommunityStats();
    if (selectedView === "users" && usersSubTab === "credentials") loadCredentialsStats();
  }, [selectedView, communitySubTab, usersSubTab]);

  // Load overview metrics from API
  const loadOverviewData = async () => {
    setLoadingOverview(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/admin/overview", {
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.overviewMetrics) setOverviewMetrics(data.overviewMetrics);
        if (data.pipelineData) setPipelineData(data.pipelineData);
        if (data.competencyGrowth) setCompetencyGrowth(data.competencyGrowth);
        if (data.wellnessIndicators) setWellnessIndicators(data.wellnessIndicators);
      }
    } catch (error) {
      console.error("Error loading overview data:", error);
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadModerationData = async () => {
    setLoadingModeration(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/admin/community?view=users", {
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setModerationUsers(data.users || []);
      }

      const logsResponse = await fetch("/api/admin/community?view=moderation_log", {
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setModerationLogs(logsData.logs || []);
      }
    } catch (error) {
      console.error("Error loading moderation data:", error);
    } finally {
      setLoadingModeration(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) return;
    setProcessingAction(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/admin/community", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "ban", user_id: selectedUser.user_id, reason: banReason }),
      });

      if (response.ok) {
        setShowBanModal(false);
        setSelectedUser(null);
        setBanReason("");
        loadModerationData();
      }
    } catch (error) {
      console.error("Error banning user:", error);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    setProcessingAction(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/admin/community", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "unban", user_id: userId }),
      });

      if (response.ok) loadModerationData();
    } catch (error) {
      console.error("Error unbanning user:", error);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser || !suspendReason.trim()) return;
    setProcessingAction(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/admin/community", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "suspend",
          user_id: selectedUser.user_id,
          reason: suspendReason,
          days: suspendDays,
        }),
      });

      if (response.ok) {
        setShowSuspendModal(false);
        setSelectedUser(null);
        setSuspendReason("");
        setSuspendDays(7);
        loadModerationData();
      }
    } catch (error) {
      console.error("Error suspending user:", error);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    setProcessingAction(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/admin/community", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "unsuspend", user_id: userId }),
      });

      if (response.ok) loadModerationData();
    } catch (error) {
      console.error("Error unsuspending user:", error);
    } finally {
      setProcessingAction(false);
    }
  };

  const loadElyaFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const { data: convos, error } = await supabase
        .from("elya_conversations")
        .select("id, user_id, mode, title, mood_emoji, sentiment, user_feedback, message_count, created_at, ended_at")
        .eq("is_active", false)
        .order("ended_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error loading feedback:", error);
        return;
      }

      if (convos && convos.length > 0) {
        const userIds = [...new Set(convos.map((c: any) => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
        const feedbackWithUsers = convos.map((c: any) => ({
          ...c,
          user: profileMap.get(c.user_id) || null
        }));
        setElyaFeedback(feedbackWithUsers);
      } else {
        setElyaFeedback([]);
      }
    } catch (error) {
      console.error("Error loading Elya feedback:", error);
    }
    setLoadingFeedback(false);
  };

  const loadAgencyData = async () => {
    const { data: orgs } = await (supabase as any)
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });
    if (orgs) setOrganizations(orgs);

    const { data: agencyCodesData } = await (supabase as any)
      .from("agency_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (agencyCodesData) setAgencyCodes(agencyCodesData);
  };

  // Load credentials stats (platform-wide for super admin)
  const loadCredentialsStats = async () => {
    setLoadingCredentials(true);
    try {
      // Query credentials table directly for platform-wide stats
      const now = new Date().toISOString().split("T")[0]; // Just date part for comparison
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Total active credentials (using expiration_date column)
      const { count: activeCount } = await (supabase as any)
        .from("credentials")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .gte("expiration_date", now);

      // Expiring within 30 days
      const { count: expiringCount } = await (supabase as any)
        .from("credentials")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .gte("expiration_date", now)
        .lte("expiration_date", thirtyDaysFromNow);

      // Expired
      const { count: expiredCount } = await (supabase as any)
        .from("credentials")
        .select("*", { count: "exact", head: true })
        .lt("expiration_date", now);

      // Total interpreters with credentials
      const { data: uniqueUsers } = await (supabase as any)
        .from("credentials")
        .select("user_id");
      const totalInterpreters = new Set(uniqueUsers?.map((u: any) => u.user_id) || []).size;

      // Credentials by type
      const { data: credsByType } = await (supabase as any)
        .from("credentials")
        .select("credential_type")
        .eq("status", "active")
        .gte("expiration_date", now);

      const typeCounts: Record<string, number> = {};
      credsByType?.forEach((c: any) => {
        typeCounts[c.credential_type] = (typeCounts[c.credential_type] || 0) + 1;
      });
      const byType = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));

      setCredentialsStats({
        activeCredentials: activeCount || 0,
        expiringSoon: expiringCount || 0,
        expired: expiredCount || 0,
        totalInterpreters,
        byType,
      });
    } catch (error) {
      console.error("Error loading credentials stats:", error);
    } finally {
      setLoadingCredentials(false);
    }
  };

  // Load community activity stats
  const loadCommunityStats = async () => {
    setLoadingCommunityStats(true);
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Total posts
      const { count: totalPosts } = await supabase
        .from("community_posts")
        .select("*", { count: "exact", head: true })
        .eq("is_deleted", false);

      // Total comments
      const { count: totalComments } = await supabase
        .from("post_comments")
        .select("*", { count: "exact", head: true })
        .eq("is_deleted", false);

      // Active users (users with posts or comments in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentPosts } = await supabase
        .from("community_posts")
        .select("user_id")
        .gte("created_at", thirtyDaysAgo);
      const { data: recentComments } = await supabase
        .from("post_comments")
        .select("user_id")
        .gte("created_at", thirtyDaysAgo);

      const activeUserIds = new Set([
        ...(recentPosts?.map(p => p.user_id) || []),
        ...(recentComments?.map(c => c.user_id) || []),
      ]);

      // Posts this week
      const { count: postsThisWeek } = await supabase
        .from("community_posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo)
        .eq("is_deleted", false);

      setCommunityStats({
        totalPosts: totalPosts || 0,
        totalComments: totalComments || 0,
        activeUsers: activeUserIds.size,
        postsThisWeek: postsThisWeek || 0,
      });
    } catch (error) {
      console.error("Error loading community stats:", error);
    } finally {
      setLoadingCommunityStats(false);
    }
  };

  const generateInviteCode = (): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    code += "-";
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleCreateOrganization = async () => {
    if (!newOrg.name.trim()) return;
    setCreatingOrg(true);

    const { data, error } = await (supabase as any)
      .from("organizations")
      .insert({ name: newOrg.name.trim(), subscription_tier: newOrg.subscription_tier })
      .select()
      .single();

    if (!error && data) {
      setOrganizations([data, ...organizations]);
      setNewOrg({ name: "", subscription_tier: "standard" });
      setShowCreateOrgModal(false);
    }
    setCreatingOrg(false);
  };

  const handleCreateAgencyCode = async () => {
    if (!newAgencyCode.organization_name.trim()) return;
    setCreatingAgencyCode(true);

    const code = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + newAgencyCode.expires_days);

    const { data, error } = await (supabase as any)
      .from("agency_codes")
      .insert({
        code,
        organization_name: newAgencyCode.organization_name.trim(),
        status: "pending",
        expires_at: expiresAt.toISOString(),
        notes: newAgencyCode.notes || null,
        created_by: userData?.id,
      })
      .select()
      .single();

    if (!error && data) {
      setAgencyCodes([data, ...agencyCodes]);
      setGeneratedCode(code);
      setNewAgencyCode({ organization_name: "", notes: "", expires_days: 30 });
      setShowCreateAgencyCodeModal(false);
    }
    setCreatingAgencyCode(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRevokeAgencyCode = async (codeId: string) => {
    await (supabase as any)
      .from("agency_codes")
      .update({ status: "revoked" })
      .eq("id", codeId);
    setAgencyCodes(agencyCodes.map(c => c.id === codeId ? { ...c, status: "revoked" as const } : c));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  // Tab configuration - consolidated from 12 to 6
  const tabs: { key: AdminView; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "ceu", label: "CEU & RID" },
    { key: "users", label: "Users & Analytics" },
    { key: "orgs", label: "Organizations" },
    { key: "content", label: "Content" },
    { key: "community", label: "Community" },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-50">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Platform management and analytics</p>
        </div>

        {/* Main Tab Navigation - Now only 6 tabs */}
        <div className="mb-6 flex gap-1 border-b border-slate-800 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedView(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                selectedView === tab.key
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== OVERVIEW TAB ===== */}
        {selectedView === "overview" && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5">
                <p className="text-3xl font-bold text-violet-400">{overviewMetrics.activeUsers}</p>
                <p className="text-sm text-slate-300 mt-1">Active Users</p>
              </div>
              <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-5">
                <p className="text-3xl font-bold text-teal-400">{overviewMetrics.ceuEarned}</p>
                <p className="text-sm text-slate-300 mt-1">CEUs Earned</p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <p className="text-3xl font-bold text-emerald-400">{overviewMetrics.workshopsCompleted}</p>
                <p className="text-sm text-slate-300 mt-1">Workshops Completed</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                <p className="text-3xl font-bold text-amber-400">{overviewMetrics.avgRating}</p>
                <p className="text-sm text-slate-300 mt-1">Avg Rating</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => setSelectedView("ceu")}
                className="p-4 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-800/50 transition-colors text-left"
              >
                <p className="font-medium text-slate-200">CEU Management</p>
                <p className="text-sm text-slate-400 mt-1">Export RID data, manage certificates</p>
              </button>
              <button
                onClick={() => setSelectedView("content")}
                className="p-4 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-800/50 transition-colors text-left"
              >
                <p className="font-medium text-slate-200">Workshop Manager</p>
                <p className="text-sm text-slate-400 mt-1">Create and edit CEU workshops</p>
              </button>
              <button
                onClick={() => setSelectedView("orgs")}
                className="p-4 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-800/50 transition-colors text-left"
              >
                <p className="font-medium text-slate-200">Organizations</p>
                <p className="text-sm text-slate-400 mt-1">Manage agencies and invite codes</p>
              </button>
            </div>
          </div>
        )}

        {/* ===== CEU & RID TAB ===== */}
        {selectedView === "ceu" && (
          <CEUAdminDashboard />
        )}

        {/* ===== USERS & ANALYTICS TAB ===== */}
        {selectedView === "users" && (
          <div className="space-y-6">
            {/* Sub-tabs */}
            <div className="flex gap-2 pb-4 border-b border-slate-800">
              {[
                { key: "pipeline", label: "Pipeline Health" },
                { key: "competency", label: "Competency Growth" },
                { key: "wellness", label: "Wellness" },
                { key: "credentials", label: "Credentials" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setUsersSubTab(tab.key as any)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    usersSubTab === tab.key
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-400 hover:text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Pipeline Health */}
            {usersSubTab === "pipeline" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5">
                    <p className="text-3xl font-bold text-violet-400">{pipelineData.itpGraduates}</p>
                    <p className="text-sm text-slate-300 mt-1">ITP Graduates</p>
                  </div>
                  <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-5">
                    <p className="text-3xl font-bold text-teal-400">{pipelineData.activeInterpreters}</p>
                    <p className="text-sm text-slate-300 mt-1">Active Interpreters</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                    <p className="text-3xl font-bold text-emerald-400">{pipelineData.nowMentoring}</p>
                    <p className="text-sm text-slate-300 mt-1">Now Mentoring</p>
                  </div>
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
                    <p className="text-3xl font-bold text-blue-400">{pipelineData.totalUsers}</p>
                    <p className="text-sm text-slate-300 mt-1">Total Users</p>
                  </div>
                </div>

              </div>
            )}

            {/* Competency Growth */}
            {usersSubTab === "competency" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">Domain Averages</h4>
                  <div className="space-y-4">
                    {competencyGrowth.domains.map((domain) => (
                      <div key={domain.name}>
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-300">{domain.name}</span>
                          <span className="text-emerald-400">{domain.trend}</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: `${domain.average}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{domain.average}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Wellness */}
            {usersSubTab === "wellness" && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                    <p className="text-3xl font-bold text-emerald-400">{wellnessIndicators.distribution.healthy}</p>
                    <p className="text-sm text-slate-300 mt-1">Healthy</p>
                  </div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                    <p className="text-3xl font-bold text-amber-400">{wellnessIndicators.distribution.warning}</p>
                    <p className="text-sm text-slate-300 mt-1">Warning</p>
                  </div>
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
                    <p className="text-3xl font-bold text-rose-400">{wellnessIndicators.distribution.critical}</p>
                    <p className="text-sm text-slate-300 mt-1">Critical</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Check-in Completion Rate</span>
                    <span className="text-teal-400 text-2xl font-bold">{wellnessIndicators.checkInCompletionRate}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Credentials */}
            {usersSubTab === "credentials" && (
              <div className="space-y-6">
                {loadingCredentials ? (
                  <div className="text-center py-8 text-slate-400">Loading credentials data...</div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                        <p className="text-3xl font-bold text-emerald-400">{credentialsStats.activeCredentials}</p>
                        <p className="text-sm text-slate-300 mt-1">Active Credentials</p>
                      </div>
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                        <p className="text-3xl font-bold text-amber-400">{credentialsStats.expiringSoon}</p>
                        <p className="text-sm text-slate-300 mt-1">Expiring Soon</p>
                      </div>
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
                        <p className="text-3xl font-bold text-rose-400">{credentialsStats.expired}</p>
                        <p className="text-sm text-slate-300 mt-1">Expired</p>
                      </div>
                      <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5">
                        <p className="text-3xl font-bold text-violet-400">{credentialsStats.totalInterpreters}</p>
                        <p className="text-sm text-slate-300 mt-1">Total Interpreters</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                      <h4 className="text-sm font-medium text-slate-300 mb-4">Credential Types</h4>
                      <div className="space-y-3">
                        {credentialsStats.byType.length === 0 ? (
                          <p className="text-slate-500 text-sm">No credential data available</p>
                        ) : (
                          credentialsStats.byType.map((item) => (
                            <div key={item.type} className="flex justify-between items-center">
                              <span className="text-slate-300">{item.type}</span>
                              <span className="text-teal-400">{item.count}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== ORGANIZATIONS TAB ===== */}
        {selectedView === "orgs" && (
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateOrgModal(true)}
                className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
              >
                Create Organization
              </button>
              <button
                onClick={() => setShowCreateAgencyCodeModal(true)}
                className="px-4 py-2 rounded-lg border border-teal-500/50 text-teal-400 hover:bg-teal-500/10 transition-colors"
              >
                Generate Agency Code
              </button>
            </div>

            {/* Generated Code Display */}
            {generatedCode && (
              <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-400 mb-1">Generated Code:</p>
                    <p className="text-2xl font-mono font-bold text-slate-100">{generatedCode}</p>
                  </div>
                  <button
                    onClick={() => handleCopyCode(generatedCode)}
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400 transition-colors"
                  >
                    {copiedCode ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            {/* Organizations List */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="font-medium text-slate-200">Organizations</h3>
              </div>
              <div className="divide-y divide-slate-800">
                {organizations.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">No organizations yet</div>
                ) : (
                  organizations.map((org) => (
                    <div key={org.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-200">{org.name}</p>
                        <p className="text-sm text-slate-500">
                          {org.subscription_tier} - Created {formatDate(org.created_at)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        org.subscription_tier === "premium"
                          ? "bg-violet-500/20 text-violet-400"
                          : "bg-slate-700 text-slate-300"
                      }`}>
                        {org.subscription_tier}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Agency Codes List */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="font-medium text-slate-200">Agency Codes</h3>
              </div>
              <div className="divide-y divide-slate-800">
                {agencyCodes.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">No agency codes yet</div>
                ) : (
                  agencyCodes.map((code) => (
                    <div key={code.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-mono text-slate-200">{code.code}</p>
                        <p className="text-sm text-slate-500">
                          {code.organization_name} - Expires {formatDate(code.expires_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          code.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                          code.status === "used" ? "bg-emerald-500/20 text-emerald-400" :
                          "bg-slate-700 text-slate-400"
                        }`}>
                          {code.status}
                        </span>
                        {code.status === "pending" && (
                          <button
                            onClick={() => handleRevokeAgencyCode(code.id)}
                            className="text-xs text-rose-400 hover:text-rose-300"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== CONTENT TAB ===== */}
        {selectedView === "content" && (
          <WorkshopManager />
        )}

        {/* ===== COMMUNITY TAB ===== */}
        {selectedView === "community" && (
          <div className="space-y-6">
            {/* Sub-tabs */}
            <div className="flex gap-2 pb-4 border-b border-slate-800">
              {[
                { key: "activity", label: "Activity" },
                { key: "elya", label: "Elya Feedback" },
                { key: "moderation", label: "Moderation" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setCommunitySubTab(tab.key as any)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    communitySubTab === tab.key
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-400 hover:text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Activity */}
            {communitySubTab === "activity" && (
              <div className="space-y-6">
                {loadingCommunityStats ? (
                  <div className="text-center py-8 text-slate-400">Loading community data...</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5">
                      <p className="text-3xl font-bold text-violet-400">{communityStats.totalPosts}</p>
                      <p className="text-sm text-slate-300 mt-1">Total Posts</p>
                    </div>
                    <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-5">
                      <p className="text-3xl font-bold text-teal-400">{communityStats.totalComments}</p>
                      <p className="text-sm text-slate-300 mt-1">Total Comments</p>
                    </div>
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                      <p className="text-3xl font-bold text-emerald-400">{communityStats.activeUsers}</p>
                      <p className="text-sm text-slate-300 mt-1">Active Users (30d)</p>
                    </div>
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
                      <p className="text-3xl font-bold text-blue-400">{communityStats.postsThisWeek}</p>
                      <p className="text-sm text-slate-300 mt-1">Posts This Week</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Elya Feedback */}
            {communitySubTab === "elya" && (
              <div className="space-y-6">
                <div className="flex gap-2 flex-wrap">
                  {[
                    { key: "all", label: "All" },
                    { key: "helpful", label: "Helpful" },
                    { key: "okay", label: "Okay" },
                    { key: "not-helpful", label: "Not Helpful" },
                    { key: "with-text", label: "With Comments" },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setFeedbackFilter(filter.key as any)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        feedbackFilter === filter.key
                          ? "bg-violet-500/20 text-violet-400"
                          : "bg-slate-800 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {loadingFeedback ? (
                  <div className="text-center py-8 text-slate-400">Loading feedback...</div>
                ) : (
                  <div className="space-y-3">
                    {elyaFeedback
                      .filter((f) => {
                        if (feedbackFilter === "all") return true;
                        if (feedbackFilter === "with-text") return f.user_feedback;
                        if (feedbackFilter === "helpful") return f.sentiment === "helpful";
                        if (feedbackFilter === "okay") return f.sentiment === "okay";
                        if (feedbackFilter === "not-helpful") return f.sentiment === "not-helpful";
                        return true;
                      })
                      .slice(0, 20)
                      .map((feedback) => (
                        <div key={feedback.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm text-slate-200">{feedback.user?.full_name || "Anonymous"}</p>
                              <p className="text-xs text-slate-500">{feedback.mode} - {formatDate(feedback.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {feedback.mood_emoji && <span className="text-lg">{feedback.mood_emoji}</span>}
                              {feedback.sentiment && (
                                <span className={`px-2 py-0.5 text-xs rounded ${
                                  feedback.sentiment === "helpful" ? "bg-emerald-500/20 text-emerald-400" :
                                  feedback.sentiment === "okay" ? "bg-amber-500/20 text-amber-400" :
                                  "bg-rose-500/20 text-rose-400"
                                }`}>
                                  {feedback.sentiment}
                                </span>
                              )}
                            </div>
                          </div>
                          {feedback.user_feedback && (
                            <p className="text-sm text-slate-300 mt-2 p-2 bg-slate-800/50 rounded">
                              {feedback.user_feedback}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Moderation */}
            {communitySubTab === "moderation" && (
              <div className="space-y-6">
                {loadingModeration ? (
                  <div className="text-center py-8 text-slate-400">Loading moderation data...</div>
                ) : (
                  <>
                    {/* Search and Filter */}
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Search by name or email..."
                          value={moderationSearch}
                          onChange={(e) => setModerationSearch(e.target.value)}
                          className="w-full px-4 py-2.5 pl-10 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                        />
                        <svg className="absolute left-3 top-3 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { key: "all", label: "All", color: "slate" },
                          { key: "banned", label: "Banned", color: "rose" },
                          { key: "suspended", label: "Suspended", color: "amber" },
                          { key: "warned", label: "Warned", color: "orange" },
                          { key: "active", label: "Active", color: "emerald" },
                        ].map((filter) => (
                          <button
                            key={filter.key}
                            onClick={() => setModerationFilter(filter.key as any)}
                            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                              moderationFilter === filter.key
                                ? filter.color === "rose" ? "bg-rose-500/20 text-rose-400"
                                : filter.color === "amber" ? "bg-amber-500/20 text-amber-400"
                                : filter.color === "orange" ? "bg-orange-500/20 text-orange-400"
                                : filter.color === "emerald" ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-teal-500/20 text-teal-400"
                                : "bg-slate-800 text-slate-400 hover:text-slate-300"
                            }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Users requiring attention */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="font-medium text-slate-200">Community Members</h3>
                        <span className="text-xs text-slate-500">
                          {moderationUsers.filter((user) => {
                            const searchLower = moderationSearch.toLowerCase();
                            const matchesSearch = !moderationSearch ||
                              user.display_name?.toLowerCase().includes(searchLower) ||
                              user.profiles?.full_name?.toLowerCase().includes(searchLower) ||
                              user.profiles?.email?.toLowerCase().includes(searchLower);
                            const matchesFilter = moderationFilter === "all" ||
                              (moderationFilter === "banned" && user.is_banned) ||
                              (moderationFilter === "suspended" && user.is_suspended) ||
                              (moderationFilter === "warned" && user.warning_count > 0) ||
                              (moderationFilter === "active" && !user.is_banned && !user.is_suspended);
                            return matchesSearch && matchesFilter;
                          }).length} users
                        </span>
                      </div>
                      <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
                        {moderationUsers.filter((user) => {
                          const searchLower = moderationSearch.toLowerCase();
                          const matchesSearch = !moderationSearch ||
                            user.display_name?.toLowerCase().includes(searchLower) ||
                            user.profiles?.full_name?.toLowerCase().includes(searchLower) ||
                            user.profiles?.email?.toLowerCase().includes(searchLower);
                          const matchesFilter = moderationFilter === "all" ||
                            (moderationFilter === "banned" && user.is_banned) ||
                            (moderationFilter === "suspended" && user.is_suspended) ||
                            (moderationFilter === "warned" && user.warning_count > 0) ||
                            (moderationFilter === "active" && !user.is_banned && !user.is_suspended);
                          return matchesSearch && matchesFilter;
                        }).length === 0 ? (
                          <div className="p-4 text-center text-slate-500">No users match your search</div>
                        ) : (
                          moderationUsers.filter((user) => {
                            const searchLower = moderationSearch.toLowerCase();
                            const matchesSearch = !moderationSearch ||
                              user.display_name?.toLowerCase().includes(searchLower) ||
                              user.profiles?.full_name?.toLowerCase().includes(searchLower) ||
                              user.profiles?.email?.toLowerCase().includes(searchLower);
                            const matchesFilter = moderationFilter === "all" ||
                              (moderationFilter === "banned" && user.is_banned) ||
                              (moderationFilter === "suspended" && user.is_suspended) ||
                              (moderationFilter === "warned" && user.warning_count > 0) ||
                              (moderationFilter === "active" && !user.is_banned && !user.is_suspended);
                            return matchesSearch && matchesFilter;
                          }).slice(0, 50).map((user) => (
                            <div key={user.user_id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-slate-200 font-medium truncate">{user.display_name || user.profiles?.full_name || "Anonymous"}</p>
                                  {user.is_banned && (
                                    <span className="px-1.5 py-0.5 text-[10px] bg-rose-500/20 text-rose-400 rounded">BANNED</span>
                                  )}
                                  {user.is_suspended && (
                                    <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded">SUSPENDED</span>
                                  )}
                                  {user.warning_count > 0 && (
                                    <span className="px-1.5 py-0.5 text-[10px] bg-orange-500/20 text-orange-400 rounded">{user.warning_count} WARNING{user.warning_count > 1 ? 'S' : ''}</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 truncate">{user.profiles?.email || "No email"}</p>
                                <p className="text-xs text-slate-600 mt-0.5">{user.post_count || 0} posts • Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {user.is_banned ? (
                                  <button
                                    onClick={() => handleUnbanUser(user.user_id)}
                                    disabled={processingAction}
                                    className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30"
                                  >
                                    Unban
                                  </button>
                                ) : user.is_suspended ? (
                                  <button
                                    onClick={() => handleUnsuspendUser(user.user_id)}
                                    disabled={processingAction}
                                    className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30"
                                  >
                                    Unsuspend
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => { setSelectedUser(user); setShowSuspendModal(true); }}
                                      className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30"
                                    >
                                      Suspend
                                    </button>
                                    <button
                                      onClick={() => { setSelectedUser(user); setShowBanModal(true); }}
                                      className="text-xs px-2 py-1 bg-rose-500/20 text-rose-400 rounded hover:bg-rose-500/30"
                                    >
                                      Ban
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Moderation Log */}
                    {moderationLogs.length > 0 && (
                      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                        <div className="p-4 border-b border-slate-800">
                          <h3 className="font-medium text-slate-200">Recent Actions</h3>
                        </div>
                        <div className="divide-y divide-slate-800">
                          {moderationLogs.slice(0, 5).map((log) => (
                            <div key={log.id} className="p-4">
                              <p className="text-sm text-slate-300">
                                <span className="text-slate-400">{log.action}</span> - {log.reason}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">{formatDate(log.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== MODALS ===== */}

      {/* Create Organization Modal */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Create Organization</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  placeholder="Agency name"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Subscription Tier</label>
                <select
                  value={newOrg.subscription_tier}
                  onChange={(e) => setNewOrg({ ...newOrg, subscription_tier: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateOrgModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrganization}
                disabled={creatingOrg || !newOrg.name.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 disabled:opacity-50"
              >
                {creatingOrg ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Agency Code Modal */}
      {showCreateAgencyCodeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Generate Agency Code</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={newAgencyCode.organization_name}
                  onChange={(e) => setNewAgencyCode({ ...newAgencyCode, organization_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  placeholder="Agency name"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Expires In (days)</label>
                <input
                  type="number"
                  value={newAgencyCode.expires_days}
                  onChange={(e) => setNewAgencyCode({ ...newAgencyCode, expires_days: parseInt(e.target.value) || 30 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Notes (optional)</label>
                <textarea
                  value={newAgencyCode.notes}
                  onChange={(e) => setNewAgencyCode({ ...newAgencyCode, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateAgencyCodeModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAgencyCode}
                disabled={creatingAgencyCode || !newAgencyCode.organization_name.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 disabled:opacity-50"
              >
                {creatingAgencyCode ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
              Ban {selectedUser.display_name || "User"}
            </h3>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Reason</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                rows={3}
                placeholder="Reason for banning..."
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowBanModal(false); setSelectedUser(null); setBanReason(""); }}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                disabled={processingAction || !banReason.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-400 disabled:opacity-50"
              >
                {processingAction ? "Banning..." : "Ban User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
              Suspend {selectedUser.display_name || "User"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Duration (days)</label>
                <input
                  type="number"
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(parseInt(e.target.value) || 7)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  min={1}
                  max={365}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Reason</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  rows={3}
                  placeholder="Reason for suspension..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowSuspendModal(false); setSelectedUser(null); setSuspendReason(""); }}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendUser}
                disabled={processingAction || !suspendReason.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-medium hover:bg-amber-400 disabled:opacity-50"
              >
                {processingAction ? "Suspending..." : "Suspend User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
