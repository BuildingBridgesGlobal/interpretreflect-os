"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AgencyNavBar from "@/components/AgencyNavBar";
import { motion } from "framer-motion";

interface TeamMember {
  id: string; // membership_id for remove action
  user_id: string;
  role: string | null;
  joined_at: string | null;
  is_active: boolean | null;
  status: "pending" | "active" | "declined" | "removed" | null;
  removed_at: string | null;
  profile: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    created_at: string | null;
  };
  activity: {
    assignmentsThisMonth: number;
    debriefCompletionRate: number | null; // null if interpreter opted out
    prepCompletionRate: number | null; // null if interpreter opted out
  };
  credentials: Credential[];
  dataSharing?: {
    prep: boolean;
    debrief: boolean;
    credentials: boolean;
    checkins: boolean;
    modules: boolean;
  };
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

type TabType = "roster" | "assignments" | "teams" | "credentials" | "prep" | "reports" | "settings";

interface Assignment {
  id: string;
  title: string;
  client_name: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  status: "upcoming" | "in_progress" | "completed" | "cancelled";
  assigned_interpreters: {
    user_id: string;
    name: string;
    role: string;
  }[];
  prep_required: boolean;
  debrief_required: boolean;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  members: {
    user_id: string;
    name: string;
    role: string;
  }[];
  created_at: string;
  conversation_id: string | null;
}

interface OrgSettings {
  ceu_tracking_enabled: boolean;
  prep_required_default: boolean;
  debrief_required_default: boolean;
  custom_fields: string[];
}

