"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import SwitchTimer from "@/components/assignments/SwitchTimer";

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
  timezone: string;
};

type TeamMember = {
  id: string;
  user_id: string;
  role: string;
  status: string;
  full_name?: string;
  email?: string;
  display_name?: string;
};

type Message = {
  id: string;
  sender_id: string | null;
  content: string;
  created_at: string | null;
  conversation_id?: string | null;
  sender?: {
    full_name?: string;
    email?: string;
    display_name?: string;
  };
};

type LivePhase = "pre_session" | "in_session" | "post_session";

type AssignmentResource = {
  id: string;
  resource_type: string;
  title: string;
  content: string | null;
  description: string | null;
  file_url: string | null;
};

export default function LiveAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [livePhase, setLivePhase] = useState<LivePhase>("pre_session");
  const [isLive, setIsLive] = useState(false);
  const [activeInterpreter, setActiveInterpreter] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Resource panel state
  const [resources, setResources] = useState<AssignmentResource[]>([]);
  const [quickNotes, setQuickNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    speaker: true,
    vocabulary: false,
    notes: false,
    links: false,
  });

  // Countdown state
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);
  const phaseIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Polish: Error and offline handling
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'team' | 'resources'>('chat');

  // Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsReconnecting(true);
      loadData().finally(() => setIsReconnecting(false));
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [assignmentId]);

  // Phase transition timer - updates every second
  useEffect(() => {
    if (!assignment) return;

    const updatePhaseAndCountdown = () => {
      const now = new Date();
      const scheduledStart = new Date(assignment.date + 'T' + (assignment.time || '00:00'));
      const scheduledEnd = new Date(scheduledStart.getTime() + (assignment.duration_minutes || 60) * 60000);

      if (now < scheduledStart) {
        // Pre-session: calculate countdown to start
        setLivePhase("pre_session");
        const diff = scheduledStart.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
        setSessionTimeRemaining(null);
      } else if (now >= scheduledStart && now <= scheduledEnd) {
        // In-session: calculate time remaining
        setLivePhase("in_session");
        if (!isLive) setIsLive(true);
        setCountdown(null);
        const remaining = Math.floor((scheduledEnd.getTime() - now.getTime()) / 1000);
        setSessionTimeRemaining(remaining);
      } else {
        // Post-session
        setLivePhase("post_session");
        setIsLive(false);
        setCountdown(null);
        setSessionTimeRemaining(null);
      }
    };

    // Initial update
    updatePhaseAndCountdown();

    // Update every second
    phaseIntervalRef.current = setInterval(updatePhaseAndCountdown, 1000);

    return () => {
      if (phaseIntervalRef.current) {
        clearInterval(phaseIntervalRef.current);
      }
    };
  }, [assignment, isLive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          // Fetch the new message with sender info
          const { data: newMsg } = await supabase
            .from("messages")
            .select("*")
            .eq("id", payload.new.id)
            .single();

          if (newMsg) {
            const sender = teamMembers.find(m => m.user_id === newMsg.sender_id);
            setMessages((prev) => [
              ...prev,
              {
                ...newMsg,
                sender: sender ? {
                  full_name: sender.full_name,
                  display_name: sender.display_name,
                  email: sender.email,
                } : undefined,
              },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id, teamMembers]);

  const loadData = async () => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }

      setUser(session.user);

      // Load assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .select("*")
        .eq("id", assignmentId)
        .single();

      if (assignmentError) {
        throw new Error("Failed to load assignment");
      }

      if (assignmentData) {
        setAssignment(assignmentData as Assignment);
        // Phase determination is handled by the useEffect with phaseIntervalRef
      }

    // Load team members
    const { data: membersData } = await (supabase as any)
      .from("assignment_team_members")
      .select("*")
      .eq("assignment_id", assignmentId)
      .eq("status", "confirmed");

    if (membersData) {
      const userIds = membersData.map((m: any) => m.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      // Get community profiles for display names
      const { data: communityProfiles } = await supabase
        .from("community_profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const enrichedMembers = membersData.map((member: any) => {
        const profile = profiles?.find((p: any) => p.id === member.user_id);
        const communityProfile = communityProfiles?.find((p: any) => p.user_id === member.user_id);
        return {
          ...member,
          full_name: profile?.full_name,
          email: profile?.email,
          display_name: communityProfile?.display_name || profile?.full_name || profile?.email?.split("@")[0],
        };
      });

      setTeamMembers(enrichedMembers);

      // Set first member as active interpreter by default
      if (enrichedMembers.length > 0) {
        setActiveInterpreter(enrichedMembers[0].user_id);
      }
    }

    // Load team conversation
    const { data: convData } = await supabase
      .from("conversations")
      .select("*")
      .eq("assignment_id", assignmentId)
      .single();

    if (convData) {
      setConversation(convData);
      await loadMessages(convData.id);
    }

    // Load assignment resources
    const { data: resourcesData } = await (supabase as any)
      .from("assignment_resources")
      .select("id, resource_type, title, content, description, file_url")
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: true });

    if (resourcesData) {
      setResources(resourcesData);
      // Load quick notes if exists
      const notesResource = resourcesData.find((r: any) => r.resource_type === "note" && r.title === "Quick Notes");
      if (notesResource) {
        setQuickNotes(notesResource.content || "");
      }
    }

    setLoading(false);
    } catch (err) {
      console.error("Error loading live data:", err);
      setError(err instanceof Error ? err.message : "Failed to load assignment data");
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (messagesData) {
      // Enrich with sender info from team members
      const enrichedMessages = messagesData.map((msg: any) => {
        const sender = teamMembers.find(m => m.user_id === msg.sender_id);
        return {
          ...msg,
          sender: sender ? {
            full_name: sender.full_name,
            display_name: sender.display_name,
            email: sender.email,
          } : undefined,
        };
      });
      setMessages(enrichedMessages);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content,
      });

    if (error) {
      console.error("Error sending message:", error);
      setNewMessage(content); // Restore message on error
    }

    setSending(false);
  };

  // Quick action message sender - sends formatted message directly
  const sendQuickAction = async (emoji: string, action: string) => {
    if (!conversation || !user) return;

    const timestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const content = `${emoji} ${action}`;

    await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content,
      });
  };

  const goLive = () => {
    setIsLive(true);
    setLivePhase("in_session");
    // Update assignment status in database
    supabase
      .from("assignments")
      .update({ status: "in_progress" })
      .eq("id", assignmentId)
      .then(() => {});
  };

  const endSession = () => {
    setIsLive(false);
    setLivePhase("post_session");
    // Update assignment status
    supabase
      .from("assignments")
      .update({ status: "completed" })
      .eq("id", assignmentId)
      .then(() => {});
  };

  const getPhaseColor = (phase: LivePhase) => {
    switch (phase) {
      case "pre_session":
        return { bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-400" };
      case "in_session":
        return { bg: "bg-green-500/20", border: "border-green-500/30", text: "text-green-400" };
      case "post_session":
        return { bg: "bg-slate-700/50", border: "border-slate-600", text: "text-slate-400" };
    }
  };

  const formatSessionTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const saveQuickNotes = async () => {
    if (!user) return;
    setSavingNotes(true);

    // Find existing quick notes resource
    const existingNotes = resources.find(r => r.resource_type === "note" && r.title === "Quick Notes");

    if (existingNotes) {
      // Update existing
      await (supabase as any)
        .from("assignment_resources")
        .update({ content: quickNotes })
        .eq("id", existingNotes.id);
    } else {
      // Create new
      await (supabase as any)
        .from("assignment_resources")
        .insert({
          assignment_id: assignmentId,
          added_by: user.id,
          resource_type: "note",
          title: "Quick Notes",
          content: quickNotes,
          visibility: "team"
        });
    }

    setSavingNotes(false);
  };

  // Filter resources by type
  const vocabularyResources = resources.filter(r => r.resource_type === "vocabulary");
  const linkResources = resources.filter(r => r.resource_type === "link");
  const documentResources = resources.filter(r => r.resource_type === "document");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-teal-500/30 border-t-teal-500 animate-spin" />
          <div className="text-slate-400">Loading live mode...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => loadData()}
              className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/assignments")}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Back to Assignments
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
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

  const phaseColors = getPhaseColor(livePhase);
  const assignmentDateTime = new Date(`${assignment.date}T${assignment.time || '00:00'}`);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Offline Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
            You're offline. Messages won't sync until you reconnect.
          </div>
        </div>
      )}

      {/* Reconnecting Banner */}
      {isReconnecting && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Reconnecting...
          </div>
        </div>
      )}

      <NavBar />
      <div className={`container mx-auto max-w-7xl px-4 md:px-6 py-4 md:py-6 ${isOffline || isReconnecting ? 'pt-12' : ''}`}>
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={() => router.push(`/assignments/${assignmentId}`)}
            className="text-sm text-slate-400 hover:text-teal-400 mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Assignment
          </button>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              {/* Live indicator */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-800 border border-slate-700'
              }`}>
                {isLive ? (
                  <div className="w-4 h-4 rounded-full bg-white" />
                ) : (
                  <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-semibold text-slate-50">{assignment.title}</h1>
                  {isLive && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span>{assignment.assignment_type}</span>
                  <span>•</span>
                  <span>
                    {assignmentDateTime.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })} at {assignment.time || 'TBD'}
                  </span>
                  <span>•</span>
                  <span>{assignment.duration_minutes} min</span>
                </div>
                {/* Phase Badge */}
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${phaseColors.bg} border ${phaseColors.border} ${phaseColors.text}`}>
                    {livePhase === "pre_session" ? "Pre-Session" :
                     livePhase === "in_session" ? "In Session" : "Post-Session"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {livePhase === "pre_session" && !isLive && (
                <button
                  onClick={goLive}
                  className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-bold transition-colors flex items-center gap-2"
                >
                  <div className="w-3 h-3 rounded-full bg-slate-950" />
                  Go Live
                </button>
              )}
              {isLive && (
                <button
                  onClick={endSession}
                  className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold transition-colors"
                >
                  End Session
                </button>
              )}
              {livePhase === "post_session" && (
                <button
                  onClick={() => router.push(`/dashboard?mode=debrief&assignment=${assignmentId}`)}
                  className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-colors"
                >
                  Start Debrief
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden mb-4">
          <div className="flex rounded-xl bg-slate-900/50 border border-slate-800 p-1">
            <button
              onClick={() => setMobileTab('chat')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mobileTab === 'chat'
                  ? 'bg-teal-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setMobileTab('team')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mobileTab === 'team'
                  ? 'bg-teal-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Team
            </button>
            <button
              onClick={() => setMobileTab('resources')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mobileTab === 'resources'
                  ? 'bg-teal-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Resources
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Sidebar - Team & Controls */}
          <div className={`lg:col-span-3 space-y-4 ${mobileTab !== 'team' ? 'hidden lg:block' : ''}`}>
            {/* PRE-SESSION: Countdown Panel */}
            {livePhase === "pre_session" && countdown && (
              <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-900/50 p-4">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Starting In
                </h3>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-900/50">
                    <div className="text-2xl font-bold text-amber-400">{countdown.days}</div>
                    <div className="text-xs text-slate-500">days</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50">
                    <div className="text-2xl font-bold text-amber-400">{countdown.hours}</div>
                    <div className="text-xs text-slate-500">hrs</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50">
                    <div className="text-2xl font-bold text-amber-400">{countdown.minutes}</div>
                    <div className="text-xs text-slate-500">min</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50">
                    <div className="text-2xl font-bold text-amber-400">{countdown.seconds}</div>
                    <div className="text-xs text-slate-500">sec</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => router.push(`/assignments/${assignmentId}/team-prep`)}
                    className="w-full px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 font-medium hover:bg-amber-500/30 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Review Prep Materials
                  </button>
                  <button
                    onClick={() => window.open(`/dashboard?mode=prep&assignment=${assignmentId}`, '_blank')}
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Ask Elya
                  </button>
                </div>
              </div>
            )}

            {/* IN-SESSION: Session Timer */}
            {livePhase === "in_session" && sessionTimeRemaining !== null && (
              <div className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-slate-900/50 p-4">
                <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Session Time Remaining
                </h3>
                <div className="text-center">
                  <div className={`text-4xl font-mono font-bold ${sessionTimeRemaining <= 300 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                    {formatSessionTime(sessionTimeRemaining)}
                  </div>
                  {sessionTimeRemaining <= 300 && sessionTimeRemaining > 0 && (
                    <p className="text-xs text-red-400 mt-1">Session ending soon!</p>
                  )}
                </div>
              </div>
            )}

            {/* Team Members Panel */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
                Team ({teamMembers.length})
              </h3>
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer ${
                      activeInterpreter === member.user_id
                        ? 'bg-green-500/20 border border-green-500/50'
                        : 'hover:bg-slate-800'
                    }`}
                    onClick={() => isLive && setActiveInterpreter(member.user_id)}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      activeInterpreter === member.user_id ? 'bg-green-500' :
                      member.role === 'lead' ? 'bg-violet-500' : 'bg-blue-500'
                    }`}>
                      {(member.display_name || member.full_name || member.email)?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {member.display_name || member.full_name || member.email?.split('@')[0]}
                        {member.user_id === user?.id && " (You)"}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs capitalize ${
                          activeInterpreter === member.user_id ? 'text-green-400' : 'text-slate-500'
                        }`}>
                          {activeInterpreter === member.user_id ? 'Active' : member.role}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Switch Timer Component - Only show when live and team has 2+ members */}
            {isLive && teamMembers.length > 1 && (
              <SwitchTimer
                assignmentId={assignmentId}
                teamMembers={teamMembers}
                currentUserId={user?.id || ""}
                isLive={isLive}
                onActiveInterpreterChange={setActiveInterpreter}
              />
            )}

            {/* Quick Actions */}
            {isLive && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => sendQuickAction("👀", "Need your eyes on this")}
                    className="px-3 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>👀</span> Need Eyes
                  </button>
                  <button
                    onClick={() => sendQuickAction("✍️", "Type feed please")}
                    className="px-3 py-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>✍️</span> Type Feed
                  </button>
                  <button
                    onClick={() => sendQuickAction("⭐", "Great work!")}
                    className="px-3 py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>⭐</span> Great Work
                  </button>
                  <button
                    onClick={() => sendQuickAction("🔄", "Ready to switch")}
                    className="px-3 py-2.5 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>🔄</span> Ready
                  </button>
                </div>
                {/* Additional quick actions row */}
                <div className="mt-2">
                  <button
                    onClick={() => sendQuickAction("☕", "Break needed")}
                    className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>☕</span> Break
                  </button>
                </div>
              </div>
            )}

            {/* POST-SESSION: Debrief Panel */}
            {livePhase === "post_session" && (
              <div className="rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-slate-900/50 p-4">
                <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Session Complete
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  Great work! Take time to reflect on this session.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push(`/dashboard?mode=debrief&assignment=${assignmentId}`)}
                    className="w-full px-4 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-medium transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Start Debrief with Elya
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard?mode=freewrite&assignment=${assignmentId}`)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Free Write
                  </button>
                  <button
                    onClick={() => router.push(`/assignments/${assignmentId}`)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    View Assignment Details
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Content - Team Chat */}
          <div className={`lg:col-span-6 ${mobileTab !== 'chat' ? 'hidden lg:block' : ''}`}>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
              {/* Chat Header */}
              <div className="border-b border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                    <h3 className="font-semibold text-slate-100">Team Chat</h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    {messages.length} messages
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Real-time coordination with your team
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-slate-400 text-sm">
                      No messages yet. Start coordinating with your team!
                    </p>
                  </div>
                )}

                {messages.map((message) => {
                  const isCurrentUser = message.sender_id === user?.id;
                  const senderName = message.sender?.display_name || message.sender?.full_name || message.sender?.email?.split('@')[0] || "Team Member";

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        isCurrentUser ? 'bg-teal-500 text-slate-950' : 'bg-blue-500 text-white'
                      }`}>
                        {senderName.charAt(0).toUpperCase()}
                      </div>
                      <div className={`flex-1 max-w-[75%] ${isCurrentUser ? 'text-right' : ''}`}>
                        <div className={`text-xs text-slate-500 mb-1 ${isCurrentUser ? 'text-right' : ''}`}>
                          {isCurrentUser ? 'You' : senderName} • {message.created_at ? new Date(message.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'now'}
                        </div>
                        <div className={`rounded-lg px-3 py-2 text-sm ${
                          isCurrentUser
                            ? 'bg-teal-500/20 border border-teal-500/30 text-slate-100'
                            : 'bg-slate-800 border border-slate-700 text-slate-200'
                        }`}>
                          {message.content}
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
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
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

          {/* Right Sidebar - Assignment Info */}
          <div className={`lg:col-span-3 space-y-4 ${mobileTab !== 'resources' ? 'hidden lg:block' : ''}`}>
            {/* Assignment Details */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
                Assignment Info
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-500">Type</span>
                  <p className="text-slate-200 font-medium">{assignment.assignment_type}</p>
                </div>
                {assignment.setting && (
                  <div>
                    <span className="text-slate-500">Setting</span>
                    <p className="text-slate-200 font-medium">{assignment.setting}</p>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Location</span>
                  <p className="text-slate-200 font-medium">
                    {assignment.location_type?.replace('_', ' ').charAt(0).toUpperCase() + assignment.location_type?.slice(1).replace('_', ' ')}
                  </p>
                  {assignment.location_details && (
                    <p className="text-slate-400 text-xs mt-1">{assignment.location_details}</p>
                  )}
                </div>
                {assignment.description && (
                  <div>
                    <span className="text-slate-500">Notes</span>
                    <p className="text-slate-200 text-xs mt-1">{assignment.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Assignment Resources - Collapsible Drawer */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide p-4 pb-2 border-b border-slate-800">
                Assignment Resources
              </h3>

              {/* Speaker Profile Section */}
              <div className="border-b border-slate-800">
                <button
                  onClick={() => toggleSection('speaker')}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm text-slate-200">Speaker Profile</span>
                  </div>
                  <svg className={`w-4 h-4 text-slate-500 transition-transform ${expandedSections.speaker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.speaker && (
                  <div className="px-4 pb-3 space-y-2">
                    <div className="text-xs text-slate-400">
                      <span className="text-slate-500">Type:</span> {assignment.assignment_type}
                    </div>
                    {assignment.setting && (
                      <div className="text-xs text-slate-400">
                        <span className="text-slate-500">Setting:</span> {assignment.setting}
                      </div>
                    )}
                    {assignment.description && (
                      <div className="text-xs text-slate-400">
                        <span className="text-slate-500">Details:</span> {assignment.description}
                      </div>
                    )}
                    {!assignment.setting && !assignment.description && (
                      <p className="text-xs text-slate-500 italic">No speaker details added yet</p>
                    )}
                  </div>
                )}
              </div>

              {/* Vocabulary/Jargon Section */}
              <div className="border-b border-slate-800">
                <button
                  onClick={() => toggleSection('vocabulary')}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="text-sm text-slate-200">Jargon List</span>
                    {vocabularyResources.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                        {vocabularyResources.length}
                      </span>
                    )}
                  </div>
                  <svg className={`w-4 h-4 text-slate-500 transition-transform ${expandedSections.vocabulary ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.vocabulary && (
                  <div className="px-4 pb-3">
                    {vocabularyResources.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {vocabularyResources.map((vocab) => (
                          <div key={vocab.id} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                            <p className="text-xs font-medium text-slate-200">{vocab.title}</p>
                            {vocab.content && (
                              <p className="text-xs text-slate-400 mt-1">{vocab.content}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <p className="text-xs text-slate-500 italic mb-2">No jargon added yet</p>
                        <button
                          onClick={() => window.open(`/dashboard?mode=research&message=${encodeURIComponent(`Give me key ${assignment.assignment_type} terminology for interpreting.`)}`, '_blank')}
                          className="text-xs text-teal-400 hover:text-teal-300"
                        >
                          Ask Elya for terminology
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Notes Section */}
              <div className="border-b border-slate-800">
                <button
                  onClick={() => toggleSection('notes')}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="text-sm text-slate-200">Quick Notes</span>
                    {quickNotes && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                  </div>
                  <svg className={`w-4 h-4 text-slate-500 transition-transform ${expandedSections.notes ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.notes && (
                  <div className="px-4 pb-3">
                    <textarea
                      value={quickNotes}
                      onChange={(e) => setQuickNotes(e.target.value)}
                      placeholder="Jot down quick notes during the session..."
                      className="w-full h-24 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs resize-none"
                    />
                    <button
                      onClick={saveQuickNotes}
                      disabled={savingNotes}
                      className="mt-2 w-full px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                    >
                      {savingNotes ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                )}
              </div>

              {/* Links & Prep Materials Section */}
              <div>
                <button
                  onClick={() => toggleSection('links')}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="text-sm text-slate-200">Prep Materials</span>
                    {(linkResources.length + documentResources.length) > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                        {linkResources.length + documentResources.length}
                      </span>
                    )}
                  </div>
                  <svg className={`w-4 h-4 text-slate-500 transition-transform ${expandedSections.links ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.links && (
                  <div className="px-4 pb-3 space-y-2">
                    {/* Saved Links */}
                    {linkResources.map((link) => (
                      <a
                        key={link.id}
                        href={link.content || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-colors text-xs"
                      >
                        {link.title}
                      </a>
                    ))}
                    {/* Documents */}
                    {documentResources.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.file_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-colors text-xs"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {doc.title}
                      </a>
                    ))}
                    {/* Quick Links */}
                    <button
                      onClick={() => router.push(`/assignments/${assignmentId}/team-prep`)}
                      className="w-full text-left px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-teal-400 transition-colors text-xs flex items-center gap-2"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Team Prep Notes
                    </button>
                    <button
                      onClick={() => window.open(`/dashboard?mode=prep&assignment=${assignmentId}&message=${encodeURIComponent(`What are common challenges in ${assignment.assignment_type} interpreting and how should I handle them?`)}`, '_blank')}
                      className="w-full text-left px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-teal-400 transition-colors text-xs flex items-center gap-2"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Ask Elya for Tips
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Post-Session Actions */}
            {livePhase === "post_session" && (
              <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-4">
                <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wide mb-3">
                  Session Complete
                </h3>
                <p className="text-sm text-slate-300 mb-4">
                  Great work! Take time to debrief and reflect on the session.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push(`/dashboard?mode=debrief&assignment=${assignmentId}`)}
                    className="w-full px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-medium transition-colors text-sm"
                  >
                    Start Debrief
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard?mode=freewrite&assignment=${assignmentId}`)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm"
                  >
                    Free Write
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
