"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  debriefed?: boolean;
  completed?: boolean;
  team_members?: any[];
  free_write_sessions?: FreeWriteSession[];
  emotional_intensity?: 'low' | 'moderate' | 'high' | 'very_high';
};

type FreeWriteSession = {
  id: string;
  created_at: string | null;
  summary?: string | null;
  detected_themes?: any;
  messages?: { role: string; content: string; timestamp: string }[];
};

// Persist modal state across Fast Refresh during development
const modalStateRef = { current: false };

function AssignmentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedTab, setSelectedTab] = useState<"upcoming" | "past">("upcoming");

  // Use ref-backed state to survive Fast Refresh remounts
  const [showNewAssignmentModal, setShowNewAssignmentModalInternal] = useState(() => modalStateRef.current);

  const setShowNewAssignmentModal = (value: boolean) => {
    modalStateRef.current = value;
    setShowNewAssignmentModalInternal(value);
  };
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [freeWriteSessions, setFreeWriteSessions] = useState<FreeWriteSession[]>([]);
  const [expandedFreeWrite, setExpandedFreeWrite] = useState<string | null>(null);

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
    timezone: "America/New_York",
    emotional_intensity: "" as "" | "low" | "moderate" | "high" | "very_high"
  });

  const [teamEmails, setTeamEmails] = useState<string[]>([""]);
  const [teamRoles, setTeamRoles] = useState<string[]>(["team"]);

  useEffect(() => {
    // Check for tab parameter from URL (for redirects from /history)
    const tab = searchParams.get('tab');
    if (tab === 'past') {
      setSelectedTab('past');
    }

    loadData();
  }, [searchParams]);

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

    // Load free write sessions
    const { data: freeWriteData } = await supabase
      .from("free_write_sessions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    // Attach free write sessions to their assignments
    const assignmentsWithFreeWrites = (assignmentsData || []).map((assignment: any) => {
      const linkedSessions = (freeWriteData || []).filter(
        (fw: any) => fw.assignment_id === assignment.id
      );
      return {
        ...assignment,
        free_write_sessions: linkedSessions
      };
    });

    // Get unlinked free write sessions (not attached to any assignment)
    const unlinkedSessions = (freeWriteData || []).filter(
      (fw: any) => !fw.assignment_id
    );

    if (!error && assignmentsWithFreeWrites) {
      setAssignments(assignmentsWithFreeWrites as any);
    }
    setFreeWriteSessions(unlinkedSessions as any);

    // Load templates (with auth token)
    const templatesResponse = await fetch(`/api/assignments/templates`, {
      headers: {
        "Authorization": `Bearer ${session.access_token}`
      }
    });
    if (templatesResponse.ok) {
      const templatesData = await templatesResponse.json();
      setTemplates(templatesData.templates || []);
    }

    setLoading(false);
  };

  const handleUseTemplate = async (template: any) => {
    // Pre-fill form with template data
    setFormData({
      ...formData,
      title: template.default_title || "",
      assignment_type: template.assignment_type,
      setting: template.setting || "",
      location_type: template.location_type,
      location_details: template.location_details || "",
      duration_minutes: template.duration_minutes,
    });
    setShowTemplates(false);
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }

    try {
      // Get auth token for API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert("Not authenticated. Please sign in again.");
        return;
      }

      const response = await fetch("/api/assignments/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          template_name: templateName,
          assignment_type: formData.assignment_type,
          setting: formData.setting,
          location_type: formData.location_type,
          location_details: formData.location_details,
          duration_minutes: formData.duration_minutes,
          default_title: formData.title,
        }),
      });

      if (response.ok) {
        alert("Template saved successfully!");
        setTemplateName("");
        setShowSaveTemplate(false);
        await loadData(); // Reload templates
      } else {
        alert("Failed to save template");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Error saving template");
    }
  };

  const getUpcomingAssignments = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    return assignments.filter(a => {
      if (a.status === 'cancelled') return false;
      if (a.status === 'completed') return false;
      // If date is in the future, it's upcoming
      if (a.date > today) return true;
      // If date is today, check if time has passed
      if (a.date === today) {
        // If no time set, consider it upcoming for today
        if (!a.time) return true;
        // If time hasn't passed yet, it's upcoming
        return a.time > currentTime;
      }
      // Date is in the past
      return false;
    });
  };

  const getPastAssignments = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    return assignments.filter(a => {
      if (a.status === 'completed') return true;
      // If date is in the past, it's past
      if (a.date < today) return true;
      // If date is today and time has passed, it's past
      if (a.date === today && a.time && a.time <= currentTime) return true;
      return false;
    });
  };

  const getTypeIcon = (type: string) => {
    // Return a colored circle component for each type
    const typeColors: any = {
      "Medical": "bg-rose-500",
      "Legal": "bg-amber-500",
      "Educational": "bg-blue-500",
      "VRS": "bg-violet-500",
      "VRI": "bg-teal-500",
      "Community": "bg-emerald-500",
      "Mental Health": "bg-purple-500",
      "Conference": "bg-indigo-500"
    };
    const color = typeColors[type] || "bg-slate-500";
    return (
      <div className={`w-3 h-3 rounded-full ${color} flex-shrink-0`}></div>
    );
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
          time: formData.time || null, // Convert empty string to null for PostgreSQL time type
          location_type: formData.location_type,
          location_details: formData.location_details || null,
          duration_minutes: formData.duration_minutes,
          description: formData.description || null,
          is_team_assignment: formData.is_team_assignment,
          team_size: formData.is_team_assignment ? formData.team_size : 1,
          timezone: formData.timezone,
          status: "upcoming",
          prep_status: "pending",
          completed: false,
          emotional_intensity: formData.emotional_intensity || null
        })
        .select()
        .single();

      if (assignmentError) {
        console.error("Error creating assignment:", JSON.stringify(assignmentError, null, 2));
        console.error("Error details:", {
          message: assignmentError.message,
          details: assignmentError.details,
          hint: assignmentError.hint,
          code: assignmentError.code
        });
        alert(`Failed to create assignment: ${assignmentError.message || 'Unknown error'}`);
        setCreatingAssignment(false);
        return;
      }

      // If team assignment, add team members (non-blocking - don't fail assignment creation)
      if (formData.is_team_assignment && newAssignment) {
        const validEmails = teamEmails.filter(email => email.trim() !== "");

        if (validEmails.length > 0) {
          try {
            // For MVP: look up users by email and add them as confirmed team members
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, email")
              .in("email", validEmails);

            if (profiles && profiles.length > 0) {
              const teamMembersToAdd = profiles.map((profile) => ({
                assignment_id: newAssignment.id,
                user_id: profile.id,
                role: teamRoles[teamEmails.indexOf(profile.email || "")] || "team",
                status: "confirmed",
                invited_by: user.id,
                invited_at: new Date().toISOString(),
                confirmed_at: new Date().toISOString(),
                can_edit_assignment: false,
                can_invite_others: false
              }));

              const { error: teamError } = await supabase
                .from("assignment_team_members")
                .insert(teamMembersToAdd);

              if (teamError) {
                console.warn("Could not add team members:", teamError.message);
                // Don't fail the whole assignment - just log the warning
              }
            }
          } catch (teamErr) {
            console.warn("Team member addition failed:", teamErr);
            // Continue with assignment creation
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
        timezone: "America/New_York",
        emotional_intensity: ""
      });
      setTeamEmails([""]);
      setTeamRoles(["team"]);
      setShowMoreDetails(false);
      setShowNewAssignmentModal(false);

      // Reload assignments
      await loadData();

      // Navigate to the new assignment
      router.push(`/assignments/${newAssignment.id}`);
    } catch (error: any) {
      console.error("Error creating assignment:", error);
      console.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      alert(`An error occurred: ${error?.message || 'Please try again.'}`);
    }

    setCreatingAssignment(false);
  };

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading assignments...</div>
      </div>
    );
  }

  const displayedAssignments = selectedTab === "upcoming" ? getUpcomingAssignments() : getPastAssignments();

  // Stats for past tab
  const pastAssignments = getPastAssignments();
  const debriefedCount = pastAssignments.filter(a => a.debriefed).length;
  const journaledCount = pastAssignments.filter(a => (a.free_write_sessions?.length || 0) > 0).length;
  const totalFreeWrites = pastAssignments.reduce((acc, a) => acc + (a.free_write_sessions?.length || 0), 0) + freeWriteSessions.length;

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Hero-style Background Effects */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)]" />

      <NavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8 relative">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Assignments</h1>
            <p className="mt-1 text-sm text-slate-300">Manage your interpreting assignments and reflections</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {templates.length > 0 && (
              <button
                onClick={() => setShowTemplates(true)}
                className="px-4 py-2 rounded-lg border border-teal-500 text-teal-400 font-medium hover:bg-teal-500/10 transition-colors flex items-center gap-2"
              >
                Use Template
              </button>
            )}
            <button
              onClick={() => setShowNewAssignmentModal(true)}
              className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
            >
              + New Assignment
            </button>
          </div>
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

        {/* Summary Stats - Only show on Past tab when there are assignments */}
        {selectedTab === "past" && pastAssignments.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
              <p className="text-2xl font-bold text-slate-200">{pastAssignments.length}</p>
              <p className="text-sm text-slate-400">Completed</p>
            </div>
            <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-4">
              <p className="text-2xl font-bold text-teal-300">{debriefedCount}</p>
              <p className="text-sm text-teal-400">Debriefed</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
              <p className="text-2xl font-bold text-slate-200">{journaledCount}</p>
              <p className="text-sm text-slate-400">With reflections</p>
            </div>
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
              <p className="text-2xl font-bold text-purple-300">{totalFreeWrites}</p>
              <p className="text-sm text-purple-400">Free writes</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {displayedAssignments.length === 0 && (
          <div className="text-center py-16">
            {selectedTab === "upcoming" ? (
              <>
                {/* Calm calendar design for upcoming */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                  {/* Subtle glow */}
                  <div className="absolute inset-0 rounded-full bg-teal-500/10 blur-xl" />
                  {/* Static concentric rings */}
                  <div className="absolute inset-0 rounded-full border border-teal-500/20" />
                  <div className="absolute inset-3 rounded-full border border-teal-500/30" />
                  <div className="absolute inset-6 rounded-full border border-teal-500/40" />
                  {/* Center calendar icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
                      <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-200 mb-2">
                  No upcoming assignments
                </h3>
                <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                  Add your interpreting assignments to prepare with Elya and track your growth
                </p>
                <button
                  onClick={() => setShowNewAssignmentModal(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40"
                >
                  + Add Your First Assignment
                </button>
              </>
            ) : (
              <>
                {/* Checkmark/history design for past */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                  {/* Subtle glow */}
                  <div className="absolute inset-0 rounded-full bg-slate-500/10 blur-xl" />
                  {/* Concentric circles */}
                  <div className="absolute inset-0 rounded-full border border-slate-700/50" />
                  <div className="absolute inset-3 rounded-full border border-slate-700/40" />
                  <div className="absolute inset-6 rounded-full border border-slate-700/30" />
                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">
                  No completed assignments yet
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Your completed assignments will appear here for review and debriefing
                </p>
              </>
            )}
          </div>
        )}

        {/* Assignments List */}
        <div className="space-y-2">
          {displayedAssignments.map((assignment) => {
            const statusColors = getStatusColor(assignment.status);
            const teamMembers = assignment.team_members || [];
            const confirmedMembers = teamMembers.filter((m: any) => m.status === 'confirmed');
            const hasFreeWrites = assignment.free_write_sessions && assignment.free_write_sessions.length > 0;

            return (
              <div
                key={assignment.id}
                className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 hover:border-slate-600 transition-all cursor-pointer"
                onClick={() => router.push(`/assignments/${assignment.id}`)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getTypeIcon(assignment.assignment_type)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-100 truncate">{assignment.title}</h3>
                        {assignment.setting && (
                          <span className="text-xs text-slate-500 hidden sm:inline">• {assignment.setting}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span>
                          {new Date(assignment.date + 'T' + (assignment.time || '00:00')).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        {assignment.duration_minutes && <span>{assignment.duration_minutes} min</span>}
                        {assignment.location_type && <span>{assignment.location_type.replace('_', ' ')}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Badges - inline */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {assignment.is_team_assignment && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/20 border border-violet-500/30 text-violet-400">
                        Team
                      </span>
                    )}
                    {assignment.emotional_intensity && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        assignment.emotional_intensity === 'very_high'
                          ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
                          : assignment.emotional_intensity === 'high'
                          ? 'bg-orange-500/20 border border-orange-500/30 text-orange-400'
                          : assignment.emotional_intensity === 'moderate'
                          ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                          : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                      }`}>
                        {assignment.emotional_intensity === 'very_high' ? 'High' :
                         assignment.emotional_intensity === 'high' ? 'Med-High' :
                         assignment.emotional_intensity === 'moderate' ? 'Med' : 'Low'}
                      </span>
                    )}
                    {/* Prep Status Badge - Upcoming */}
                    {selectedTab === "upcoming" && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        assignment.prep_status === 'completed'
                          ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                          : assignment.prep_status === 'in_progress'
                          ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                          : 'bg-slate-700/50 border border-slate-600 text-slate-500'
                      }`}>
                        {assignment.prep_status === 'completed' ? 'Prepped' :
                         assignment.prep_status === 'in_progress' ? 'Prepping' : 'Not Prepped'}
                      </span>
                    )}
                    {/* Debrief Status Badge - Past */}
                    {selectedTab === "past" && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        assignment.debriefed
                          ? 'bg-teal-500/20 border border-teal-500/30 text-teal-400'
                          : 'bg-slate-700/50 border border-slate-600 text-slate-500'
                      }`}>
                        {assignment.debriefed ? 'Debriefed' : 'Not Debriefed'}
                      </span>
                    )}
                    {selectedTab === "past" && hasFreeWrites && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 border border-purple-500/30 text-purple-400">
                        {assignment.free_write_sessions?.length} FW
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {selectedTab === "upcoming" && assignment.prep_status !== 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (assignment.is_team_assignment) {
                            router.push(`/assignments/${assignment.id}/team-prep`);
                          } else {
                            router.push(`/dashboard?mode=prep&assignment=${assignment.id}`);
                          }
                        }}
                        className="px-3 py-1.5 rounded-md bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-xs"
                      >
                        {assignment.is_team_assignment ? 'Team Prep' : 'Prep'}
                      </button>
                    )}
                    {selectedTab === "past" && !assignment.debriefed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard?mode=debrief&assignment=${assignment.id}`);
                        }}
                        className="px-3 py-1.5 rounded-md bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-medium border border-teal-500/30 transition-all"
                      >
                        Debrief
                      </button>
                    )}
                    {selectedTab === "past" && assignment.debriefed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard?mode=debrief&assignment=${assignment.id}`);
                        }}
                        className="px-3 py-1.5 rounded-md border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors text-xs"
                      >
                        Debrief
                      </button>
                    )}
                  </div>
                </div>

                {/* Free Write Sessions - Past Tab only (collapsible) */}
                {selectedTab === "past" && hasFreeWrites && (
                  <div className="mt-2 pt-2 border-t border-slate-700/30">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedFreeWrite(expandedFreeWrite === assignment.id ? null : assignment.id);
                      }}
                      className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300"
                    >
                      <span>{assignment.free_write_sessions?.length} Free Write{assignment.free_write_sessions?.length !== 1 ? 's' : ''}</span>
                      <svg className={`w-3 h-3 transition-transform ${expandedFreeWrite === assignment.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedFreeWrite === assignment.id && (
                      <div className="mt-2 space-y-1.5">
                        {assignment.free_write_sessions?.map((session) => (
                          <div
                            key={session.id}
                            className="rounded border border-purple-500/20 bg-purple-500/5 px-2 py-1.5 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">{formatDateTime(session.created_at || "")}</span>
                            </div>
                            <p className="text-slate-300 truncate mt-0.5">
                              {(session.messages || []).find(m => m.role === "user")?.content || "No content"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Unlinked Free Write Sessions - Past Tab only */}
        {selectedTab === "past" && freeWriteSessions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-slate-100 mb-4">General Reflections</h2>
            <p className="text-sm text-slate-400 mb-4">Free writes not linked to a specific assignment</p>
            <div className="space-y-3">
              {freeWriteSessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-rose-500/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-400 to-rose-400"></div>
                      <span className="text-sm font-medium text-purple-300">Free Write</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatDateTime(session.created_at || "")}
                    </span>
                  </div>
                  <button
                    onClick={() => setExpandedFreeWrite(
                      expandedFreeWrite === session.id ? null : session.id
                    )}
                    className="w-full text-left"
                  >
                    {expandedFreeWrite === session.id ? (
                      <div className="space-y-2 mt-2">
                        {(session.messages || []).filter(m => m.role === "user").map((msg, idx) => (
                          <p key={idx} className="text-sm text-slate-200 whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        ))}
                        <p className="text-xs text-purple-300 mt-2">Click to collapse</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-slate-300 truncate">
                          {(session.messages || []).find(m => m.role === "user")?.content || "No content"}
                        </p>
                        <p className="text-xs text-purple-300 mt-1">Click to expand</p>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reflection Practice Prompt - Past Tab only */}
        {selectedTab === "past" && pastAssignments.length > 0 && (
          <div className="mt-6 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Build Your Reflection Practice</h3>
                <p className="text-sm text-slate-300 mb-4">
                  Regular debriefing and free writing helps you process assignments and grow as an interpreter.
                  {journaledCount > 0 && ` You've reflected on ${journaledCount} of ${pastAssignments.length} assignments.`}
                </p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-teal-400"></div>
                    <span className="text-slate-300">Debrief = Skill analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-rose-400"></div>
                    <span className="text-slate-300">Free Write = Process emotions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Template Picker Modal */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-100">Use a Template</h2>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-slate-400 hover:text-slate-300 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800 transition-colors cursor-pointer"
                    onClick={() => {
                      handleUseTemplate(template);
                      setShowNewAssignmentModal(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-100">{template.template_name}</h3>
                        <div className="mt-2 flex items-center gap-3 text-sm text-slate-400">
                          <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 flex items-center gap-2">
                            {getTypeIcon(template.assignment_type)} {template.assignment_type}
                          </span>
                          {template.is_recurring && (
                            <span className="px-2 py-1 rounded-md bg-violet-500/20 border border-violet-500/30 text-violet-400">
                              {template.recurrence_pattern}
                            </span>
                          )}
                          <span className="text-slate-500">
                            {template.duration_minutes} min
                          </span>
                        </div>
                        {template.description && (
                          <p className="mt-2 text-sm text-slate-400">{template.description}</p>
                        )}
                        <p className="mt-2 text-xs text-slate-500">
                          Used {template.times_used} {template.times_used === 1 ? 'time' : 'times'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {templates.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <p>No templates yet</p>
                    <p className="text-sm mt-2">Create an assignment and save it as a template!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* New Assignment Modal */}
        {showNewAssignmentModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 modal-backdrop"
            onClick={(e) => {
              // Only close if clicking the backdrop itself
              if (e.target === e.currentTarget) {
                setShowNewAssignmentModal(false);
              }
            }}
          >
            <div
              className="bg-slate-900 rounded-xl border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-100">Create New Assignment</h2>
                <button
                  onClick={() => setShowNewAssignmentModal(false)}
                  className="text-slate-400 hover:text-slate-300 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Essential Fields Only */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Assignment Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Pediatric Cardiology Consultation"
                      className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Type <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={formData.assignment_type}
                        onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
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
                        Date <span className="text-red-400">*</span>
                      </label>
                      <DatePicker
                        selected={formData.date ? new Date(formData.date + 'T00:00:00') : null}
                        onChange={(date: Date | null) => {
                          if (date) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            setFormData({ ...formData, date: `${year}-${month}-${day}` });
                          } else {
                            setFormData({ ...formData, date: '' });
                          }
                        }}
                        minDate={new Date()}
                        dateFormat="MM/dd/yyyy"
                        placeholderText="Select a date"
                        className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        calendarClassName="dark-calendar"
                        wrapperClassName="w-full"
                        popperClassName="dark-datepicker-popper"
                        popperProps={{
                          strategy: "fixed",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Time
                      </label>
                      <DatePicker
                        selected={formData.time ? new Date(`2000-01-01T${formData.time}`) : new Date(`2000-01-01T08:00`)}
                        onChange={(date: Date | null) => {
                          if (date) {
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            setFormData({ ...formData, time: `${hours}:${minutes}` });
                          } else {
                            setFormData({ ...formData, time: '' });
                          }
                        }}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="h:mm aa"
                        placeholderText="Select time"
                        className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        wrapperClassName="w-full"
                        popperClassName="dark-datepicker-popper"
                        popperProps={{
                          strategy: "fixed",
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Duration (min)
                      </label>
                      <input
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                  </div>
                </div>

                {/* More Details Toggle */}
                <button
                  type="button"
                  onClick={() => setShowMoreDetails(!showMoreDetails)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <span className="text-sm font-medium">
                    {showMoreDetails ? "Hide" : "Add"} Optional Details
                  </span>
                  <span className="text-slate-500">
                    {showMoreDetails ? "▼" : "▶"}
                  </span>
                </button>

                {/* Collapsible Optional Fields */}
                {showMoreDetails && (
                  <div className="space-y-5 pt-2">
                    {/* Location */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Location</h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">
                            Location Type
                          </label>
                          <select
                            value={formData.location_type}
                            onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                          >
                            <option value="in_person">In Person</option>
                            <option value="virtual">Virtual</option>
                            <option value="hybrid">Hybrid</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">
                            Setting
                          </label>
                          <input
                            type="text"
                            value={formData.setting}
                            onChange={(e) => setFormData({ ...formData, setting: e.target.value })}
                            placeholder="Hospital, Court, etc."
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                          Location Details
                        </label>
                        <input
                          type="text"
                          value={formData.location_details}
                          onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
                          placeholder="Room 304, Zoom link, etc."
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Notes</h3>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Any special requirements, context, or notes..."
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                      </div>
                    </div>

                    {/* Emotional Intensity */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Load Tracking</h3>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                          Expected Emotional Intensity
                        </label>
                        <select
                          value={formData.emotional_intensity}
                          onChange={(e) => setFormData({ ...formData, emotional_intensity: e.target.value as "" | "low" | "moderate" | "high" | "very_high" })}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        >
                          <option value="">Not specified</option>
                          <option value="low">🟢 Low intensity</option>
                          <option value="moderate">🟡 Moderate</option>
                          <option value="high">🟠 High intensity</option>
                          <option value="very_high">🔴 Very high intensity</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                          This helps track your emotional load over time
                        </p>
                      </div>
                    </div>

                    {/* Team Assignment */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Team</h3>

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
                        <div className="space-y-3 pl-7">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-slate-400">Team Members</h4>
                            <button
                              type="button"
                              onClick={addTeamMemberField}
                              className="text-sm text-teal-400 hover:text-teal-300 font-medium"
                            >
                              + Add Member
                            </button>
                          </div>

                          <div className="space-y-2">
                            {teamEmails.map((email, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="email"
                                  value={email}
                                  onChange={(e) => updateTeamEmail(index, e.target.value)}
                                  placeholder="team.member@example.com"
                                  className="flex-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                                />
                                <select
                                  value={teamRoles[index]}
                                  onChange={(e) => updateTeamRole(index, e.target.value)}
                                  className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
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
                                    type="button"
                                    onClick={() => removeTeamMemberField(index)}
                                    className="px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500 transition-colors text-lg leading-none"
                                  >
                                    &times;
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          <p className="text-xs text-slate-500">
                            Team members must have InterpretReflect accounts
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 px-6 py-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => setShowSaveTemplate(true)}
                  disabled={!formData.assignment_type}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Save as Template
                </button>
                <div className="flex gap-3">
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
          </div>
        )}

        {/* Save as Template Dialog */}
        {showSaveTemplate && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Save as Template</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Weekly VRS Shift, Medical Consults"
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    autoFocus
                  />
                </div>

                <div className="pt-2 text-sm text-slate-400">
                  <p className="font-medium text-slate-300 mb-1">Template will save:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Assignment type: {formData.assignment_type}</li>
                    {formData.setting && <li>Setting: {formData.setting}</li>}
                    <li>Duration: {formData.duration_minutes} minutes</li>
                    <li>Location type: {formData.location_type}</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowSaveTemplate(false);
                    setTemplateName("");
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAsTemplate}
                  disabled={!templateName.trim()}
                  className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function AssignmentsPageLoading() {
  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        <div className="text-slate-400">Loading assignments...</div>
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  return (
    <Suspense fallback={<AssignmentsPageLoading />}>
      <AssignmentsPageContent />
    </Suspense>
  );
}
