"use client";

import { useEffect, useState, useRef } from "react";
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

type PrepMessage = {
  id: string;
  user_id: string | null;
  role: string;
  content: string;
  created_at: string;
  user?: {
    full_name?: string;
    email?: string;
  };
};

export default function TeamPrepPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [prepRoom, setPrepRoom] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [messages, setMessages] = useState<PrepMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [assignmentId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    // Load prep room
    const { data: roomData } = await supabase
      .from("team_prep_rooms")
      .select("*")
      .eq("assignment_id", assignmentId)
      .single();

    if (roomData) {
      setPrepRoom(roomData);
      await loadMessages(roomData.id);
    }

    // Load team members
    const { data: membersData } = await supabase
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
    }

    setLoading(false);
  };

  const loadMessages = async (roomId: string) => {
    const { data: messagesData } = await supabase
      .from("team_prep_messages")
      .select("*")
      .eq("prep_room_id", roomId)
      .order("created_at", { ascending: true });

    if (messagesData) {
      // Enrich with user data
      const userIds = messagesData
        .filter((m: any) => m.user_id)
        .map((m: any) => m.user_id);

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        const enrichedMessages = messagesData.map((msg: any) => ({
          ...msg,
          user: profiles?.find((p: any) => p.id === msg.user_id)
        }));

        setMessages(enrichedMessages);
      } else {
        setMessages(messagesData);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !prepRoom || sending) return;

    setSending(true);

    // Save user message
    const { error: userMsgError } = await supabase
      .from("team_prep_messages")
      .insert({
        prep_room_id: prepRoom.id,
        user_id: user.id,
        role: "user",
        content: newMessage.trim()
      });

    if (userMsgError) {
      console.error("Error sending message:", userMsgError);
      setSending(false);
      return;
    }

    // Clear input immediately
    const userMessageContent = newMessage.trim();
    setNewMessage("");

    // Reload messages to show user's message
    await loadMessages(prepRoom.id);

    // Call Elya API for team prep context
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessageContent }
          ],
          userId: user.id,
          context: {
            type: "team_prep",
            assignment_id: assignmentId,
            assignment: assignment,
            team_members: teamMembers
          }
        })
      });

      const data = await response.json();

      if (data.response) {
        // Save Elya's response
        await supabase
          .from("team_prep_messages")
          .insert({
            prep_room_id: prepRoom.id,
            user_id: null, // Elya
            role: "assistant",
            content: data.response
          });

        // Reload messages
        await loadMessages(prepRoom.id);
      }
    } catch (error) {
      console.error("Error calling Elya:", error);
    }

    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading team prep room...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Assignment not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/assignments")}
            className="text-sm text-slate-400 hover:text-teal-400 mb-2 flex items-center gap-1"
          >
            ← Back to Assignments
          </button>
          <h1 className="text-2xl font-semibold text-slate-50">Team Prep Room</h1>
          <p className="mt-1 text-sm text-slate-400">{assignment.title}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Area - 2/3 width */}
          <div className="lg:col-span-2 space-y-4">
            {/* Assignment Details Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-3">Assignment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="font-medium text-slate-400">Type:</span>
                  {assignment.assignment_type}
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="font-medium text-slate-400">Date:</span>
                  {new Date(assignment.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  {assignment.time && ` at ${assignment.time}`}
                </div>
                {assignment.location_details && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="font-medium text-slate-400">Location:</span>
                    {assignment.location_details}
                  </div>
                )}
                {assignment.description && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-slate-300">{assignment.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Interface */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col" style={{ height: 'calc(100vh - 450px)', minHeight: '400px' }}>
              {/* Chat Header */}
              <div className="border-b border-slate-800 p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  <h3 className="font-semibold text-slate-100">Team Chat with Elya</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Collaborate with your team to prepare for this assignment
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-slate-400 text-sm">
                      Start the conversation! Ask Elya for help preparing, or coordinate with your team.
                    </p>
                  </div>
                )}

                {messages.map((message) => {
                  const isElya = message.role === "assistant";
                  const isCurrentUser = message.user_id === user?.id;
                  const userName = isElya ? "Elya" : (isCurrentUser ? "You" : (message.user?.full_name || message.user?.email?.split('@')[0] || "Team Member"));

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isElya
                          ? 'bg-teal-500 text-slate-950'
                          : isCurrentUser
                          ? 'bg-violet-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {isElya ? 'E' : userName.charAt(0).toUpperCase()}
                      </div>

                      {/* Message */}
                      <div className={`flex-1 max-w-[80%] ${isCurrentUser ? 'text-right' : ''}`}>
                        <div className={`text-xs text-slate-400 mb-1 ${isCurrentUser ? 'text-right' : ''}`}>
                          {userName} • {new Date(message.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                        <div className={`rounded-lg p-3 ${
                          isElya
                            ? 'bg-teal-500/10 border border-teal-500/30 text-slate-100'
                            : isCurrentUser
                            ? 'bg-violet-500/10 border border-violet-500/30 text-slate-100'
                            : 'bg-blue-500/10 border border-blue-500/30 text-slate-100'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-800 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Ask Elya for help or chat with your team..."
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? '...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-4">
            {/* Team Members */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Team Members ({teamMembers.length})</h3>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      {(member.full_name || member.email)?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {member.full_name || member.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prep Checklist */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Prep Checklist</h3>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-slate-100">
                  <input type="checkbox" className="rounded border-slate-600" />
                  Review assignment details
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-slate-100">
                  <input type="checkbox" className="rounded border-slate-600" />
                  Research terminology
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-slate-100">
                  <input type="checkbox" className="rounded border-slate-600" />
                  Pre-session briefing
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-slate-100">
                  <input type="checkbox" className="rounded border-slate-600" />
                  Tech check (if virtual)
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-slate-100">
                  <input type="checkbox" className="rounded border-slate-600" />
                  Team roles confirmed
                </label>
              </div>
            </div>

            {/* Resources */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Resources</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-teal-400 transition-colors text-sm">
                  📋 Team Interpreting Checklist
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-teal-400 transition-colors text-sm">
                  💻 Technical Troubleshooting
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-teal-400 transition-colors text-sm">
                  🌍 Multicultural Teaming Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
