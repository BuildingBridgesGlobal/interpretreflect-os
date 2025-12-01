"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

type Assignment = {
  id: string;
  title: string;
  assignment_type: string;
  setting: string;
  date: string;
  time: string;
  location_type: string;
  location_details: string;
  duration_minutes: number;
  is_team_assignment: boolean;
  team_size: number;
  status: string;
  description: string;
  prep_status: string;
  team_members?: any[];
};

export default function AssignmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedTab, setSelectedTab] = useState<"upcoming" | "past">("upcoming");
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/signin");
      return;
    }

    setUser(session.user);

    // Load assignments for this user
    const { data: assignmentsData, error } = await supabase
      .from("assignments")
      .select(`
        *,
        assignment_team_members (
          id,
          user_id,
          role,
          status
        )
      `)
      .order("date", { ascending: true });

    if (!error && assignmentsData) {
      setAssignments(assignmentsData);
    }

    setLoading(false);
  };

  const getUpcomingAssignments = () => {
    const today = new Date().toISOString().split('T')[0];
    return assignments.filter(a => a.date >= today && a.status !== 'cancelled');
  };

  const getPastAssignments = () => {
    const today = new Date().toISOString().split('T')[0];
    return assignments.filter(a => a.date < today || a.status === 'completed');
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
        <div className="text-slate-400">Loading assignments...</div>
      </div>
    );
  }

  const displayedAssignments = selectedTab === "upcoming" ? getUpcomingAssignments() : getPastAssignments();

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Assignments</h1>
            <p className="mt-1 text-sm text-slate-400">Manage your interpreting assignments and team collaborations</p>
          </div>
          <button
            onClick={() => setShowNewAssignmentModal(true)}
            className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
          >
            + New Assignment
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-slate-800">
          {[
            { key: "upcoming", label: `Upcoming (${getUpcomingAssignments().length})` },
            { key: "past", label: `Past (${getPastAssignments().length})` }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                selectedTab === tab.key
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {displayedAssignments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              No {selectedTab} assignments
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {selectedTab === "upcoming"
                ? "Add your upcoming interpreting assignments to start preparing with Elya"
                : "Your completed assignments will appear here"}
            </p>
            {selectedTab === "upcoming" && (
              <button
                onClick={() => setShowNewAssignmentModal(true)}
                className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
              >
                Add Your First Assignment
              </button>
            )}
          </div>
        )}

        {/* Assignments List */}
        <div className="space-y-4">
          {displayedAssignments.map((assignment) => {
            const statusColors = getStatusColor(assignment.status);
            const teamMembers = assignment.team_members || [];
            const confirmedMembers = teamMembers.filter((m: any) => m.status === 'confirmed');

            return (
              <div
                key={assignment.id}
                className={`rounded-xl border ${statusColors.border} ${statusColors.bg} p-6 hover:shadow-lg transition-all cursor-pointer`}
                onClick={() => router.push(`/assignments/${assignment.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{getTypeIcon(assignment.assignment_type)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-100">{assignment.title}</h3>
                        <p className="text-sm text-slate-400">{assignment.setting}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-300">
                      <span className="flex items-center gap-1">
                        📅 {new Date(assignment.date + 'T' + (assignment.time || '00:00')).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                        {assignment.time && ` at ${assignment.time}`}
                      </span>
                      {assignment.duration_minutes && (
                        <span className="flex items-center gap-1">
                          ⏱️ {assignment.duration_minutes} min
                        </span>
                      )}
                      {assignment.location_type && (
                        <span className="flex items-center gap-1">
                          {assignment.location_type === 'virtual' ? '💻' : assignment.location_type === 'in_person' ? '📍' : '🔄'}
                          {assignment.location_type}
                        </span>
                      )}
                    </div>

                    {assignment.description && (
                      <p className="text-sm text-slate-400 mt-3 line-clamp-2">{assignment.description}</p>
                    )}

                    {/* Team Badge */}
                    {assignment.is_team_assignment && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="px-2 py-1 rounded-md bg-violet-500/20 border border-violet-500/30 text-violet-400 text-xs font-medium flex items-center gap-1">
                          👥 Team Assignment ({confirmedMembers.length} {confirmedMembers.length === 1 ? 'member' : 'members'})
                        </span>
                      </div>
                    )}

                    {/* Prep Status */}
                    {selectedTab === "upcoming" && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          assignment.prep_status === 'completed'
                            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                            : assignment.prep_status === 'in_progress'
                            ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                            : 'bg-slate-700/50 border border-slate-600 text-slate-400'
                        }`}>
                          {assignment.prep_status === 'completed' ? '✓ Prep Complete' :
                           assignment.prep_status === 'in_progress' ? '⚙️ Prep In Progress' :
                           '📝 Prep Pending'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex flex-col gap-2">
                    {selectedTab === "upcoming" && assignment.prep_status !== 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (assignment.is_team_assignment) {
                            router.push(`/assignments/${assignment.id}/team-prep`);
                          } else {
                            router.push(`/assignments/${assignment.id}/prep`);
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors whitespace-nowrap text-sm"
                      >
                        {assignment.is_team_assignment ? 'Team Prep' : 'Start Prep'}
                      </button>
                    )}
                    {assignment.status === 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/assignments/${assignment.id}/debrief`);
                        }}
                        className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors whitespace-nowrap text-sm"
                      >
                        View Debrief
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* New Assignment Modal - Simplified for now */}
        {showNewAssignmentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-100">Create New Assignment</h2>
                <button
                  onClick={() => setShowNewAssignmentModal(false)}
                  className="text-slate-400 hover:text-slate-300"
                >
                  ✕
                </button>
              </div>

              <div className="text-center py-8">
                <p className="text-slate-300 mb-4">
                  Assignment creation form coming soon! This will include:
                </p>
                <ul className="text-left max-w-md mx-auto space-y-2 text-sm text-slate-400">
                  <li>📋 Assignment details (type, date, time, location)</li>
                  <li>👥 Team member invitations</li>
                  <li>📝 Description and special requirements</li>
                  <li>🔗 Automatic prep room creation</li>
                  <li>📚 Resource recommendations from toolkit</li>
                </ul>
                <button
                  onClick={() => setShowNewAssignmentModal(false)}
                  className="mt-6 px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
