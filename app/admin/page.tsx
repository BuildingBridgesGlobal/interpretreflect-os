"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import AdminNavBar from "@/components/AdminNavBar";

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

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<"overview" | "pipeline" | "competency" | "community" | "wellness" | "compliance" | "credentials" | "agencies">("overview");

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
            { key: "agencies", label: "Agencies" },
            { key: "pipeline", label: "Pipeline Health" },
            { key: "competency", label: "Competency Growth" },
            { key: "community", label: "Community Activity" },
            { key: "wellness", label: "Wellness Indicators" },
            { key: "compliance", label: "Compliance & CEUs" },
            { key: "credentials", label: "Credentials" }
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
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Compliance & CEU Tracking</h3>
                  <p className="text-sm text-slate-400 mt-1">Can we prove this to our funders?</p>
                </div>
                <button className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors">
                  Export PDF Report
                </button>
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
      </div>
    </div>
  );
}
