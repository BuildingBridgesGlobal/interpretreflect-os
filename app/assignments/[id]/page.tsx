"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

type Assignment = {
  id: string;
  user_id: string;
  title: string;
  assignment_type: string;
  setting: string;
  date: string;
  time: string;
  location_type: string;
  location_details: string;
  duration_minutes: number;
  description: string;
  is_team_assignment: boolean;
  team_size: number;
  status: string;
  prep_status: string;
  completed: boolean;
  timezone: string;
};

type TeamMember = {
  id: string;
  user_id: string;
  role: string;
  status: string;
  full_name?: string;
  email?: string;
};

type CommunityMember = {
  id: string;
  user_id: string;
  display_name: string;
  years_experience: string;
  settings_work_in: string[];
  is_deaf_interpreter: boolean;
  open_to_mentoring: boolean;
};

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isTeamMember, setIsTeamMember] = useState(false);

  // Team invite state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, [assignmentId]);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/signin");
      return;
    }

    setUser(session.user);

    // Load assignment
    const { data: assignmentData } = await supabase
      .from("assignments")
      .select("*")
      .eq("id", assignmentId)
      .single();

    if (assignmentData) {
      setAssignment(assignmentData as any);

      // Load team members (including invited)
      if ((assignmentData as any).is_team_assignment || (assignmentData as any).user_id === session.user.id) {
        const { data: membersData } = await (supabase as any)
          .from("assignment_team_members")
          .select("*")
          .eq("assignment_id", assignmentId)
          .in("status", ["confirmed", "invited"]);

        if (membersData) {
          // Get user profiles for team members
          const userIds = membersData.map((m: any) => m.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);

          // Also get community profiles for display names
          const { data: communityProfiles } = await supabase
            .from("community_profiles")
            .select("user_id, display_name")
            .in("user_id", userIds);

          const enrichedMembers = membersData.map((member: any) => {
            const profile = profiles?.find((p: any) => p.id === member.user_id);
            const communityProfile = communityProfiles?.find((p: any) => p.user_id === member.user_id);
            return {
              ...member,
              full_name: communityProfile?.display_name || profile?.full_name || profile?.email?.split("@")[0],
              email: profile?.email
            };
          });

          setTeamMembers(enrichedMembers);
          setIsTeamMember(enrichedMembers.some((m: any) => m.user_id === session.user.id && m.status === "confirmed"));
        }
      }
    }

    setLoading(false);
  };

  // Load community members for invite modal - only connected members
  const loadCommunityMembers = async () => {
    if (!user) return;
    setLoadingMembers(true);

    // First, get the user's accepted connections
    const { data: connections, error: connError } = await supabase
      .from("connections")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (connError) {
      console.error("Error loading connections:", connError);
      setLoadingMembers(false);
      return;
    }

    // Extract connected user IDs (the other party in each connection)
    const connectedUserIds = (connections || []).map(conn =>
      conn.requester_id === user.id ? conn.addressee_id : conn.requester_id
    );

    if (connectedUserIds.length === 0) {
      // No connections yet
      setCommunityMembers([]);
      setLoadingMembers(false);
      return;
    }

    // Get community profiles only for connected users
    const { data: members, error } = await supabase
      .from("community_profiles")
      .select("*")
      .in("user_id", connectedUserIds);

    if (!error && members) {
      // Filter out users who are already team members
      const existingUserIds = teamMembers.map(m => m.user_id);
      const availableMembers = members.filter(m => !existingUserIds.includes(m.user_id));

      setCommunityMembers(availableMembers.map(m => ({
        id: m.id,
        user_id: m.user_id,
        display_name: m.display_name || "Anonymous",
        years_experience: m.years_experience || "Unknown",
        settings_work_in: m.settings_work_in || [],
        is_deaf_interpreter: m.is_deaf_interpreter || false,
        open_to_mentoring: m.open_to_mentoring || false
      })));
    }

    setLoadingMembers(false);
  };

  // Invite a community member to the team
  const handleInviteMember = async (memberUserId: string) => {
    if (!user || !assignment) return;
    setInviting(memberUserId);

    try {
      // 1. Add team member to assignment
      const response = await fetch("/api/assignments/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: assignmentId,
          user_id: memberUserId,
          invited_by: user.id,
          role: "team"
        })
      });

      const data = await response.json();

      if (data.success) {
        // 2. Refresh team members first to get updated list
        await loadData();

        // 3. Get all confirmed team member IDs (including the new one once they accept)
        const allTeamMemberIds = [...teamMembers.map(m => m.user_id), memberUserId]
          .filter(id => id !== user.id); // Exclude current user, they'll be added as creator

        // 4. Create/update team chat in community section
        if (allTeamMemberIds.length > 0) {
          await fetch("/api/assignments/team-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assignment_id: assignmentId,
              user_id: user.id,
              member_user_ids: allTeamMemberIds,
              assignment_title: assignment.title
            })
          });
        }

        // Remove from available community members
        setCommunityMembers(prev => prev.filter(m => m.user_id !== memberUserId));
      } else {
        console.error("Error inviting member:", data.error);
      }
    } catch (error) {
      console.error("Error inviting member:", error);
    }

    setInviting(null);
  };

  // Open invite modal and load community members
  const openInviteModal = () => {
    setShowInviteModal(true);
    loadCommunityMembers();
  };

  // Filter community members by search query
  const filteredCommunityMembers = communityMembers.filter(member =>
    member.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.settings_work_in.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStatusUpdate = async (newStatus: string) => {
    if (!assignment) return;

    const { error } = await supabase
      .from("assignments")
      .update({ status: newStatus })
      .eq("id", assignmentId);

    if (!error) {
      setAssignment({ ...assignment, status: newStatus });

      // If marked as completed, auto-create debrief
      if (newStatus === "completed") {
        const { data: existingDebrief } = await (supabase as any)
          .from("assignment_debriefs")
          .select("id")
          .eq("assignment_id", assignmentId)
          .single();

        if (!existingDebrief) {
          await (supabase as any)
            .from("assignment_debriefs")
            .insert({
              assignment_id: assignmentId,
              created_by: user.id,
              status: "in_progress"
            });
        }
      }
    }
  };

  const getTypeColor = (type: string) => {
    const colors: any = {
      "Medical": "bg-rose-500",
      "Legal": "bg-amber-500",
      "Educational": "bg-blue-500",
      "VRS": "bg-violet-500",
      "VRI": "bg-teal-500",
      "Community": "bg-emerald-500",
      "Mental Health": "bg-purple-500",
      "Conference": "bg-indigo-500"
    };
    return colors[type] || "bg-slate-500";
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      "upcoming": { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
      "in_progress": { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" },
      "completed": { bg: "bg-slate-700/50", border: "border-slate-600", text: "text-slate-400" },
      "cancelled": { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" }
    };
    return colors[status] || colors["upcoming"];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading assignment...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Assignment not found</h2>
          <button
            onClick={() => router.push("/assignments")}
            className="mt-4 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  const statusColors = getStatusColor(assignment.status);
  const assignmentDate = new Date(`${assignment.date}T${assignment.time || '00:00'}`);
  const isUpcoming = assignment.status === "upcoming";
  const isCompleted = assignment.status === "completed";

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/assignments")}
            className="text-sm text-slate-400 hover:text-teal-400 mb-4 flex items-center gap-1"
          >
            ← Back to Assignments
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-2xl ${getTypeColor(assignment.assignment_type)} flex items-center justify-center flex-shrink-0`}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-slate-50">{assignment.title}</h1>
                <p className="mt-2 text-slate-400">{assignment.setting}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusColors.bg} ${statusColors.border} ${statusColors.text} border`}>
                    {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                  </span>
                  {assignment.is_team_assignment && (
                    <span className="px-3 py-1 rounded-lg text-sm font-medium bg-violet-500/20 border border-violet-500/30 text-violet-400 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Team Assignment
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status Update Dropdown */}
            {assignment.user_id === user?.id && isUpcoming && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusUpdate("in_progress")}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => handleStatusUpdate("completed")}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition-colors text-sm font-medium"
                >
                  Mark Completed
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assignment Details Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Assignment Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Date & Time</p>
                  <p className="text-slate-200 font-medium">
                    {assignmentDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  {assignment.time && (
                    <p className="text-slate-300 text-sm">at {assignment.time}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-1">Duration</p>
                  <p className="text-slate-200 font-medium">{assignment.duration_minutes} minutes</p>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-1">Location Type</p>
                  <p className="text-slate-200 font-medium">
                    {assignment.location_type?.replace('_', ' ').charAt(0).toUpperCase() + assignment.location_type?.slice(1).replace('_', ' ')}
                  </p>
                </div>

                {assignment.location_details && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Location Details</p>
                    <p className="text-slate-200 font-medium">{assignment.location_details}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-slate-400 mb-1">Assignment Type</p>
                  <p className="text-slate-200 font-medium">{assignment.assignment_type}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-1">Timezone</p>
                  <p className="text-slate-200 font-medium">{assignment.timezone}</p>
                </div>
              </div>

              {assignment.description && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <p className="text-sm text-slate-400 mb-2">Description</p>
                  <p className="text-slate-200 whitespace-pre-wrap">{assignment.description}</p>
                </div>
              )}
            </div>

            {/* Quick Actions Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {isUpcoming && assignment.prep_status !== 'completed' && (
                  <button
                    onClick={() => {
                      if (assignment.is_team_assignment) {
                        router.push(`/assignments/${assignmentId}/team-prep`);
                      } else {
                        router.push(`/assignments/${assignmentId}/prep`);
                      }
                    }}
                    className="px-4 py-3 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-left"
                  >
                    {assignment.is_team_assignment ? 'Team Prep' : 'Start Prep'}
                  </button>
                )}

                {isCompleted && (
                  <button
                    onClick={() => router.push(`/assignments/${assignmentId}/debrief`)}
                    className="px-4 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-left font-medium"
                  >
                    View Debrief
                  </button>
                )}

                <button
                  onClick={() => {/* TODO: Add to calendar */}}
                  className="px-4 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-left font-medium"
                >
                  Add to Calendar
                </button>

                <button
                  onClick={() => {/* TODO: Share assignment */}}
                  className="px-4 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-left font-medium"
                >
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Team Members Card */}
            {(assignment.is_team_assignment || assignment.user_id === user?.id) && (
              <div className="rounded-xl border border-violet-500/30 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-100">
                    Team {teamMembers.length > 0 && `(${teamMembers.length})`}
                  </h2>
                  {assignment.user_id === user?.id && (
                    <button
                      onClick={openInviteModal}
                      className="px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-300 text-xs font-medium transition-colors"
                    >
                      + Invite
                    </button>
                  )}
                </div>

                {teamMembers.length > 0 ? (
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          member.role === 'lead' ? 'bg-violet-500' : 'bg-blue-500'
                        }`}>
                          {(member.full_name || member.email)?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">
                            {member.full_name || member.email?.split('@')[0]}
                            {member.user_id === user?.id && " (You)"}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-500 capitalize">{member.role}</p>
                            {member.status === 'invited' && (
                              <span className="text-xs text-amber-400">Pending</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-400 mb-3">No team members yet</p>
                    {assignment.user_id === user?.id && (
                      <button
                        onClick={openInviteModal}
                        className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-medium transition-colors"
                      >
                        Invite Team Members
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Prep Status Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Preparation Status</h2>
              <div className="space-y-3">
                <div className={`px-4 py-3 rounded-lg ${
                  assignment.prep_status === 'completed'
                    ? 'bg-emerald-500/20 border border-emerald-500/30'
                    : assignment.prep_status === 'in_progress'
                    ? 'bg-amber-500/20 border border-amber-500/30'
                    : 'bg-slate-700/50 border border-slate-600'
                }`}>
                  <p className={`text-sm font-medium ${
                    assignment.prep_status === 'completed' ? 'text-emerald-400' :
                    assignment.prep_status === 'in_progress' ? 'text-amber-400' :
                    'text-slate-400'
                  }`}>
                    {assignment.prep_status === 'completed' ? 'Preparation Complete' :
                     assignment.prep_status === 'in_progress' ? 'Prep In Progress' :
                     'Prep Pending'}
                  </p>
                </div>
              </div>
            </div>

            {/* Resources Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Resources</h2>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-teal-400 transition-colors text-sm">
                  Assignment Checklist
                </button>
                {assignment.assignment_type === "Medical" && (
                  <button className="w-full text-left px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-teal-400 transition-colors text-sm">
                    Medical Terminology Guide
                  </button>
                )}
                {assignment.is_team_assignment && (
                  <button className="w-full text-left px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-teal-400 transition-colors text-sm">
                    Team Interpreting Guide
                  </button>
                )}
                <button className="w-full text-left px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-teal-400 transition-colors text-sm">
                  General Resources
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Team Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Invite Team Members</h3>
                <p className="text-sm text-slate-400">Add from your community connections - a team chat will be created automatically</p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-700">
              <input
                type="text"
                placeholder="Search by name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>

            {/* Member List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMembers ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-slate-400 text-sm">Loading community members...</p>
                </div>
              ) : filteredCommunityMembers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-400">
                    {searchQuery ? "No connections match your search" : "No connections available to invite"}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Only your community connections can be invited. Connect with interpreters in the Community section first!
                  </p>
                </div>
              ) : (
                filteredCommunityMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 hover:border-violet-500/50 hover:bg-slate-800/50 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                      {member.display_name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">
                        {member.display_name}
                        {member.is_deaf_interpreter && (
                          <span className="ml-2 text-xs text-teal-400">DI</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {member.years_experience}
                        {member.settings_work_in.length > 0 && ` • ${member.settings_work_in.slice(0, 2).join(", ")}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleInviteMember(member.user_id)}
                      disabled={inviting === member.user_id}
                      className="px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 disabled:bg-violet-500/50 text-white text-sm font-medium transition-colors"
                    >
                      {inviting === member.user_id ? "..." : "Invite"}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-700">
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-full px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
