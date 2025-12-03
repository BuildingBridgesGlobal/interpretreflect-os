"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

type TeamMember = {
  id: string;
  user_id: string;
  role: string;
  full_name?: string;
  email?: string;
};

type Reflection = {
  id: string;
  reflection_type: string;
  target_user_id?: string;
  content: any;
  visibility: string;
  created_at: string;
};

export default function TeamDebriefPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [debrief, setDebrief] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [myReflections, setMyReflections] = useState<Reflection[]>([]);
  const [teamReflections, setTeamReflections] = useState<Reflection[]>([]);
  const [activeForm, setActiveForm] = useState<"self" | "peer" | null>(null);
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);

  // Form state for self-assessment
  const [selfAssessment, setSelfAssessment] = useState({
    strengths: "",
    growth_areas: "",
    notes: ""
  });

  // Form state for peer feedback
  const [peerFeedback, setPeerFeedback] = useState({
    strengths: "",
    growth_areas: "",
    notes: "",
    visibility: "private" as "private" | "team"
  });

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
      setAssignment(assignmentData);
    }

    // Load or create debrief
    let { data: debriefData } = await (supabase as any)
      .from("assignment_debriefs")
      .select("*")
      .eq("assignment_id", assignmentId)
      .single();

    if (!debriefData) {
      // Create debrief if it doesn't exist
      const { data: newDebrief } = await (supabase as any)
        .from("assignment_debriefs")
        .insert({
          assignment_id: assignmentId,
          created_by: session.user.id
        })
        .select()
        .single();

      debriefData = newDebrief;
    }

    if (debriefData) {
      setDebrief(debriefData);
      await loadReflections(debriefData.id, session.user.id);
    }

    // Load team members
    const { data: membersData } = await (supabase as any)
      .from("assignment_team_members")
      .select("*")
      .eq("assignment_id", assignmentId)
      .eq("status", "confirmed");

    if (membersData) {
      const userIds = membersData.map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const enrichedMembers = membersData.map((member: any) => ({
        ...member,
        ...profiles?.find((p: any) => p.id === member.user_id)
      }));

      setTeamMembers(enrichedMembers.filter((m: any) => m.user_id !== session.user.id));
    }

    setLoading(false);
  };

  const loadReflections = async (debriefId: string, userId: string) => {
    // Load my reflections
    const { data: myReflectionsData } = await (supabase as any)
      .from("debrief_reflections")
      .select("*")
      .eq("debrief_id", debriefId)
      .eq("user_id", userId);

    if (myReflectionsData) {
      setMyReflections(myReflectionsData);
    }

    // Load team reflections (only those shared with team)
    const { data: teamReflectionsData } = await (supabase as any)
      .from("debrief_reflections")
      .select("*")
      .eq("debrief_id", debriefId)
      .eq("visibility", "team")
      .neq("user_id", userId);

    if (teamReflectionsData) {
      setTeamReflections(teamReflectionsData);
    }
  };

  const saveSelfAssessment = async () => {
    if (!debrief) return;

    const { error } = await (supabase as any)
      .from("debrief_reflections")
      .insert({
        debrief_id: debrief.id,
        user_id: user.id,
        reflection_type: "self_assessment",
        content: {
          strengths: selfAssessment.strengths.split('\n').filter(s => s.trim()),
          growth_areas: selfAssessment.growth_areas.split('\n').filter(g => g.trim()),
          notes: selfAssessment.notes
        },
        visibility: "private"
      });

    if (!error) {
      setSelfAssessment({ strengths: "", growth_areas: "", notes: "" });
      setActiveForm(null);
      await loadReflections(debrief.id, user.id);
    }
  };

  const savePeerFeedback = async () => {
    if (!debrief || !selectedPeer) return;

    const { error } = await (supabase as any)
      .from("debrief_reflections")
      .insert({
        debrief_id: debrief.id,
        user_id: user.id,
        target_user_id: selectedPeer,
        reflection_type: "peer_feedback",
        content: {
          strengths: peerFeedback.strengths.split('\n').filter(s => s.trim()),
          growth_areas: peerFeedback.growth_areas.split('\n').filter(g => g.trim()),
          notes: peerFeedback.notes
        },
        visibility: peerFeedback.visibility
      });

    if (!error) {
      setPeerFeedback({ strengths: "", growth_areas: "", notes: "", visibility: "private" });
      setActiveForm(null);
      setSelectedPeer(null);
      await loadReflections(debrief.id, user.id);
    }
  };

  const hasSelfAssessment = myReflections.some(r => r.reflection_type === "self_assessment");
  const peerFeedbackGiven = myReflections.filter(r => r.reflection_type === "peer_feedback");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading debrief...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/assignments")}
            className="text-sm text-slate-400 hover:text-teal-400 mb-2 flex items-center gap-1"
          >
            ← Back to Assignments
          </button>
          <h1 className="text-2xl font-semibold text-slate-50">Team Debrief</h1>
          <p className="mt-1 text-sm text-slate-400">{assignment?.title}</p>
        </div>

        {/* Growth Mindset Reminder */}
        <div className="mb-6 rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-1">Reflection for Growth</h3>
              <p className="text-sm text-slate-300">
                This debrief is a learning opportunity, not an evaluation. Focus on what you learned, what worked well,
                and what you'd like to develop further. Your reflections are private by default - you choose what to share.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Self-Assessment Section */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Your Self-Assessment</h3>
                <p className="text-sm text-slate-400 mt-1">Reflect on your own performance (private)</p>
              </div>
              {!hasSelfAssessment && activeForm !== "self" && (
                <button
                  onClick={() => setActiveForm("self")}
                  className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
                >
                  Start Self-Assessment
                </button>
              )}
            </div>

            {activeForm === "self" && (
              <div className="space-y-4 mt-4 pt-4 border-t border-slate-700">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    What went well? (One strength per line)
                  </label>
                  <textarea
                    value={selfAssessment.strengths}
                    onChange={(e) => setSelfAssessment({ ...selfAssessment, strengths: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="Example:&#10;Clear message accuracy throughout&#10;Strong cultural bridging in sensitive moments&#10;Good pacing and turn-taking with team"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    What would you like to develop? (One area per line)
                  </label>
                  <textarea
                    value={selfAssessment.growth_areas}
                    onChange={(e) => setSelfAssessment({ ...selfAssessment, growth_areas: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="Example:&#10;Could improve transition signals between team members&#10;Want to work on medical terminology confidence&#10;Practice managing cognitive load during rapid exchanges"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Additional notes or insights
                  </label>
                  <textarea
                    value={selfAssessment.notes}
                    onChange={(e) => setSelfAssessment({ ...selfAssessment, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="Any other thoughts about this assignment..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={saveSelfAssessment}
                    className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
                  >
                    Save Self-Assessment
                  </button>
                  <button
                    onClick={() => {
                      setActiveForm(null);
                      setSelfAssessment({ strengths: "", growth_areas: "", notes: "" });
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {hasSelfAssessment && activeForm !== "self" && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-sm text-emerald-400">✓ Self-assessment completed</p>
              </div>
            )}
          </div>

          {/* Peer Feedback Section */}
          {assignment?.is_team_assignment && teamMembers.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-100">Peer Feedback (Optional)</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Give constructive feedback to team members - private by default, you can choose to share
                </p>
              </div>

              {activeForm !== "peer" && (
                <div className="space-y-2">
                  {teamMembers.map((member) => {
                    const feedbackGiven = peerFeedbackGiven.some(r => r.target_user_id === member.user_id);
                    return (
                      <button
                        key={member.id}
                        onClick={() => {
                          setSelectedPeer(member.user_id);
                          setActiveForm("peer");
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                            {(member.full_name || member.email)?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-slate-200">{member.full_name || member.email?.split('@')[0]}</span>
                        </div>
                        <span className="text-sm text-slate-400">
                          {feedbackGiven ? '✓ Feedback given' : 'Give feedback'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeForm === "peer" && selectedPeer && (
                <div className="space-y-4 mt-4 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-slate-400">Feedback for:</span>
                    <span className="font-medium text-slate-200">
                      {teamMembers.find(m => m.user_id === selectedPeer)?.full_name ||
                       teamMembers.find(m => m.user_id === selectedPeer)?.email?.split('@')[0]}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Strengths you observed (One per line)
                    </label>
                    <textarea
                      value={peerFeedback.strengths}
                      onChange={(e) => setPeerFeedback({ ...peerFeedback, strengths: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      placeholder="Example:&#10;Excellent turn-taking and team coordination&#10;Clear and accurate message delivery&#10;Professional demeanor throughout"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Development suggestions (Optional, one per line)
                    </label>
                    <textarea
                      value={peerFeedback.growth_areas}
                      onChange={(e) => setPeerFeedback({ ...peerFeedback, growth_areas: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      placeholder="Constructive suggestions for growth..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Additional notes
                    </label>
                    <textarea
                      value={peerFeedback.notes}
                      onChange={(e) => setPeerFeedback({ ...peerFeedback, notes: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      placeholder="Any other observations..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Privacy
                    </label>
                    <select
                      value={peerFeedback.visibility}
                      onChange={(e) => setPeerFeedback({ ...peerFeedback, visibility: e.target.value as "private" | "team" })}
                      className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                      <option value="private">Private (only you can see)</option>
                      <option value="team">Share with team</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={savePeerFeedback}
                      className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
                    >
                      Save Peer Feedback
                    </button>
                    <button
                      onClick={() => {
                        setActiveForm(null);
                        setSelectedPeer(null);
                        setPeerFeedback({ strengths: "", growth_areas: "", notes: "", visibility: "private" });
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Team Reflections (Shared) */}
          {teamReflections.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Team Reflections (Shared)</h3>
              <div className="space-y-4">
                {teamReflections.map((reflection) => (
                  <div key={reflection.id} className="p-4 rounded-lg border border-slate-700 bg-slate-800/30">
                    <p className="text-sm text-slate-300">{reflection.content.notes}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(reflection.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
