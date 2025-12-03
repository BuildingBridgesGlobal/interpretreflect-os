"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import EssenceProfileOnboarding from "@/components/community/EssenceProfileOnboarding";

interface CommunityMember {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  years_experience: number | string | null;
  specialties: string[] | null;
  open_to_mentoring: boolean | null;
  avatar: string;
}

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at: string | null;
  participants: { user_id: string | null; display_name: string; avatar: string }[];
  last_message?: { content: string; created_at: string | null; sender_name: string };
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string | null;
  sender_name: string;
  created_at: string | null;
}

export default function CommunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [communityProfile, setCommunityProfile] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  // Data from database
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);

  // UI State
  const [sidebarView, setSidebarView] = useState<"feed" | "connections" | "suggested">("feed");
  const [showMessagesPanel, setShowMessagesPanel] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTopic, setNewPostTopic] = useState("General");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [onboardingTrigger, setOnboardingTrigger] = useState<"sidebar" | "post">("sidebar");
  const [newMessageText, setNewMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // New Chat / Group Chat State
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatType, setNewChatType] = useState<"direct" | "group">("direct");
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [creatingChat, setCreatingChat] = useState(false);

  // Load community members from database
  const loadCommunityMembers = useCallback(async () => {
    const { data: members, error } = await supabase
      .from("community_profiles")
      .select("*")
      .neq("user_id", userId || "")
      .limit(50);

    if (!error && members) {
      setCommunityMembers(members.map(m => ({
        id: m.id,
        user_id: m.user_id,
        display_name: m.display_name || "Anonymous",
        bio: m.bio,
        years_experience: m.years_experience,
        specialties: m.specialties,
        open_to_mentoring: m.open_to_mentoring,
        avatar: (m.display_name || "A").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
      })));
    }
  }, [userId]);

  // Load conversations from database
  const loadConversations = useCallback(async () => {
    if (!userId) return;

    // Get conversations the user is part of
    const { data: participations, error: partError } = await supabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        conversations (
          id,
          name,
          is_group,
          created_at
        )
      `)
      .eq("user_id", userId);

    if (partError || !participations) return;

    const convs: Conversation[] = [];

    for (const p of participations) {
      const conv = (p as any).conversations;
      if (!conv) continue;

      // Get participants for this conversation
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conv.id);

      // Get display names for participants
      const participantList: { user_id: string | null; display_name: string; avatar: string }[] = [];
      if (participants) {
        for (const part of participants) {
          if (!part.user_id || part.user_id === userId) continue;
          const { data: profile } = await supabase
            .from("community_profiles")
            .select("display_name")
            .eq("user_id", part.user_id)
            .single();

          const name = profile?.display_name || "Unknown";
          participantList.push({
            user_id: part.user_id,
            display_name: name,
            avatar: name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
          });
        }
      }

      // Get last message
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at, sender_id")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      convs.push({
        id: conv.id,
        name: conv.name,
        is_group: conv.is_group,
        created_at: conv.created_at,
        participants: participantList,
        last_message: lastMsg ? {
          content: lastMsg.content,
          created_at: lastMsg.created_at,
          sender_name: lastMsg.sender_id === userId ? "You" : participantList.find(p => p.user_id === lastMsg.sender_id)?.display_name || "Unknown"
        } : undefined,
        unread_count: 0 // TODO: implement unread tracking
      });
    }

    setConversations(convs);
  }, [userId]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!error && messages) {
      // Get sender names
      const msgs: Message[] = [];
      for (const m of messages) {
        let senderName = "Unknown";
        if (m.sender_id === userId) {
          senderName = "You";
        } else {
          const { data: profile } = await supabase
            .from("community_profiles")
            .select("display_name")
            .eq("user_id", m.sender_id || "")
            .single();
          senderName = profile?.display_name || "Unknown";
        }
        msgs.push({
          id: m.id,
          content: m.content,
          sender_id: m.sender_id,
          sender_name: senderName,
          created_at: m.created_at
        });
      }
      setCurrentMessages(msgs);
    }
  }, [userId]);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }

      setUserId(session.user.id);

      // Load user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      // Get name from multiple sources (profile > auth metadata > email prefix)
      const authUserName = session.user.user_metadata?.full_name ||
                          session.user.user_metadata?.name ||
                          null;
      const emailPrefix = session.user.email?.split("@")[0] || "";

      // Determine if we have a verified name (not just email prefix)
      const verifiedName = profile?.full_name || authUserName;
      const resolvedName = verifiedName || emailPrefix;

      // Combine profile data with resolved name
      setUserData({
        ...profile,
        full_name: resolvedName,
        email: session.user.email,
        isVerifiedName: !!verifiedName
      });

      // Check if user has community profile
      const { data: commProfile } = await supabase
        .from("community_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (commProfile) {
        setCommunityProfile(commProfile);
        setHasProfile(true);
      }

      setLoading(false);
    };
    loadUserData();
  }, [router]);

  // Load data when userId is set
  useEffect(() => {
    if (userId) {
      loadCommunityMembers();
      loadConversations();
    }
  }, [userId, loadCommunityMembers, loadConversations]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation, loadMessages]);

  // Handle onboarding completion
  const handleOnboardingComplete = async (profileData: {
    display_name: string;
    bio: string;
    is_deaf_interpreter: boolean;
    open_to_mentoring: boolean;
    years_experience: string;
    primary_settings: string[];
    community_intent: string;
  }) => {
    setOnboardingLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Session expired. Please sign in again.");
        router.push("/signin");
        return;
      }

      const response = await fetch("/api/community/profile/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          ...profileData
        })
      });

      const result = await response.json();

      if (response.ok) {
        setCommunityProfile(result.profile);
        setHasProfile(true);
        setShowOnboarding(false);
        loadCommunityMembers(); // Refresh member list
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      console.error("Onboarding error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setOnboardingLoading(false);
    }
  };

  const handleNewPost = () => {
    // TODO: Save post to database
    console.log("New post created:", {
      title: newPostTitle,
      content: newPostContent,
      topic: newPostTopic,
      author: userData?.full_name || "Anonymous"
    });

    setNewPostTitle("");
    setNewPostContent("");
    setNewPostTopic("General");
    setShowNewPostModal(false);
    alert("Post created successfully!");
  };

  // Handle creating a new chat (direct or group)
  const handleCreateChat = async () => {
    if (selectedMembers.length === 0) {
      alert("Please select at least one member");
      return;
    }

    if (newChatType === "group" && !newGroupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    setCreatingChat(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Session expired. Please sign in again.");
        return;
      }

      // Create the conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          name: newChatType === "group" ? newGroupName : null,
          is_group: newChatType === "group",
          created_by: session.user.id
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants (including self)
      const participants = [
        { conversation_id: conversation.id, user_id: session.user.id, is_admin: true },
        ...selectedMembers.map(memberId => ({
          conversation_id: conversation.id,
          user_id: memberId,
          is_admin: false
        }))
      ];

      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert(participants);

      if (partError) throw partError;

      // Reset and close modal
      setNewGroupName("");
      setSelectedMembers([]);
      setNewChatType("direct");
      setShowNewChatModal(false);

      // Reload conversations and select the new one
      await loadConversations();
      setSelectedConversation(conversation.id);

    } catch (error: any) {
      console.error("Error creating chat:", error);
      alert("Failed to create chat. Please try again.");
    } finally {
      setCreatingChat(false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessageText.trim() || !selectedConversation || !userId) return;

    setSendingMessage(true);

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation,
          sender_id: userId,
          content: newMessageText.trim()
        });

      if (error) throw error;

      setNewMessageText("");
      await loadMessages(selectedConversation);
      await loadConversations(); // Update last message
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const getTopicColor = (topic: string) => {
    const colors: Record<string, string> = {
      Medical: "bg-rose-500/20 text-rose-400",
      Legal: "bg-amber-500/20 text-amber-400",
      Educational: "bg-blue-500/20 text-blue-400",
      "Mental Health": "bg-purple-500/20 text-purple-400",
      VRS: "bg-teal-500/20 text-teal-400",
      General: "bg-slate-500/20 text-slate-400"
    };
    return colors[topic] || colors.General;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  // Get conversation display name
  const getConversationName = (conv: Conversation) => {
    if (conv.is_group && conv.name) return conv.name;
    return conv.participants.map(p => p.display_name).join(", ") || "New Conversation";
  };

  // Get conversation avatar
  const getConversationAvatar = (conv: Conversation) => {
    if (conv.is_group) return "G";
    return conv.participants[0]?.avatar || "?";
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />

      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6">
        {/* Top Search Bar */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(e.target.value.length > 0);
                }}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                placeholder="Search for interpreters..."
                className="w-full px-4 py-3 pl-12 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              {/* Search Results Dropdown */}
              {showSearchResults && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    <p className="text-xs text-slate-500 px-3 py-2">COMMUNITY MEMBERS</p>
                    {communityMembers
                      .filter(m => m.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 5)
                      .map(member => (
                        <button
                          key={member.id}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-all"
                          onClick={() => {
                            setShowSearchResults(false);
                            setSearchQuery("");
                            // TODO: Navigate to member profile
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                            {member.avatar}
                          </div>
                          <div className="text-left">
                            <p className="text-sm text-slate-100">{member.display_name}</p>
                            <p className="text-xs text-slate-500">{(member.specialties || []).join(", ") || "No specialties listed"}</p>
                          </div>
                        </button>
                      ))}
                    {communityMembers.filter(m => m.display_name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <p className="text-sm text-slate-500 px-3 py-2">No members found</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (!hasProfile) {
                  setOnboardingTrigger("post");
                  setShowOnboarding(true);
                } else {
                  setShowNewPostModal(true);
                }
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white font-semibold transition-all whitespace-nowrap"
            >
              + New Post
            </button>
          </div>
        </div>

        {/* Main Layout: Sidebar + Feed */}
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="w-72 flex-shrink-0 hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* Profile Card */}
              {hasProfile ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center text-lg font-bold text-white">
                      {userData?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100">{communityProfile?.display_name || userData?.full_name}</p>
                      <p className="text-xs text-slate-400">{communityProfile?.years_experience}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center py-3 border-t border-slate-800">
                    <div>
                      <p className="text-lg font-bold text-teal-400">{conversations.length}</p>
                      <p className="text-xs text-slate-500">Chats</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-violet-400">{communityMembers.length}</p>
                      <p className="text-xs text-slate-500">Friends</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-400">{communityProfile?.offer_support_in?.length || 0}</p>
                      <p className="text-xs text-slate-500">Strengths</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-4">
                  <h3 className="font-semibold text-slate-100 mb-2">Join the Community</h3>
                  <p className="text-sm text-slate-400 mb-4">Create your profile to connect with peers.</p>
                  <button
                    onClick={() => {
                      setOnboardingTrigger("sidebar");
                      setShowOnboarding(true);
                    }}
                    disabled={!userData}
                    className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-violet-500 text-white font-semibold hover:from-teal-400 hover:to-violet-400 transition-all disabled:opacity-50"
                  >
                    Get Started
                  </button>
                </div>
              )}

              {/* Navigation */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                <button
                  onClick={() => setShowMessagesPanel(true)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-slate-100">Messages</span>
                  </div>
                  {totalUnread > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-teal-500 text-slate-950 text-xs font-bold">
                      {totalUnread}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setSidebarView(sidebarView === "connections" ? "feed" : "connections")}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-all border-t border-slate-800 ${
                    sidebarView === "connections" ? "bg-slate-800/50" : ""
                  }`}
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-slate-100">Friends</span>
                  <span className="ml-auto text-sm text-slate-500">{communityMembers.length}</span>
                </button>

                <button
                  onClick={() => setSidebarView(sidebarView === "suggested" ? "feed" : "suggested")}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-all border-t border-slate-800 ${
                    sidebarView === "suggested" ? "bg-slate-800/50" : ""
                  }`}
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span className="text-slate-100">Mentors</span>
                  <span className="ml-auto text-sm text-slate-500">
                    {communityMembers.filter(m => m.open_to_mentoring).length}
                  </span>
                </button>

                <button
                  onClick={() => router.push("/settings")}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-all border-t border-slate-800"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-slate-100">My Profile</span>
                </button>
              </div>

              {/* Recent Conversations */}
              {conversations.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">RECENT CHATS</h4>
                  <div className="space-y-2">
                    {conversations.slice(0, 3).map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv.id);
                          setShowMessagesPanel(true);
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-all"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                          {getConversationAvatar(conv)}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-sm text-slate-300 truncate block">{getConversationName(conv)}</span>
                          {conv.last_message && (
                            <span className="text-xs text-slate-500 truncate block">{conv.last_message.content}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 max-w-2xl">
            {/* Connections View */}
            {sidebarView === "connections" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-100">Friends</h2>
                  <button
                    onClick={() => setSidebarView("feed")}
                    className="text-sm text-slate-400 hover:text-slate-300"
                  >
                    ← Back to Feed
                  </button>
                </div>

                {communityMembers.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
                    <p className="text-slate-400">No friends found yet.</p>
                    <p className="text-sm text-slate-500 mt-2">Be the first to invite others!</p>
                  </div>
                ) : (
                  communityMembers.map(member => (
                    <div key={member.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                          {member.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-100">{member.display_name}</h4>
                            {member.open_to_mentoring && (
                              <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-400 text-xs">
                                Mentor
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mb-2">
                            {member.years_experience} · {(member.specialties || []).join(", ") || "No specialties listed"}
                          </p>
                          {member.bio && (
                            <p className="text-sm text-slate-300 mb-3">{member.bio}</p>
                          )}
                          <button
                            onClick={() => {
                              setSelectedMembers([member.user_id]);
                              setNewChatType("direct");
                              setShowNewChatModal(true);
                            }}
                            className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 text-sm font-medium hover:bg-teal-400 transition-all"
                          >
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Suggested/Mentors View */}
            {sidebarView === "suggested" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-100">Available Mentors</h2>
                  <button
                    onClick={() => setSidebarView("feed")}
                    className="text-sm text-slate-400 hover:text-slate-300"
                  >
                    ← Back to Feed
                  </button>
                </div>

                {communityMembers.filter(m => m.open_to_mentoring).length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
                    <p className="text-slate-400">No mentors available yet.</p>
                    <p className="text-sm text-slate-500 mt-2">Check back soon!</p>
                  </div>
                ) : (
                  communityMembers.filter(m => m.open_to_mentoring).map(member => (
                    <div key={member.id} className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5 overflow-hidden">
                      <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                        <span className="text-xs font-medium text-amber-400">Available Mentor</span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                            {member.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-100">{member.display_name}</h4>
                            </div>
                            <p className="text-sm text-slate-400 mb-2">
                              {member.years_experience} · {(member.specialties || []).join(", ") || "No specialties listed"}
                            </p>
                            {member.bio && (
                              <p className="text-sm text-slate-300 mb-3">{member.bio}</p>
                            )}
                            <button
                              onClick={() => {
                                setSelectedMembers([member.user_id]);
                                setNewChatType("direct");
                                setShowNewChatModal(true);
                              }}
                              className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 text-sm font-medium hover:bg-teal-400 transition-all"
                            >
                              Connect
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Feed View */}
            {sidebarView === "feed" && (
              <div className="space-y-4">
                {/* Welcome / Empty State */}
                {communityMembers.length === 0 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
                    <h3 className="text-xl font-semibold text-slate-100 mb-2">Welcome to the Community!</h3>
                    <p className="text-slate-400 mb-4">
                      Connect with other interpreters, share knowledge, and grow together.
                    </p>
                    {!hasProfile && (
                      <button
                        onClick={() => {
                          setOnboardingTrigger("sidebar");
                          setShowOnboarding(true);
                        }}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-violet-500 text-white font-semibold hover:from-teal-400 hover:to-violet-400 transition-all"
                      >
                        Create Your Profile
                      </button>
                    )}
                  </div>
                )}

                {/* Friends Preview */}
                {communityMembers.length > 0 && (
                  <>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-100">Friends</h3>
                        <button
                          onClick={() => setSidebarView("connections")}
                          className="text-sm text-teal-400 hover:text-teal-300"
                        >
                          View All →
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {communityMembers.slice(0, 4).map(member => (
                          <button
                            key={member.id}
                            onClick={() => {
                              setSelectedMembers([member.user_id]);
                              setNewChatType("direct");
                              setShowNewChatModal(true);
                            }}
                            className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
                              {member.avatar}
                            </div>
                            <div className="text-left min-w-0">
                              <p className="text-sm font-medium text-slate-100 truncate">{member.display_name}</p>
                              <p className="text-xs text-slate-500 truncate">{member.years_experience}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mentors Preview */}
                    {communityMembers.filter(m => m.open_to_mentoring).length > 0 && (
                      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5 p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-slate-100">Available Mentors</h3>
                          <button
                            onClick={() => setSidebarView("suggested")}
                            className="text-sm text-amber-400 hover:text-amber-300"
                          >
                            View All →
                          </button>
                        </div>
                        <div className="space-y-3">
                          {communityMembers.filter(m => m.open_to_mentoring).slice(0, 2).map(member => (
                            <div key={member.id} className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-sm font-bold text-white">
                                {member.avatar}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-100">{member.display_name}</p>
                                <p className="text-xs text-slate-500 truncate">{(member.specialties || []).join(", ") || member.years_experience}</p>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedMembers([member.user_id]);
                                  setNewChatType("direct");
                                  setShowNewChatModal(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 text-xs font-medium hover:bg-teal-400 transition-all"
                              >
                                Connect
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Community Guidelines - Mobile/Tablet (hidden on xl) */}
                    <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-4 xl:hidden">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <h4 className="text-sm font-semibold text-violet-400">Community Guidelines</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                        <div className="flex items-start gap-2">
                          <span className="text-violet-400 mt-0.5">•</span>
                          <span><span className="text-slate-100 font-medium">Respect confidentiality</span></span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-violet-400 mt-0.5">•</span>
                          <span><span className="text-slate-100 font-medium">Support each other</span></span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-violet-400 mt-0.5">•</span>
                          <span><span className="text-slate-100 font-medium">Be constructive</span></span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-violet-400 mt-0.5">•</span>
                          <span><span className="text-slate-100 font-medium">Respect boundaries</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <h4 className="text-sm font-semibold text-blue-400">Getting Started</h4>
                      </div>
                      <p className="text-sm text-slate-300">
                        Click on any member to start a conversation. You can also create group chats by clicking "+ New Chat" in the Messages panel.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - Stats */}
          <div className="w-72 flex-shrink-0 hidden xl:block">
            <div className="sticky top-24 space-y-4">
              {/* Community Guidelines */}
              <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-violet-400">Community Guidelines</h4>
                </div>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span><span className="text-slate-100 font-medium">Respect confidentiality</span> — Never share client info</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span><span className="text-slate-100 font-medium">Support each other</span> — We all have hard days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span><span className="text-slate-100 font-medium">Be constructive</span> — Offer help, not judgment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span><span className="text-slate-100 font-medium">Respect boundaries</span> — Ask before mentoring</span>
                  </li>
                </ul>
              </div>

              {/* Community Stats */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <h4 className="text-sm font-semibold text-slate-400 mb-3">COMMUNITY</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Friends</span>
                    <span className="text-sm font-medium text-slate-100">{communityMembers.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Mentors</span>
                    <span className="text-sm font-medium text-slate-100">
                      {communityMembers.filter(m => m.open_to_mentoring).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Your conversations</span>
                    <span className="text-sm font-medium text-emerald-400">{conversations.length}</span>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <h4 className="text-sm font-semibold text-blue-400">Did you know?</h4>
                </div>
                <p className="text-sm text-slate-300">
                  Your strengths are automatically discovered through your debriefs. The more you reflect, the better your matches!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Slide-out Panel */}
      {showMessagesPanel && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowMessagesPanel(false);
              setSelectedConversation(null);
            }}
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-slate-100">Messages</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 text-sm font-medium hover:bg-teal-400 transition-all"
                >
                  + New Chat
                </button>
                <button
                  onClick={() => {
                    setShowMessagesPanel(false);
                    setSelectedConversation(null);
                  }}
                  className="text-slate-400 hover:text-slate-300 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Conversation List */}
              {!selectedConversation ? (
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-slate-400 mb-4">No conversations yet</p>
                      <button
                        onClick={() => setShowNewChatModal(true)}
                        className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-all"
                      >
                        Start a Conversation
                      </button>
                    </div>
                  ) : (
                    conversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-all border-b border-slate-800"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
                          {getConversationAvatar(conv)}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-slate-100 truncate">{getConversationName(conv)}</span>
                            {conv.last_message && (
                              <span className="text-xs text-slate-500">{formatTime(conv.last_message.created_at || "")}</span>
                            )}
                          </div>
                          {conv.last_message ? (
                            <p className="text-sm text-slate-400 truncate">
                              {conv.last_message.sender_name === "You" ? "You: " : ""}{conv.last_message.content}
                            </p>
                          ) : (
                            <p className="text-sm text-slate-500 italic">No messages yet</p>
                          )}
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-teal-500 text-slate-950 text-xs font-bold">
                            {conv.unread_count}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              ) : (
                /* Conversation Thread */
                <div className="flex-1 flex flex-col">
                  {/* Thread Header */}
                  <div className="flex items-center gap-3 p-4 border-b border-slate-800">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="text-slate-400 hover:text-slate-300"
                    >
                      ←
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
                      {getConversationAvatar(conversations.find(c => c.id === selectedConversation)!)}
                    </div>
                    <span className="font-medium text-slate-100">
                      {getConversationName(conversations.find(c => c.id === selectedConversation)!)}
                    </span>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {currentMessages.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-slate-500">No messages yet. Say hello!</p>
                      </div>
                    ) : (
                      currentMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender_name === "You" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            msg.sender_name === "You"
                              ? "bg-teal-500 text-slate-950"
                              : "bg-slate-800 text-slate-100"
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.sender_name === "You" ? "text-teal-800" : "text-slate-500"}`}>
                              {formatTime(msg.created_at || "")}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-slate-800">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessageText.trim() || sendingMessage}
                        className="px-4 py-2 rounded-full bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-all disabled:opacity-50"
                      >
                        {sendingMessage ? "..." : "Send"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-100">Create Post</h2>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="text-slate-400 hover:text-slate-300 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Topic Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Topic</label>
                <div className="flex gap-2 flex-wrap">
                  {["Medical", "Legal", "Educational", "Mental Health", "VRS", "General"].map(topic => (
                    <button
                      key={topic}
                      onClick={() => setNewPostTopic(topic)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        newPostTopic === topic
                          ? "bg-teal-500 text-slate-950 font-medium"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="What's your question or topic?"
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Details</label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your question, experience, or insight..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowNewPostModal(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNewPost}
                  disabled={!newPostTitle.trim() || !newPostContent.trim()}
                  className="px-6 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-semibold hover:bg-teal-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">
                  {onboardingTrigger === "post" ? "Set Up Your Profile First" : "Create Your Community Profile"}
                </h2>
                {onboardingTrigger === "post" && (
                  <p className="text-sm text-slate-400 mt-1">
                    You need a community profile before you can post. It only takes 2 minutes!
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowOnboarding(false)}
                className="text-slate-400 hover:text-slate-300 text-2xl"
                disabled={onboardingLoading}
              >
                ×
              </button>
            </div>
            {onboardingLoading ? (
              <div className="py-12 text-center">
                <div className="text-slate-400 mb-2">Creating your profile...</div>
                <div className="text-sm text-slate-500">This will only take a moment</div>
              </div>
            ) : (
              <EssenceProfileOnboarding
                onComplete={handleOnboardingComplete}
                onSkip={() => setShowOnboarding(false)}
                suggestedName={userData?.full_name || ""}
                isVerifiedName={userData?.isVerifiedName || false}
              />
            )}
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-slate-100">New Conversation</h2>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setSelectedMembers([]);
                  setNewGroupName("");
                  setNewChatType("direct");
                }}
                className="text-slate-400 hover:text-slate-300 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Chat Type Toggle */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex gap-2">
                <button
                  onClick={() => setNewChatType("direct")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    newChatType === "direct"
                      ? "bg-teal-500 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Direct Message
                </button>
                <button
                  onClick={() => setNewChatType("group")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    newChatType === "group"
                      ? "bg-teal-500 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Group Chat
                </button>
              </div>
            </div>

            {/* Group Name (only for group chats) */}
            {newChatType === "group" && (
              <div className="px-4 pt-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            )}

            {/* Member Selection */}
            <div className="p-4 flex-1 overflow-y-auto">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                {newChatType === "group" ? "Add Members" : "Select Person"}
                {selectedMembers.length > 0 && (
                  <span className="ml-2 text-teal-400">({selectedMembers.length} selected)</span>
                )}
              </label>

              <div className="space-y-2">
                {communityMembers.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No friends found</p>
                ) : (
                  communityMembers.map(member => {
                    const isSelected = selectedMembers.includes(member.user_id);
                    return (
                      <button
                        key={member.id}
                        onClick={() => {
                          if (newChatType === "direct") {
                            setSelectedMembers([member.user_id]);
                          } else {
                            toggleMemberSelection(member.user_id);
                          }
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                          isSelected
                            ? "bg-teal-500/20 border border-teal-500/50"
                            : "bg-slate-800/50 border border-slate-700 hover:border-slate-600"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
                          {member.avatar}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-medium ${isSelected ? "text-teal-400" : "text-slate-100"}`}>
                            {member.display_name}
                          </p>
                          <p className="text-xs text-slate-500">{(member.specialties || []).join(", ") || member.years_experience}</p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setSelectedMembers([]);
                  setNewGroupName("");
                  setNewChatType("direct");
                }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChat}
                disabled={
                  creatingChat ||
                  selectedMembers.length === 0 ||
                  (newChatType === "group" && !newGroupName.trim())
                }
                className="flex-1 px-4 py-2.5 rounded-lg bg-teal-500 text-slate-950 font-semibold hover:bg-teal-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingChat ? "Creating..." : newChatType === "group" ? "Create Group" : "Start Chat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
