"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import { motion } from "framer-motion";

interface TeamMember {
  user_id: string;
  role: string | null;
  joined_at: string | null;
  is_active: boolean | null;
  profile: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    created_at: string | null;
  };
  activity: {
    assignmentsThisMonth: number;
    debriefCompletionRate: number;
    prepCompletionRate: number;
  };
  credentials: Credential[];
}

interface Credential {
  id: string;
  credential_type: string;
  credential_name: string;
  issuing_organization: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  status: "active" | "expiring_soon" | "expired";
  file_url: string | null;
  memberName?: string;
  memberEmail?: string;
}

interface Organization {
  id: string;
  name: string;
  subscription_tier: string | null;
}

interface AgencyStats {
  totalMembers: number;
  activeCredentials: number;
  expiringSoon: number;
  expired: number;
  avgPrepRate: number;
  avgDebriefRate: number;
  totalAssignmentsThisMonth: number;
}

type TabType = "roster" | "credentials" | "prep" | "reports";

export default function AgencyDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allCredentials, setAllCredentials] = useState<Credential[]>([]);
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [selectedTab, setSelectedTab] = useState<TabType>("roster");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [credentialFilter, setCredentialFilter] = useState<"all" | "active" | "expiring" | "expired">("all");

  useEffect(() => {
    loadAgencyData();
  }, []);

  /**
   * SECURITY: All data is fetched through the secure API endpoint
   * The API validates the session token and only returns data for the user's organization
   * This prevents any cross-organization data access
   */
  const loadAgencyData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }

      // SECURITY: Call API with Authorization header
      // The API validates the token and only returns data for the user's own organization
      const response = await fetch("/api/agency", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        router.push("/signin");
        return;
      }

      if (response.status === 403) {
        // Not an agency admin - redirect to regular dashboard
        router.push("/dashboard");
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load agency data");
      }

      const data = await response.json();

      setOrganization(data.organization);
      setTeamMembers(data.teamMembers || []);
      setAllCredentials(data.credentials || []);
      setStats(data.stats);
      setLoading(false);
    } catch (err: any) {
      console.error("Error loading agency data:", err);
      setError(err.message || "Failed to load agency data");
      setLoading(false);
    }
  };

  /**
   * SECURITY: Invitations go through the secure API endpoint
   * The API validates the session and only allows invites to the user's own organization
   */
  const handleInvite = async () => {
    if (!inviteEmail || !organization) return;
    setInviting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }

      // SECURITY: Call API with Authorization header
      const response = await fetch("/api/agency", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "invite",
          email: inviteEmail,
          role: "member",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      alert(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setShowInviteModal(false);
    } catch (err: any) {
      console.error("Error sending invitation:", err);
      alert(err.message || "Failed to send invitation. Please try again.");
    } finally {
      setInviting(false);
    }
  };

  // Use credentials from API response (already includes memberName/memberEmail)
  const getFilteredCredentials = () => {
    if (credentialFilter === "all") return allCredentials;
    return allCredentials.filter((c) => {
      if (credentialFilter === "active") return c.status === "active";
      if (credentialFilter === "expiring") return c.status === "expiring_soon";
      if (credentialFilter === "expired") return c.status === "expired";
      return true;
    });
  };

  // Use stats from API response
  const getCredentialStats = () => {
    if (stats) {
      return {
        total: allCredentials.length,
        active: stats.activeCredentials,
        expiringSoon: stats.expiringSoon,
        expired: stats.expired,
      };
    }
    return { total: 0, active: 0, expiringSoon: 0, expired: 0 };
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading agency dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950">
        <NavBar />
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
            <h2 className="text-lg font-semibold text-rose-400 mb-2">Error Loading Dashboard</h2>
            <p className="text-sm text-slate-300 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                loadAgencyData();
              }}
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const credentialStats = getCredentialStats();
  // Use stats from API for team averages
  const avgPrepRate = stats?.avgPrepRate || 0;
  const avgDebriefRate = stats?.avgDebriefRate || 0;

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">{organization?.name || "Agency"} Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Manage your team, credentials, and compliance</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-sm"
          >
            Invite Team Member
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5">
            <p className="text-3xl font-bold text-violet-400">{teamMembers.length}</p>
            <p className="text-sm text-slate-300 mt-1">Team Members</p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <p className="text-3xl font-bold text-emerald-400">{credentialStats.active}</p>
            <p className="text-sm text-slate-300 mt-1">Active Credentials</p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
            <p className="text-3xl font-bold text-amber-400">{credentialStats.expiringSoon}</p>
            <p className="text-sm text-slate-300 mt-1">Expiring Soon</p>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
            <p className="text-3xl font-bold text-blue-400">{avgPrepRate}%</p>
            <p className="text-sm text-slate-300 mt-1">Avg Prep Rate</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-slate-800">
          {[
            { key: "roster", label: "Team Roster" },
            { key: "credentials", label: "Credential Command Center" },
            { key: "prep", label: "Prep Tracking" },
            { key: "reports", label: "Reports" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as TabType)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                selectedTab === tab.key
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Team Roster Tab */}
        {selectedTab === "roster" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80">
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider p-4">Team Member</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider p-4">Role</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider p-4">Joined</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider p-4">Assignments (This Month)</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider p-4">Debrief Rate</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider p-4">Credentials</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {teamMembers.map((member) => {
                      const expiringSoon = member.credentials.filter((c) => c.status === "expiring_soon").length;
                      const expired = member.credentials.filter((c) => c.status === "expired").length;
                      return (
                        <tr key={member.user_id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center text-white font-medium">
                                {member.profile.full_name?.charAt(0) || "?"}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-100">{member.profile.full_name || "Unknown"}</p>
                                <p className="text-xs text-slate-500">{member.profile.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${
                              member.role === "admin" || member.role === "owner"
                                ? "bg-violet-500/20 text-violet-400"
                                : member.role === "manager"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-slate-700 text-slate-300"
                            }`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-slate-300">{formatDate(member.joined_at)}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-slate-300">{member.activity.assignmentsThisMonth}</p>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    member.activity.debriefCompletionRate >= 70
                                      ? "bg-emerald-500"
                                      : member.activity.debriefCompletionRate >= 40
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                  }`}
                                  style={{ width: `${member.activity.debriefCompletionRate}%` }}
                                />
                              </div>
                              <span className="text-sm text-slate-400">{member.activity.debriefCompletionRate}%</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {member.credentials.length === 0 ? (
                                <span className="text-sm text-slate-500">None</span>
                              ) : (
                                <>
                                  <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-xs">
                                    {member.credentials.filter((c) => c.status === "active").length} active
                                  </span>
                                  {expiringSoon > 0 && (
                                    <span className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-400 text-xs">
                                      {expiringSoon} expiring
                                    </span>
                                  )}
                                  {expired > 0 && (
                                    <span className="px-2 py-1 rounded-md bg-rose-500/20 text-rose-400 text-xs">
                                      {expired} expired
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {teamMembers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No team members yet. Invite your first team member to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Credential Command Center Tab */}
        {selectedTab === "credentials" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Alert for expiring/expired */}
            {(credentialStats.expiringSoon > 0 || credentialStats.expired > 0) && (
              <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-amber-400 mb-1">Attention Required</h3>
                    <p className="text-sm text-slate-300">
                      <strong>{credentialStats.expiringSoon + credentialStats.expired} credentials</strong> need action:
                      {credentialStats.expiringSoon > 0 && ` ${credentialStats.expiringSoon} expiring within 90 days`}
                      {credentialStats.expired > 0 && `${credentialStats.expiringSoon > 0 ? "," : ""} ${credentialStats.expired} expired`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Filter buttons */}
            <div className="flex gap-2">
              {[
                { key: "all", label: `All (${credentialStats.total})` },
                { key: "active", label: `Active (${credentialStats.active})`, color: "emerald" },
                { key: "expiring", label: `Expiring (${credentialStats.expiringSoon})`, color: "amber" },
                { key: "expired", label: `Expired (${credentialStats.expired})`, color: "rose" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setCredentialFilter(filter.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    credentialFilter === filter.key
                      ? "bg-slate-700 text-slate-100"
                      : "bg-slate-800/50 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Credentials Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80">
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider p-4">Interpreter</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider p-4">Credential</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider p-4">Issuing Org</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider p-4">Issue Date</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider p-4">Expiration</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {getFilteredCredentials().map((cred) => (
                      <tr key={cred.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="text-sm font-medium text-slate-100">{cred.memberName}</p>
                            <p className="text-xs text-slate-500">{cred.memberEmail}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-slate-300">{cred.credential_name}</p>
                          <p className="text-xs text-slate-500">{cred.credential_type}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-slate-300">{cred.issuing_organization || "—"}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-slate-300">{formatDate(cred.issue_date)}</p>
                        </td>
                        <td className="p-4">
                          <p className={`text-sm ${
                            cred.status === "expired" ? "text-rose-400" :
                            cred.status === "expiring_soon" ? "text-amber-400" :
                            "text-slate-300"
                          }`}>
                            {formatDate(cred.expiration_date)}
                          </p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                            cred.status === "active"
                              ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                              : cred.status === "expiring_soon"
                              ? "bg-amber-500/20 border border-amber-500/30 text-amber-400"
                              : "bg-rose-500/20 border border-rose-500/30 text-rose-400"
                          }`}>
                            {cred.status === "active" ? "Active" : cred.status === "expiring_soon" ? "Expiring Soon" : "Expired"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {getFilteredCredentials().length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          {credentialStats.total === 0
                            ? "No credentials uploaded yet. Team members can add credentials in their Settings."
                            : "No credentials match this filter."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Prep Tracking Tab */}
        {selectedTab === "prep" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Team Prep Completion</h3>
                <p className="text-3xl font-bold text-teal-400">{avgPrepRate}%</p>
                <p className="text-xs text-slate-500 mt-1">Average across all team members</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Team Debrief Completion</h3>
                <p className="text-3xl font-bold text-violet-400">{avgDebriefRate}%</p>
                <p className="text-xs text-slate-500 mt-1">Reflections completed after assignments</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Total Assignments</h3>
                <p className="text-3xl font-bold text-blue-400">
                  {teamMembers.reduce((sum, m) => sum + m.activity.assignmentsThisMonth, 0)}
                </p>
                <p className="text-xs text-slate-500 mt-1">This month</p>
              </div>
            </div>

            {/* Individual Prep Rates */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Individual Prep Completion</h3>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.user_id} className="flex items-center gap-4">
                    <div className="w-32 flex-shrink-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{member.profile.full_name || "Unknown"}</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            member.activity.prepCompletionRate >= 70
                              ? "bg-gradient-to-r from-teal-500 to-emerald-500"
                              : member.activity.prepCompletionRate >= 40
                              ? "bg-gradient-to-r from-amber-500 to-orange-500"
                              : "bg-gradient-to-r from-rose-500 to-pink-500"
                          }`}
                          style={{ width: `${member.activity.prepCompletionRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className={`text-sm font-medium ${
                        member.activity.prepCompletionRate >= 70
                          ? "text-emerald-400"
                          : member.activity.prepCompletionRate >= 40
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}>
                        {member.activity.prepCompletionRate}%
                      </span>
                    </div>
                    <div className="w-24 text-right text-xs text-slate-500">
                      {member.activity.assignmentsThisMonth} assignments
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 && (
                  <p className="text-center text-slate-500 py-4">No team members to show</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Reports Tab */}
        {selectedTab === "reports" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Compliance Reports</h3>
              <p className="text-sm text-slate-400 mb-6">Generate PDF reports for audits and compliance verification</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-lg border border-slate-700 bg-slate-800/30">
                  <h4 className="text-sm font-medium text-slate-200 mb-2">Credential Status Report</h4>
                  <p className="text-xs text-slate-400 mb-4">
                    Full roster credential status including expiration dates and verification status
                  </p>
                  <button className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-sm">
                    Generate PDF
                  </button>
                </div>

                <div className="p-5 rounded-lg border border-slate-700 bg-slate-800/30">
                  <h4 className="text-sm font-medium text-slate-200 mb-2">Activity Summary Report</h4>
                  <p className="text-xs text-slate-400 mb-4">
                    Team activity metrics including prep completion and engagement rates
                  </p>
                  <button className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-sm">
                    Generate PDF
                  </button>
                </div>

                <div className="p-5 rounded-lg border border-slate-700 bg-slate-800/30">
                  <h4 className="text-sm font-medium text-slate-200 mb-2">Monthly Roster Export</h4>
                  <p className="text-xs text-slate-400 mb-4">
                    Complete team roster with credential and activity data
                  </p>
                  <button className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm">
                    Export CSV
                  </button>
                </div>

                <div className="p-5 rounded-lg border border-slate-700 bg-slate-800/30">
                  <h4 className="text-sm font-medium text-slate-200 mb-2">Expiring Credentials Alert</h4>
                  <p className="text-xs text-slate-400 mb-4">
                    List of all credentials expiring in the next 90 days
                  </p>
                  <button className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm">
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">About Reports</h3>
              <p className="text-sm text-slate-300">
                Reports are generated in real-time with your current team data. PDF reports include your organization
                branding and are suitable for compliance audits. CSV exports can be imported into spreadsheet applications.
              </p>
            </div>
          </motion.div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md"
            >
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Invite Team Member</h2>
              <p className="text-sm text-slate-400 mb-4">
                Send an invitation to join your organization. They&apos;ll receive an email with instructions to create an account or link their existing account.
              </p>
              <input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail || inviting}
                  className="flex-1 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
