"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import AdminNavBar from "@/components/AdminNavBar";
import CEUAdminDashboard from "@/components/admin/CEUAdminDashboard";
import WorkshopManager from "@/components/admin/WorkshopManager";

type Organization = {
  id: string;
  name: string;
  subscription_tier: string;
  created_at: string;
};

type InviteCode = {
  id: string;
  code: string;
  organization_id: string;
  organization?: { name: string };
  expires_at: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  agency_admin_email: string | null;
  notes: string | null;
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
  user?: {
    full_name: string | null;
    email: string | null;
  };
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<"overview" | "pipeline" | "competency" | "community" | "wellness" | "compliance" | "credentials" | "agencies" | "ceu" | "workshops" | "elya-feedback" | "moderation">("overview");

  // Community moderation state
  const [moderationUsers, setModerationUsers] = useState<any[]>([]);
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [loadingModeration, setLoadingModeration] = useState(false);
  const [moderationTab, setModerationTab] = useState<"users" | "logs">("users");
  const [showBanModal, setShowBanModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banReason, setBanReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDays, setSuspendDays] = useState(7);
  const [processingAction, setProcessingAction] = useState(false);

  // Agency management state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [agencyCodes, setAgencyCodes] = useState<AgencyCode[]>([]);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [showCreateInviteModal, setShowCreateInviteModal] = useState(false);
  const [showCreateAgencyCodeModal, setShowCreateAgencyCodeModal] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [creatingAgencyCode, setCreatingAgencyCode] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", subscription_tier: "standard" });
  const [newInvite, setNewInvite] = useState({
    organization_id: "",
    agency_admin_email: "",
    notes: "",
    expires_days: 30,
    max_uses: 1,
  });
  const [newAgencyCode, setNewAgencyCode] = useState({
    organization_name: "",
    notes: "",
    expires_days: 30,
  });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Elya Feedback state
  const [elyaFeedback, setElyaFeedback] = useState<ElyaFeedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState<"all" | "helpful" | "okay" | "not-helpful" | "with-text">("all");

  // CEU Export state
  const [exportStartDate, setExportStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First of current month
    return date.toISOString().split("T")[0];
  });
  const [exportEndDate, setExportEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [exportActivityNumber, setExportActivityNumber] = useState("");
  const [exportSummary, setExportSummary] = useState<any>(null);
  const [loadingExportSummary, setLoadingExportSummary] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Super admin emails - only these can access /admin
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

      // Check if user is a super admin (by email OR by role)
      const userEmail = session.user.email?.toLowerCase() || "";
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(userEmail);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      // Must be super admin by email OR have super_admin/admin role
      const hasAdminRole = (profile as any)?.role === "admin" || (profile as any)?.role === "super_admin";

      if (!isSuperAdmin && !hasAdminRole) {
        // Check if they're an agency admin - redirect to agency dashboard
        if ((profile as any)?.role === "agency_admin") {
          router.push("/agency");
        } else {
          router.push("/dashboard");
        }
        return;
      }

      // User is authorized
      setUserData(profile);
      setAuthorized(true);
      setLoading(false);
    };
    loadUserData();
  }, [router]);

  // Load organizations and invite codes when agencies tab is selected
  useEffect(() => {
    if (selectedView === "agencies") {
      loadAgencyData();
    }
  }, [selectedView]);

  // Load Elya feedback when that tab is selected
  useEffect(() => {
    if (selectedView === "elya-feedback") {
      loadElyaFeedback();
    }
  }, [selectedView]);

  // Load moderation data when that tab is selected
  useEffect(() => {
    if (selectedView === "moderation") {
      loadModerationData();
    }
  }, [selectedView]);

  const loadModerationData = async () => {
    setLoadingModeration(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load community users with their moderation status
      const response = await fetch("/api/admin/community?view=users", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setModerationUsers(data.users || []);
      }

      // Load moderation logs
      const logsResponse = await fetch("/api/admin/community?view=moderation_log", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
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
        body: JSON.stringify({
          action: "ban",
          user_id: selectedUser.user_id,
          reason: banReason,
        }),
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
        body: JSON.stringify({
          action: "unban",
          user_id: userId,
        }),
      });

      if (response.ok) {
        loadModerationData();
      }
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
        body: JSON.stringify({
          action: "unsuspend",
          user_id: userId,
        }),
      });

      if (response.ok) {
        loadModerationData();
      }
    } catch (error) {
      console.error("Error unsuspending user:", error);
    } finally {
      setProcessingAction(false);
    }
  };

  const loadElyaFeedback = async () => {
    setLoadingFeedback(true);
    try {
      // Get conversations that have feedback (mood_emoji is not null OR user_feedback is not null)
      const { data: convos, error } = await supabase
        .from("elya_conversations")
        .select(`
          id,
          user_id,
          mode,
          title,
          mood_emoji,
          sentiment,
          user_feedback,
          message_count,
          created_at,
          ended_at
        `)
        .eq("is_active", false)
        .order("ended_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error loading feedback:", error);
        return;
      }

      // Get user info for each conversation
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
    // Load organizations
    const { data: orgs } = await (supabase as any)
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });
    if (orgs) setOrganizations(orgs);

    // Load invite codes with organization names (legacy)
    const { data: codes } = await (supabase as any)
      .from("agency_invite_codes")
      .select("*, organization:organizations(name)")
      .order("created_at", { ascending: false });
    if (codes) setInviteCodes(codes);

    // Load agency activation codes (new system)
    const { data: agencyCodesData } = await (supabase as any)
      .from("agency_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (agencyCodesData) setAgencyCodes(agencyCodesData);
  };

  const generateInviteCode = (): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    code += "-";
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const handleCreateOrganization = async () => {
    if (!newOrg.name.trim()) return;
    setCreatingOrg(true);

    const { data, error } = await (supabase as any)
      .from("organizations")
      .insert({
        name: newOrg.name.trim(),
        subscription_tier: newOrg.subscription_tier,
      })
      .select()
      .single();

    if (!error && data) {
      setOrganizations([data, ...organizations]);
      setNewOrg({ name: "", subscription_tier: "standard" });
      setShowCreateOrgModal(false);
    }
    setCreatingOrg(false);
  };

  const handleCreateInviteCode = async () => {
    if (!newInvite.organization_id) return;
    setCreatingInvite(true);

    const code = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + newInvite.expires_days);

    const { data, error } = await (supabase as any)
      .from("agency_invite_codes")
      .insert({
        code,
        organization_id: newInvite.organization_id,
        expires_at: expiresAt.toISOString(),
        max_uses: newInvite.max_uses,
        agency_admin_email: newInvite.agency_admin_email || null,
        notes: newInvite.notes || null,
        created_by: userData?.id,
      })
      .select("*, organization:organizations(name)")
      .single();

    if (!error && data) {
      setInviteCodes([data, ...inviteCodes]);
      setGeneratedCode(code);
      setNewInvite({
        organization_id: "",
        agency_admin_email: "",
        notes: "",
        expires_days: 30,
        max_uses: 1,
      });
    }
    setCreatingInvite(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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
      setNewAgencyCode({
        organization_name: "",
        notes: "",
        expires_days: 30,
      });
      setShowCreateAgencyCodeModal(false);
    }
    setCreatingAgencyCode(false);
  };

  const handleRevokeAgencyCode = async (codeId: string) => {
    await (supabase as any)
      .from("agency_codes")
      .update({ status: "revoked" })
      .eq("id", codeId);

    setAgencyCodes(agencyCodes.map(c =>
      c.id === codeId ? { ...c, status: "revoked" as const } : c
    ));
  };

  const handleDeactivateCode = async (codeId: string) => {
    await (supabase as any)
      .from("agency_invite_codes")
      .update({ is_active: false })
      .eq("id", codeId);

    setInviteCodes(inviteCodes.map(c =>
      c.id === codeId ? { ...c, is_active: false } : c
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // CEU Export functions
  const loadExportSummary = async () => {
    setLoadingExportSummary(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/admin/ceu-export", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "summary",
          start_date: exportStartDate,
          end_date: exportEndDate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setExportSummary(data.summary);
      }
    } catch (error) {
      console.error("Error loading export summary:", error);
    } finally {
      setLoadingExportSummary(false);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams({
        start_date: exportStartDate,
        end_date: exportEndDate,
        format: "csv",
      });
      if (exportActivityNumber) {
        params.append("activity_number", exportActivityNumber);
      }

      const response = await fetch(`/api/admin/ceu-export?${params}`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `RID_CEU_Export_${exportStartDate}_to_${exportEndDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
    } finally {
      setExportingCsv(false);
    }
  };

  // Load export summary when compliance tab is selected or dates change
  useEffect(() => {
    if (selectedView === "compliance") {
      loadExportSummary();
    }
  }, [selectedView, exportStartDate, exportEndDate]);

  // Show loading state until authorization is confirmed
  // This prevents any flash of admin content for unauthorized users
  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  // Mock aggregate data - will be replaced with real queries
  const toplineMetrics = {
    activeInterpreters: 127,
    assignmentReadinessRate: 84,
    debriefCompletionRate: 71,
    mentorConnectionsThisMonth: 34
  };

  const pipelineData = {
    itpGraduates: 52,
    activeInterpreters: 127,
    nowMentoring: 18,
    avgTimeToComplex: "8.3 months",
    dropOffPoints: [
      { stage: "First assignment", rate: "12%" },
      { stage: "After 3 months", rate: "8%" },
      { stage: "Complex assignments", rate: "5%" }
    ]
  };

  const competencyGrowth = {
    domains: [
      { name: "Linguistic", average: 72, trend: "+8%", status: "improving" },
      { name: "Cultural", average: 64, trend: "+12%", status: "improving" },
      { name: "Cognitive", average: 78, trend: "+5%", status: "stable" },
      { name: "Interpersonal", average: 69, trend: "+7%", status: "improving" }
    ],
    topGrowthAreas: [
      { skill: "Medical Terminology", improvement: "+12%" },
      { skill: "Cultural Navigation", improvement: "+15%" },
      { skill: "Decision Making", improvement: "+9%" }
    ],
    strugglingAreas: [
      { skill: "Legal Register Shifting", avg: 58 },
      { skill: "Community Knowledge", avg: 61 }
    ]
  };

  const communityActivity = {
    totalConnections: 156,
    activeConversations: 43,
    topContributors: [
      { name: "Sarah Johnson", helped: 12, domain: "Medical" },
      { name: "Dr. Patricia Williams", helped: 9, domain: "Educational" },
      { name: "Marcus Chen", helped: 8, domain: "Legal" }
    ],
    connectionAcceptanceRate: 78,
    avgResponseTime: "4.2 hours"
  };

  const wellnessIndicators = {
    distribution: {
      healthy: 89,
      warning: 28,
      critical: 10
    },
    checkInCompletionRate: 76,
    trendThisMonth: "improving",
    flaggedInterpreters: 10,
    interventionsSent: 5
  };

  const complianceData = {
    totalCEUHours: 342.5,
    avgCEUPerInterpreter: 2.7,
    completionByType: [
      { type: "Medical", completed: 89, total: 127 },
      { type: "Legal", completed: 67, total: 127 },
      { type: "Educational", completed: 78, total: 127 }
    ],
    ridCompliant: 94
  };

  const roiMetrics = [
    {
      finding: "Prep completion impact",
      stat: "23% higher debrief satisfaction",
      description: "Interpreters who completed assignment prep scored 23% higher on post-assignment debrief satisfaction"
    },
    {
      finding: "Mentor connection impact",
      stat: "40% lower burnout risk",
      description: "Interpreters with active mentor connections show 40% lower burnout risk scores"
    },
    {
      finding: "Competency acceleration",
      stat: "2.3 ECCI levels in 6 months",
      description: "Average competency growth of 2.3 ECCI levels in first 6 months (vs 1.1 industry average)"
    },
    {
      finding: "Retention improvement",
      stat: "18% reduction in turnover",
      description: "Platform users show 18% lower turnover rate compared to state average"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-50">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">NC program oversight and ROI analytics</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-slate-800 overflow-x-auto">
          {[
            { key: "overview", label: "Overview" },
            { key: "ceu", label: "CEU Management" },
            { key: "workshops", label: "Workshop Manager" },
            { key: "agencies", label: "Agencies" },
            { key: "pipeline", label: "Pipeline Health" },
            { key: "competency", label: "Competency Growth" },
            { key: "community", label: "Community Activity" },
            { key: "wellness", label: "Wellness Indicators" },
            { key: "compliance", label: "Compliance & CEUs" },
            { key: "credentials", label: "Credentials" },
            { key: "elya-feedback", label: "Elya Feedback" },
            { key: "moderation", label: "Moderation" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedView(tab.key as any)}
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

        {/* Overview Tab */}
        {selectedView === "overview" && (
          <div className="space-y-6">
            {/* Top Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5">
                <p className="text-3xl font-bold text-violet-400">{toplineMetrics.activeInterpreters}</p>
                <p className="text-sm text-slate-300 mt-1">Active Interpreters</p>
                <p className="text-xs text-slate-500 mt-1">Platform engagement proof</p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <p className="text-3xl font-bold text-emerald-400">{toplineMetrics.assignmentReadinessRate}%</p>
                <p className="text-sm text-slate-300 mt-1">Assignment Readiness</p>
                <p className="text-xs text-slate-500 mt-1">Prep completion rate</p>
              </div>
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
                <p className="text-3xl font-bold text-blue-400">{toplineMetrics.debriefCompletionRate}%</p>
                <p className="text-sm text-slate-300 mt-1">Debrief Completion</p>
                <p className="text-xs text-slate-500 mt-1">Reflection happening</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                <p className="text-3xl font-bold text-amber-400">{toplineMetrics.mentorConnectionsThisMonth}</p>
                <p className="text-sm text-slate-300 mt-1">Mentor Connections</p>
                <p className="text-xs text-slate-500 mt-1">This month</p>
              </div>
            </div>

            {/* ROI Proof - The Killer Feature */}
            <div className="rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-blue-500/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Intervention Tracking - ROI Proof</h3>
                  <p className="text-sm text-slate-400 mt-1">Measurable impact on interpreter outcomes</p>
                </div>
                <button className="px-4 py-2 rounded-lg border border-teal-500/50 text-teal-400 hover:bg-teal-500/10 transition-colors text-sm">
                  Export Report
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roiMetrics.map((metric, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-700 bg-slate-900/50 p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2"></div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{metric.finding}</p>
                        <p className="text-2xl font-bold text-emerald-400 mb-2">{metric.stat}</p>
                        <p className="text-sm text-slate-400">{metric.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Pipeline Health</h4>
                <p className="text-xl font-bold text-slate-100 mb-1">{pipelineData.itpGraduates} → {pipelineData.activeInterpreters} → {pipelineData.nowMentoring}</p>
                <p className="text-xs text-slate-500">ITP Grads → Active → Mentoring</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Wellness Status</h4>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">{wellnessIndicators.distribution.healthy} Healthy</span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">{wellnessIndicators.distribution.warning} Warning</span>
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-sm">{wellnessIndicators.distribution.critical} Critical</span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Compliance</h4>
                <p className="text-xl font-bold text-slate-100 mb-1">{complianceData.ridCompliant}% RID Compliant</p>
                <p className="text-xs text-slate-500">{complianceData.totalCEUHours}h CEUs earned total</p>
              </div>
            </div>
          </div>
        )}

        {/* CEU Management Tab */}
        {selectedView === "ceu" && (
          <CEUAdminDashboard />
        )}

        {/* Workshop Manager Tab */}
        {selectedView === "workshops" && (
          <WorkshopManager />
        )}

        {/* Agencies Tab */}
        {selectedView === "agencies" && (
          <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Agency Management</h3>
                <p className="text-sm text-slate-400 mt-1">Generate activation codes for new agencies after discovery calls</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateAgencyCodeModal(true)}
                  className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Generate Activation Code
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5">
                <p className="text-3xl font-bold text-violet-400">{agencyCodes.length}</p>
                <p className="text-sm text-slate-300 mt-1">Total Codes</p>
              </div>
              <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-5">
                <p className="text-3xl font-bold text-teal-400">{agencyCodes.filter(c => c.status === "pending").length}</p>
                <p className="text-sm text-slate-300 mt-1">Pending</p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <p className="text-3xl font-bold text-emerald-400">{agencyCodes.filter(c => c.status === "used").length}</p>
                <p className="text-sm text-slate-300 mt-1">Activated</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                <p className="text-3xl font-bold text-amber-400">{agencyCodes.filter(c => c.status === "expired" || c.status === "revoked").length}</p>
                <p className="text-sm text-slate-300 mt-1">Expired/Revoked</p>
              </div>
            </div>

            {/* Generated Code Success Banner */}
            {generatedCode && (
              <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-400 mb-2">Activation Code Generated!</h3>
                    <p className="text-sm text-slate-300 mb-3">Share this code with the agency. They&apos;ll use it at <strong>/agency/signup</strong>:</p>
                    <div className="flex items-center gap-3">
                      <code className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-2xl font-mono text-emerald-400 tracking-wider">
                        {generatedCode}
                      </code>
                      <button
                        onClick={() => handleCopyCode(generatedCode)}
                        className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm"
                      >
                        {copiedCode ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setGeneratedCode(null)}
                    className="text-slate-400 hover:text-slate-300"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Agency Activation Codes List */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Agency Activation Codes ({agencyCodes.length})</h4>
                {agencyCodes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-200 mb-2">No Activation Codes Yet</h3>
                    <p className="text-sm text-slate-400 mb-4">Generate an activation code after completing a discovery call with an agency</p>
                    <button
                      onClick={() => setShowCreateAgencyCodeModal(true)}
                      className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-sm"
                    >
                      Generate First Code
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Code</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Organization Name</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Created</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Expires</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Status</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {agencyCodes.map((code) => {
                          const isExpired = new Date(code.expires_at) < new Date();
                          return (
                            <tr key={code.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-4">
                                <div className="flex items-center gap-2">
                                  <code className="px-2 py-1 rounded bg-slate-800 font-mono text-sm text-teal-400">
                                    {code.code}
                                  </code>
                                  <button
                                    onClick={() => handleCopyCode(code.code)}
                                    className="text-slate-500 hover:text-slate-300"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                </div>
                                {code.notes && (
                                  <p className="text-xs text-slate-500 mt-1">{code.notes}</p>
                                )}
                              </td>
                              <td className="py-4">
                                <p className="text-sm font-medium text-slate-100">{code.organization_name}</p>
                              </td>
                              <td className="py-4">
                                <p className="text-sm text-slate-400">{formatDate(code.created_at)}</p>
                              </td>
                              <td className="py-4">
                                <p className={`text-sm ${isExpired ? "text-rose-400" : "text-slate-400"}`}>
                                  {formatDate(code.expires_at)}
                                </p>
                              </td>
                              <td className="py-4">
                                {code.status === "used" ? (
                                  <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                                    Activated
                                  </span>
                                ) : code.status === "revoked" ? (
                                  <span className="px-2 py-1 rounded-md bg-slate-500/20 text-slate-400 text-xs font-medium">
                                    Revoked
                                  </span>
                                ) : isExpired ? (
                                  <span className="px-2 py-1 rounded-md bg-rose-500/20 text-rose-400 text-xs font-medium">
                                    Expired
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-md bg-teal-500/20 text-teal-400 text-xs font-medium">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-4">
                                {code.status === "pending" && !isExpired && (
                                  <button
                                    onClick={() => handleRevokeAgencyCode(code.id)}
                                    className="text-xs text-rose-400 hover:text-rose-300"
                                  >
                                    Deactivate
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-xl border border-blue-500/50 bg-blue-500/10 p-5">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">Agency Onboarding Flow</h3>
              <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                <li>Agency books discovery call via LunaCal</li>
                <li>After call, generate an activation code here with their organization name</li>
                <li>Share the code (e.g., ABCD-1234) with the agency admin</li>
                <li>Agency admin visits <strong>/agency/signup</strong>, enters code, creates their account</li>
                <li>They become the organization owner and can invite interpreters via their dashboard</li>
              </ol>
            </div>
          </div>
        )}

        {/* Create Agency Activation Code Modal */}
        {showCreateAgencyCodeModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Generate Agency Activation Code</h2>
              <p className="text-sm text-slate-400 mb-4">
                Create an activation code for a new agency. They&apos;ll use this code to sign up at /agency/signup
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Organization Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Acme Interpreting Services"
                    value={newAgencyCode.organization_name}
                    onChange={(e) => setNewAgencyCode({ ...newAgencyCode, organization_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">This will be their organization name in the system</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Expires In</label>
                  <select
                    value={newAgencyCode.expires_days}
                    onChange={(e) => setNewAgencyCode({ ...newAgencyCode, expires_days: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Notes (optional)</label>
                  <textarea
                    placeholder="Notes from discovery call..."
                    value={newAgencyCode.notes}
                    onChange={(e) => setNewAgencyCode({ ...newAgencyCode, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateAgencyCodeModal(false);
                    setNewAgencyCode({
                      organization_name: "",
                      notes: "",
                      expires_days: 30,
                    });
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAgencyCode}
                  disabled={!newAgencyCode.organization_name.trim() || creatingAgencyCode}
                  className="flex-1 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingAgencyCode ? "Generating..." : "Generate Code"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Organization Modal */}
        {showCreateOrgModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Create New Organization</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Organization Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Acme Interpreting Services"
                    value={newOrg.name}
                    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Subscription Tier</label>
                  <select
                    value={newOrg.subscription_tier}
                    onChange={(e) => setNewOrg({ ...newOrg, subscription_tier: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateOrgModal(false);
                    setNewOrg({ name: "", subscription_tier: "standard" });
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrganization}
                  disabled={!newOrg.name.trim() || creatingOrg}
                  className="flex-1 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingOrg ? "Creating..." : "Create Organization"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Invite Code Modal */}
        {showCreateInviteModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Generate Invite Code</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Organization *</label>
                  <select
                    value={newInvite.organization_id}
                    onChange={(e) => setNewInvite({ ...newInvite, organization_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">Select organization...</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Agency Admin Email (optional)</label>
                  <input
                    type="email"
                    placeholder="admin@agency.com"
                    value={newInvite.agency_admin_email}
                    onChange={(e) => setNewInvite({ ...newInvite, agency_admin_email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Pre-specify who should use this code</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Expires In</label>
                    <select
                      value={newInvite.expires_days}
                      onChange={(e) => setNewInvite({ ...newInvite, expires_days: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                    >
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                      <option value={60}>60 days</option>
                      <option value={90}>90 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Max Uses</label>
                    <select
                      value={newInvite.max_uses}
                      onChange={(e) => setNewInvite({ ...newInvite, max_uses: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                    >
                      <option value={1}>1 use</option>
                      <option value={5}>5 uses</option>
                      <option value={10}>10 uses</option>
                      <option value={25}>25 uses</option>
                      <option value={100}>100 uses</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Notes (optional)</label>
                  <textarea
                    placeholder="Notes from discovery call..."
                    value={newInvite.notes}
                    onChange={(e) => setNewInvite({ ...newInvite, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateInviteModal(false);
                    setNewInvite({
                      organization_id: "",
                      agency_admin_email: "",
                      notes: "",
                      expires_days: 30,
                      max_uses: 1,
                    });
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleCreateInviteCode();
                    setShowCreateInviteModal(false);
                  }}
                  disabled={!newInvite.organization_id || creatingInvite}
                  className="flex-1 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingInvite ? "Generating..." : "Generate Code"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline Health Tab */}
        {selectedView === "pipeline" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">New Interpreter Pipeline</h3>
              <p className="text-sm text-slate-400 mb-6">Are our new interpreters becoming competent?</p>

              {/* Pipeline Funnel */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1 text-center">
                    <div className="w-full bg-violet-500/20 border border-violet-500/30 rounded-lg p-4">
                      <p className="text-3xl font-bold text-violet-400">{pipelineData.itpGraduates}</p>
                      <p className="text-sm text-slate-300 mt-1">ITP Graduates</p>
                    </div>
                  </div>
                  <div className="w-12 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="w-full bg-teal-500/20 border border-teal-500/30 rounded-lg p-4">
                      <p className="text-3xl font-bold text-teal-400">{pipelineData.activeInterpreters}</p>
                      <p className="text-sm text-slate-300 mt-1">Active on Platform</p>
                    </div>
                  </div>
                  <div className="w-12 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="w-full bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4">
                      <p className="text-3xl font-bold text-emerald-400">{pipelineData.nowMentoring}</p>
                      <p className="text-sm text-slate-300 mt-1">Now Mentoring</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-sm text-blue-300">
                    <strong>Average time to complex assignments:</strong> {pipelineData.avgTimeToComplex}
                  </p>
                </div>
              </div>

              {/* Drop-off Points */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Drop-off Analysis</h4>
                <div className="space-y-2">
                  {pipelineData.dropOffPoints.map((point, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                      <span className="text-sm text-slate-300">{point.stage}</span>
                      <span className="text-sm font-medium text-rose-400">{point.rate} drop-off</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Competency Growth Tab */}
        {selectedView === "competency" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">ECCI Domain Performance</h3>
              <p className="text-sm text-slate-400 mb-6">What skills are improving across our workforce?</p>

              <div className="space-y-4 mb-6">
                {competencyGrowth.domains.map((domain, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">{domain.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-100">{domain.average}%</span>
                        <span className="text-sm text-emerald-400">{domain.trend}</span>
                      </div>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-violet-500 rounded-full"
                        style={{ width: `${domain.average}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <h4 className="text-sm font-medium text-slate-100 mb-3">Top Growth Areas</h4>
                  <div className="space-y-2">
                    {competencyGrowth.topGrowthAreas.map((skill, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">{skill.skill}</span>
                        <span className="text-sm font-medium text-emerald-400">{skill.improvement}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <h4 className="text-sm font-medium text-slate-100 mb-3">Need Attention</h4>
                  <div className="space-y-2">
                    {competencyGrowth.strugglingAreas.map((skill, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">{skill.skill}</span>
                        <span className="text-sm font-medium text-amber-400">{skill.avg}% avg</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Community Activity Tab */}
        {selectedView === "community" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Community Engagement</h3>
              <p className="text-sm text-slate-400 mb-6">Is the mentorship network actually working?</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-slate-800/50">
                  <p className="text-2xl font-bold text-violet-400">{communityActivity.totalConnections}</p>
                  <p className="text-xs text-slate-400 mt-1">Total Connections</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-800/50">
                  <p className="text-2xl font-bold text-teal-400">{communityActivity.activeConversations}</p>
                  <p className="text-xs text-slate-400 mt-1">Active Conversations</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-800/50">
                  <p className="text-2xl font-bold text-emerald-400">{communityActivity.connectionAcceptanceRate}%</p>
                  <p className="text-xs text-slate-400 mt-1">Acceptance Rate</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-800/50">
                  <p className="text-2xl font-bold text-blue-400">{communityActivity.avgResponseTime}</p>
                  <p className="text-xs text-slate-400 mt-1">Avg Response Time</p>
                </div>
              </div>

              <div className="p-5 rounded-lg bg-violet-500/10 border border-violet-500/30">
                <h4 className="text-sm font-medium text-slate-100 mb-3">Top Contributors</h4>
                <div className="space-y-3">
                  {communityActivity.topContributors.map((contributor, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-400">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{contributor.name}</p>
                          <p className="text-xs text-slate-500">{contributor.domain}</p>
                        </div>
                      </div>
                      <span className="text-sm text-emerald-400">{contributor.helped} interpreters helped</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wellness Indicators Tab */}
        {selectedView === "wellness" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Wellness & Burnout Prevention</h3>
              <p className="text-sm text-slate-400 mb-6">Are we catching burnout early?</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-3xl font-bold text-emerald-400">{wellnessIndicators.distribution.healthy}</p>
                  <p className="text-sm text-slate-300 mt-1">Healthy Status</p>
                  <p className="text-xs text-slate-500 mt-1">Low burnout risk</p>
                </div>
                <div className="p-5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-3xl font-bold text-amber-400">{wellnessIndicators.distribution.warning}</p>
                  <p className="text-sm text-slate-300 mt-1">Warning Status</p>
                  <p className="text-xs text-slate-500 mt-1">Monitoring needed</p>
                </div>
                <div className="p-5 rounded-lg bg-rose-500/10 border border-rose-500/30">
                  <p className="text-3xl font-bold text-rose-400">{wellnessIndicators.distribution.critical}</p>
                  <p className="text-sm text-slate-300 mt-1">Critical Status</p>
                  <p className="text-xs text-slate-500 mt-1">Intervention sent</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-800/50">
                  <p className="text-sm text-slate-400 mb-2">Check-in completion rate</p>
                  <p className="text-2xl font-bold text-slate-100">{wellnessIndicators.checkInCompletionRate}%</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50">
                  <p className="text-sm text-slate-400 mb-2">Wellness trend this month</p>
                  <p className="text-2xl font-bold text-emerald-400 capitalize">{wellnessIndicators.trendThisMonth}</p>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30">
                <p className="text-sm text-slate-300">
                  <strong className="text-rose-400">{wellnessIndicators.flaggedInterpreters} interpreters flagged</strong> - {wellnessIndicators.interventionsSent} supervisors notified for intervention
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Compliance & CEUs Tab */}
        {selectedView === "compliance" && (
          <div className="space-y-6">
            {/* RID Export Section - Primary Feature */}
            <div className="rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-violet-500/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                  <span className="text-teal-400 font-bold text-sm">RID</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">RID CEU Export</h3>
                  <p className="text-sm text-slate-400">Generate CSV for batch upload to RID (Sponsor #2309)</p>
                </div>
              </div>

              {/* Date Range Selection */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Activity Number (optional)</label>
                  <input
                    type="text"
                    value={exportActivityNumber}
                    onChange={(e) => setExportActivityNumber(e.target.value)}
                    placeholder="e.g., 2309-2025-001"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleExportCsv}
                    disabled={exportingCsv || !exportSummary?.total_certificates}
                    className="w-full px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {exportingCsv ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download CSV
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Export Summary */}
              {loadingExportSummary ? (
                <div className="text-center py-4 text-slate-400 text-sm">Loading summary...</div>
              ) : exportSummary ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                    <p className="text-2xl font-bold text-teal-400">{exportSummary.total_certificates}</p>
                    <p className="text-xs text-slate-400">Certificates</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                    <p className="text-2xl font-bold text-violet-400">{exportSummary.unique_participants}</p>
                    <p className="text-xs text-slate-400">Participants</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                    <p className="text-2xl font-bold text-emerald-400">{exportSummary.total_ceus}</p>
                    <p className="text-xs text-slate-400">Total CEUs</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                    <p className="text-2xl font-bold text-blue-400">{exportSummary.by_category?.["Professional Studies"]?.toFixed(2) || "0.00"}</p>
                    <p className="text-xs text-slate-400">Prof. Studies</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                    <p className={`text-2xl font-bold ${exportSummary.missing_rid_numbers > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                      {exportSummary.missing_rid_numbers}
                    </p>
                    <p className="text-xs text-slate-400">Missing RID #</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm">No certificates in this date range</div>
              )}

              {/* Warning for missing RID numbers */}
              {exportSummary?.missing_rid_numbers > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-sm text-amber-400">
                    <strong>{exportSummary.missing_rid_numbers} participant(s)</strong> are missing RID member numbers.
                    The CSV will export with blank RID numbers - you may need to look these up manually before submitting to RID.
                  </p>
                </div>
              )}
            </div>

            {/* Original Compliance Stats */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Compliance & CEU Tracking</h3>
                  <p className="text-sm text-slate-400 mt-1">Platform-wide CEU statistics</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/30">
                  <p className="text-3xl font-bold text-violet-400">{complianceData.totalCEUHours}h</p>
                  <p className="text-xs text-slate-400 mt-1">Total CEU Hours</p>
                </div>
                <div className="p-4 rounded-lg bg-teal-500/10 border border-teal-500/30">
                  <p className="text-3xl font-bold text-teal-400">{complianceData.avgCEUPerInterpreter}h</p>
                  <p className="text-xs text-slate-400 mt-1">Avg Per Interpreter</p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-3xl font-bold text-emerald-400">{complianceData.ridCompliant}%</p>
                  <p className="text-xs text-slate-400 mt-1">RID Compliant</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-3xl font-bold text-blue-400">100%</p>
                  <p className="text-xs text-slate-400 mt-1">Tracked & Verified</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Completion by Domain</h4>
                <div className="space-y-3">
                  {complianceData.completionByType.map((type, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300">{type.type}</span>
                        <span className="text-sm text-slate-400">{type.completed}/{type.total} interpreters</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${(type.completed / type.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RID Workflow Info */}
            <div className="rounded-xl border border-blue-500/50 bg-blue-500/10 p-5">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">Monthly RID Submission Workflow</h3>
              <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                <li>Select the date range for your reporting period (typically 1st - end of month)</li>
                <li>Optionally enter the RID Activity Number for this batch</li>
                <li>Review the summary - check for missing RID numbers</li>
                <li>Download CSV and review the data</li>
                <li>Upload to RID CEU Sponsor portal for batch processing</li>
                <li>Log completion in your CEU tracking system (Stage 6 of workflow)</li>
              </ol>
            </div>
          </div>
        )}

        {/* Credentials Tab */}
        {selectedView === "credentials" && (
          <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Roster Credentials</h3>
                <p className="text-sm text-slate-400 mt-1">View and track professional credentials across your team</p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors text-sm">
                  Filter
                </button>
                <button className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-sm">
                  Export Report
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <p className="text-3xl font-bold text-emerald-400">94</p>
                <p className="text-sm text-slate-300 mt-1">Active Credentials</p>
                <p className="text-xs text-slate-500 mt-1">All current & valid</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                <p className="text-3xl font-bold text-amber-400">12</p>
                <p className="text-sm text-slate-300 mt-1">Expiring Soon</p>
                <p className="text-xs text-slate-500 mt-1">Within 90 days</p>
              </div>
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
                <p className="text-3xl font-bold text-rose-400">3</p>
                <p className="text-sm text-slate-300 mt-1">Expired</p>
                <p className="text-xs text-slate-500 mt-1">Need renewal</p>
              </div>
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5">
                <p className="text-3xl font-bold text-violet-400">127</p>
                <p className="text-sm text-slate-300 mt-1">Total Interpreters</p>
                <p className="text-xs text-slate-500 mt-1">On platform</p>
              </div>
            </div>

            {/* Credentials Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-4">All Credentials</h4>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Interpreter</th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Credential Type</th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Issue Date</th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Expiration</th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Status</th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {/* Example Row 1 - Active */}
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-100">Sarah Johnson</p>
                            <p className="text-xs text-slate-500">sarah.johnson@example.com</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-slate-300">NIC Certification</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-slate-300">Jan 2020</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-slate-300">Jan 2026</p>
                        </td>
                        <td className="py-4">
                          <span className="px-2 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                            Active
                          </span>
                        </td>
                        <td className="py-4">
                          <button className="text-xs text-teal-400 hover:text-teal-300">View</button>
                        </td>
                      </tr>

                      {/* Example Row 2 - Expiring Soon */}
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-100">Marcus Chen</p>
                            <p className="text-xs text-slate-500">marcus.chen@example.com</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-slate-300">State License</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-slate-300">March 2022</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-amber-400">March 2025</p>
                        </td>
                        <td className="py-4">
                          <span className="px-2 py-1 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium">
                            Expiring Soon (2 mo)
                          </span>
                        </td>
                        <td className="py-4">
                          <button className="text-xs text-teal-400 hover:text-teal-300">View</button>
                        </td>
                      </tr>

                      {/* Example Row 3 - Expired */}
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-100">Dr. Patricia Williams</p>
                            <p className="text-xs text-slate-500">patricia.w@example.com</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-slate-300">CDI Certification</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-slate-300">June 2019</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-rose-400">Dec 2024</p>
                        </td>
                        <td className="py-4">
                          <span className="px-2 py-1 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-medium">
                            Expired
                          </span>
                        </td>
                        <td className="py-4">
                          <button className="text-xs text-teal-400 hover:text-teal-300">View</button>
                        </td>
                      </tr>

                      {/* Example Row 4 - Active */}
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-100">Jennifer Martinez</p>
                            <p className="text-xs text-slate-500">jmartinez@example.com</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-slate-300">BEI Certification</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-slate-300">Sept 2021</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-slate-300">Sept 2027</p>
                        </td>
                        <td className="py-4">
                          <span className="px-2 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                            Active
                          </span>
                        </td>
                        <td className="py-4">
                          <button className="text-xs text-teal-400 hover:text-teal-300">View</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Alert Card for Expiring/Expired */}
            <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-amber-400 mb-2">Attention Required</h3>
                  <p className="text-sm text-slate-300 mb-3">
                    <strong>15 credentials</strong> require action: 12 expiring within 90 days, 3 already expired
                  </p>
                  <button className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-colors text-sm font-medium">
                    Send Reminder Emails
                  </button>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-xl border border-blue-500/50 bg-blue-500/10 p-5">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">Credential Tracking</h3>
              <p className="text-sm text-slate-300">
                Interpreters upload their credentials via Settings → Credentials. You can view all roster credentials here,
                export compliance reports, and send renewal reminders. All credential files are stored securely and encrypted.
              </p>
            </div>
          </div>
        )}

        {/* Elya Feedback Tab */}
        {selectedView === "elya-feedback" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Elya Feedback</h3>
                <p className="text-sm text-slate-400 mt-1">User feedback from Elya chat sessions</p>
              </div>
              <button
                onClick={loadElyaFeedback}
                disabled={loadingFeedback}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors text-sm flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${loadingFeedback ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {/* Summary Stats */}
            {(() => {
              const withFeedback = elyaFeedback.filter(f => f.mood_emoji);
              const helpful = withFeedback.filter(f => f.mood_emoji === "helpful").length;
              const okay = withFeedback.filter(f => f.mood_emoji === "okay").length;
              const notHelpful = withFeedback.filter(f => f.mood_emoji === "not-helpful").length;
              const withText = elyaFeedback.filter(f => f.user_feedback).length;
              const totalWithFeedback = withFeedback.length;
              const helpfulPercent = totalWithFeedback > 0 ? Math.round((helpful / totalWithFeedback) * 100) : 0;

              return (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5">
                    <p className="text-3xl font-bold text-violet-400">{elyaFeedback.length}</p>
                    <p className="text-sm text-slate-300 mt-1">Total Sessions</p>
                    <p className="text-xs text-slate-500 mt-1">Completed chats</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                    <p className="text-3xl font-bold text-emerald-400">{helpful}</p>
                    <p className="text-sm text-slate-300 mt-1">Helpful</p>
                    <p className="text-xs text-slate-500 mt-1">{helpfulPercent}% of feedback</p>
                  </div>
                  <div className="rounded-xl border border-slate-600/50 bg-slate-700/20 p-5">
                    <p className="text-3xl font-bold text-slate-300">{okay}</p>
                    <p className="text-sm text-slate-300 mt-1">Okay</p>
                    <p className="text-xs text-slate-500 mt-1">Neutral feedback</p>
                  </div>
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
                    <p className="text-3xl font-bold text-rose-400">{notHelpful}</p>
                    <p className="text-sm text-slate-300 mt-1">Not Helpful</p>
                    <p className="text-xs text-slate-500 mt-1">Needs improvement</p>
                  </div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                    <p className="text-3xl font-bold text-amber-400">{withText}</p>
                    <p className="text-sm text-slate-300 mt-1">With Comments</p>
                    <p className="text-xs text-slate-500 mt-1">Written feedback</p>
                  </div>
                </div>
              );
            })()}

            {/* Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Filter:</span>
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    feedbackFilter === filter.key
                      ? "bg-violet-500 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-300 border border-slate-700"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Feedback Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-4">
                  Recent Feedback ({elyaFeedback.filter(f => {
                    if (feedbackFilter === "all") return true;
                    if (feedbackFilter === "with-text") return !!f.user_feedback;
                    return f.mood_emoji === feedbackFilter;
                  }).length})
                </h4>

                {loadingFeedback ? (
                  <div className="text-center py-8 text-slate-400">Loading feedback...</div>
                ) : elyaFeedback.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-200 mb-2">No Feedback Yet</h3>
                    <p className="text-sm text-slate-400">Feedback will appear here when users complete Elya conversations</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">User</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Mode</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Title</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Feedback</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Comment</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {elyaFeedback
                          .filter(f => {
                            if (feedbackFilter === "all") return true;
                            if (feedbackFilter === "with-text") return !!f.user_feedback;
                            return f.mood_emoji === feedbackFilter;
                          })
                          .map((feedback) => (
                            <tr key={feedback.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-4">
                                <div>
                                  <p className="text-sm font-medium text-slate-100">
                                    {feedback.user?.full_name || "Unknown User"}
                                  </p>
                                  <p className="text-xs text-slate-500">{feedback.user?.email || feedback.user_id.slice(0, 8)}</p>
                                </div>
                              </td>
                              <td className="py-4">
                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                  feedback.mode === "chat" ? "bg-violet-500/20 text-violet-400" :
                                  feedback.mode === "prep" ? "bg-teal-500/20 text-teal-400" :
                                  feedback.mode === "debrief" ? "bg-blue-500/20 text-blue-400" :
                                  feedback.mode === "research" ? "bg-amber-500/20 text-amber-400" :
                                  feedback.mode === "free-write" ? "bg-rose-500/20 text-rose-400" :
                                  "bg-slate-700/50 text-slate-400"
                                }`}>
                                  {feedback.mode || "chat"}
                                </span>
                              </td>
                              <td className="py-4">
                                <p className="text-sm text-slate-300 max-w-[200px] truncate">
                                  {feedback.title || "Untitled"}
                                </p>
                                <p className="text-xs text-slate-500">{feedback.message_count} messages</p>
                              </td>
                              <td className="py-4">
                                {feedback.mood_emoji ? (
                                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                    feedback.mood_emoji === "helpful" ? "bg-emerald-500/20 text-emerald-400" :
                                    feedback.mood_emoji === "okay" ? "bg-slate-600/50 text-slate-300" :
                                    feedback.mood_emoji === "not-helpful" ? "bg-rose-500/20 text-rose-400" :
                                    "bg-slate-700/50 text-slate-400"
                                  }`}>
                                    {feedback.mood_emoji === "helpful" ? "Helpful" :
                                     feedback.mood_emoji === "okay" ? "Okay" :
                                     feedback.mood_emoji === "not-helpful" ? "Not Helpful" :
                                     feedback.mood_emoji}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-500">No feedback</span>
                                )}
                              </td>
                              <td className="py-4">
                                {feedback.user_feedback ? (
                                  <div className="max-w-[250px]">
                                    <p className="text-sm text-slate-300 line-clamp-2">
                                      &ldquo;{feedback.user_feedback}&rdquo;
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500">-</span>
                                )}
                              </td>
                              <td className="py-4">
                                <p className="text-sm text-slate-400">
                                  {feedback.ended_at ? formatDate(feedback.ended_at) : formatDate(feedback.created_at)}
                                </p>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-xl border border-violet-500/50 bg-violet-500/10 p-5">
              <h3 className="text-sm font-semibold text-violet-400 mb-2">About Elya Feedback</h3>
              <p className="text-sm text-slate-300">
                Users are asked for feedback when they end a conversation with Elya. They can rate the chat as
                &ldquo;Helpful&rdquo;, &ldquo;Okay&rdquo;, or &ldquo;Not what I needed&rdquo; and optionally leave a written comment.
                This feedback helps improve Elya&apos;s responses over time.
              </p>
            </div>
          </div>
        )}

        {/* Moderation Tab */}
        {selectedView === "moderation" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Community Moderation</h3>
                <p className="text-sm text-slate-400 mt-1">Manage user bans, suspensions, and review moderation history</p>
              </div>
              <button
                onClick={loadModerationData}
                disabled={loadingModeration}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors text-sm flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${loadingModeration ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5">
                <p className="text-3xl font-bold text-violet-400">{moderationUsers.length}</p>
                <p className="text-sm text-slate-300 mt-1">Total Users</p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <p className="text-3xl font-bold text-emerald-400">
                  {moderationUsers.filter(u => !u.is_banned && !u.is_suspended).length}
                </p>
                <p className="text-sm text-slate-300 mt-1">Active</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                <p className="text-3xl font-bold text-amber-400">
                  {moderationUsers.filter(u => u.is_suspended).length}
                </p>
                <p className="text-sm text-slate-300 mt-1">Suspended</p>
              </div>
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
                <p className="text-3xl font-bold text-rose-400">
                  {moderationUsers.filter(u => u.is_banned).length}
                </p>
                <p className="text-sm text-slate-300 mt-1">Banned</p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setModerationTab("users")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  moderationTab === "users"
                    ? "bg-violet-500 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-300 border border-slate-700"
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setModerationTab("logs")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  moderationTab === "logs"
                    ? "bg-violet-500 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-300 border border-slate-700"
                }`}
              >
                Moderation Log
              </button>
            </div>

            {/* Users Tab */}
            {moderationTab === "users" && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                <div className="p-6">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">Community Members ({moderationUsers.length})</h4>

                  {loadingModeration ? (
                    <div className="text-center py-8 text-slate-400">Loading users...</div>
                  ) : moderationUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-slate-200 mb-2">No Community Users</h3>
                      <p className="text-sm text-slate-400">Users will appear here when they join the community</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-800">
                            <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">User</th>
                            <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Display Name</th>
                            <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Status</th>
                            <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Joined</th>
                            <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {moderationUsers.map((user) => (
                            <tr key={user.user_id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-medium">
                                    {user.display_name?.[0]?.toUpperCase() || user.user_id?.[0]?.toUpperCase() || "?"}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-100">
                                      {user.profiles?.full_name || "Unknown"}
                                    </p>
                                    <p className="text-xs text-slate-500">{user.profiles?.email || user.user_id?.slice(0, 8)}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4">
                                <p className="text-sm text-slate-300">{user.display_name || "-"}</p>
                              </td>
                              <td className="py-4">
                                {user.is_banned ? (
                                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-rose-500/20 text-rose-400">
                                    Banned
                                  </span>
                                ) : user.is_suspended ? (
                                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-amber-500/20 text-amber-400">
                                    Suspended until {user.suspended_until ? new Date(user.suspended_until).toLocaleDateString() : "N/A"}
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-400">
                                    Active
                                  </span>
                                )}
                              </td>
                              <td className="py-4">
                                <p className="text-sm text-slate-400">
                                  {user.created_at ? formatDate(user.created_at) : "-"}
                                </p>
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {user.is_banned ? (
                                    <button
                                      onClick={() => handleUnbanUser(user.user_id)}
                                      disabled={processingAction}
                                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                                    >
                                      Unban
                                    </button>
                                  ) : user.is_suspended ? (
                                    <button
                                      onClick={() => handleUnsuspendUser(user.user_id)}
                                      disabled={processingAction}
                                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                                    >
                                      Unsuspend
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setShowSuspendModal(true);
                                        }}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                                      >
                                        Suspend
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setShowBanModal(true);
                                        }}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                                      >
                                        Ban
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Logs Tab */}
            {moderationTab === "logs" && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                <div className="p-6">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">Moderation History ({moderationLogs.length})</h4>

                  {loadingModeration ? (
                    <div className="text-center py-8 text-slate-400">Loading logs...</div>
                  ) : moderationLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-slate-200 mb-2">No Moderation Actions Yet</h3>
                      <p className="text-sm text-slate-400">A history of all moderation actions will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {moderationLogs.map((log: any) => (
                        <div key={log.id} className="p-4 rounded-lg border border-slate-700 bg-slate-800/30">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                log.action === "ban" ? "bg-rose-500/20" :
                                log.action === "unban" ? "bg-emerald-500/20" :
                                log.action === "suspend" ? "bg-amber-500/20" :
                                log.action === "unsuspend" ? "bg-teal-500/20" :
                                "bg-slate-700"
                              }`}>
                                <svg className={`w-4 h-4 ${
                                  log.action === "ban" ? "text-rose-400" :
                                  log.action === "unban" ? "text-emerald-400" :
                                  log.action === "suspend" ? "text-amber-400" :
                                  log.action === "unsuspend" ? "text-teal-400" :
                                  "text-slate-400"
                                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  {log.action === "ban" || log.action === "suspend" ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  )}
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-100">
                                  <span className={`capitalize ${
                                    log.action === "ban" ? "text-rose-400" :
                                    log.action === "unban" ? "text-emerald-400" :
                                    log.action === "suspend" ? "text-amber-400" :
                                    log.action === "unsuspend" ? "text-teal-400" :
                                    "text-slate-300"
                                  }`}>{log.action}</span>
                                  {" - "}
                                  {log.target_user?.display_name || log.target_user?.profiles?.full_name || "Unknown User"}
                                </p>
                                {log.reason && (
                                  <p className="text-sm text-slate-400 mt-1">Reason: {log.reason}</p>
                                )}
                                <p className="text-xs text-slate-500 mt-2">
                                  By {log.admin_user?.full_name || "Admin"} on {log.created_at ? formatDate(log.created_at) : "-"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 p-5">
              <h3 className="text-sm font-semibold text-rose-400 mb-2">Moderation Guidelines</h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>&bull; <strong>Suspend:</strong> Temporary restriction (1-30 days). User cannot post or comment.</li>
                <li>&bull; <strong>Ban:</strong> Permanent removal from the community. Use for serious violations.</li>
                <li>&bull; All actions are logged and visible in the moderation history.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Ban Modal */}
        {showBanModal && selectedUser && (
          <>
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40" onClick={() => setShowBanModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Ban User</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Are you sure you want to permanently ban <strong className="text-slate-200">{selectedUser.display_name || selectedUser.profiles?.full_name || "this user"}</strong> from the community?
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reason for ban</label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Enter the reason for this ban..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowBanModal(false);
                      setSelectedUser(null);
                      setBanReason("");
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBanUser}
                    disabled={!banReason.trim() || processingAction}
                    className="flex-1 px-4 py-2 rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingAction ? "Banning..." : "Ban User"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Suspend Modal */}
        {showSuspendModal && selectedUser && (
          <>
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40" onClick={() => setShowSuspendModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Suspend User</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Temporarily suspend <strong className="text-slate-200">{selectedUser.display_name || selectedUser.profiles?.full_name || "this user"}</strong> from the community.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Suspension duration</label>
                  <select
                    value={suspendDays}
                    onChange={(e) => setSuspendDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reason for suspension</label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Enter the reason for this suspension..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSuspendModal(false);
                      setSelectedUser(null);
                      setSuspendReason("");
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSuspendUser}
                    disabled={!suspendReason.trim() || processingAction}
                    className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingAction ? "Suspending..." : "Suspend User"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
