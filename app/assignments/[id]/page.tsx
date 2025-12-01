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

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isTeamMember, setIsTeamMember] = useState(false);

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

      // If team assignment, load team members
      if ((assignmentData as any).is_team_assignment) {
        const { data: membersData } = await (supabase as any)
          .from("assignment_team_members")
          .select("*")
          .eq("assignment_id", assignmentId)
          .eq("status", "confirmed");

        if (membersData) {
          // Get user profiles for team members
          const userIds = membersData.map((m: any) => m.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);

          const enrichedMembers = membersData.map((member: any) => ({
            ...member,
            ...profiles?.find((p: any) => p.id === member.user_id)
          }));

          setTeamMembers(enrichedMembers);
          setIsTeamMember(enrichedMembers.some((m: any) => m.user_id === session.user.id));
        }
      }
    }

    setLoading(false);
  };

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

  const getTypeIcon = (type: string) => {
    const icons: any = {
      "Medical": "🏥",
      "Legal": "⚖️",
      "Educational": "🎓",
      "VRS": "📞",
      "VRI": "💻",
      "Community": "🏘️",
      "Mental Health": "🧠",
      "Conference": "🎤"
    };
    return icons[type] || "📋";
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
          <div className="text-6xl mb-4">📋</div>
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
              <span className="text-5xl">{getTypeIcon(assignment.assignment_type)}</span>
              <div>
                <h1 className="text-3xl font-semibold text-slate-50">{assignment.title}</h1>
                <p className="mt-2 text-slate-400">{assignment.setting}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusColors.bg} ${statusColors.border} ${statusColors.text} border`}>
                    {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                  </span>
                  {assignment.is_team_assignment && (
                    <span className="px-3 py-1 rounded-lg text-sm font-medium bg-violet-500/20 border border-violet-500/30 text-violet-400">
                      👥 Team Assignment
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
                  <p className="text-slate-200 font-medium flex items-center gap-2">
                    {assignment.location_type === 'virtual' ? '💻' : assignment.location_type === 'in_person' ? '📍' : '🔄'}
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
                    {assignment.is_team_assignment ? '👥 Team Prep' : '📝 Start Prep'}
                  </button>
                )}

                {isCompleted && (
                  <button
                    onClick={() => router.push(`/assignments/${assignmentId}/debrief`)}
                    className="px-4 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-left font-medium"
                  >
                    💭 View Debrief
                  </button>
                )}

                <button
                  onClick={() => {/* TODO: Add to calendar */}}
                  className="px-4 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-left font-medium"
                >
                  📅 Add to Calendar
                </button>

                <button
                  onClick={() => {/* TODO: Share assignment */}}
                  className="px-4 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-left font-medium"
                >
                  🔗 Share
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Team Members Card */}
            {assignment.is_team_assignment && teamMembers.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <h2 className="text-lg font-semibold text-slate-100 mb-4">
                  Team Members ({teamMembers.length})
                </h2>
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                        {(member.full_name || member.email)?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {member.full_name || member.email?.split('@')[0]}
                          {member.user_id === user?.id && " (You)"}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                    {assignment.prep_status === 'completed' ? '✓ Preparation Complete' :
                     assignment.prep_status === 'in_progress' ? '⚙️ Prep In Progress' :
                     '📝 Prep Pending'}
                  </p>
                </div>
              </div>
            </div>

            {/* Resources Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Resources</h2>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-teal-400 transition-colors text-sm">
                  📋 Assignment Checklist
                </button>
                {assignment.assignment_type === "Medical" && (
                  <button className="w-full text-left px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-teal-400 transition-colors text-sm">
                    🏥 Medical Terminology Guide
                  </button>
                )}
                {assignment.is_team_assignment && (
                  <button className="w-full text-left px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-teal-400 transition-colors text-sm">
                    👥 Team Interpreting Guide
                  </button>
                )}
                <button className="w-full text-left px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-teal-400 transition-colors text-sm">
                  📚 General Resources
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
