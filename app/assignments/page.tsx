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
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    assignment_type: "Medical",
    setting: "",
    date: "",
    time: "",
    location_type: "in_person",
    location_details: "",
    duration_minutes: 60,
    description: "",
    is_team_assignment: false,
    team_size: 1,
    timezone: "America/New_York"
  });

  const [teamEmails, setTeamEmails] = useState<string[]>([""]);
  const [teamRoles, setTeamRoles] = useState<string[]>(["team"]);

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

  const addTeamMemberField = () => {
    setTeamEmails([...teamEmails, ""]);
    setTeamRoles([...teamRoles, "team"]);
  };

  const removeTeamMemberField = (index: number) => {
    setTeamEmails(teamEmails.filter((_, i) => i !== index));
    setTeamRoles(teamRoles.filter((_, i) => i !== index));
  };

  const updateTeamEmail = (index: number, email: string) => {
    const newEmails = [...teamEmails];
    newEmails[index] = email;
    setTeamEmails(newEmails);
  };

  const updateTeamRole = (index: number, role: string) => {
    const newRoles = [...teamRoles];
    newRoles[index] = role;
    setTeamRoles(newRoles);
  };

  const handleCreateAssignment = async () => {
    if (!formData.title || !formData.date) {
      alert("Please fill in the required fields: Title and Date");
      return;
    }

    setCreatingAssignment(true);

    try {
      // Create the assignment
      const { data: newAssignment, error: assignmentError } = await supabase
        .from("assignments")
        .insert({
          user_id: user.id,
          title: formData.title,
          assignment_type: formData.assignment_type,
          setting: formData.setting,
          date: formData.date,
          time: formData.time,
          location_type: formData.location_type,
          location_details: formData.location_details,
          duration_minutes: formData.duration_minutes,
          description: formData.description,
          is_team_assignment: formData.is_team_assignment,
          team_size: formData.is_team_assignment ? formData.team_size : 1,
          timezone: formData.timezone,
          status: "upcoming",
          prep_status: "pending",
          completed: false
        })
        .select()
        .single();

      if (assignmentError) {
        console.error("Error creating assignment:", assignmentError);
        alert("Failed to create assignment. Please try again.");
        setCreatingAssignment(false);
        return;
      }

      // If team assignment, add team members
      if (formData.is_team_assignment && newAssignment) {
        const validEmails = teamEmails.filter(email => email.trim() !== "");

        if (validEmails.length > 0) {
          // For MVP: look up users by email and add them as confirmed team members
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, email")
            .in("email", validEmails);

          if (profiles && profiles.length > 0) {
            const teamMembersToAdd = profiles.map((profile, index) => ({
              assignment_id: newAssignment.id,
              user_id: profile.id,
              role: teamRoles[teamEmails.indexOf(profile.email || "")] || "team",
              status: "confirmed", // MVP: auto-confirm
              invited_by: user.id,
              invited_at: new Date().toISOString(),
              confirmed_at: new Date().toISOString(),
              can_edit_assignment: false,
              can_invite_others: false
            }));

            await supabase
              .from("assignment_team_members")
              .insert(teamMembersToAdd);
          }
        }
      }

      // Reset form and close modal
      setFormData({
        title: "",
        assignment_type: "Medical",
        setting: "",
        date: "",
        time: "",
        location_type: "in_person",
        location_details: "",
        duration_minutes: 60,
        description: "",
        is_team_assignment: false,
        team_size: 1,
        timezone: "America/New_York"
      });
      setTeamEmails([""]);
      setTeamRoles(["team"]);
      setShowNewAssignmentModal(false);

      // Reload assignments
      await loadData();

      // Navigate to the new assignment
      router.push(`/assignments/${newAssignment.id}`);
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert("An error occurred. Please try again.");
    }

    setCreatingAssignment(false);
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

        {/* New Assignment Modal */}
        {showNewAssignmentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-100">Create New Assignment</h2>
                <button
                  onClick={() => setShowNewAssignmentModal(false)}
                  className="text-slate-400 hover:text-slate-300"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-200">Basic Details</h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Pediatric Cardiology Consultation"
                      className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Assignment Type
                      </label>
                      <select
                        value={formData.assignment_type}
                        onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      >
                        <option value="Medical">Medical</option>
                        <option value="Legal">Legal</option>
                        <option value="Educational">Educational</option>
                        <option value="VRS">VRS</option>
                        <option value="VRI">VRI</option>
                        <option value="Community">Community</option>
                        <option value="Mental Health">Mental Health</option>
                        <option value="Conference">Conference</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Setting
                      </label>
                      <input
                        type="text"
                        value={formData.setting}
                        onChange={(e) => setFormData({ ...formData, setting: e.target.value })}
                        placeholder="e.g., Hospital, Clinic, Court"
                        className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Date <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Time
                      </label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-200">Location</h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Location Type
                    </label>
                    <select
                      value={formData.location_type}
                      onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                      <option value="in_person">In Person</option>
                      <option value="virtual">Virtual</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Location Details
                    </label>
                    <input
                      type="text"
                      value={formData.location_details}
                      onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
                      placeholder="e.g., Room 304, Zoom link, Hybrid setup"
                      className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-200">Additional Information</h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Any special requirements, context, or notes..."
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                </div>

                {/* Team Assignment */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_team"
                      checked={formData.is_team_assignment}
                      onChange={(e) => setFormData({ ...formData, is_team_assignment: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-600 text-teal-400 focus:ring-teal-400"
                    />
                    <label htmlFor="is_team" className="text-sm font-medium text-slate-300">
                      This is a team assignment
                    </label>
                  </div>

                  {formData.is_team_assignment && (
                    <div className="space-y-4 pl-7">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-slate-300">Team Members</h4>
                        <button
                          onClick={addTeamMemberField}
                          className="text-sm text-teal-400 hover:text-teal-300 font-medium"
                        >
                          + Add Member
                        </button>
                      </div>

                      <div className="space-y-3">
                        {teamEmails.map((email, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => updateTeamEmail(index, e.target.value)}
                              placeholder="team.member@example.com"
                              className="flex-1 px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                            />
                            <select
                              value={teamRoles[index]}
                              onChange={(e) => updateTeamRole(index, e.target.value)}
                              className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                            >
                              <option value="team">Team</option>
                              <option value="lead">Lead</option>
                              <option value="support">Support</option>
                              <option value="feed">Feed</option>
                              <option value="shadow">Shadow</option>
                              <option value="mentor">Mentor</option>
                            </select>
                            {index > 0 && (
                              <button
                                onClick={() => removeTeamMemberField(index)}
                                className="px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500 transition-colors"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-slate-500">
                        Note: Team members must have InterpretReflect accounts with these email addresses.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowNewAssignmentModal(false)}
                  disabled={creatingAssignment}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAssignment}
                  disabled={creatingAssignment || !formData.title || !formData.date}
                  className="px-6 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingAssignment ? "Creating..." : "Create Assignment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