export default function AgencyDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allCredentials, setAllCredentials] = useState<Credential[]>([]);
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [selectedTab, setSelectedTab] = useState<TabType>("roster");
  const [credentialFilter, setCredentialFilter] = useState<"all" | "active" | "expiring" | "expired">("all");

  // New state for assignments, teams, and settings
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [orgSettings, setOrgSettings] = useState<OrgSettings>({
    ceu_tracking_enabled: true,
    prep_required_default: true,
    debrief_required_default: true,
    custom_fields: [],
  });
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showTeamChatModal, setShowTeamChatModal] = useState(false);
  const [selectedTeamForChat, setSelectedTeamForChat] = useState<Team | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    client_name: "",
    location: "",
    start_time: "",
    end_time: "",
    prep_required: true,
    debrief_required: true,
    assigned_interpreters: [] as string[],
  });
  const [createTeamWithAssignment, setCreateTeamWithAssignment] = useState(false);
  const [assignmentTeamName, setAssignmentTeamName] = useState("");
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    members: [] as string[],
  });
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "upcoming" | "completed">("upcoming");
  const [interpreterSearch, setInterpreterSearch] = useState("");
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

  // Invite code state
  interface InviteCode {
    id: string;
    code: string;
    expires_at: string;
    current_uses: number;
    max_uses: number;
    is_active: boolean;
  }
  const [inviteCode, setInviteCode] = useState<InviteCode | null>(null);
  const [loadingInviteCode, setLoadingInviteCode] = useState(false);
  const [inviteCodeCopied, setInviteCodeCopied] = useState(false);

  // Remove member state
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  // Remove member handler
  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setRemovingMember(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You must be logged in");
        return;
      }

      const response = await fetch("/api/agency", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "remove_member",
          member_id: memberToRemove.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to remove member");
        return;
      }

      // Remove from local state
      setTeamMembers(prev => prev.filter(m => m.id !== memberToRemove.id));
      setShowRemoveMemberModal(false);
      setMemberToRemove(null);
    } catch (err) {
      console.error("Error removing member:", err);
      setError("Failed to remove member");
    } finally {
      setRemovingMember(false);
    }
  };

  // Report download helper functions
  const downloadCSV = async (reportType: string, filename: string) => {
    try {
      setDownloadingReport(reportType);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/agency?report=${reportType}`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      setError("Failed to download report");
    } finally {
      setDownloadingReport(null);
    }
  };

  const generatePDF = async (reportType: string) => {
    try {
      setDownloadingReport(reportType);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Open the report in a new window - it will auto-trigger print dialog
      const reportUrl = `/api/agency?report=${reportType}`;
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        // Fetch the HTML content and write it to the new window
        const response = await fetch(reportUrl, {
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to generate report");

        const htmlContent = await response.text();
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      setError("Failed to generate PDF report");
    } finally {
      setDownloadingReport(null);
    }
  };

  useEffect(() => {
    loadAgencyData();
  }, []);

  // Fetch invite code when Settings tab is selected
  useEffect(() => {
    if (selectedTab === "settings" && !inviteCode && !loadingInviteCode) {
      fetchInviteCode();
    }
  }, [selectedTab]);

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
      setAssignments(data.assignments || []);
      setTeams(data.teams || []);
      // Load settings from organization
      if (data.organization?.settings) {
        setOrgSettings(data.organization.settings);
      }
      setLoading(false);
    } catch (err: any) {
      console.error("Error loading agency data:", err);
      setError(err.message || "Failed to load agency data");
      setLoading(false);
    }
  };


  /**
   * Create a new assignment
   */
  const handleCreateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.start_time) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }

      const response = await fetch("/api/agency", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_assignment",
          ...newAssignment,
          // Include team creation data if applicable
          create_team: createTeamWithAssignment && newAssignment.assigned_interpreters.length >= 3,
          team_name: assignmentTeamName || `${newAssignment.title} Team`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create assignment");
      }

      // Reload data to get updated list
      await loadAgencyData();

      // Reset form and close modal
      setNewAssignment({
        title: "",
        client_name: "",
        location: "",
        start_time: "",
        end_time: "",
        prep_required: true,
        debrief_required: true,
        assigned_interpreters: [],
      });
      setCreateTeamWithAssignment(false);
      setAssignmentTeamName("");
      setShowCreateAssignmentModal(false);

      if (data.teamCreated) {
        alert("Assignment created and team with group chat has been set up!");
      } else {
        alert("Assignment created successfully!");
      }
    } catch (err: any) {
      console.error("Error creating assignment:", err);
      alert(err.message || "Failed to create assignment. Please try again.");
    }
  };

  /**
   * Create a new team
   */
  const handleCreateTeam = async () => {
    if (!newTeam.name) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }

      const response = await fetch("/api/agency", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_team",
          name: newTeam.name,
          description: newTeam.description,
          members: newTeam.members,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create team");
      }

      // Reload data to get updated list
      await loadAgencyData();

      // Reset form and close modal
      setNewTeam({ name: "", description: "", members: [] });
      setShowCreateTeamModal(false);
      alert("Team created successfully!");
    } catch (err: any) {
      console.error("Error creating team:", err);
      alert(err.message || "Failed to create team. Please try again.");
    }
  };

  /**
   * Fetch the agency's invite code (or create one if none exists)
   */
  const fetchInviteCode = async () => {
    setLoadingInviteCode(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/agency", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "get_invite_code" }),
      });

      const data = await response.json();
      if (response.ok && data.inviteCode) {
        setInviteCode(data.inviteCode);
      }
    } catch (err) {
      console.error("Error fetching invite code:", err);
    } finally {
      setLoadingInviteCode(false);
    }
  };

  /**
   * Copy invite code to clipboard
   */
  const handleCopyInviteCode = () => {
    if (inviteCode?.code) {
      navigator.clipboard.writeText(inviteCode.code);
      setInviteCodeCopied(true);
      setTimeout(() => setInviteCodeCopied(false), 2000);
    }
  };

  /**
   * Save organization settings
   */
  const handleSaveSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }

      const response = await fetch("/api/agency", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update_settings",
          settings: orgSettings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      alert("Settings saved successfully!");
    } catch (err: any) {
      console.error("Error saving settings:", err);
      alert(err.message || "Failed to save settings. Please try again.");
    }
  };

  /**
   * Open team chat and load messages
   */
  const handleOpenTeamChat = async (team: Team) => {
    if (!team.conversation_id) {
      alert("This team doesn't have a chat yet. This may happen for teams created before the chat feature was added.");
      return;
    }

    setSelectedTeamForChat(team);
    setShowTeamChatModal(true);
    setLoadingMessages(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/community/messages?conversation_id=${team.conversation_id}`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  /**
   * Send a message to team chat
   */
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTeamForChat?.conversation_id) return;

    setSendingMessage(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/community/messages", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: selectedTeamForChat.conversation_id,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages((prev) => [...prev, data.message]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  /**
   * Get filtered assignments based on current filter
   */
  const getFilteredAssignments = () => {
    if (assignmentFilter === "all") return assignments;
    return assignments.filter((a) => {
      if (assignmentFilter === "upcoming") {
        return a.status === "upcoming" || a.status === "in_progress";
      }
      if (assignmentFilter === "completed") {
        return a.status === "completed";
      }
      return true;
    });
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
        <AgencyNavBar />
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
      <AgencyNavBar organizationName={organization?.name} />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">{organization?.name || "Agency"} Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Manage your team, credentials, and compliance</p>
          </div>
          <button
            onClick={() => setSelectedTab("settings")}
            className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Get Invite Code
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
        <div className="mb-6 flex gap-2 border-b border-slate-800 overflow-x-auto">
          {[
            { key: "roster", label: "Interpreters" },
            { key: "assignments", label: "Assignments" },
            { key: "teams", label: "Teams" },
            { key: "credentials", label: "Credentials" },
            { key: "prep", label: "Prep Tracking" },
            { key: "reports", label: "Reports" },
            { key: "settings", label: "Settings" },
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
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider p-4">Prep Rate</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider p-4">Debrief Rate</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider p-4">Credentials</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider p-4">Actions</th>
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
                            {member.activity.prepCompletionRate === null ? (
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-xs">Hidden</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      member.activity.prepCompletionRate >= 70
                                        ? "bg-teal-500"
                                        : member.activity.prepCompletionRate >= 40
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                    }`}
                                    style={{ width: `${member.activity.prepCompletionRate}%` }}
                                  />
                                </div>
                                <span className="text-sm text-slate-400">{member.activity.prepCompletionRate}%</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            {member.activity.debriefCompletionRate === null ? (
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-xs">Hidden</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      member.activity.debriefCompletionRate >= 70
                                        ? "bg-violet-500"
                                        : member.activity.debriefCompletionRate >= 40
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                    }`}
                                    style={{ width: `${member.activity.debriefCompletionRate}%` }}
                                  />
                                </div>
                                <span className="text-sm text-slate-400">{member.activity.debriefCompletionRate}%</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {member.dataSharing?.credentials === false ? (
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  <span className="text-xs">Hidden</span>
                                </div>
                              ) : member.credentials.length === 0 ? (
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
                          <td className="p-4">
                            {/* Don't show remove button for owners */}
                            {member.role !== "owner" && (
                              <button
                                onClick={() => {
                                  setMemberToRemove(member);
                                  setShowRemoveMemberModal(true);
                                }}
                                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Remove from organization"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {teamMembers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
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

        {/* Assignments Tab */}
        {selectedTab === "assignments" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Assignment Management</h2>
                <p className="text-sm text-slate-400">Create and manage assignments for your interpreters</p>
              </div>
              <button
                onClick={() => setShowCreateAssignmentModal(true)}
                className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Assignment
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
              {[
                { key: "upcoming", label: "Upcoming" },
                { key: "all", label: "All" },
                { key: "completed", label: "Completed" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setAssignmentFilter(filter.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    assignmentFilter === filter.key
                      ? "bg-slate-700 text-slate-100"
                      : "bg-slate-800/50 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Assignments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.length === 0 ? (
                <div className="col-span-full rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-200 mb-2">No Assignments Yet</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Create your first assignment to start managing interpreter schedules
                  </p>
                  <button
                    onClick={() => setShowCreateAssignmentModal(true)}
                    className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-sm"
                  >
                    Create First Assignment
                  </button>
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-slate-100">{assignment.title}</h3>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        assignment.status === "upcoming" ? "bg-blue-500/20 text-blue-400" :
                        assignment.status === "in_progress" ? "bg-amber-500/20 text-amber-400" :
                        assignment.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                        "bg-slate-500/20 text-slate-400"
                      }`}>
                        {assignment.status.replace("_", " ")}
                      </span>
                    </div>
                    {assignment.client_name && (
                      <p className="text-sm text-slate-400 mb-2">
                        <span className="text-slate-500">Client:</span> {assignment.client_name}
                      </p>
                    )}
                    {assignment.location && (
                      <p className="text-sm text-slate-400 mb-2">
                        <span className="text-slate-500">Location:</span> {assignment.location}
                      </p>
                    )}
                    <p className="text-sm text-slate-400 mb-3">
                      <span className="text-slate-500">Time:</span> {new Date(assignment.start_time).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {assignment.assigned_interpreters.map((interp) => (
                        <span key={interp.user_id} className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-xs">
                          {interp.name}
                        </span>
                      ))}
                      {assignment.assigned_interpreters.length === 0 && (
                        <span className="text-xs text-slate-500 italic">No interpreters assigned</span>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-4 text-xs">
                      {assignment.prep_required && (
                        <span className="flex items-center gap-1 text-teal-400">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Prep Required
                        </span>
                      )}
                      {assignment.debrief_required && (
                        <span className="flex items-center gap-1 text-violet-400">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Debrief Required
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Teams Tab */}
        {selectedTab === "teams" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Team Management</h2>
                <p className="text-sm text-slate-400">Create teams to quickly assign groups of interpreters to jobs</p>
              </div>
              <button
                onClick={() => setShowCreateTeamModal(true)}
                className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create Team
              </button>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.length === 0 ? (
                <div className="col-span-full rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-200 mb-2">No Teams Created</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Teams help you quickly assign multiple interpreters to the same job
                  </p>
                  <button
                    onClick={() => setShowCreateTeamModal(true)}
                    className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-sm"
                  >
                    Create First Team
                  </button>
                </div>
              ) : (
                teams.map((team) => (
                  <div key={team.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-slate-100">{team.name}</h3>
                        {team.description && (
                          <p className="text-sm text-slate-400 mt-1">{team.description}</p>
                        )}
                      </div>
                      <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 text-xs font-medium">
                        {team.members.length} members
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-4">
                      {team.members.slice(0, 5).map((member) => (
                        <div
                          key={member.user_id}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center text-white text-xs font-medium"
                          title={member.name}
                        >
                          {member.name.charAt(0)}
                        </div>
                      ))}
                      {team.members.length > 5 && (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs">
                          +{team.members.length - 5}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Created {formatDate(team.created_at)}
                      </span>
                      <div className="flex items-center gap-3">
                        {team.conversation_id && (
                          <button
                            onClick={() => handleOpenTeamChat(team)}
                            className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Open Chat
                          </button>
                        )}
                        <button className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                          Edit Team
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick assign info */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">Quick Assign Teams</h3>
              <p className="text-sm text-slate-300">
                When creating an assignment, you can select a team to automatically add all team members.
                This is especially useful for recurring jobs with the same interpreter group.
              </p>
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
                    {member.activity.prepCompletionRate === null ? (
                      <>
                        <div className="flex-1 flex items-center gap-2 text-slate-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-sm">Hidden by interpreter</span>
                        </div>
                        <div className="w-24 text-right text-xs text-slate-500">
                          {member.activity.assignmentsThisMonth} assignments
                        </div>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
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
                  <button
                    onClick={() => generatePDF("credentials-pdf")}
                    disabled={downloadingReport === "credentials-pdf"}
                    className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingReport === "credentials-pdf" ? "Generating..." : "Generate PDF"}
                  </button>
                </div>

                <div className="p-5 rounded-lg border border-slate-700 bg-slate-800/30">
                  <h4 className="text-sm font-medium text-slate-200 mb-2">Activity Summary Report</h4>
                  <p className="text-xs text-slate-400 mb-4">
                    Team activity metrics including prep completion and engagement rates
                  </p>
                  <button
                    onClick={() => generatePDF("activity-pdf")}
                    disabled={downloadingReport === "activity-pdf"}
                    className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingReport === "activity-pdf" ? "Generating..." : "Generate PDF"}
                  </button>
                </div>

                <div className="p-5 rounded-lg border border-slate-700 bg-slate-800/30">
                  <h4 className="text-sm font-medium text-slate-200 mb-2">Monthly Roster Export</h4>
                  <p className="text-xs text-slate-400 mb-4">
                    Complete team roster with credential and activity data
                  </p>
                  <button
                    onClick={() => downloadCSV("roster-csv", `roster-${new Date().toISOString().split("T")[0]}.csv`)}
                    disabled={downloadingReport === "roster-csv"}
                    className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingReport === "roster-csv" ? "Downloading..." : "Export CSV"}
                  </button>
                </div>

                <div className="p-5 rounded-lg border border-slate-700 bg-slate-800/30">
                  <h4 className="text-sm font-medium text-slate-200 mb-2">Expiring Credentials Alert</h4>
                  <p className="text-xs text-slate-400 mb-4">
                    List of all credentials expiring in the next 90 days
                  </p>
                  <button
                    onClick={() => downloadCSV("credentials-csv", `credentials-${new Date().toISOString().split("T")[0]}.csv`)}
                    disabled={downloadingReport === "credentials-csv"}
                    className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingReport === "credentials-csv" ? "Downloading..." : "Export CSV"}
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

        {/* Settings Tab */}
        {selectedTab === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Interpreter Invite Code Section */}
            <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Interpreter Invite Code</h3>
                  <p className="text-sm text-slate-400">Share this code with interpreters to connect them to your agency</p>
                </div>
              </div>

              {loadingInviteCode ? (
                <div className="flex items-center gap-3 py-4">
                  <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-slate-400">Loading invite code...</span>
                </div>
              ) : inviteCode ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-5 py-4 rounded-lg bg-slate-900 border border-slate-700">
                      <p className="text-3xl font-bold font-mono tracking-[0.2em] text-violet-300 text-center">
                        {inviteCode.code}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyInviteCode}
                      className="px-4 py-4 rounded-lg border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                      title="Copy code"
                    >
                      {inviteCodeCopied ? (
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="text-sm text-slate-500 text-center">
                    <span className="text-slate-400 font-medium">{inviteCode.current_uses}</span> interpreter{inviteCode.current_uses !== 1 ? 's' : ''} have used this code
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <h4 className="text-sm font-medium text-slate-300 mb-2">How it works:</h4>
                    <ol className="space-y-2 text-sm text-slate-400">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-medium">1</span>
                        <span>Share this code with your interpreters</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-medium">2</span>
                        <span>They enter the code in <strong className="text-slate-300">Settings → My Agencies</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-medium">3</span>
                        <span>They appear in your roster automatically</span>
                      </li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-400">No invite code available. Please try again.</p>
                  <button
                    onClick={fetchInviteCode}
                    className="mt-2 text-sm text-violet-400 hover:text-violet-300"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Organization Info */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Organization Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Organization Name</label>
                  <input
                    type="text"
                    value={organization?.name || ""}
                    disabled
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">Contact support to change organization name</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Subscription Tier</label>
                  <div className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                    <span className="px-2 py-1 rounded bg-violet-500/20 text-violet-400 text-sm font-medium">
                      {organization?.subscription_tier || "Standard"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Feature Configuration</h3>
              <p className="text-sm text-slate-400 mb-6">Customize which features are enabled for your organization</p>

              <div className="space-y-4">
                {/* CEU Tracking - Coming Soon */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/30 opacity-60">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-slate-200">CEU Tracking</h4>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Track continuing education units for team members</p>
                  </div>
                  <button
                    disabled
                    className="relative w-12 h-6 rounded-full bg-slate-600 cursor-not-allowed"
                  >
                    <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white/50" />
                  </button>
                </div>

                {/* Prep Required Default Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/30">
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">Prep Required by Default</h4>
                    <p className="text-xs text-slate-400 mt-1">New assignments will require prep completion</p>
                  </div>
                  <button
                    onClick={() => setOrgSettings({ ...orgSettings, prep_required_default: !orgSettings.prep_required_default })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      orgSettings.prep_required_default ? "bg-teal-500" : "bg-slate-600"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        orgSettings.prep_required_default ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Debrief Required Default Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/30">
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">Debrief Required by Default</h4>
                    <p className="text-xs text-slate-400 mt-1">New assignments will require post-assignment reflection</p>
                  </div>
                  <button
                    onClick={() => setOrgSettings({ ...orgSettings, debrief_required_default: !orgSettings.debrief_required_default })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      orgSettings.debrief_required_default ? "bg-teal-500" : "bg-slate-600"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        orgSettings.debrief_required_default ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Available Features */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Available Features</h3>
              <p className="text-sm text-slate-400 mb-6">Features included in your plan</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Interpreter Roster", description: "Manage all interpreters in your organization", enabled: true },
                  { name: "Assignment Management", description: "Create and track assignments", enabled: true },
                  { name: "Team Creation", description: "Group interpreters for quick assignment", enabled: true },
                  { name: "Credential Tracking", description: "Monitor certifications and expirations", enabled: true },
                  { name: "Prep Tracking", description: "Track pre-assignment preparation", enabled: true },
                  { name: "CEU Management", description: "Track continuing education credits", enabled: orgSettings.ceu_tracking_enabled },
                  { name: "Compliance Reports", description: "Generate PDF/CSV reports", enabled: true },
                  { name: "Skills Development", description: "Access to training modules", enabled: true },
                  { name: "Wellness Check-ins", description: "Monitor interpreter wellness", enabled: true },
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      feature.enabled
                        ? "border-teal-500/30 bg-teal-500/10"
                        : "border-slate-700 bg-slate-800/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${feature.enabled ? "text-teal-400" : "text-slate-500"}`}>
                        {feature.enabled ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className={`text-sm font-medium ${feature.enabled ? "text-slate-100" : "text-slate-400"}`}>
                          {feature.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                className="px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
              >
                Save Settings
              </button>
            </div>

            {/* Contact Support */}
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5">
              <h3 className="text-sm font-semibold text-violet-400 mb-2">Need Additional Features?</h3>
              <p className="text-sm text-slate-300 mb-3">
                Contact us to customize InterpretReflect for your organization&apos;s specific needs.
              </p>
              <a
                href="mailto:info@interpretreflect.com"
                className="inline-flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                info@interpretreflect.com
              </a>
            </div>
          </motion.div>
        )}

        {/* Remove Member Confirmation Modal */}
        {showRemoveMemberModal && memberToRemove && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-slate-100">Remove Team Member</h2>
              </div>

              <p className="text-slate-300 mb-2">
                Are you sure you want to remove <span className="font-semibold text-slate-100">{memberToRemove.profile.full_name || memberToRemove.profile.email}</span> from {organization?.name}?
              </p>

              <p className="text-sm text-slate-500 mb-6">
                They will lose access to agency features but keep their personal data. You can re-invite them later if needed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRemoveMemberModal(false);
                    setMemberToRemove(null);
                  }}
                  disabled={removingMember}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveMember}
                  disabled={removingMember}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {removingMember ? "Removing..." : "Remove Member"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Create Assignment Modal */}
        {showCreateAssignmentModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Create New Assignment</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Assignment Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., Medical Appointment - General Hospital"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Client Name</label>
                  <input
                    type="text"
                    placeholder="Enter client name"
                    value={newAssignment.client_name}
                    onChange={(e) => setNewAssignment({ ...newAssignment, client_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="Enter location or address"
                    value={newAssignment.location}
                    onChange={(e) => setNewAssignment({ ...newAssignment, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Start Time *</label>
                    <input
                      type="datetime-local"
                      value={newAssignment.start_time}
                      onChange={(e) => setNewAssignment({ ...newAssignment, start_time: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">End Time</label>
                    <input
                      type="datetime-local"
                      value={newAssignment.end_time}
                      onChange={(e) => setNewAssignment({ ...newAssignment, end_time: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Assign Interpreters *
                    {newAssignment.assigned_interpreters.length > 0 && (
                      <span className="ml-2 text-teal-400">({newAssignment.assigned_interpreters.length} selected)</span>
                    )}
                  </label>

                  {/* Search Box */}
                  <div className="relative mb-2">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search interpreters by name or email..."
                      value={interpreterSearch}
                      onChange={(e) => setInterpreterSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm"
                    />
                    {interpreterSearch && (
                      <button
                        onClick={() => setInterpreterSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Selected Interpreters Preview */}
                  {newAssignment.assigned_interpreters.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newAssignment.assigned_interpreters.map((userId) => {
                        const member = teamMembers.find(m => m.user_id === userId);
                        return (
                          <span
                            key={userId}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs"
                          >
                            {member?.profile.full_name || "Unknown"}
                            <button
                              onClick={() => setNewAssignment({
                                ...newAssignment,
                                assigned_interpreters: newAssignment.assigned_interpreters.filter(id => id !== userId)
                              })}
                              className="ml-1 hover:text-red-400"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Interpreter List */}
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 p-2">
                    {teamMembers.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No interpreters available. Invite interpreters first.</p>
                    ) : (() => {
                      const filteredMembers = teamMembers.filter((member) => {
                        if (!interpreterSearch) return true;
                        const search = interpreterSearch.toLowerCase();
                        return (
                          member.profile.full_name?.toLowerCase().includes(search) ||
                          member.profile.email?.toLowerCase().includes(search)
                        );
                      });

                      if (filteredMembers.length === 0) {
                        return (
                          <p className="text-sm text-slate-500 text-center py-4">
                            No interpreters match &quot;{interpreterSearch}&quot;
                          </p>
                        );
                      }

                      return filteredMembers.map((member) => (
                        <label
                          key={member.user_id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={newAssignment.assigned_interpreters.includes(member.user_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewAssignment({
                                  ...newAssignment,
                                  assigned_interpreters: [...newAssignment.assigned_interpreters, member.user_id],
                                });
                              } else {
                                setNewAssignment({
                                  ...newAssignment,
                                  assigned_interpreters: newAssignment.assigned_interpreters.filter((id) => id !== member.user_id),
                                });
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-600 text-teal-500 focus:ring-teal-500 focus:ring-offset-0 bg-slate-700"
                          />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                              {member.profile.full_name?.charAt(0) || "?"}
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm text-slate-200 block truncate">{member.profile.full_name}</span>
                              <span className="text-xs text-slate-500 block truncate">{member.profile.email}</span>
                            </div>
                          </div>
                        </label>
                      ));
                    })()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {teamMembers.length} interpreter{teamMembers.length !== 1 ? 's' : ''} in your organization
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAssignment.prep_required}
                      onChange={(e) => setNewAssignment({ ...newAssignment, prep_required: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-600 text-teal-500 focus:ring-teal-500 focus:ring-offset-0 bg-slate-700"
                    />
                    <span className="text-sm text-slate-300">Prep Required</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAssignment.debrief_required}
                      onChange={(e) => setNewAssignment({ ...newAssignment, debrief_required: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-600 text-teal-500 focus:ring-teal-500 focus:ring-offset-0 bg-slate-700"
                    />
                    <span className="text-sm text-slate-300">Debrief Required</span>
                  </label>
                </div>

                {/* Create Team Option - Only shown when 3+ interpreters selected */}
                {newAssignment.assigned_interpreters.length >= 3 && (
                  <div className="mt-4 p-4 rounded-lg bg-violet-500/10 border border-violet-500/30">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createTeamWithAssignment}
                        onChange={(e) => {
                          setCreateTeamWithAssignment(e.target.checked);
                          if (!e.target.checked) {
                            setAssignmentTeamName("");
                          }
                        }}
                        className="w-5 h-5 rounded border-slate-600 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 bg-slate-700"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm font-medium text-violet-300">Create a Team</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Automatically creates a team with a group chat for these {newAssignment.assigned_interpreters.length} interpreters
                        </p>
                      </div>
                    </label>

                    {createTeamWithAssignment && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Team Name (optional)</label>
                        <input
                          type="text"
                          value={assignmentTeamName}
                          onChange={(e) => setAssignmentTeamName(e.target.value)}
                          placeholder={`${newAssignment.title || "Assignment"} Team`}
                          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateAssignmentModal(false);
                    setInterpreterSearch("");
                    setNewAssignment({
                      title: "",
                      client_name: "",
                      location: "",
                      start_time: "",
                      end_time: "",
                      prep_required: true,
                      debrief_required: true,
                      assigned_interpreters: [],
                    });
                    setCreateTeamWithAssignment(false);
                    setAssignmentTeamName("");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAssignment}
                  disabled={!newAssignment.title || !newAssignment.start_time || newAssignment.assigned_interpreters.length === 0}
                  className="flex-1 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {newAssignment.assigned_interpreters.length === 0
                    ? "Select Interpreter(s)"
                    : `Assign to ${newAssignment.assigned_interpreters.length} Interpreter${newAssignment.assigned_interpreters.length > 1 ? 's' : ''}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateTeamModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Create New Team</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Team Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Medical Team A"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                  <textarea
                    placeholder="Brief description of this team..."
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Team Members</label>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 p-2">
                    {teamMembers.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-2">No interpreters available</p>
                    ) : (
                      teamMembers.map((member) => (
                        <label
                          key={member.user_id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={newTeam.members.includes(member.user_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTeam({
                                  ...newTeam,
                                  members: [...newTeam.members, member.user_id],
                                });
                              } else {
                                setNewTeam({
                                  ...newTeam,
                                  members: newTeam.members.filter((id) => id !== member.user_id),
                                });
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-600 text-teal-500 focus:ring-teal-500 focus:ring-offset-0 bg-slate-700"
                          />
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center text-white text-xs font-medium">
                              {member.profile.full_name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <span className="text-sm text-slate-200">{member.profile.full_name}</span>
                              <p className="text-xs text-slate-500">{member.role}</p>
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  {newTeam.members.length > 0 && (
                    <p className="text-xs text-slate-500 mt-2">{newTeam.members.length} member(s) selected</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateTeamModal(false);
                    setNewTeam({ name: "", description: "", members: [] });
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTeam}
                  disabled={!newTeam.name}
                  className="flex-1 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Team
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Team Chat Modal */}
        {showTeamChatModal && selectedTeamForChat && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">{selectedTeamForChat.name} Chat</h2>
                    <p className="text-xs text-slate-400">{selectedTeamForChat.members.length} members</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTeamChatModal(false);
                    setSelectedTeamForChat(null);
                    setChatMessages([]);
                    setNewMessage("");
                  }}
                  className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-slate-400">Loading messages...</div>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-200 mb-2">Start the conversation</h3>
                    <p className="text-sm text-slate-400">
                      Send a message to get the team chat going
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg: any) => {
                    const isSystemMessage = msg.is_system_message;
                    const senderMember = selectedTeamForChat.members.find(m => m.user_id === msg.sender_id);

                    return (
                      <div
                        key={msg.id}
                        className={`${isSystemMessage ? "text-center" : ""}`}
                      >
                        {isSystemMessage ? (
                          <div className="inline-block px-4 py-2 rounded-lg bg-slate-800/50 text-slate-400 text-sm">
                            {msg.content}
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                              {senderMember?.name?.charAt(0) || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-slate-200">
                                  {senderMember?.name || "Unknown"}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <p className="text-sm text-slate-300 break-words">{msg.content}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-slate-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="px-4 py-3 rounded-lg bg-violet-500 text-white font-medium hover:bg-violet-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
