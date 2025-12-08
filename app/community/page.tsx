"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import EssenceProfileOnboarding from "@/components/community/EssenceProfileOnboarding";

// ============================================
// PREMIUM ANIMATION STYLES
// ============================================
const animationStyles = `
  /* Fade In Up Animation */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Fade In Scale Animation */
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Slide In Right Animation */
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* Slide Out Right Animation */
  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }

  /* Pulse Animation for Skeleton */
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  /* Heart Pop Animation */
  @keyframes heartPop {
    0% { transform: scale(1); }
    25% { transform: scale(1.3); }
    50% { transform: scale(0.9); }
    75% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  /* Bounce In Animation */
  @keyframes bounceIn {
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      transform: scale(1);
    }
  }

  /* Stagger Children Animation */
  .animate-fade-in-up {
    animation: fadeInUp 0.4s ease-out forwards;
  }

  .animate-fade-in-scale {
    animation: fadeInScale 0.3s ease-out forwards;
  }

  .animate-slide-in-right {
    animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .animate-bounce-in {
    animation: bounceIn 0.5s ease-out forwards;
  }

  .animate-heart-pop {
    animation: heartPop 0.4s ease-out;
  }

  /* Skeleton Shimmer */
  .skeleton-shimmer {
    background: linear-gradient(
      90deg,
      rgba(71, 85, 105, 0.1) 25%,
      rgba(71, 85, 105, 0.3) 50%,
      rgba(71, 85, 105, 0.1) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite ease-in-out;
  }

  /* Premium Transitions */
  .premium-transition {
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .premium-transition-slow {
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Premium Hover Card */
  .premium-card {
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .premium-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.4);
  }

  /* Premium Button */
  .premium-button {
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .premium-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px -2px rgba(20, 184, 166, 0.4);
  }

  .premium-button:active {
    transform: translateY(0) scale(0.98);
  }

  /* Tab Indicator */
  .tab-indicator {
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Modal Backdrop */
  .modal-backdrop {
    animation: fadeIn 0.2s ease-out forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Modal Content */
  .modal-content {
    animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes modalSlideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Staggered List Items */
  .stagger-item {
    opacity: 0;
    animation: fadeInUp 0.4s ease-out forwards;
  }

  .stagger-item:nth-child(1) { animation-delay: 0ms; }
  .stagger-item:nth-child(2) { animation-delay: 50ms; }
  .stagger-item:nth-child(3) { animation-delay: 100ms; }
  .stagger-item:nth-child(4) { animation-delay: 150ms; }
  .stagger-item:nth-child(5) { animation-delay: 200ms; }
  .stagger-item:nth-child(6) { animation-delay: 250ms; }
  .stagger-item:nth-child(7) { animation-delay: 300ms; }
  .stagger-item:nth-child(8) { animation-delay: 350ms; }
  .stagger-item:nth-child(9) { animation-delay: 400ms; }
  .stagger-item:nth-child(10) { animation-delay: 450ms; }
`;

// Types
interface CommunityProfile {
  user_id: string;
  display_name: string;
  bio: string | null;
  years_experience: string | number | null;
  specialties: string[] | null;
  strong_domains: string[] | null;
  open_to_mentoring: boolean | null;
  offer_support_in?: string[] | null;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  post_type: "general" | "win" | "question" | "insight" | "reflection";
  ecci_domains: string[];
  setting_tags: string[];
  is_edited: boolean;
  created_at: string;
  author: {
    display_name: string;
    years_experience: number | string;
    strong_domains: string[];
    open_to_mentoring: boolean;
  };
  likes_count: number;
  comments_count: number;
  liked_by_user: boolean;
  bookmarked_by_user: boolean;
}

interface Connection {
  connection_id: string;
  status: string;
  requested_at: string;
  responded_at: string | null;
  is_requester: boolean;
  user: CommunityProfile;
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

// ============================================
// SKELETON COMPONENTS
// ============================================

// Post Skeleton Loader
const PostSkeleton = () => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
    <div className="p-4 pb-0">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full skeleton-shimmer bg-slate-800 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-28 rounded skeleton-shimmer bg-slate-800" />
            <div className="h-3 w-16 rounded skeleton-shimmer bg-slate-800" />
          </div>
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full skeleton-shimmer bg-slate-800" />
            <div className="h-5 w-20 rounded-full skeleton-shimmer bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
    <div className="p-4 space-y-2">
      <div className="h-4 w-full rounded skeleton-shimmer bg-slate-800" />
      <div className="h-4 w-3/4 rounded skeleton-shimmer bg-slate-800" />
      <div className="h-4 w-5/6 rounded skeleton-shimmer bg-slate-800" />
    </div>
    <div className="px-4 pb-4 flex items-center gap-4">
      <div className="h-8 w-16 rounded-lg skeleton-shimmer bg-slate-800" />
      <div className="h-8 w-16 rounded-lg skeleton-shimmer bg-slate-800" />
      <div className="h-8 w-10 rounded-lg skeleton-shimmer bg-slate-800" />
    </div>
  </div>
);

// Member Card Skeleton
const MemberSkeleton = () => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-full skeleton-shimmer bg-slate-800 flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-32 rounded skeleton-shimmer bg-slate-800" />
          <div className="h-4 w-16 rounded-full skeleton-shimmer bg-slate-800" />
        </div>
        <div className="h-4 w-48 rounded skeleton-shimmer bg-slate-800" />
      </div>
      <div className="h-9 w-24 rounded-lg skeleton-shimmer bg-slate-800" />
    </div>
  </div>
);

// Conversation Skeleton
const ConversationSkeleton = () => (
  <div className="flex items-center gap-3 p-4 border-b border-slate-800">
    <div className="w-12 h-12 rounded-full skeleton-shimmer bg-slate-800" />
    <div className="flex-1">
      <div className="h-4 w-28 rounded skeleton-shimmer bg-slate-800 mb-2" />
      <div className="h-3 w-40 rounded skeleton-shimmer bg-slate-800" />
    </div>
  </div>
);

// Profile Card Skeleton
const ProfileCardSkeleton = () => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-14 h-14 rounded-full skeleton-shimmer bg-slate-800" />
      <div>
        <div className="h-5 w-24 rounded skeleton-shimmer bg-slate-800 mb-2" />
        <div className="h-3 w-20 rounded skeleton-shimmer bg-slate-800" />
      </div>
    </div>
    <div className="h-12 w-full rounded skeleton-shimmer bg-slate-800 mb-4" />
    <div className="grid grid-cols-3 gap-2 text-center py-3 border-t border-slate-800">
      <div className="h-10 rounded skeleton-shimmer bg-slate-800" />
      <div className="h-10 rounded skeleton-shimmer bg-slate-800" />
      <div className="h-10 rounded skeleton-shimmer bg-slate-800" />
    </div>
  </div>
);

// Post type configurations
const POST_TYPES = {
  general: { label: "Post", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", color: "slate" },
  win: { label: "Win", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", color: "amber" },
  question: { label: "Question", icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "blue" },
  insight: { label: "Insight", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", color: "violet" },
  reflection: { label: "Reflection", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", color: "rose" }
};

export default function CommunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [communityProfile, setCommunityProfile] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  // Posts Feed State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postFilter, setPostFilter] = useState<string | null>(null);

  // Connections State
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [discoverMembers, setDiscoverMembers] = useState<CommunityProfile[]>([]);

  // Conversations State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<"feed" | "connections" | "discover" | "mentors">("feed");
  const [showMessagesPanel, setShowMessagesPanel] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostType, setNewPostType] = useState<keyof typeof POST_TYPES>("general");
  const [newPostSettings, setNewPostSettings] = useState<string[]>([]);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [newMessageText, setNewMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // New Chat State
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatType, setNewChatType] = useState<"direct" | "group">("direct");
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [creatingChat, setCreatingChat] = useState(false);

  // Member Profile Modal
  const [selectedMember, setSelectedMember] = useState<CommunityProfile | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ status: string; connection_id?: string } | null>(null);

  // Animation States
  const [animatingLikes, setAnimatingLikes] = useState<Set<string>>(new Set());
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  // ============================================
  // DATA LOADING
  // ============================================

  // Load posts from API
  const loadPosts = useCallback(async () => {
    if (!userId) return;
    setLoadingPosts(true);
    try {
      const params = new URLSearchParams({ user_id: userId });
      if (postFilter) params.append("post_type", postFilter);

      const response = await fetch(`/api/community/posts?${params}`);
      const data = await response.json();

      if (response.ok && data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  }, [userId, postFilter]);

  // Load connections
  const loadConnections = useCallback(async () => {
    if (!userId) return;
    setLoadingConnections(true);
    try {
      // Load accepted connections
      const acceptedRes = await fetch(`/api/community/connections?user_id=${userId}&status=accepted`);
      const acceptedData = await acceptedRes.json();
      if (acceptedRes.ok) {
        setConnections(acceptedData.connections || []);
      }

      // Load pending requests received
      const pendingRes = await fetch(`/api/community/connections?user_id=${userId}&type=pending_received`);
      const pendingData = await pendingRes.json();
      if (pendingRes.ok) {
        setPendingRequests(pendingData.connections || []);
      }
    } catch (error) {
      console.error("Error loading connections:", error);
    } finally {
      setLoadingConnections(false);
    }
  }, [userId]);

  // Load discover members (non-connected users)
  const loadDiscoverMembers = useCallback(async () => {
    if (!userId) return;
    setLoadingDiscover(true);
    try {
      const { data: members, error } = await supabase
        .from("community_profiles")
        .select("*")
        .neq("user_id", userId)
        .limit(50);

      if (!error && members) {
        // Filter out already connected users
        const connectedUserIds = new Set(connections.map(c => c.user?.user_id).filter(Boolean));
        const pendingUserIds = new Set(pendingRequests.map(c => c.user?.user_id).filter(Boolean));

        const filtered = members.filter(m =>
          !connectedUserIds.has(m.user_id) && !pendingUserIds.has(m.user_id)
        );
        setDiscoverMembers(filtered);
      }
    } catch (error) {
      console.error("Error loading discover members:", error);
    } finally {
      setLoadingDiscover(false);
    }
  }, [userId, connections, pendingRequests]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!userId) return;
    setLoadingConversations(true);

    const { data: participations, error } = await supabase
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

    if (error || !participations) {
      setLoadingConversations(false);
      return;
    }

    const convs: Conversation[] = [];

    for (const p of participations) {
      const conv = (p as any).conversations;
      if (!conv) continue;

      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conv.id);

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
        unread_count: 0
      });
    }

    setConversations(convs);
    setLoadingConversations(false);
  }, [userId]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!error && messages) {
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

  // ============================================
  // INITIAL LOAD
  // ============================================

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }

      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      const authUserName = session.user.user_metadata?.full_name ||
                          session.user.user_metadata?.name ||
                          null;
      const emailPrefix = session.user.email?.split("@")[0] || "";
      const verifiedName = profile?.full_name || authUserName;
      const resolvedName = verifiedName || emailPrefix;

      setUserData({
        ...profile,
        full_name: resolvedName,
        email: session.user.email,
        isVerifiedName: !!verifiedName
      });

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
      // Trigger content ready animation after a brief delay
      setTimeout(() => setContentReady(true), 100);
    };
    loadUserData();
  }, [router]);

  // Load data when userId is set
  useEffect(() => {
    if (userId && hasProfile) {
      loadPosts();
      loadConnections();
      loadConversations();
    }
  }, [userId, hasProfile, loadPosts, loadConnections, loadConversations]);

  // Load discover members after connections load
  useEffect(() => {
    if (userId && hasProfile) {
      loadDiscoverMembers();
    }
  }, [userId, hasProfile, connections, loadDiscoverMembers]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation, loadMessages]);

  // ============================================
  // ACTIONS
  // ============================================

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

  // Create new post
  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !userId) return;
    setSubmittingPost(true);

    try {
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          content: newPostContent.trim(),
          post_type: newPostType,
          setting_tags: newPostSettings,
          ecci_domains: []
        })
      });

      const data = await response.json();
      if (response.ok && data.post) {
        // Optimistically add to feed
        setPosts(prev => [data.post, ...prev]);
        setNewPostContent("");
        setNewPostType("general");
        setNewPostSettings([]);
        setShowNewPostModal(false);
      } else {
        alert(data.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    } finally {
      setSubmittingPost(false);
    }
  };

  // Like/unlike post
  const handleLikePost = async (post: Post) => {
    if (!userId) return;

    // Trigger heart animation when liking
    if (!post.liked_by_user) {
      setAnimatingLikes(prev => new Set(prev).add(post.id));
      setTimeout(() => {
        setAnimatingLikes(prev => {
          const next = new Set(prev);
          next.delete(post.id);
          return next;
        });
      }, 400);
    }

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          liked_by_user: !p.liked_by_user,
          likes_count: p.liked_by_user ? p.likes_count - 1 : p.likes_count + 1
        };
      }
      return p;
    }));

    try {
      if (post.liked_by_user) {
        await fetch(`/api/community/posts/${post.id}/like?user_id=${userId}`, {
          method: "DELETE"
        });
      } else {
        await fetch(`/api/community/posts/${post.id}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId })
        });
      }
    } catch (error) {
      // Revert on error
      setPosts(prev => prev.map(p => {
        if (p.id === post.id) {
          return {
            ...p,
            liked_by_user: post.liked_by_user,
            likes_count: post.likes_count
          };
        }
        return p;
      }));
    }
  };

  // Bookmark/unbookmark post
  const handleBookmarkPost = async (post: Post) => {
    if (!userId) return;

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === post.id) {
        return { ...p, bookmarked_by_user: !p.bookmarked_by_user };
      }
      return p;
    }));

    try {
      if (post.bookmarked_by_user) {
        await fetch(`/api/community/posts/${post.id}/bookmark?user_id=${userId}`, {
          method: "DELETE"
        });
      } else {
        await fetch(`/api/community/posts/${post.id}/bookmark`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId })
        });
      }
    } catch (error) {
      // Revert on error
      setPosts(prev => prev.map(p => {
        if (p.id === post.id) {
          return { ...p, bookmarked_by_user: post.bookmarked_by_user };
        }
        return p;
      }));
    }
  };

  // Send connection request
  const handleConnect = async (targetUserId: string) => {
    if (!userId) return;

    try {
      const response = await fetch("/api/community/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requester_id: userId,
          addressee_id: targetUserId
        })
      });

      const data = await response.json();
      if (response.ok) {
        // Remove from discover and close modal
        setDiscoverMembers(prev => prev.filter(m => m.user_id !== targetUserId));
        setShowMemberModal(false);
        setSelectedMember(null);
      } else {
        alert(data.error || "Failed to send connection request");
      }
    } catch (error) {
      console.error("Error sending connection:", error);
    }
  };

  // Accept/decline connection request
  const handleConnectionAction = async (connectionId: string, action: "accept" | "decline") => {
    if (!userId) return;

    try {
      const response = await fetch("/api/community/connections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connection_id: connectionId,
          user_id: userId,
          action
        })
      });

      if (response.ok) {
        // Refresh connections
        loadConnections();
      }
    } catch (error) {
      console.error("Error handling connection:", error);
    }
  };

  // Check connection status with a user
  const checkConnectionStatus = async (targetUserId: string) => {
    if (!userId) return;

    try {
      const res = await fetch(`/api/community/connections?user_id=${userId}&status=pending`);
      const data = await res.json();

      // Check if there's an existing connection
      const existing = data.connections?.find((c: Connection) => c.user?.user_id === targetUserId);

      if (existing) {
        setConnectionStatus({ status: existing.status, connection_id: existing.connection_id });
      } else {
        // Check accepted connections
        const acceptedRes = await fetch(`/api/community/connections?user_id=${userId}&status=accepted`);
        const acceptedData = await acceptedRes.json();
        const accepted = acceptedData.connections?.find((c: Connection) => c.user?.user_id === targetUserId);

        if (accepted) {
          setConnectionStatus({ status: "accepted", connection_id: accepted.connection_id });
        } else {
          setConnectionStatus(null);
        }
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
    }
  };

  // Open member profile modal
  const openMemberProfile = (member: CommunityProfile) => {
    setSelectedMember(member);
    setShowMemberModal(true);
    checkConnectionStatus(member.user_id);
  };

  // Create chat
  const handleCreateChat = async () => {
    if (selectedMembers.length === 0) return;
    if (newChatType === "group" && !newGroupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    setCreatingChat(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

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

      const participants = [
        { conversation_id: conversation.id, user_id: session.user.id, is_admin: true },
        ...selectedMembers.map(memberId => ({
          conversation_id: conversation.id,
          user_id: memberId,
          is_admin: false
        }))
      ];

      await supabase.from("conversation_participants").insert(participants);

      setNewGroupName("");
      setSelectedMembers([]);
      setNewChatType("direct");
      setShowNewChatModal(false);
      await loadConversations();
      setSelectedConversation(conversation.id);

    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Failed to create chat");
    } finally {
      setCreatingChat(false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessageText.trim() || !selectedConversation || !userId) return;
    setSendingMessage(true);

    try {
      await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation,
          sender_id: userId,
          content: newMessageText.trim()
        });

      setNewMessageText("");
      await loadMessages(selectedConversation);
      await loadConversations();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

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

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const getPostTypeStyle = (type: keyof typeof POST_TYPES) => {
    const config = POST_TYPES[type];
    const colors: Record<string, string> = {
      slate: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      violet: "bg-violet-500/20 text-violet-400 border-violet-500/30",
      rose: "bg-rose-500/20 text-rose-400 border-rose-500/30"
    };
    return colors[config.color];
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.is_group && conv.name) return conv.name;
    return conv.participants.map(p => p.display_name).join(", ") || "New Conversation";
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.is_group) return "G";
    return conv.participants[0]?.avatar || "?";
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  // ============================================
  // RENDER LOADING
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-teal-500 animate-spin"></div>
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading Community...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Inject Premium Animation Styles */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      <NavBar />

      <div className={`container mx-auto max-w-7xl px-4 md:px-6 py-6 ${contentReady ? 'animate-fade-in-up' : 'opacity-0'}`}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Community</h1>
            <p className="text-sm text-slate-400">Connect, share, and grow with fellow interpreters</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Pending Requests Badge */}
            {pendingRequests.length > 0 && (
              <button
                onClick={() => setActiveTab("connections")}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 premium-transition hover:scale-105 active:scale-95"
              >
                <span className="font-semibold">{pendingRequests.length}</span>
                <span className="text-sm">pending</span>
              </button>
            )}

            {/* Messages Button */}
            <button
              onClick={() => setShowMessagesPanel(true)}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 premium-transition hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-teal-500 text-slate-950 text-xs font-bold flex items-center justify-center animate-bounce-in">
                  {totalUnread}
                </span>
              )}
            </button>

            {/* New Post Button */}
            <button
              onClick={() => {
                if (!hasProfile) {
                  setShowOnboarding(true);
                } else {
                  setShowNewPostModal(true);
                }
              }}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white font-semibold premium-button"
            >
              + New Post
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 p-1 bg-slate-900/50 rounded-xl border border-slate-800 w-fit">
          {[
            { id: "feed", label: "Feed", count: null },
            { id: "connections", label: "Friends", count: connections.length },
            { id: "discover", label: "Discover", count: discoverMembers.length },
            { id: "mentors", label: "Mentors", count: [...connections.filter(c => c.user?.open_to_mentoring), ...discoverMembers.filter(m => m.open_to_mentoring)].length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium premium-transition ${
                activeTab === tab.id
                  ? "bg-slate-800 text-slate-100 shadow-lg"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`ml-2 text-xs premium-transition ${activeTab === tab.id ? 'text-teal-400' : 'text-slate-500'}`}>
                  ({tab.count})
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-teal-500 rounded-full tab-indicator" />
              )}
            </button>
          ))}
        </div>

        {/* Main Layout */}
        <div className="flex gap-6">
          {/* Left Sidebar - Profile */}
          <div className="w-72 flex-shrink-0 hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {hasProfile ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 premium-card hover:border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center text-lg font-bold text-white premium-transition hover:scale-105 cursor-pointer shadow-lg shadow-teal-500/20">
                      {getInitials(communityProfile?.display_name || userData?.full_name || "?")}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100">{communityProfile?.display_name}</p>
                      <p className="text-xs text-slate-400">{communityProfile?.years_experience}</p>
                    </div>
                  </div>

                  {communityProfile?.bio && (
                    <p className="text-sm text-slate-300 mb-4">{communityProfile.bio}</p>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-center py-3 border-t border-slate-800">
                    <div className="premium-transition hover:scale-105 cursor-default">
                      <p className="text-lg font-bold text-teal-400">{connections.length}</p>
                      <p className="text-xs text-slate-500">Friends</p>
                    </div>
                    <div className="premium-transition hover:scale-105 cursor-default">
                      <p className="text-lg font-bold text-violet-400">{posts.filter(p => p.user_id === userId).length}</p>
                      <p className="text-xs text-slate-500">Posts</p>
                    </div>
                    <div className="premium-transition hover:scale-105 cursor-default">
                      <p className="text-lg font-bold text-emerald-400">{conversations.length}</p>
                      <p className="text-xs text-slate-500">Chats</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-4 premium-card hover:border-violet-500/50">
                  <h3 className="font-semibold text-slate-100 mb-2">Join the Community</h3>
                  <p className="text-sm text-slate-400 mb-4">Create your profile to connect with peers.</p>
                  <button
                    onClick={() => setShowOnboarding(true)}
                    className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-violet-500 text-white font-semibold premium-button"
                  >
                    Get Started
                  </button>
                </div>
              )}

              {/* Post Type Filters */}
              {activeTab === "feed" && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 premium-card hover:border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">FILTER BY TYPE</h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => setPostFilter(null)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm premium-transition ${
                        !postFilter ? "bg-slate-800 text-slate-100 shadow-md" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
                      }`}
                    >
                      All Posts
                    </button>
                    {Object.entries(POST_TYPES).map(([type, config]) => (
                      <button
                        key={type}
                        onClick={() => setPostFilter(type)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm premium-transition ${
                          postFilter === type ? "bg-slate-800 text-slate-100 shadow-md" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
                        }`}
                      >
                        <svg className={`w-4 h-4 premium-transition ${postFilter === type ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                        </svg>
                        {config.label}s
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-2xl">
            {/* FEED TAB */}
            {activeTab === "feed" && (
              <div className="space-y-4">
                {/* Quick Post Composer */}
                {hasProfile && (
                  <div
                    onClick={() => setShowNewPostModal(true)}
                    className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 cursor-pointer premium-card hover:border-slate-700 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white premium-transition group-hover:scale-105 shadow-lg shadow-teal-500/20">
                        {getInitials(communityProfile?.display_name || "?")}
                      </div>
                      <div className="flex-1 px-4 py-2 rounded-full bg-slate-800 text-slate-500 text-sm premium-transition group-hover:bg-slate-700 group-hover:text-slate-400">
                        Share a win, ask a question, or post an insight...
                      </div>
                    </div>
                  </div>
                )}

                {/* Posts */}
                {loadingPosts ? (
                  <div className="space-y-4">
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center animate-fade-in-up">
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">No posts yet</h3>
                    <p className="text-slate-400 mb-4">Be the first to share something with the community!</p>
                    <button
                      onClick={() => setShowNewPostModal(true)}
                      className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium premium-button"
                    >
                      Create First Post
                    </button>
                  </div>
                ) : (
                  posts.map((post, index) => (
                    <div
                      key={post.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden premium-card hover:border-slate-700 stagger-item"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Post Header */}
                      <div className="p-4 pb-0">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 premium-transition hover:scale-110 cursor-pointer shadow-md">
                            {getInitials(post.author.display_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-slate-100 hover:text-teal-400 premium-transition cursor-pointer">{post.author.display_name}</span>
                              {post.author.open_to_mentoring && (
                                <span className="px-1.5 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 premium-transition hover:bg-amber-500/30">Mentor</span>
                              )}
                              <span className="text-slate-500 text-sm">·</span>
                              <span className="text-slate-500 text-sm">{formatTime(post.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs border premium-transition hover:scale-105 ${getPostTypeStyle(post.post_type)}`}>
                                {POST_TYPES[post.post_type].label}
                              </span>
                              {post.setting_tags.slice(0, 2).map(tag => (
                                <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400 premium-transition hover:bg-slate-700">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="p-4">
                        <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                      </div>

                      {/* Post Actions */}
                      <div className="px-4 pb-4 flex items-center gap-3">
                        <button
                          onClick={() => handleLikePost(post)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg premium-transition hover:scale-105 active:scale-95 ${
                            post.liked_by_user
                              ? "bg-rose-500/20 text-rose-400 shadow-md shadow-rose-500/10"
                              : "bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          }`}
                        >
                          <svg
                            className={`w-4 h-4 premium-transition ${animatingLikes.has(post.id) ? 'animate-heart-pop' : ''}`}
                            fill={post.liked_by_user ? "currentColor" : "none"}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span className="text-sm font-medium">{post.likes_count || ""}</span>
                        </button>

                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 premium-transition hover:scale-105 active:scale-95">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="text-sm font-medium">{post.comments_count || ""}</span>
                        </button>

                        <button
                          onClick={() => handleBookmarkPost(post)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg premium-transition hover:scale-105 active:scale-95 ${
                            post.bookmarked_by_user
                              ? "bg-amber-500/20 text-amber-400 shadow-md shadow-amber-500/10"
                              : "bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                          }`}
                        >
                          <svg className="w-4 h-4" fill={post.bookmarked_by_user ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>

                        {/* Share button */}
                        <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 premium-transition hover:scale-105 active:scale-95">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* CONNECTIONS TAB */}
            {activeTab === "connections" && (
              <div className="space-y-4">
                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 animate-fade-in-up">
                    <h3 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      Pending Requests ({pendingRequests.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingRequests.map((req, index) => (
                        <div
                          key={req.connection_id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 premium-card hover:bg-slate-900 stagger-item"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-sm font-bold text-white premium-transition hover:scale-105 shadow-md">
                            {getInitials(req.user?.display_name || "?")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-100">{req.user?.display_name}</p>
                            <p className="text-xs text-slate-500">{req.user?.years_experience}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleConnectionAction(req.connection_id, "accept")}
                              className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 text-sm font-medium premium-button"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleConnectionAction(req.connection_id, "decline")}
                              className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium premium-transition hover:bg-slate-600 active:scale-95"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connected Friends */}
                {loadingConnections ? (
                  <div className="grid gap-3">
                    <MemberSkeleton />
                    <MemberSkeleton />
                    <MemberSkeleton />
                  </div>
                ) : connections.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center animate-fade-in-up">
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">No friends yet</h3>
                    <p className="text-slate-400 mb-4">Discover and connect with other interpreters!</p>
                    <button
                      onClick={() => setActiveTab("discover")}
                      className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium premium-button"
                    >
                      Discover Members
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {connections.map((conn, index) => (
                      <div
                        key={conn.connection_id}
                        onClick={() => openMemberProfile(conn.user)}
                        className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 cursor-pointer premium-card hover:border-slate-700 group stagger-item"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-lg font-bold text-white flex-shrink-0 premium-transition group-hover:scale-105 shadow-lg shadow-teal-500/20">
                            {getInitials(conn.user?.display_name || "?")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-100 group-hover:text-teal-400 premium-transition">{conn.user?.display_name}</h4>
                              {conn.user?.open_to_mentoring && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs">Mentor</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400">
                              {conn.user?.years_experience}
                              {conn.user?.specialties?.length ? ` · ${conn.user.specialties.slice(0, 2).join(", ")}` : ""}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMembers([conn.user.user_id]);
                              setShowNewChatModal(true);
                            }}
                            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium premium-transition hover:bg-teal-500 hover:text-slate-950 active:scale-95"
                          >
                            Message
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DISCOVER TAB */}
            {activeTab === "discover" && (
              <div className="space-y-4">
                {loadingDiscover ? (
                  <div className="grid gap-3">
                    <MemberSkeleton />
                    <MemberSkeleton />
                    <MemberSkeleton />
                    <MemberSkeleton />
                  </div>
                ) : discoverMembers.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center animate-fade-in-up">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">Everyone's connected!</h3>
                    <p className="text-slate-400">You've connected with all community members.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {discoverMembers.map((member, index) => (
                      <div
                        key={member.user_id}
                        onClick={() => openMemberProfile(member)}
                        className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 cursor-pointer premium-card hover:border-slate-700 group stagger-item"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-lg font-bold text-white flex-shrink-0 premium-transition group-hover:scale-105 shadow-lg shadow-violet-500/20">
                            {getInitials(member.display_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-100 group-hover:text-violet-400 premium-transition">{member.display_name}</h4>
                              {member.open_to_mentoring && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs">Mentor</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400">
                              {member.years_experience}
                              {member.specialties?.length ? ` · ${member.specialties.slice(0, 2).join(", ")}` : ""}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConnect(member.user_id);
                            }}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-violet-500 text-white text-sm font-medium premium-button"
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MENTORS TAB */}
            {activeTab === "mentors" && (
              <div className="space-y-4">
                {/* Intro */}
                <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5 p-4 animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <h3 className="font-semibold text-slate-100">Available Mentors</h3>
                  </div>
                  <p className="text-sm text-slate-400">
                    These interpreters have indicated they're open to mentoring. Reach out to learn from their experience!
                  </p>
                </div>

                {/* Mentor List */}
                {(() => {
                  const mentors = [
                    ...connections.filter(c => c.user?.open_to_mentoring).map(c => ({ ...c.user, isConnected: true })),
                    ...discoverMembers.filter(m => m.open_to_mentoring).map(m => ({ ...m, isConnected: false }))
                  ];

                  return mentors.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center animate-fade-in-up">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center opacity-50">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-100 mb-2">No mentors available yet</h3>
                      <p className="text-slate-400">Check back soon as more interpreters join the community!</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {mentors.map((mentor: any, index: number) => (
                        <div
                          key={mentor.user_id}
                          className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5 overflow-hidden premium-card hover:border-amber-500/50 stagger-item group"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                            <span className="text-xs font-medium text-amber-400">Available Mentor</span>
                            {mentor.isConnected && (
                              <span className="ml-auto text-xs text-teal-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Connected
                              </span>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-lg font-bold text-white flex-shrink-0 premium-transition group-hover:scale-105 shadow-lg shadow-amber-500/20">
                                {getInitials(mentor.display_name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-100 mb-1 group-hover:text-amber-400 premium-transition">{mentor.display_name}</h4>
                                <p className="text-sm text-slate-400 mb-2">
                                  {mentor.years_experience}
                                  {mentor.specialties?.length ? ` · ${mentor.specialties.join(", ")}` : ""}
                                </p>
                                {mentor.bio && (
                                  <p className="text-sm text-slate-300 mb-3 line-clamp-2">{mentor.bio}</p>
                                )}
                                <button
                                  onClick={() => {
                                    if (mentor.isConnected) {
                                      setSelectedMembers([mentor.user_id]);
                                      setShowNewChatModal(true);
                                    } else {
                                      handleConnect(mentor.user_id);
                                    }
                                  }}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium premium-button ${
                                    mentor.isConnected
                                      ? "bg-teal-500 text-slate-950"
                                      : "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                                  }`}
                                >
                                  {mentor.isConnected ? "Message" : "Connect"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-72 flex-shrink-0 hidden xl:block">
            <div className="sticky top-24 space-y-4">
              {/* Community Guidelines */}
              <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-4 premium-card hover:border-violet-500/50">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-violet-400">Community Guidelines</h4>
                </div>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2 premium-transition hover:translate-x-1">
                    <span className="text-violet-400 mt-0.5">·</span>
                    <span><span className="text-slate-100 font-medium">Respect confidentiality</span> - Never share client info</span>
                  </li>
                  <li className="flex items-start gap-2 premium-transition hover:translate-x-1">
                    <span className="text-violet-400 mt-0.5">·</span>
                    <span><span className="text-slate-100 font-medium">Support each other</span> - We all have hard days</span>
                  </li>
                  <li className="flex items-start gap-2 premium-transition hover:translate-x-1">
                    <span className="text-violet-400 mt-0.5">·</span>
                    <span><span className="text-slate-100 font-medium">Be constructive</span> - Offer help, not judgment</span>
                  </li>
                </ul>
              </div>

              {/* Recent Chats */}
              {conversations.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 premium-card hover:border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">RECENT CHATS</h4>
                  <div className="space-y-2">
                    {conversations.slice(0, 3).map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv.id);
                          setShowMessagesPanel(true);
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 premium-transition group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white premium-transition group-hover:scale-105">
                          {getConversationAvatar(conv)}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-sm text-slate-300 truncate block group-hover:text-teal-400 premium-transition">{getConversationName(conv)}</span>
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
        </div>
      </div>

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content shadow-2xl shadow-black/50">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-100">Create Post</h2>
                <button
                  onClick={() => setShowNewPostModal(false)}
                  className="text-slate-400 hover:text-slate-300 text-2xl premium-transition hover:rotate-90 hover:scale-110"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Post Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">What type of post?</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(POST_TYPES).map(([type, config]) => (
                    <button
                      key={type}
                      onClick={() => setNewPostType(type as keyof typeof POST_TYPES)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border premium-transition hover:scale-105 active:scale-95 ${
                        newPostType === type
                          ? `${getPostTypeStyle(type as keyof typeof POST_TYPES)} border-current shadow-md`
                          : "border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      <svg className={`w-4 h-4 premium-transition ${newPostType === type ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                      </svg>
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={
                    newPostType === "win" ? "Share your recent success..." :
                    newPostType === "question" ? "What would you like to ask the community?" :
                    newPostType === "insight" ? "Share an insight or lesson learned..." :
                    newPostType === "reflection" ? "What's on your mind?" :
                    "Share something with the community..."
                  }
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 resize-none premium-transition"
                />
                <div className="flex justify-between mt-2">
                  <span className={`text-xs premium-transition ${newPostContent.length > 1800 ? 'text-amber-400' : newPostContent.length > 1950 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {newPostContent.length}/2000
                  </span>
                </div>
              </div>

              {/* Settings Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Related settings (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {["Medical", "Legal", "Educational", "Mental Health", "VRS", "Community"].map(setting => (
                    <button
                      key={setting}
                      onClick={() => {
                        if (newPostSettings.includes(setting)) {
                          setNewPostSettings(prev => prev.filter(s => s !== setting));
                        } else {
                          setNewPostSettings(prev => [...prev, setting]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm premium-transition hover:scale-105 active:scale-95 ${
                        newPostSettings.includes(setting)
                          ? "bg-teal-500/20 text-teal-400 border border-teal-500/30 shadow-md"
                          : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-300"
                      }`}
                    >
                      {setting}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setShowNewPostModal(false)}
                className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 premium-transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || submittingPost}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold premium-button disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submittingPost ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Posting...
                  </span>
                ) : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Profile Modal */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full modal-content shadow-2xl shadow-black/50">
            <div className="p-6 text-center border-b border-slate-800">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 shadow-xl shadow-teal-500/30 premium-transition hover:scale-105">
                {getInitials(selectedMember.display_name)}
              </div>
              <h2 className="text-xl font-bold text-slate-100">{selectedMember.display_name}</h2>
              <p className="text-slate-400">{selectedMember.years_experience}</p>
              {selectedMember.open_to_mentoring && (
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm animate-fade-in-up">
                  Open to Mentoring
                </span>
              )}
            </div>

            <div className="p-6 space-y-4">
              {selectedMember.bio && (
                <div className="animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                  <h4 className="text-sm font-medium text-slate-400 mb-1">About</h4>
                  <p className="text-slate-200">{selectedMember.bio}</p>
                </div>
              )}

              {selectedMember.specialties && selectedMember.specialties.length > 0 && (
                <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.specialties.map(s => (
                      <span key={s} className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-sm premium-transition hover:bg-slate-700 hover:scale-105">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedMember.strong_domains && selectedMember.strong_domains.length > 0 && (
                <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Strengths</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.strong_domains.map(d => (
                      <span key={d} className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-sm premium-transition hover:bg-teal-500/30 hover:scale-105">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => {
                  setShowMemberModal(false);
                  setSelectedMember(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 premium-transition active:scale-95"
              >
                Close
              </button>
              {connectionStatus?.status === "accepted" ? (
                <button
                  onClick={() => {
                    setSelectedMembers([selectedMember.user_id]);
                    setShowMemberModal(false);
                    setShowNewChatModal(true);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-semibold premium-button"
                >
                  Message
                </button>
              ) : connectionStatus?.status === "pending" ? (
                <button
                  disabled
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 text-slate-400 font-semibold cursor-not-allowed"
                >
                  Request Pending
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(selectedMember.user_id)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-violet-500 text-white font-semibold premium-button"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Panel */}
      {showMessagesPanel && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 modal-backdrop"
            onClick={() => {
              setShowMessagesPanel(false);
              setSelectedConversation(null);
            }}
          />

          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-slate-100">Messages</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 text-sm font-medium premium-button"
                >
                  + New
                </button>
                <button
                  onClick={() => {
                    setShowMessagesPanel(false);
                    setSelectedConversation(null);
                  }}
                  className="text-slate-400 hover:text-slate-300 text-2xl premium-transition hover:rotate-90 hover:scale-110"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {!selectedConversation ? (
                <div className="flex-1 overflow-y-auto">
                  {loadingConversations ? (
                    <div>
                      <ConversationSkeleton />
                      <ConversationSkeleton />
                      <ConversationSkeleton />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-8 text-center animate-fade-in-up">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center opacity-50">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-slate-400 mb-4">No conversations yet</p>
                      <button
                        onClick={() => setShowNewChatModal(true)}
                        className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium premium-button"
                      >
                        Start a Conversation
                      </button>
                    </div>
                  ) : (
                    conversations.map((conv, index) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/50 premium-transition border-b border-slate-800 group stagger-item"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white premium-transition group-hover:scale-105">
                          {getConversationAvatar(conv)}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-slate-100 truncate group-hover:text-teal-400 premium-transition">{getConversationName(conv)}</span>
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
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-3 p-4 border-b border-slate-800">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="text-slate-400 hover:text-slate-300 premium-transition hover:-translate-x-1"
                    >
                      ←
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white shadow-md">
                      {getConversationAvatar(conversations.find(c => c.id === selectedConversation)!)}
                    </div>
                    <span className="font-medium text-slate-100">
                      {getConversationName(conversations.find(c => c.id === selectedConversation)!)}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {currentMessages.length === 0 ? (
                      <div className="text-center py-8 animate-fade-in-up">
                        <p className="text-slate-500">No messages yet. Say hello!</p>
                      </div>
                    ) : (
                      currentMessages.map((msg, index) => (
                        <div
                          key={msg.id}
                          className={`flex stagger-item ${msg.sender_name === "You" ? "justify-end" : "justify-start"}`}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2 premium-transition hover:scale-[1.02] ${
                            msg.sender_name === "You"
                              ? "bg-gradient-to-r from-teal-500 to-teal-400 text-slate-950 shadow-lg shadow-teal-500/20"
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
                        className="flex-1 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 premium-transition"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessageText.trim() || sendingMessage}
                        className="px-4 py-2 rounded-full bg-teal-500 text-slate-950 font-medium premium-button disabled:opacity-50 disabled:transform-none"
                      >
                        {sendingMessage ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : "Send"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 modal-content shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-100">Create Your Community Profile</h2>
              <button
                onClick={() => setShowOnboarding(false)}
                className="text-slate-400 hover:text-slate-300 text-2xl premium-transition hover:rotate-90 hover:scale-110"
                disabled={onboardingLoading}
              >
                ×
              </button>
            </div>
            {onboardingLoading ? (
              <div className="py-12 text-center animate-fade-in-up">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-teal-500 animate-spin"></div>
                </div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 modal-backdrop">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col modal-content shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-slate-100">New Conversation</h2>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setSelectedMembers([]);
                  setNewGroupName("");
                  setNewChatType("direct");
                }}
                className="text-slate-400 hover:text-slate-300 text-2xl premium-transition hover:rotate-90 hover:scale-110"
              >
                ×
              </button>
            </div>

            <div className="p-4 border-b border-slate-800">
              <div className="flex gap-2">
                <button
                  onClick={() => setNewChatType("direct")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium premium-transition ${
                    newChatType === "direct"
                      ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Direct Message
                </button>
                <button
                  onClick={() => setNewChatType("group")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium premium-transition ${
                    newChatType === "group"
                      ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Group Chat
                </button>
              </div>
            </div>

            {newChatType === "group" && (
              <div className="px-4 pt-4 animate-fade-in-up">
                <label className="block text-sm font-medium text-slate-300 mb-2">Group Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 premium-transition"
                />
              </div>
            )}

            <div className="p-4 flex-1 overflow-y-auto">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                {newChatType === "group" ? "Add Members" : "Select Person"}
                {selectedMembers.length > 0 && (
                  <span className="ml-2 text-teal-400 animate-fade-in-up">({selectedMembers.length} selected)</span>
                )}
              </label>

              <div className="space-y-2">
                {connections.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4 animate-fade-in-up">Connect with others first to message them</p>
                ) : (
                  connections.map((conn, index) => {
                    const isSelected = selectedMembers.includes(conn.user.user_id);
                    return (
                      <button
                        key={conn.connection_id}
                        onClick={() => {
                          if (newChatType === "direct") {
                            setSelectedMembers([conn.user.user_id]);
                          } else {
                            if (isSelected) {
                              setSelectedMembers(prev => prev.filter(id => id !== conn.user.user_id));
                            } else {
                              setSelectedMembers(prev => [...prev, conn.user.user_id]);
                            }
                          }
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg premium-transition stagger-item hover:scale-[1.02] ${
                          isSelected
                            ? "bg-teal-500/20 border border-teal-500/50 shadow-md shadow-teal-500/10"
                            : "bg-slate-800/50 border border-slate-700 hover:border-slate-600"
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white premium-transition ${isSelected ? 'scale-105' : ''}`}>
                          {getInitials(conn.user.display_name)}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-medium premium-transition ${isSelected ? "text-teal-400" : "text-slate-100"}`}>
                            {conn.user.display_name}
                          </p>
                          <p className="text-xs text-slate-500">{conn.user.years_experience}</p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center animate-bounce-in">
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

            <div className="p-4 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setSelectedMembers([]);
                  setNewGroupName("");
                  setNewChatType("direct");
                }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 premium-transition active:scale-95"
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
                className="flex-1 px-4 py-2.5 rounded-lg bg-teal-500 text-slate-950 font-semibold premium-button disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {creatingChat ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </span>
                ) : newChatType === "group" ? "Create Group" : "Start Chat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
