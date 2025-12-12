"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import EssenceProfileOnboarding from "@/components/community/EssenceProfileOnboarding";
import CommentThread from "@/components/community/CommentThread";
import FilterChips from "@/components/community/FilterChips";
import GuidelinesModal from "@/components/community/GuidelinesModal";
import { communityStorage } from "@/lib/communityStorage";

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
  avatar_url?: string | null;
}

// Reaction types mapped to post types for story-telling reactions
type ReactionType = "celebration" | "thinking" | "fire" | "solidarity";

interface PostReactions {
  celebration_count: number;
  thinking_count: number;
  fire_count: number;
  solidarity_count: number;
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
  image_url?: string;
  author: {
    display_name: string;
    years_experience: number | string;
    strong_domains: string[];
    open_to_mentoring: boolean;
    avatar_url?: string | null;
  };
  likes_count: number;
  comments_count: number;
  liked_by_user: boolean;
  bookmarked_by_user: boolean;
  // Story-telling reactions
  reactions: PostReactions;
  user_reactions: ReactionType[];
}

interface Connection {
  connection_id: string;
  status: string;
  requested_at: string;
  responded_at: string | null;
  is_requester: boolean;
  user: CommunityProfile;
}

interface Assignment {
  id: string;
  title: string;
  date: string;
  time: string;
  setting: string;
  location_type: string;
  assignment_type: string;
}

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at: string | null;
  participants: { user_id: string | null; display_name: string; avatar: string; is_mentor?: boolean }[];
  last_message?: { content: string; created_at: string | null; sender_name: string };
  unread_count: number;
  conversation_type?: 'personal' | 'mentoring' | 'teaming';
  assignment_id?: string | null;
  assignment?: Assignment | null;
}

// Chat label types and colors
type ChatLabel = 'assignment' | 'group' | 'mentor' | 'personal';
const chatLabelConfig: Record<ChatLabel, { text: string; bgColor: string; textColor: string }> = {
  assignment: { text: 'Assignment', bgColor: 'bg-orange-500/20', textColor: 'text-orange-400' },
  group: { text: 'Group Chat', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400' },
  mentor: { text: 'Mentor', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400' },
  personal: { text: 'Personal', bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-400' },
};

interface Message {
  id: string;
  content: string;
  sender_id: string | null;
  sender_name: string;
  created_at: string | null;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  is_edited: boolean;
  created_at: string;
  author: {
    display_name: string;
    years_experience: string | number | null;
    avatar_url?: string | null;
  };
  likes_count: number;
  liked_by_user: boolean;
  replies?: Comment[];
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
  const [feedSort, setFeedSort] = useState<"recent" | "top" | "following" | "trending">("recent");
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [showFriendsFeed, setShowFriendsFeed] = useState(false);
  const [showSavedPosts, setShowSavedPosts] = useState(false);
  const [friendsFeedLastViewed, setFriendsFeedLastViewed] = useState<string | null>(null);
  const [hasUnreadFriendsPosts, setHasUnreadFriendsPosts] = useState(false);

  // Connections State
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]); // User IDs of sent pending requests
  const [discoverMembers, setDiscoverMembers] = useState<CommunityProfile[]>([]);

  // Conversations State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<"feed" | "connections" | "discover" | "mentors">("feed");
  const [showMessagesPanel, setShowMessagesPanel] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationSearch, setConversationSearch] = useState("");
  const [conversationFilter, setConversationFilter] = useState<'all' | 'teaming' | 'personal' | 'mentoring'>('all');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialize sidebar state from localStorage on mount (client-side only)
  useEffect(() => {
    const savedState = communityStorage.getSidebarCollapsed();
    setSidebarCollapsed(savedState);
  }, []);

  // Handler to toggle and persist sidebar state
  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => {
      const newState = !prev;
      communityStorage.setSidebarCollapsed(newState);
      return newState;
    });
  }, []);

  // Guidelines Modal State
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [hasAcknowledgedGuidelines, setHasAcknowledgedGuidelines] = useState(false);

  // Check guidelines acknowledgment on mount
  useEffect(() => {
    if (userId) {
      const acknowledged = communityStorage.hasAcknowledgedGuidelines(userId);
      setHasAcknowledgedGuidelines(acknowledged);
    }
  }, [userId]);

  // Handler to open new post modal (checks guidelines first)
  const handleOpenNewPostModal = useCallback(() => {
    if (!userId) return;

    if (!hasAcknowledgedGuidelines) {
      setShowGuidelinesModal(true);
    } else {
      setShowNewPostModal(true);
    }
  }, [userId, hasAcknowledgedGuidelines]);

  // Handler when user acknowledges guidelines
  const handleAcknowledgeGuidelines = useCallback(() => {
    if (userId) {
      communityStorage.acknowledgeGuidelines(userId);
      setHasAcknowledgedGuidelines(true);
      setShowNewPostModal(true);
    }
  }, [userId]);

  const [newPostContent, setNewPostContent] = useState("");
  const [newPostType, setNewPostType] = useState<keyof typeof POST_TYPES>("general");
  const [newPostSettings, setNewPostSettings] = useState<string[]>([]);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
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

  // Delete Post Confirmation Modal
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deletingPost, setDeletingPost] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Edit Post Modal
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Report Content Modal
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState<string>("");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{ status: string; connection_id?: string } | null>(null);

  // Animation States
  const [animatingLikes, setAnimatingLikes] = useState<Set<string>>(new Set());
  const [animatingReactions, setAnimatingReactions] = useState<Set<string>>(new Set());
  const [openReactionPicker, setOpenReactionPicker] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [loadingDiscover, setLoadingDiscover] = useState(false);

  // Search State
  const [discoverSearch, setDiscoverSearch] = useState("");
  const [mentorSearch, setMentorSearch] = useState("");
  const [mentorSpecialtyFilter, setMentorSpecialtyFilter] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [feedSearch, setFeedSearch] = useState("");
  const feedSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Comments Modal State
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Avatar Upload State
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // DATA LOADING
  // ============================================

  // Load posts from API
  const loadPosts = useCallback(async () => {
    if (!userId) return;
    setLoadingPosts(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams({ user_id: userId });
      if (postFilter) params.append("post_type", postFilter);

      // Add sort parameter
      params.append("sort", feedSort);

      // Add search parameter
      if (feedSearch.trim()) {
        params.append("search", feedSearch.trim());
      }

      if (showMyPosts) {
        params.append("author_id", userId);
      } else if (showFriendsFeed && connections.length > 0) {
        // Get all friend IDs from connections
        const friendIds = connections.map(c => c.user?.user_id).filter(Boolean);
        if (friendIds.length > 0) {
          params.append("author_ids", friendIds.join(","));
        }
      } else if (feedSort === "following" && connections.length > 0) {
        // For "following" sort, filter by friend IDs
        const friendIds = connections.map(c => c.user?.user_id).filter(Boolean);
        if (friendIds.length > 0) {
          params.append("author_ids", friendIds.join(","));
        }
      }

      const response = await fetch(`/api/community/posts?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await response.json();

      if (response.ok && data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  }, [userId, postFilter, feedSort, feedSearch, showMyPosts, showFriendsFeed, connections]);

  // Debounced search handler for feed
  const handleFeedSearchChange = useCallback((value: string) => {
    setFeedSearch(value);

    // Clear any existing timeout
    if (feedSearchTimeoutRef.current) {
      clearTimeout(feedSearchTimeoutRef.current);
    }

    // Set a new timeout to trigger search after 400ms of no typing
    feedSearchTimeoutRef.current = setTimeout(() => {
      // loadPosts will be called automatically by the useEffect watching feedSearch
    }, 400);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (feedSearchTimeoutRef.current) {
        clearTimeout(feedSearchTimeoutRef.current);
      }
    };
  }, []);

  // Load connections
  const loadConnections = useCallback(async () => {
    if (!userId) return;
    setLoadingConnections(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = { Authorization: `Bearer ${session.access_token}` };

      // Load accepted connections
      const acceptedRes = await fetch(`/api/community/connections?user_id=${userId}&status=accepted`, { headers });
      const acceptedData = await acceptedRes.json();
      if (acceptedRes.ok) {
        setConnections(acceptedData.connections || []);
      }

      // Load pending requests received
      const pendingRes = await fetch(`/api/community/connections?user_id=${userId}&type=pending_received`, { headers });
      const pendingData = await pendingRes.json();
      if (pendingRes.ok) {
        setPendingRequests(pendingData.connections || []);
      }

      // Load pending requests sent (to show "Pending" status in discover)
      const sentRes = await fetch(`/api/community/connections?user_id=${userId}&type=pending_sent`, { headers });
      const sentData = await sentRes.json();
      if (sentRes.ok) {
        // Extract addressee_ids from sent requests
        const sentUserIds = (sentData.connections || []).map((c: any) => c.user?.user_id).filter(Boolean);
        setSentRequests(sentUserIds);
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

  // Load conversations - OPTIMIZED: batch queries instead of N+1
  const loadConversations = useCallback(async () => {
    if (!userId) return;
    setLoadingConversations(true);

    // Step 1: Get all conversations for this user with participants in ONE query
    const { data: participations, error } = await supabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        last_read_at,
        conversations (
          id,
          name,
          is_group,
          created_at,
          assignment_id,
          conversation_type
        )
      `)
      .eq("user_id", userId);

    if (error || !participations) {
      setLoadingConversations(false);
      return;
    }

    const convIds = participations.map(p => (p as any).conversations?.id).filter(Boolean);
    if (convIds.length === 0) {
      setConversations([]);
      setLoadingConversations(false);
      return;
    }

    // Step 2: Get ALL participants for ALL conversations in ONE query
    const { data: allParticipants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds);

    // Step 3: Get unique user IDs and fetch ALL profiles in ONE query (include open_to_mentoring for mentor detection)
    const uniqueUserIds = [...new Set((allParticipants || []).map(p => p.user_id).filter((id): id is string => id !== null))];
    const { data: allProfiles } = await supabase
      .from("community_profiles")
      .select("user_id, display_name, open_to_mentoring")
      .in("user_id", uniqueUserIds);

    // Create a lookup map for profiles (includes mentor status)
    const profileMap = new Map<string, { display_name: string; is_mentor: boolean }>();
    (allProfiles || []).forEach(p => {
      if (p.user_id) profileMap.set(p.user_id, {
        display_name: p.display_name || "Unknown",
        is_mentor: p.open_to_mentoring === true
      });
    });

    // Step 4: Get last messages for ALL conversations in ONE query using a subquery approach
    // We'll get recent messages and pick the latest per conversation
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("conversation_id, content, created_at, sender_id")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false })
      .limit(convIds.length * 2); // Get enough to cover all convos

    // Build last message map (first occurrence per conversation_id is the latest)
    const lastMessageMap = new Map<string, { content: string | null; created_at: string | null; sender_id: string | null }>();
    (recentMessages || []).forEach(msg => {
      if (msg.conversation_id && !lastMessageMap.has(msg.conversation_id)) {
        lastMessageMap.set(msg.conversation_id, msg);
      }
    });

    // Step 5: Build conversations array (no more database calls!)
    const convs: Conversation[] = [];

    for (const p of participations) {
      const conv = (p as any).conversations;
      if (!conv) continue;

      const lastReadAt = (p as any).last_read_at;

      // Get participants for this conversation from our batch data
      const convParticipants = (allParticipants || []).filter(ap => ap.conversation_id === conv.id);
      const participantList: { user_id: string | null; display_name: string; avatar: string; is_mentor?: boolean }[] = [];
      let hasMentor = false;

      for (const part of convParticipants) {
        if (!part.user_id || part.user_id === userId) continue;
        const profile = profileMap.get(part.user_id);
        const name = profile?.display_name || "Unknown";
        const isMentor = profile?.is_mentor || false;
        if (isMentor) hasMentor = true;
        participantList.push({
          user_id: part.user_id,
          display_name: name,
          avatar: name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
          is_mentor: isMentor
        });
      }

      const lastMsg = lastMessageMap.get(conv.id);

      // Count unread messages
      let unreadCount = 0;
      if (lastMsg && lastMsg.sender_id !== userId && lastMsg.created_at) {
        if (!lastReadAt || new Date(lastMsg.created_at) > new Date(lastReadAt)) {
          unreadCount = 1;
        }
      }

      // Determine conversation type:
      // 1. Use the stored conversation_type from the database (if set)
      // 2. If has assignment -> teaming (work)
      // 3. If participant is a mentor (open_to_mentoring) -> mentoring
      // 4. Otherwise -> personal
      let conversationType: 'personal' | 'mentoring' | 'teaming' = 'personal';
      if (conv.conversation_type && ['personal', 'mentoring', 'teaming'].includes(conv.conversation_type)) {
        conversationType = conv.conversation_type as 'personal' | 'mentoring' | 'teaming';
      } else if (conv.assignment_id) {
        conversationType = 'teaming';
      } else if (hasMentor && !conv.is_group) {
        conversationType = 'mentoring';
      }

      convs.push({
        id: conv.id,
        name: conv.name,
        is_group: conv.is_group,
        created_at: conv.created_at,
        participants: participantList,
        last_message: lastMsg ? {
          content: lastMsg.content || "",
          created_at: lastMsg.created_at,
          sender_name: lastMsg.sender_id === userId ? "You" : participantList.find(p => p.user_id === lastMsg.sender_id)?.display_name || "Unknown"
        } : undefined,
        unread_count: unreadCount,
        conversation_type: conversationType,
        assignment_id: conv.assignment_id || null
      });
    }

    // Fetch assignment details for teaming conversations
    const assignmentIds = convs
      .filter(c => c.assignment_id)
      .map(c => c.assignment_id as string);

    if (assignmentIds.length > 0) {
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, title, date, time, setting, location_type, assignment_type")
        .in("id", assignmentIds);

      if (assignments) {
        const assignmentMap = new Map(assignments.map(a => [a.id, a]));
        convs.forEach(c => {
          if (c.assignment_id && assignmentMap.has(c.assignment_id)) {
            c.assignment = assignmentMap.get(c.assignment_id) as Assignment;
          }
        });
      }
    }

    // Sort by most recent activity
    convs.sort((a, b) => {
      const aTime = a.last_message?.created_at || a.created_at || '';
      const bTime = b.last_message?.created_at || b.created_at || '';
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setConversations(convs);
    setLoadingConversations(false);
  }, [userId]);

  // Load messages for selected conversation - OPTIMIZED: batch profile lookup
  const loadMessages = useCallback(async (conversationId: string) => {
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!error && messages) {
      // Get unique sender IDs (excluding current user)
      const senderIds = [...new Set(messages.map(m => m.sender_id).filter((id): id is string => id !== null && id !== userId))];

      // Fetch ALL sender profiles in ONE query
      const profileMap = new Map<string, string>();
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("community_profiles")
          .select("user_id, display_name")
          .in("user_id", senderIds);

        (profiles || []).forEach(p => {
          if (p.user_id) profileMap.set(p.user_id, p.display_name || "Unknown");
        });
      }

      // Build messages array (no more database calls!)
      const msgs: Message[] = messages.map(m => ({
        id: m.id,
        content: m.content,
        sender_id: m.sender_id,
        sender_name: m.sender_id === userId ? "You" : profileMap.get(m.sender_id || "") || "Unknown",
        created_at: m.created_at
      }));

      setCurrentMessages(msgs);

      // Mark conversation as read (fire and forget - don't await)
      if (userId) {
        supabase
          .from("conversation_participants")
          .update({ last_read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .eq("user_id", userId)
          .then(() => {
            // Update local state to clear unread indicator
            setConversations(prev => prev.map(conv =>
              conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
            ));
          });
      }
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
        .maybeSingle();

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
        .maybeSingle();

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

  // Load initial data when userId is set (only runs once when user is authenticated)
  useEffect(() => {
    if (userId && hasProfile) {
      loadConnections();
      loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, hasProfile]);

  // Load posts separately - this can re-run when filters or connections change
  useEffect(() => {
    if (userId && hasProfile) {
      loadPosts();
    }
  }, [userId, hasProfile, loadPosts]);

  // Load discover members after connections load
  useEffect(() => {
    if (userId && hasProfile) {
      loadDiscoverMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, hasProfile, connections]);

  // Initialize friends feed last viewed from localStorage
  useEffect(() => {
    if (userId) {
      const stored = localStorage.getItem(`friendsFeedLastViewed_${userId}`);
      if (stored) {
        setFriendsFeedLastViewed(stored);
      }
    }
  }, [userId]);

  // Check for unread friends posts
  useEffect(() => {
    if (connections.length === 0) {
      setHasUnreadFriendsPosts(false);
      return;
    }

    // Get friend IDs
    const friendIds = connections.map(c => c.user?.user_id).filter(Boolean);
    if (friendIds.length === 0) {
      setHasUnreadFriendsPosts(false);
      return;
    }

    // Check if any post from a friend is newer than last viewed
    const friendPosts = posts.filter(p => friendIds.includes(p.user_id));
    if (friendPosts.length === 0) {
      setHasUnreadFriendsPosts(false);
      return;
    }

    // If never viewed, show dot if there are any friend posts
    if (!friendsFeedLastViewed) {
      setHasUnreadFriendsPosts(true);
      return;
    }

    // Check if any friend post is newer than last viewed
    const hasNewer = friendPosts.some(p =>
      p.created_at && new Date(p.created_at) > new Date(friendsFeedLastViewed)
    );
    setHasUnreadFriendsPosts(hasNewer);
  }, [posts, connections, friendsFeedLastViewed]);

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
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
  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large. Maximum size is 5MB.");
      return;
    }

    setNewPostImage(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setNewPostImagePreview(previewUrl);
  };

  // Remove selected image
  const handleRemoveImage = () => {
    if (newPostImagePreview) {
      URL.revokeObjectURL(newPostImagePreview);
    }
    setNewPostImage(null);
    setNewPostImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please use JPEG, PNG, GIF, or WebP.");
      return;
    }

    // Validate size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert("File too large. Maximum size is 2MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Session expired. Please sign in again.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/community/profile/upload-avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.url) {
        // Update local state
        setCommunityProfile((prev: any) => prev ? { ...prev, avatar_url: data.url } : prev);
      } else {
        alert(data.error || "Failed to upload avatar");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      alert("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !userId) return;
    setSubmittingPost(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Session expired. Please sign in again.");
        router.push("/signin");
        return;
      }

      let imageUrl = null;

      // Upload image if selected
      if (newPostImage) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append("file", newPostImage);

        const uploadResponse = await fetch("/api/community/posts/upload-image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (uploadResponse.ok && uploadData.url) {
          imageUrl = uploadData.url;
        } else {
          setUploadingImage(false);
          alert(uploadData.error || "Failed to upload image");
          return;
        }
        setUploadingImage(false);
      }

      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          content: newPostContent.trim(),
          post_type: newPostType,
          setting_tags: newPostSettings,
          ecci_domains: [],
          image_url: imageUrl
        })
      });

      const data = await response.json();
      if (response.ok && data.post) {
        // Optimistically add to feed
        setPosts(prev => [data.post, ...prev]);
        setNewPostContent("");
        setNewPostType("general");
        setNewPostSettings([]);
        handleRemoveImage();
        setShowNewPostModal(false);
      } else {
        alert(data.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    } finally {
      setSubmittingPost(false);
      setUploadingImage(false);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (post.liked_by_user) {
        await fetch(`/api/community/posts/${post.id}/like?user_id=${userId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
      } else {
        await fetch(`/api/community/posts/${post.id}/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
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

  // Story-telling reactions mapping with full Tailwind classes
  const REACTION_CONFIG = {
    celebration: {
      emoji: "🙌",
      label: "Celebrate",
      activeClass: "bg-amber-500/20 text-amber-400 shadow-md shadow-amber-500/10",
      inactiveClass: "bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10",
      pickerActiveClass: "bg-amber-500/20"
    },
    thinking: {
      emoji: "💭",
      label: "Thinking",
      activeClass: "bg-blue-500/20 text-blue-400 shadow-md shadow-blue-500/10",
      inactiveClass: "bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10",
      pickerActiveClass: "bg-blue-500/20"
    },
    fire: {
      emoji: "🔥",
      label: "Fire",
      activeClass: "bg-orange-500/20 text-orange-400 shadow-md shadow-orange-500/10",
      inactiveClass: "bg-slate-800 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10",
      pickerActiveClass: "bg-orange-500/20"
    },
    solidarity: {
      emoji: "🫂",
      label: "Support",
      activeClass: "bg-purple-500/20 text-purple-400 shadow-md shadow-purple-500/10",
      inactiveClass: "bg-slate-800 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10",
      pickerActiveClass: "bg-purple-500/20"
    }
  } as const;

  // Get suggested reaction based on post type
  const getSuggestedReaction = (postType: string): ReactionType => {
    switch (postType) {
      case "win": return "celebration";
      case "question": return "thinking";
      case "insight": return "fire";
      case "reflection": return "solidarity";
      default: return "celebration";
    }
  };

  // Handle reaction toggle
  const handleReaction = async (post: Post, reactionType: ReactionType) => {
    if (!userId) return;

    const isRemoving = post.user_reactions.includes(reactionType);
    const animKey = `${post.id}-${reactionType}`;

    // Trigger animation when adding
    if (!isRemoving) {
      setAnimatingReactions(prev => new Set(prev).add(animKey));
      setTimeout(() => {
        setAnimatingReactions(prev => {
          const next = new Set(prev);
          next.delete(animKey);
          return next;
        });
      }, 400);
    }

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === post.id) {
        const newUserReactions = isRemoving
          ? p.user_reactions.filter(r => r !== reactionType)
          : [...p.user_reactions, reactionType];

        const countKey = `${reactionType}_count` as keyof PostReactions;
        const newReactions = {
          ...p.reactions,
          [countKey]: isRemoving
            ? Math.max(0, p.reactions[countKey] - 1)
            : p.reactions[countKey] + 1
        };

        return { ...p, user_reactions: newUserReactions, reactions: newReactions };
      }
      return p;
    }));

    // Close picker
    setOpenReactionPicker(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (isRemoving) {
        await fetch(`/api/community/posts/${post.id}/react?reaction_type=${reactionType}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
      } else {
        await fetch(`/api/community/posts/${post.id}/react`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ reaction_type: reactionType })
        });
      }
    } catch (error) {
      // Revert on error
      setPosts(prev => prev.map(p => {
        if (p.id === post.id) {
          return {
            ...p,
            user_reactions: post.user_reactions,
            reactions: post.reactions
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (post.bookmarked_by_user) {
        await fetch(`/api/community/posts/${post.id}/bookmark?user_id=${userId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
      } else {
        await fetch(`/api/community/posts/${post.id}/bookmark`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
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

  // Share post - copy link to clipboard
  const handleSharePost = async (post: Post) => {
    const postUrl = `${window.location.origin}/community?post=${post.id}`;

    try {
      // Try native share API first (works on mobile)
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${post.author.display_name}`,
          text: post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''),
          url: postUrl,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(postUrl);
        setCopiedPostId(post.id);
        setTimeout(() => setCopiedPostId(null), 2000);
      }
    } catch (error) {
      // If share was cancelled or clipboard failed, try clipboard as fallback
      try {
        await navigator.clipboard.writeText(postUrl);
        setCopiedPostId(post.id);
        setTimeout(() => setCopiedPostId(null), 2000);
      } catch {
        console.error("Failed to share/copy:", error);
      }
    }
  };

  // Delete post (only owner can delete) - opens confirmation modal
  const handleDeletePost = (post: Post) => {
    if (!userId || post.user_id !== userId) return;
    setPostToDelete(post);
  };

  // Confirm delete post - called from modal
  const confirmDeletePost = async () => {
    if (!postToDelete || !userId) return;

    setDeletingPost(true);
    const post = postToDelete;

    // Optimistic removal
    setPosts(prev => prev.filter(p => p.id !== post.id));
    setPostToDelete(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setDeletingPost(false);
        return;
      }

      const response = await fetch(`/api/community/posts?post_id=${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (!response.ok) {
        // Revert on error
        setPosts(prev => [...prev, post].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
        const data = await response.json();
        alert(data.error || "Failed to delete post");
      }
    } catch (error) {
      // Revert on error
      setPosts(prev => [...prev, post].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    } finally {
      setDeletingPost(false);
    }
  };

  // Open edit modal for a post
  const handleEditPost = (post: Post) => {
    if (!userId || post.user_id !== userId) return;
    setEditingPost(post);
    setEditContent(post.content);
  };

  // Save edited post
  const saveEditedPost = async () => {
    if (!editingPost || !userId || !editContent.trim()) return;

    setSavingEdit(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSavingEdit(false);
        return;
      }

      const response = await fetch(`/api/community/posts`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          post_id: editingPost.id,
          content: editContent.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update post in state
        setPosts(prev => prev.map(p =>
          p.id === editingPost.id
            ? { ...p, content: editContent.trim(), is_edited: true }
            : p
        ));
        setEditingPost(null);
        setEditContent("");
      } else {
        alert(data.error || "Failed to update post");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post");
    } finally {
      setSavingEdit(false);
    }
  };

  // Report content
  const submitReport = async () => {
    if (!reportingPost || !userId || !reportReason) return;

    setSubmittingReport(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSubmittingReport(false);
        return;
      }

      const response = await fetch(`/api/community/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content_type: "post",
          content_id: reportingPost.id,
          reason: reportReason,
          additional_details: reportDetails.trim() || null
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReportingPost(null);
        setReportReason("");
        setReportDetails("");
        // Show subtle success message
        alert("Thank you for your report. Our team will review it shortly.");
      } else {
        alert(data.error || "Failed to submit report");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report");
    } finally {
      setSubmittingReport(false);
    }
  };

  // Open comments modal for a post
  const openCommentsModal = async (post: Post) => {
    setCommentsPost(post);
    setShowCommentsModal(true);
    setComments([]);
    setNewCommentText("");
    setReplyingTo(null);
    setLoadingComments(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoadingComments(false);
        return;
      }

      const response = await fetch(`/api/community/posts/${post.id}/comments`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Submit a new comment or reply
  const handleSubmitComment = async () => {
    if (!commentsPost || !newCommentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    const commentContent = newCommentText.trim();
    const parentId = replyingTo?.id || null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSubmittingComment(false);
        return;
      }

      const response = await fetch(`/api/community/posts/${commentsPost.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content: commentContent,
          parent_comment_id: parentId
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newComment = data.comment;

        if (parentId) {
          // This is a reply - add it to the parent's replies
          setComments(prev => prev.map(c => {
            if (c.id === parentId) {
              return { ...c, replies: [...(c.replies || []), newComment] };
            }
            return c;
          }));
        } else {
          // This is a top-level comment
          setComments(prev => [...prev, { ...newComment, replies: [] }]);
        }

        // Update post's comment count
        setPosts(prev => prev.map(p =>
          p.id === commentsPost.id
            ? { ...p, comments_count: p.comments_count + 1 }
            : p
        ));

        // Also update the modal's post
        setCommentsPost(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : null);

        setNewCommentText("");
        setReplyingTo(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete a comment
  const handleDeleteComment = async (comment: Comment) => {
    if (!commentsPost || !userId || comment.user_id !== userId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `/api/community/posts/${commentsPost.id}/comments?comment_id=${comment.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      if (response.ok) {
        // Remove from state
        if (comment.parent_comment_id) {
          // It's a reply
          setComments(prev => prev.map(c => {
            if (c.id === comment.parent_comment_id) {
              return { ...c, replies: (c.replies || []).filter(r => r.id !== comment.id) };
            }
            return c;
          }));
        } else {
          // It's a top-level comment
          setComments(prev => prev.filter(c => c.id !== comment.id));
        }

        // Update comment count
        setPosts(prev => prev.map(p =>
          p.id === commentsPost.id
            ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
            : p
        ));
        setCommentsPost(prev => prev ? { ...prev, comments_count: Math.max(0, prev.comments_count - 1) } : null);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  // Like/unlike a comment
  const handleLikeComment = async (comment: Comment, parentId?: string) => {
    if (!commentsPost || !userId) return;

    const action = comment.liked_by_user ? "unlike" : "like";
    const newLikesCount = comment.liked_by_user
      ? Math.max(0, comment.likes_count - 1)
      : comment.likes_count + 1;

    // Optimistic update
    const updateComment = (c: Comment): Comment => {
      if (c.id === comment.id) {
        return { ...c, liked_by_user: !c.liked_by_user, likes_count: newLikesCount };
      }
      if (c.replies) {
        return { ...c, replies: c.replies.map(updateComment) };
      }
      return c;
    };
    setComments(prev => prev.map(updateComment));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `/api/community/posts/${commentsPost.id}/comments`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            comment_id: comment.id,
            action
          })
        }
      );

      if (!response.ok) {
        // Revert on failure
        const revertComment = (c: Comment): Comment => {
          if (c.id === comment.id) {
            return { ...c, liked_by_user: comment.liked_by_user, likes_count: comment.likes_count };
          }
          if (c.replies) {
            return { ...c, replies: c.replies.map(revertComment) };
          }
          return c;
        };
        setComments(prev => prev.map(revertComment));
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      // Revert on error
      const revertComment = (c: Comment): Comment => {
        if (c.id === comment.id) {
          return { ...c, liked_by_user: comment.liked_by_user, likes_count: comment.likes_count };
        }
        if (c.replies) {
          return { ...c, replies: c.replies.map(revertComment) };
        }
        return c;
      };
      setComments(prev => prev.map(revertComment));
    }
  };

  // Start replying to a comment
  const startReply = (comment: Comment) => {
    setReplyingTo(comment);
    setNewCommentText(`@${comment.author.display_name} `);
    commentInputRef.current?.focus();
  };

  // Format time ago for comments
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 604800)}w`;
  };

  // Render comment content with gradient @mentions
  const renderCommentContent = (content: string) => {
    // Match @mentions at the start: @FirstName LastName (exactly 2 words after @)
    const mentionMatch = content.match(/^(@[A-Za-z]+\s+[A-Za-z]+)\s/);

    if (mentionMatch) {
      const mention = mentionMatch[1];
      const rest = content.slice(mentionMatch[0].length);
      return (
        <>
          <span className="font-semibold bg-gradient-to-r from-teal-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            {mention}
          </span>
          {" "}{rest}
        </>
      );
    }

    return content;
  };

  // Send connection request
  const handleConnect = async (targetUserId: string) => {
    if (!userId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/community/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          requester_id: userId,
          addressee_id: targetUserId
        })
      });

      const data = await response.json();
      if (response.ok) {
        // Add to sent requests so button shows "Pending" instead of "Connect"
        setSentRequests(prev => [...prev, targetUserId]);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/community/connections", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = { Authorization: `Bearer ${session.access_token}` };

      const res = await fetch(`/api/community/connections?user_id=${userId}&status=pending`, { headers });
      const data = await res.json();

      // Check if there's an existing connection
      const existing = data.connections?.find((c: Connection) => c.user?.user_id === targetUserId);

      if (existing) {
        setConnectionStatus({ status: existing.status, connection_id: existing.connection_id });
      } else {
        // Check accepted connections
        const acceptedRes = await fetch(`/api/community/connections?user_id=${userId}&status=accepted`, { headers });
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

  // Open existing conversation with a user, or show new chat modal if none exists
  const openOrCreateChat = async (otherUserId: string) => {
    if (!userId) return;

    // FAST PATH: Check local state first (already loaded conversations)
    const existingConv = conversations.find(conv =>
      !conv.is_group &&
      conv.participants.some(p => p.user_id === otherUserId)
    );

    if (existingConv) {
      // Found in local state - open immediately (no database call needed)
      setSelectedConversation(existingConv.id);
      setShowMessagesPanel(true);
      return;
    }

    // SLOW PATH: Check database for conversation not yet loaded
    const { data: sharedConvos } = await supabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        conversations!inner (id, is_group)
      `)
      .eq("user_id", otherUserId)
      .eq("conversations.is_group", false);

    if (sharedConvos && sharedConvos.length > 0) {
      // Find one where current user is also a participant
      for (const shared of sharedConvos) {
        const convId = shared.conversation_id;
        if (!convId) continue;

        const { data: isParticipant } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("conversation_id", convId)
          .eq("user_id", userId)
          .maybeSingle();

        if (isParticipant) {
          // Found existing conversation - open immediately, refresh in background
          setSelectedConversation(convId);
          setShowMessagesPanel(true);
          loadConversations(); // Don't await - refresh in background
          return;
        }
      }
    }

    // No existing conversation - open new chat modal with user pre-selected
    setSelectedMembers([otherUserId]);
    setNewChatType("direct");
    setShowNewChatModal(true);
  };

  // Create chat (or open existing one for direct messages)
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

      // For direct messages, check if conversation already exists
      if (newChatType === "direct" && selectedMembers.length === 1) {
        const otherUserId = selectedMembers[0];

        // Find existing 1:1 conversation between these two users
        const { data: myConvos } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", session.user.id);

        if (myConvos && myConvos.length > 0) {
          const myConvoIds = myConvos.map(c => c.conversation_id);

          // Check if the other user is in any of my conversations
          const { data: sharedConvos } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("user_id", otherUserId)
            .in("conversation_id", myConvoIds);

          if (sharedConvos && sharedConvos.length > 0) {
            // Check each shared conversation to find a 1:1 (not group)
            for (const shared of sharedConvos) {
              if (!shared.conversation_id) continue;
              const { data: convData } = await supabase
                .from("conversations")
                .select("id, is_group")
                .eq("id", shared.conversation_id)
                .eq("is_group", false)
                .maybeSingle();

              if (convData) {
                // Found existing 1:1 conversation - open it
                setNewGroupName("");
                setSelectedMembers([]);
                setNewChatType("direct");
                setShowNewChatModal(false);
                await loadConversations();
                setSelectedConversation(convData.id);
                setShowMessagesPanel(true); // Open the messages panel
                setCreatingChat(false);
                return;
              }
            }
          }
        }
      }

      // No existing conversation found, create new one
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

      // IMPORTANT: Insert creator first (so RLS allows adding others)
      // The RLS policy checks if user is in conversation before allowing inserts
      const { error: creatorError } = await supabase
        .from("conversation_participants")
        .insert({ conversation_id: conversation.id, user_id: session.user.id, is_admin: true });

      if (creatorError) throw creatorError;

      // Now add other members (RLS will allow since creator is now in the conversation)
      if (selectedMembers.length > 0) {
        const otherParticipants = selectedMembers.map(memberId => ({
          conversation_id: conversation.id,
          user_id: memberId,
          is_admin: false
        }));
        const { error: membersError } = await supabase
          .from("conversation_participants")
          .insert(otherParticipants);
        if (membersError) throw membersError;
      }

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

  // Get chat label based on conversation type and properties
  const getChatLabel = (conv: Conversation): ChatLabel => {
    // Group chats always get "group" label (purple)
    if (conv.is_group) return 'group';
    // Assignment/work chats get "assignment" label (orange)
    if (conv.assignment_id || conv.conversation_type === 'teaming') return 'assignment';
    // Mentor chats get "mentor" label (blue)
    if (conv.conversation_type === 'mentoring' || conv.participants.some(p => p.is_mentor)) return 'mentor';
    // Default to personal (green)
    return 'personal';
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  // Filter conversations by search text and type filter
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Apply type filter first
    if (conversationFilter !== 'all') {
      filtered = filtered.filter(conv => conv.conversation_type === conversationFilter);
    }

    // Then apply search filter
    if (conversationSearch.trim()) {
      const searchLower = conversationSearch.toLowerCase();
      filtered = filtered.filter(conv => {
        // Search by conversation name (group name or participant names)
        const convName = conv.is_group && conv.name ? conv.name : conv.participants.map(p => p.display_name).join(", ");
        if (convName.toLowerCase().includes(searchLower)) return true;
        // Search by last message content
        if (conv.last_message?.content?.toLowerCase().includes(searchLower)) return true;
        // Search by assignment title if it's a teaming conversation
        if (conv.assignment?.title?.toLowerCase().includes(searchLower)) return true;
        return false;
      });
    }

    return filtered;
  }, [conversations, conversationSearch, conversationFilter]);

  // Count conversations per type for filter badges
  const conversationCounts = useMemo(() => ({
    all: conversations.length,
    teaming: conversations.filter(c => c.conversation_type === 'teaming').length,
    personal: conversations.filter(c => c.conversation_type === 'personal').length,
    mentoring: conversations.filter(c => c.conversation_type === 'mentoring').length,
  }), [conversations]);

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
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
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
                  handleOpenNewPostModal();
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
          {/* Left Sidebar - Collapsible */}
          <div className={`flex-shrink-0 hidden lg:block transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-12' : 'w-72'}`}>
            <div className="sticky top-24 space-y-4">
              {/* Collapse Toggle Button */}
              <button
                onClick={handleSidebarToggle}
                className="w-full flex items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200 hover:border-slate-700 premium-transition"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              {/* Sidebar Content - Hidden when collapsed */}
              <div className={`space-y-4 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 invisible h-0 overflow-hidden' : 'opacity-100 visible'}`}>
              {hasProfile ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 premium-card hover:border-slate-700">
                  {/* Hidden file input for avatar upload */}
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                  />
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="relative group cursor-pointer"
                    >
                      {communityProfile?.avatar_url ? (
                        <img
                          src={communityProfile.avatar_url}
                          alt={communityProfile.display_name || "Profile"}
                          className="w-14 h-14 rounded-full object-cover premium-transition group-hover:scale-105 shadow-lg ring-2 ring-slate-700 group-hover:ring-teal-500/50"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center text-lg font-bold text-white premium-transition group-hover:scale-105 shadow-lg shadow-teal-500/20">
                          {getInitials(communityProfile?.display_name || userData?.full_name || "?")}
                        </div>
                      )}
                      {/* Upload overlay on hover */}
                      <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 premium-transition">
                        {uploadingAvatar ? (
                          <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <Link href={`/community/profile/${userId}`} className="font-semibold text-slate-100 hover:text-teal-400 premium-transition">{communityProfile?.display_name}</Link>
                      <p className="text-xs text-slate-400">{communityProfile?.years_experience}</p>
                    </div>
                  </div>

                  {communityProfile?.bio && (
                    <p className="text-sm text-slate-300 mb-4">{communityProfile.bio}</p>
                  )}

                  {/* View Profile Button */}
                  <Link
                    href={`/community/profile/${userId}`}
                    className="block w-full text-center py-2 px-4 mb-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium premium-transition"
                  >
                    View My Profile
                  </Link>

                  <div className="grid grid-cols-3 gap-2 text-center py-3 border-t border-slate-800">
                    <div className="premium-transition hover:scale-105 cursor-default">
                      <p className="text-lg font-bold text-teal-400">{connections.length}</p>
                      <p className="text-xs text-slate-500">Friends</p>
                    </div>
                    <div className="premium-transition hover:scale-105 cursor-default">
                      <p className="text-lg font-bold text-violet-400">{posts.filter(p => p.user_id === userId).length}</p>
                      <p className="text-xs text-slate-500">Posts</p>
                    </div>
                    <div
                      onClick={() => setShowMessagesPanel(true)}
                      className="premium-transition hover:scale-105 cursor-pointer group relative"
                      title="Active direct message conversations"
                    >
                      <p className="text-lg font-bold text-emerald-400 group-hover:text-emerald-300">
                        {conversations.length > 0 ? conversations.length : '-'}
                      </p>
                      <p className="text-xs text-slate-500 group-hover:text-slate-400">
                        {conversations.length === 0 ? 'No chats' : 'Chats'}
                      </p>
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-xs text-slate-300 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Click to view messages
                      </div>
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


              {/* Friend Requests Section - Always visible in sidebar when there are pending requests */}
              {pendingRequests.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 premium-card">
                  <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    FRIEND REQUESTS ({pendingRequests.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.connection_id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 hover:bg-slate-800/50 premium-transition"
                      >
                        <Link href={`/community/profile/${req.user?.user_id}`} className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {getInitials(req.user?.display_name || "?")}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/community/profile/${req.user?.user_id}`} className="text-sm font-medium text-slate-200 hover:text-amber-400 premium-transition truncate block">
                            {req.user?.display_name}
                          </Link>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleConnectionAction(req.connection_id, "accept")}
                            className="p-1.5 rounded-md bg-teal-500 text-white hover:bg-teal-400 premium-transition"
                            title="Accept"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleConnectionAction(req.connection_id, "decline")}
                            className="p-1.5 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 premium-transition"
                            title="Decline"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sort Options */}
              {activeTab === "feed" && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 premium-card hover:border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">SORT BY</h4>
                  <div className="space-y-2">
                    {/* View All Posts */}
                    <button
                      onClick={() => {
                        setFeedSort("recent");
                        setShowFriendsFeed(false);
                        setShowSavedPosts(false);
                        setShowMyPosts(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium premium-transition ${
                        !showFriendsFeed && !showSavedPosts && feedSort === "recent"
                          ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      Viewing All Posts
                    </button>

                    {/* Top Posts */}
                    <button
                      onClick={() => {
                        setFeedSort("top");
                        setShowFriendsFeed(false);
                        setShowSavedPosts(false);
                        setShowMyPosts(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium premium-transition ${
                        !showFriendsFeed && !showSavedPosts && feedSort === "top"
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Top Posts
                    </button>

                    {/* Trending Posts */}
                    <button
                      onClick={() => {
                        setFeedSort("trending");
                        setShowFriendsFeed(false);
                        setShowSavedPosts(false);
                        setShowMyPosts(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium premium-transition ${
                        !showFriendsFeed && !showSavedPosts && feedSort === "trending"
                          ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      </svg>
                      Trending
                    </button>

                    {/* Friends Feed */}
                    <button
                      onClick={() => {
                        setShowFriendsFeed(true);
                        setShowSavedPosts(false);
                        setShowMyPosts(false);
                        // Mark as viewed when clicked
                        const now = new Date().toISOString();
                        setFriendsFeedLastViewed(now);
                        setHasUnreadFriendsPosts(false);
                        if (userId) {
                          localStorage.setItem(`friendsFeedLastViewed_${userId}`, now);
                        }
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium premium-transition ${
                        showFriendsFeed
                          ? "bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Friends Feed
                      {/* Blue dot indicator for unread friend posts */}
                      {hasUnreadFriendsPosts && !showFriendsFeed && (
                        <span className="ml-auto w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </button>

                    {/* Saved Posts */}
                    <button
                      onClick={() => {
                        setShowSavedPosts(true);
                        setShowFriendsFeed(false);
                        setShowMyPosts(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium premium-transition ${
                        showSavedPosts
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                      }`}
                    >
                      <svg className="w-4 h-4" fill={showSavedPosts ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Saved Posts
                      {posts.filter(p => p.bookmarked_by_user).length > 0 && (
                        <span className={`ml-auto px-1.5 py-0.5 rounded-full text-xs ${
                          showSavedPosts ? "bg-white/20" : "bg-slate-700"
                        }`}>
                          {posts.filter(p => p.bookmarked_by_user).length}
                        </span>
                      )}
                    </button>
                  </div>
                  {showFriendsFeed && connections.length === 0 && (
                    <p className="mt-2 text-xs text-amber-400 text-center">
                      Connect with members to see their posts
                    </p>
                  )}
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

              {/* Community Guidelines */}
              <Link
                href="/community/guidelines"
                className="block rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-4 premium-card hover:border-violet-500/50 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <h4 className="text-sm font-semibold text-violet-400">Community Guidelines</h4>
                  </div>
                  <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Our standards for a safe, respectful, and welcoming community for all interpreters.
                </p>
              </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-2xl">
            {/* FEED TAB */}
            {activeTab === "feed" && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={feedSearch}
                    onChange={(e) => handleFeedSearchChange(e.target.value)}
                    placeholder="Search posts by topic, keyword, or author..."
                    className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent premium-transition"
                  />
                  {feedSearch && (
                    <button
                      onClick={() => {
                        setFeedSearch("");
                        loadPosts();
                      }}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 premium-transition"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Search Results Indicator */}
                {feedSearch && (
                  <div className="flex items-center justify-between px-1">
                    <p className="text-sm text-slate-400">
                      {loadingPosts ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full border-2 border-slate-500 border-t-teal-400 animate-spin" />
                          Searching...
                        </span>
                      ) : (
                        <>Showing results for "<span className="text-teal-400">{feedSearch}</span>"</>
                      )}
                    </p>
                    {!loadingPosts && (
                      <button
                        onClick={() => {
                          setFeedSearch("");
                          loadPosts();
                        }}
                        className="text-sm text-slate-500 hover:text-teal-400 premium-transition"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                )}

                {/* Active Filter Chips */}
                {activeTab === "feed" && (
                  <FilterChips
                    sort={feedSort as any}
                    postType={(postFilter || 'all') as any}
                    onClearSort={() => setFeedSort("recent")}
                    onClearPostType={() => setPostFilter(null)}
                    onClearAll={() => {
                      setFeedSort("recent");
                      setPostFilter(null);
                    }}
                  />
                )}

                {/* Posts */}
                {(() => {
                  const displayPosts = showSavedPosts ? posts.filter(p => p.bookmarked_by_user) : posts;
                  return loadingPosts ? (
                  <div className="space-y-4">
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                  </div>
                ) : displayPosts.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center animate-fade-in-up">
                    {showFriendsFeed ? (
                      <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-100 mb-2">
                          {connections.length === 0 ? "No friends yet" : "No posts from friends"}
                        </h3>
                        <p className="text-slate-400 mb-4">
                          {connections.length === 0
                            ? "Connect with other interpreters to see their posts here!"
                            : "Your friends haven't posted anything yet. Check back soon!"}
                        </p>
                        <button
                          onClick={() => {
                            setShowFriendsFeed(false);
                            setActiveTab("discover");
                          }}
                          className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium premium-button"
                        >
                          {connections.length === 0 ? "Find Friends" : "Discover More"}
                        </button>
                      </>
                    ) : showSavedPosts ? (
                      <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-100 mb-2">No saved posts yet</h3>
                        <p className="text-slate-400 mb-4">Bookmark posts you find valuable to save them here!</p>
                        <button
                          onClick={() => setShowSavedPosts(false)}
                          className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-medium premium-button"
                        >
                          Browse All Posts
                        </button>
                      </>
                    ) : showMyPosts ? (
                      <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/10 flex items-center justify-center">
                          <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-100 mb-2">No posts yet</h3>
                        <p className="text-slate-400 mb-4">You haven't shared anything yet. Start a conversation!</p>
                        <button
                          onClick={handleOpenNewPostModal}
                          className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium premium-button"
                        >
                          Create Your First Post
                        </button>
                      </>
                    ) : feedSearch ? (
                      <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-100 mb-2">No results found</h3>
                        <p className="text-slate-400 mb-4">
                          No posts match "<span className="text-teal-400">{feedSearch}</span>". Try different keywords or browse all posts.
                        </p>
                        <button
                          onClick={() => setFeedSearch("")}
                          className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 font-medium premium-button hover:bg-slate-600"
                        >
                          Clear Search
                        </button>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold text-slate-100 mb-2">No posts yet</h3>
                        <p className="text-slate-400 mb-4">Be the first to share something with the community!</p>
                        <button
                          onClick={handleOpenNewPostModal}
                          className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium premium-button"
                        >
                          Create First Post
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  displayPosts.map((post, index) => (
                    <div
                      key={post.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden premium-card hover:border-slate-700 stagger-item"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Post Header */}
                      <div className="p-4 pb-0">
                        <div className="flex items-start gap-3">
                          <Link href={`/community/profile/${post.user_id}`}>
                            {post.author.avatar_url ? (
                              <img
                                src={post.author.avatar_url}
                                alt={post.author.display_name}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0 premium-transition hover:scale-110 cursor-pointer shadow-md ring-2 ring-slate-700"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 premium-transition hover:scale-110 cursor-pointer shadow-md">
                                {getInitials(post.author.display_name)}
                              </div>
                            )}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link href={`/community/profile/${post.user_id}`} className="font-medium text-slate-100 hover:text-teal-400 premium-transition">{post.author.display_name}</Link>
                              {post.author.open_to_mentoring && (
                                <span className="px-1.5 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 premium-transition hover:bg-amber-500/30">Mentor</span>
                              )}
                              <span className="text-slate-500 text-sm">·</span>
                              <span className="text-slate-500 text-sm">{formatTime(post.created_at)}</span>
                              {post.is_edited && (
                                <span className="text-slate-600 text-xs italic">(edited)</span>
                              )}
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

                          {/* More Menu (Report) - only visible for other users' posts */}
                          {post.user_id !== userId && (
                            <div className="relative">
                              <button
                                onClick={() => setShowMoreMenu(showMoreMenu === post.id ? null : post.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 premium-transition"
                                title="More options"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>

                              {/* Dropdown Menu */}
                              {showMoreMenu === post.id && (
                                <div className="absolute right-0 top-full mt-1 w-40 rounded-lg bg-slate-800 border border-slate-700 shadow-xl animate-fade-in-scale z-20">
                                  <button
                                    onClick={() => {
                                      setShowMoreMenu(null);
                                      setReportingPost(post);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 rounded-lg flex items-center gap-2 premium-transition"
                                  >
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Report
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="p-4">
                        <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                        {/* Post Image */}
                        {post.image_url && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-slate-700/50 group relative cursor-pointer" onClick={() => window.open(post.image_url, '_blank')}>
                            <img
                              src={post.image_url}
                              alt="Post image"
                              className="w-full max-h-96 object-cover premium-transition group-hover:scale-[1.02]"
                            />
                            {/* Hover overlay with expand icon */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 premium-transition flex items-end justify-end p-3">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-sm text-white text-sm">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                                View full size
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Post Actions */}
                      <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
                        {/* Story-telling Reactions */}
                        <div className="relative flex items-center gap-1">
                          {/* Suggested reaction based on post type */}
                          {(() => {
                            const suggestedReaction = getSuggestedReaction(post.post_type);
                            const config = REACTION_CONFIG[suggestedReaction];
                            const isActive = post.user_reactions?.includes(suggestedReaction);
                            const count = post.reactions?.[`${suggestedReaction}_count` as keyof PostReactions] || 0;
                            const animKey = `${post.id}-${suggestedReaction}`;

                            return (
                              <button
                                onClick={() => handleReaction(post, suggestedReaction)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg premium-transition hover:scale-105 active:scale-95 ${
                                  isActive ? config.activeClass : config.inactiveClass
                                }`}
                                title={config.label}
                              >
                                <span className={`text-base premium-transition ${animatingReactions.has(animKey) ? 'animate-bounce-in' : ''}`}>
                                  {config.emoji}
                                </span>
                                {count > 0 && <span className="text-sm font-medium">{count}</span>}
                              </button>
                            );
                          })()}

                          {/* Other reactions with counts > 0 */}
                          {(Object.keys(REACTION_CONFIG) as ReactionType[])
                            .filter(type => {
                              const suggested = getSuggestedReaction(post.post_type);
                              if (type === suggested) return false;
                              const count = post.reactions?.[`${type}_count` as keyof PostReactions] || 0;
                              return count > 0 || post.user_reactions?.includes(type);
                            })
                            .map(type => {
                              const config = REACTION_CONFIG[type];
                              const isActive = post.user_reactions?.includes(type);
                              const count = post.reactions?.[`${type}_count` as keyof PostReactions] || 0;
                              const animKey = `${post.id}-${type}`;

                              return (
                                <button
                                  key={type}
                                  onClick={() => handleReaction(post, type)}
                                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg premium-transition hover:scale-105 active:scale-95 ${
                                    isActive
                                      ? config.activeClass
                                      : "bg-slate-800/50 text-slate-400 hover:bg-slate-700"
                                  }`}
                                  title={config.label}
                                >
                                  <span className={`text-sm ${animatingReactions.has(animKey) ? 'animate-bounce-in' : ''}`}>
                                    {config.emoji}
                                  </span>
                                  {count > 0 && <span className="text-xs font-medium">{count}</span>}
                                </button>
                              );
                            })}

                          {/* Add reaction button */}
                          <button
                            onClick={() => setOpenReactionPicker(openReactionPicker === post.id ? null : post.id)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/50 text-slate-500 hover:bg-slate-700 hover:text-slate-300 premium-transition"
                            title="Add reaction"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>

                          {/* Reaction picker dropdown */}
                          {openReactionPicker === post.id && (
                            <div className="absolute left-0 bottom-full mb-2 flex items-center gap-1 p-2 rounded-xl bg-slate-800 border border-slate-700 shadow-xl animate-fade-in-scale z-10">
                              {(Object.keys(REACTION_CONFIG) as ReactionType[]).map(type => {
                                const config = REACTION_CONFIG[type];
                                const isActive = post.user_reactions?.includes(type);
                                return (
                                  <button
                                    key={type}
                                    onClick={() => handleReaction(post, type)}
                                    className={`flex flex-col items-center p-2 rounded-lg premium-transition hover:scale-110 ${
                                      isActive ? config.pickerActiveClass : "hover:bg-slate-700"
                                    }`}
                                    title={config.label}
                                  >
                                    <span className="text-xl">{config.emoji}</span>
                                    <span className="text-[10px] text-slate-400 mt-0.5">{config.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="w-px h-6 bg-slate-700 mx-1" />

                        {/* Comments button */}
                        <button
                          onClick={() => openCommentsModal(post)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 premium-transition hover:scale-105 active:scale-95"
                        >
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
                        <button
                          onClick={() => handleSharePost(post)}
                          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg premium-transition hover:scale-105 active:scale-95 ${
                            copiedPostId === post.id
                              ? "bg-teal-500/20 text-teal-400"
                              : "bg-slate-800 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10"
                          }`}
                          title="Share post"
                        >
                          {copiedPostId === post.id ? (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-xs font-medium">Copied!</span>
                            </>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                          )}
                        </button>

                        {/* Edit & Delete buttons - only visible on own posts */}
                        {post.user_id === userId && (
                          <>
                            <button
                              onClick={() => handleEditPost(post)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 premium-transition hover:scale-105 active:scale-95"
                              title="Edit post"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeletePost(post)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-500/10 premium-transition hover:scale-105 active:scale-95"
                              title="Delete post"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                );
                })()}

                {/* You're all caught up message */}
                {posts.length > 0 && !loadingPosts && (
                  <div className="py-12 text-center animate-fade-in-up">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 mb-4">
                      <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-200 mb-1">You're all caught up!</h3>
                    <p className="text-slate-400 text-sm">You've seen all the posts. Check back later for more.</p>
                  </div>
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
                          <Link href={`/community/profile/${req.user?.user_id}`} className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-sm font-bold text-white premium-transition hover:scale-105 shadow-md">
                            {getInitials(req.user?.display_name || "?")}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link href={`/community/profile/${req.user?.user_id}`} className="font-medium text-slate-100 hover:text-teal-400 premium-transition">{req.user?.display_name}</Link>
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
                          <Link href={`/community/profile/${conn.user?.user_id}`}>
                            {conn.user?.avatar_url ? (
                              <img
                                src={conn.user.avatar_url}
                                alt={conn.user.display_name || "User"}
                                className="w-14 h-14 rounded-full object-cover flex-shrink-0 premium-transition hover:scale-105 shadow-lg ring-2 ring-slate-700 hover:ring-teal-500/50"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-lg font-bold text-white flex-shrink-0 premium-transition hover:scale-105 shadow-lg shadow-teal-500/20">
                                {getInitials(conn.user?.display_name || "?")}
                              </div>
                            )}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Link href={`/community/profile/${conn.user?.user_id}`} className="font-semibold text-slate-100 hover:text-teal-400 premium-transition">{conn.user?.display_name}</Link>
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
                              openOrCreateChat(conn.user.user_id);
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
                {/* Search Input */}
                <div className="relative animate-fade-in-up">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={discoverSearch}
                    onChange={(e) => setDiscoverSearch(e.target.value)}
                    placeholder="Search members by name..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 premium-transition"
                  />
                  {discoverSearch && (
                    <button
                      onClick={() => setDiscoverSearch("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 premium-transition"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {loadingDiscover ? (
                  <div className="grid gap-3">
                    <MemberSkeleton />
                    <MemberSkeleton />
                    <MemberSkeleton />
                    <MemberSkeleton />
                  </div>
                ) : (() => {
                  // Filter members by search query
                  const filteredMembers = discoverMembers.filter(member =>
                    member.display_name.toLowerCase().includes(discoverSearch.toLowerCase())
                  );

                  return filteredMembers.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center animate-fade-in-up">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={discoverSearch ? "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" : "M5 13l4 4L19 7"} />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">
                      {discoverSearch ? "No members found" : "Everyone's connected!"}
                    </h3>
                    <p className="text-slate-400">
                      {discoverSearch ? `No members match "${discoverSearch}"` : "You've connected with all community members."}
                    </p>
                    {discoverSearch && (
                      <button
                        onClick={() => setDiscoverSearch("")}
                        className="mt-4 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 premium-transition"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredMembers.map((member, index) => (
                      <div
                        key={member.user_id}
                        onClick={() => openMemberProfile(member)}
                        className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 cursor-pointer premium-card hover:border-slate-700 group stagger-item"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <Link href={`/community/profile/${member.user_id}`} onClick={(e) => e.stopPropagation()}>
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={member.display_name}
                                className="w-14 h-14 rounded-full object-cover flex-shrink-0 premium-transition hover:scale-105 shadow-lg ring-2 ring-slate-700 hover:ring-violet-500/50"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-lg font-bold text-white flex-shrink-0 premium-transition hover:scale-105 shadow-lg shadow-violet-500/20">
                                {getInitials(member.display_name)}
                              </div>
                            )}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Link href={`/community/profile/${member.user_id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-slate-100 hover:text-violet-400 premium-transition">{member.display_name}</Link>
                              {member.open_to_mentoring && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs">Mentor</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400">
                              {member.years_experience}
                              {member.specialties?.length ? ` · ${member.specialties.slice(0, 2).join(", ")}` : ""}
                            </p>
                          </div>
                          {sentRequests.includes(member.user_id) ? (
                            <span className="px-4 py-2 rounded-lg bg-slate-700 text-slate-400 text-sm font-medium cursor-default">
                              Pending
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConnect(member.user_id);
                              }}
                              className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-violet-500 text-white text-sm font-medium premium-button"
                            >
                              Connect
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
                })()}
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

                {/* Search and Filter */}
                <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                  {/* Search by Name */}
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={mentorSearch}
                      onChange={(e) => setMentorSearch(e.target.value)}
                      placeholder="Search mentors by name..."
                      className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 premium-transition"
                    />
                    {mentorSearch && (
                      <button
                        onClick={() => setMentorSearch("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 premium-transition"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Filter by Specialty */}
                  {(() => {
                    // Gather all unique specialties from mentors
                    const allMentors = [
                      ...connections.filter(c => c.user?.open_to_mentoring).map(c => c.user),
                      ...discoverMembers.filter(m => m.open_to_mentoring)
                    ];
                    const allSpecialties = new Set<string>();
                    allMentors.forEach(m => {
                      (m?.strong_domains || []).forEach((d: string) => allSpecialties.add(d));
                      (m?.specialties || []).forEach((s: string) => allSpecialties.add(s));
                    });
                    const specialtyOptions = Array.from(allSpecialties).sort();

                    if (specialtyOptions.length === 0) return null;

                    return (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setMentorSpecialtyFilter(null)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium premium-transition ${
                            !mentorSpecialtyFilter
                              ? "bg-amber-500 text-slate-950"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          All Specialties
                        </button>
                        {specialtyOptions.map(specialty => (
                          <button
                            key={specialty}
                            onClick={() => setMentorSpecialtyFilter(mentorSpecialtyFilter === specialty ? null : specialty)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium premium-transition ${
                              mentorSpecialtyFilter === specialty
                                ? "bg-amber-500 text-slate-950"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {specialty}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Mentor List */}
                {(() => {
                  const mentors = [
                    ...connections.filter(c => c.user?.open_to_mentoring).map(c => ({ ...c.user, isConnected: true })),
                    ...discoverMembers.filter(m => m.open_to_mentoring).map(m => ({ ...m, isConnected: false }))
                  ];

                  // Apply search filter
                  let filteredMentors = mentors.filter((mentor: any) =>
                    mentor.display_name?.toLowerCase().includes(mentorSearch.toLowerCase())
                  );

                  // Apply specialty filter
                  if (mentorSpecialtyFilter) {
                    filteredMentors = filteredMentors.filter((mentor: any) => {
                      const domains = mentor.strong_domains || [];
                      const specialties = mentor.specialties || [];
                      return domains.includes(mentorSpecialtyFilter) || specialties.includes(mentorSpecialtyFilter);
                    });
                  }

                  const hasActiveFilters = mentorSearch || mentorSpecialtyFilter;

                  return filteredMentors.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center animate-fade-in-up">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center opacity-50">
                        <svg className="w-8 h-8 text-white" fill={hasActiveFilters ? "none" : "currentColor"} viewBox="0 0 24 24" stroke={hasActiveFilters ? "currentColor" : "none"}>
                          {hasActiveFilters ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          ) : (
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          )}
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-100 mb-2">
                        {hasActiveFilters ? "No mentors found" : "No mentors available yet"}
                      </h3>
                      <p className="text-slate-400">
                        {hasActiveFilters
                          ? `No mentors match your search${mentorSpecialtyFilter ? ` in "${mentorSpecialtyFilter}"` : ""}`
                          : "Check back soon as more interpreters join the community!"}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={() => {
                            setMentorSearch("");
                            setMentorSpecialtyFilter(null);
                          }}
                          className="mt-4 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 premium-transition"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {filteredMentors.map((mentor: any, index: number) => (
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
                              <Link href={`/community/profile/${mentor.user_id}`}>
                                {mentor.avatar_url ? (
                                  <img
                                    src={mentor.avatar_url}
                                    alt={mentor.display_name}
                                    className="w-14 h-14 rounded-full object-cover flex-shrink-0 premium-transition hover:scale-105 shadow-lg ring-2 ring-amber-500/30 hover:ring-amber-500/50"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-lg font-bold text-white flex-shrink-0 premium-transition hover:scale-105 shadow-lg shadow-amber-500/20">
                                    {getInitials(mentor.display_name)}
                                  </div>
                                )}
                              </Link>
                              <div className="flex-1 min-w-0">
                                <Link href={`/community/profile/${mentor.user_id}`} className="font-semibold text-slate-100 mb-1 hover:text-amber-400 premium-transition block">{mentor.display_name}</Link>
                                <p className="text-sm text-slate-400 mb-2">
                                  {mentor.years_experience}
                                  {mentor.specialties?.length ? ` · ${mentor.specialties.join(", ")}` : ""}
                                </p>
                                {mentor.bio && (
                                  <p className="text-sm text-slate-300 mb-3 line-clamp-2">{mentor.bio}</p>
                                )}
                                {mentor.isConnected ? (
                                  <button
                                    onClick={() => openOrCreateChat(mentor.user_id)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium premium-button bg-teal-500 text-slate-950"
                                  >
                                    Message
                                  </button>
                                ) : sentRequests.includes(mentor.user_id) ? (
                                  <span className="px-4 py-2 rounded-lg bg-slate-700 text-slate-400 text-sm font-medium cursor-default">
                                    Pending
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleConnect(mentor.user_id)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium premium-button bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                                  >
                                    Connect
                                  </button>
                                )}
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

      {/* Delete Post Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full modal-content shadow-2xl shadow-black/50">
            <div className="p-6">
              {/* Warning Icon */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-slate-100 text-center mb-2">Delete Post?</h3>

              {/* Message */}
              <p className="text-slate-400 text-center mb-6">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>

              {/* Post Preview */}
              <div className="bg-slate-800/50 rounded-lg p-3 mb-6 border border-slate-700">
                <p className="text-slate-300 text-sm line-clamp-3">{postToDelete.content}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setPostToDelete(null)}
                  disabled={deletingPost}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium premium-transition hover:bg-slate-800 hover:border-slate-600 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePost}
                  disabled={deletingPost}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium premium-transition hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deletingPost ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-lg w-full modal-content shadow-2xl shadow-black/50">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-100">Edit Post</h3>
                <button
                  onClick={() => {
                    setEditingPost(null);
                    setEditContent("");
                  }}
                  disabled={savingEdit}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 premium-transition disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Post Type Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  editingPost.post_type === "win" ? "bg-amber-500/20 text-amber-400" :
                  editingPost.post_type === "question" ? "bg-blue-500/20 text-blue-400" :
                  editingPost.post_type === "insight" ? "bg-purple-500/20 text-purple-400" :
                  editingPost.post_type === "reflection" ? "bg-rose-500/20 text-rose-400" :
                  "bg-slate-700 text-slate-300"
                }`}>
                  {editingPost.post_type === "win" ? "Win" :
                   editingPost.post_type === "question" ? "Question" :
                   editingPost.post_type === "insight" ? "Insight" :
                   editingPost.post_type === "reflection" ? "Reflection" :
                   "General"}
                </span>
              </div>

              {/* Edit Content */}
              <div className="mb-4">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  disabled={savingEdit}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none premium-transition disabled:opacity-50"
                  rows={6}
                  maxLength={2000}
                  placeholder="What's on your mind?"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-slate-500">
                    {editContent.length > 0 ? `${2000 - editContent.length} characters remaining` : ""}
                  </p>
                  {editContent !== editingPost.content && (
                    <p className="text-xs text-teal-400">Changes will be saved</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditingPost(null);
                    setEditContent("");
                  }}
                  disabled={savingEdit}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium premium-transition hover:bg-slate-800 hover:border-slate-600 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditedPost}
                  disabled={savingEdit || !editContent.trim() || editContent === editingPost.content}
                  className="flex-1 py-3 rounded-xl bg-teal-500 text-white font-medium premium-transition hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingEdit ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Post Modal - Subtle and non-intrusive */}
      {reportingPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full modal-content shadow-2xl shadow-black/50">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-100">Report Content</h3>
                <button
                  onClick={() => {
                    setReportingPost(null);
                    setReportReason("");
                    setReportDetails("");
                  }}
                  disabled={submittingReport}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 premium-transition disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Description */}
              <p className="text-slate-400 text-sm mb-6">
                Help us understand the problem. Your report is confidential.
              </p>

              {/* Reason Selection */}
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-slate-300">Why are you reporting this?</p>
                {[
                  { value: "spam", label: "Spam or scam" },
                  { value: "harassment", label: "Harassment or bullying" },
                  { value: "inappropriate", label: "Inappropriate content" },
                  { value: "misinformation", label: "Misinformation" },
                  { value: "other", label: "Something else" }
                ].map(option => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer premium-transition ${
                      reportReason === option.value
                        ? "bg-teal-500/10 border border-teal-500/30"
                        : "bg-slate-800/50 border border-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={option.value}
                      checked={reportReason === option.value}
                      onChange={(e) => setReportReason(e.target.value)}
                      disabled={submittingReport}
                      className="w-4 h-4 accent-teal-500"
                    />
                    <span className="text-sm text-slate-200">{option.label}</span>
                  </label>
                ))}
              </div>

              {/* Additional Details (optional) */}
              {reportReason && (
                <div className="mb-4 animate-fade-in-up">
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    disabled={submittingReport}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm premium-transition disabled:opacity-50"
                    rows={3}
                    maxLength={500}
                    placeholder="Provide any additional context..."
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setReportingPost(null);
                    setReportReason("");
                    setReportDetails("");
                  }}
                  disabled={submittingReport}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-medium text-sm premium-transition hover:bg-slate-800 hover:border-slate-600 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReport}
                  disabled={submittingReport || !reportReason}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium text-sm premium-transition hover:bg-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingReport ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal - Instagram-style */}
      {showCommentsModal && commentsPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] flex flex-col modal-content shadow-2xl shadow-black/50">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100">Comments</h2>
              <button
                onClick={() => {
                  setShowCommentsModal(false);
                  setCommentsPost(null);
                  setComments([]);
                  setReplyingTo(null);
                }}
                className="text-slate-400 hover:text-slate-300 text-2xl premium-transition hover:rotate-90 hover:scale-110"
              >
                ×
              </button>
            </div>

            {/* Original Post Preview */}
            <div className="p-4 border-b border-slate-800 bg-slate-800/30">
              <div className="flex items-start gap-3">
                <Link href={`/community/profile/${commentsPost.user_id}`}>
                  {commentsPost.author?.avatar_url ? (
                    <img
                      src={commentsPost.author.avatar_url}
                      alt={commentsPost.author.display_name || "User"}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-700 hover:ring-teal-500/50 premium-transition"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 hover:scale-105 premium-transition">
                      {getInitials(commentsPost.author?.display_name || "?")}
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/community/profile/${commentsPost.user_id}`} className="font-semibold text-slate-100 hover:text-teal-400 premium-transition">{commentsPost.author?.display_name}</Link>
                    <span className="text-slate-500 text-sm">{formatTimeAgo(commentsPost.created_at)}</span>
                  </div>
                  <p className="text-slate-300 text-sm mt-1 line-clamp-3">{commentsPost.content}</p>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-slate-500">No comments yet</p>
                  <p className="text-slate-600 text-sm">Be the first to comment!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <CommentThread
                      key={comment.id}
                      comment={comment}
                      currentUserId={userId}
                      depth={0}
                      maxDepth={3}
                      onReply={startReply}
                      onLike={handleLikeComment}
                      onDelete={handleDeleteComment}
                      formatTimeAgo={formatTimeAgo}
                      renderContent={renderCommentContent}
                      getInitials={getInitials}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t border-slate-800 bg-slate-900">
              {/* Replying to indicator */}
              {replyingTo && (
                <div className="flex items-center justify-between mb-2 px-2 py-1 bg-blue-500/10 rounded-lg">
                  <span className="text-blue-400 text-sm">
                    Replying to <span className="font-semibold">{replyingTo.author.display_name}</span>
                  </span>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setNewCommentText("");
                    }}
                    className="text-slate-400 hover:text-slate-300 text-lg"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="flex items-start gap-3">
                {communityProfile?.avatar_url ? (
                  <img
                    src={communityProfile.avatar_url}
                    alt={communityProfile.display_name || "You"}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {getInitials(communityProfile?.display_name || "?")}
                  </div>
                )}
                <div className="flex-1 flex items-end gap-2">
                  <textarea
                    ref={commentInputRef}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                    placeholder={replyingTo ? `Reply to ${replyingTo.author.display_name}...` : "Add a comment..."}
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-2xl text-slate-100 placeholder-slate-500 resize-none focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 premium-transition min-h-[44px] max-h-32"
                    rows={1}
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newCommentText.trim() || submittingComment}
                    className="p-2.5 rounded-full bg-teal-500 text-white disabled:opacity-50 disabled:cursor-not-allowed premium-transition hover:bg-teal-600 hover:scale-105 active:scale-95"
                  >
                    {submittingComment ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-slate-500 text-xs mt-2 ml-11">Press Enter to send, Shift+Enter for new line</p>
            </div>
          </div>
        </div>
      )}

      {/* Community Guidelines Modal */}
      <GuidelinesModal
        isOpen={showGuidelinesModal}
        onClose={() => setShowGuidelinesModal(false)}
        onAcknowledge={handleAcknowledgeGuidelines}
      />

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

              {/* Image Upload */}
              <div>
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                />
                {newPostImagePreview ? (
                  <div className="relative group animate-fade-in-scale">
                    <img
                      src={newPostImagePreview}
                      alt="Preview"
                      className="w-full max-h-64 object-cover rounded-xl border border-slate-700 shadow-lg shadow-black/20"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 premium-transition" />
                    {/* Remove button */}
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-900/90 backdrop-blur-sm text-slate-300 hover:text-white hover:bg-rose-500 flex items-center justify-center premium-transition hover:scale-110 active:scale-95 shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {/* Change image button */}
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-sm text-slate-300 hover:text-white hover:bg-teal-500 flex items-center gap-1.5 text-sm premium-transition hover:scale-105 active:scale-95 shadow-lg opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-3 px-4 py-5 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/30 text-slate-400 hover:border-teal-500/50 hover:text-teal-400 hover:bg-teal-500/5 premium-transition group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-teal-500/20 premium-transition">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <span className="block font-medium">Add a photo</span>
                      <span className="text-xs text-slate-500 group-hover:text-teal-500/70">JPEG, PNG, GIF, WebP up to 5MB</span>
                    </div>
                  </button>
                )}
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
                    {uploadingImage ? "Uploading image..." : "Posting..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {newPostImage && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    Post
                  </span>
                )}
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
              {selectedMember.avatar_url ? (
                <img
                  src={selectedMember.avatar_url}
                  alt={selectedMember.display_name}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-4 shadow-xl shadow-teal-500/30 premium-transition hover:scale-105 ring-4 ring-slate-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 shadow-xl shadow-teal-500/30 premium-transition hover:scale-105">
                  {getInitials(selectedMember.display_name)}
                </div>
              )}
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
              ) : connectionStatus?.status === "pending" || sentRequests.includes(selectedMember.user_id) ? (
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

            <div className="flex-1 flex flex-col overflow-hidden">
              {!selectedConversation ? (
                <>
                  {/* Search Bar */}
                  <div className="p-3 border-b border-slate-800">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={conversationSearch}
                        onChange={(e) => setConversationSearch(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 premium-transition"
                      />
                      {conversationSearch && (
                        <button
                          onClick={() => setConversationSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="px-2 py-2 border-b border-slate-800 flex gap-1 overflow-x-auto">
                    <button
                      onClick={() => setConversationFilter('all')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap premium-transition ${
                        conversationFilter === 'all'
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      All {conversationCounts.all > 0 && <span className="ml-1 text-slate-500">({conversationCounts.all})</span>}
                    </button>
                    <button
                      onClick={() => setConversationFilter('personal')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap premium-transition flex items-center gap-1.5 ${
                        conversationFilter === 'personal'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Personal {conversationCounts.personal > 0 && <span className="text-emerald-400/60">({conversationCounts.personal})</span>}
                    </button>
                    <button
                      onClick={() => setConversationFilter('mentoring')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap premium-transition flex items-center gap-1.5 ${
                        conversationFilter === 'mentoring'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Mentors {conversationCounts.mentoring > 0 && <span className="text-blue-400/60">({conversationCounts.mentoring})</span>}
                    </button>
                    <button
                      onClick={() => setConversationFilter('teaming')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap premium-transition flex items-center gap-1.5 ${
                        conversationFilter === 'teaming'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'text-slate-400 hover:text-orange-400 hover:bg-orange-500/10'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      Work {conversationCounts.teaming > 0 && <span className="text-orange-400/60">({conversationCounts.teaming})</span>}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                  {loadingConversations ? (
                    <div>
                      <ConversationSkeleton />
                      <ConversationSkeleton />
                      <ConversationSkeleton />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center animate-fade-in-up">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center opacity-50">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-slate-400 mb-4">{conversationSearch ? "No conversations match your search" : "No conversations yet"}</p>
                      {!conversationSearch && (
                        <button
                          onClick={() => setShowNewChatModal(true)}
                          className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium premium-button"
                        >
                          Start a Conversation
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* SECTION 1: Assignments / Work (Orange) */}
                      {filteredConversations.filter(c => c.conversation_type === 'teaming').length > 0 && (
                        <div className="mb-2">
                          <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10">
                            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              Assignments / Work
                            </span>
                          </div>
                          {filteredConversations.filter(c => c.conversation_type === 'teaming').map((conv, index) => {
                            const label = getChatLabel(conv);
                            const labelStyle = chatLabelConfig[label];
                            return (
                              <button
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv.id)}
                                className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/50 premium-transition border-b border-slate-800 group stagger-item"
                                style={{ animationDelay: `${index * 50}ms` }}
                              >
                                {/* Avatar - show stacked for groups */}
                                {conv.is_group && conv.participants.length > 1 ? (
                                  <div className="w-12 h-12 relative flex-shrink-0">
                                    <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-xs font-bold text-white border-2 border-slate-900">
                                      {conv.participants[0]?.avatar || "?"}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white border-2 border-slate-900">
                                      {conv.participants[1]?.avatar || "+"}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-sm font-bold text-white premium-transition group-hover:scale-105">
                                    {getConversationAvatar(conv)}
                                  </div>
                                )}
                                <div className="flex-1 text-left min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`font-medium truncate group-hover:text-orange-400 premium-transition ${conv.unread_count > 0 ? 'text-white font-semibold' : 'text-slate-100'}`}>{getConversationName(conv)}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${labelStyle.bgColor} ${labelStyle.textColor}`}>
                                        {labelStyle.text}
                                      </span>
                                      {conv.unread_count > 0 && (
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" />
                                      )}
                                    </div>
                                    {conv.last_message && (
                                      <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{formatTime(conv.last_message.created_at || "")}</span>
                                    )}
                                  </div>
                                  {conv.assignment && (
                                    <p className="text-xs text-orange-400/80 truncate mb-0.5">
                                      {conv.assignment.title}
                                    </p>
                                  )}
                                  {conv.last_message ? (
                                    <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                                      {conv.last_message.sender_name === "You" ? "You: " : ""}{conv.last_message.content}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-slate-500 italic">No messages yet</p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* SECTION 2: Personal / Friends (Green/Teal) */}
                      {filteredConversations.filter(c => c.conversation_type === 'personal').length > 0 && (
                        <div className="mb-2">
                          <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10">
                            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Personal / Friends
                            </span>
                          </div>
                          {filteredConversations.filter(c => c.conversation_type === 'personal').map((conv, index) => {
                            const label = getChatLabel(conv);
                            const labelStyle = chatLabelConfig[label];
                            return (
                              <button
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv.id)}
                                className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/50 premium-transition border-b border-slate-800 group stagger-item"
                                style={{ animationDelay: `${index * 50}ms` }}
                              >
                                {/* Avatar - show stacked for groups */}
                                {conv.is_group && conv.participants.length > 1 ? (
                                  <div className="w-12 h-12 relative flex-shrink-0">
                                    <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-xs font-bold text-white border-2 border-slate-900">
                                      {conv.participants[0]?.avatar || "?"}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white border-2 border-slate-900">
                                      {conv.participants[1]?.avatar || "+"}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-sm font-bold text-white premium-transition group-hover:scale-105">
                                    {getConversationAvatar(conv)}
                                  </div>
                                )}
                                <div className="flex-1 text-left min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`font-medium truncate group-hover:text-emerald-400 premium-transition ${conv.unread_count > 0 ? 'text-white font-semibold' : 'text-slate-100'}`}>{getConversationName(conv)}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${labelStyle.bgColor} ${labelStyle.textColor}`}>
                                        {labelStyle.text}
                                      </span>
                                      {conv.unread_count > 0 && (
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" />
                                      )}
                                    </div>
                                    {conv.last_message && (
                                      <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{formatTime(conv.last_message.created_at || "")}</span>
                                    )}
                                  </div>
                                  {conv.last_message ? (
                                    <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                                      {conv.last_message.sender_name === "You" ? "You: " : ""}{conv.last_message.content}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-slate-500 italic">No messages yet</p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* SECTION 3: Mentors (Blue) */}
                      {filteredConversations.filter(c => c.conversation_type === 'mentoring').length > 0 && (
                        <div className="mb-2">
                          <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10">
                            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              Mentors
                            </span>
                          </div>
                          {filteredConversations.filter(c => c.conversation_type === 'mentoring').map((conv, index) => {
                            const label = getChatLabel(conv);
                            const labelStyle = chatLabelConfig[label];
                            return (
                              <button
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv.id)}
                                className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/50 premium-transition border-b border-slate-800 group stagger-item"
                                style={{ animationDelay: `${index * 50}ms` }}
                              >
                                {/* Avatar - show stacked for groups */}
                                {conv.is_group && conv.participants.length > 1 ? (
                                  <div className="w-12 h-12 relative flex-shrink-0">
                                    <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white border-2 border-slate-900">
                                      {conv.participants[0]?.avatar || "?"}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white border-2 border-slate-900">
                                      {conv.participants[1]?.avatar || "+"}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-sm font-bold text-white premium-transition group-hover:scale-105">
                                    {getConversationAvatar(conv)}
                                  </div>
                                )}
                                <div className="flex-1 text-left min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`font-medium truncate group-hover:text-blue-400 premium-transition ${conv.unread_count > 0 ? 'text-white font-semibold' : 'text-slate-100'}`}>{getConversationName(conv)}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${labelStyle.bgColor} ${labelStyle.textColor}`}>
                                        {labelStyle.text}
                                      </span>
                                      {conv.unread_count > 0 && (
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" />
                                      )}
                                    </div>
                                    {conv.last_message && (
                                      <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{formatTime(conv.last_message.created_at || "")}</span>
                                    )}
                                  </div>
                                  {conv.last_message ? (
                                    <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                                      {conv.last_message.sender_name === "You" ? "You: " : ""}{conv.last_message.content}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-slate-500 italic">No messages yet</p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-3 p-4 border-b border-slate-800">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="text-slate-400 hover:text-slate-300 premium-transition hover:-translate-x-1"
                    >
                      ←
                    </button>
                    {(() => {
                      const conv = conversations.find(c => c.id === selectedConversation);
                      if (!conv) return null;
                      const label = getChatLabel(conv);
                      const labelStyle = chatLabelConfig[label];
                      const avatarGradient = conv.conversation_type === 'teaming'
                        ? 'bg-gradient-to-br from-orange-500 to-amber-500'
                        : conv.conversation_type === 'mentoring'
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-500'
                          : 'bg-gradient-to-br from-emerald-500 to-teal-500';
                      return (
                        <>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md ${avatarGradient}`}>
                            {getConversationAvatar(conv)}
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-slate-100 truncate">
                              {getConversationName(conv)}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${labelStyle.bgColor} ${labelStyle.textColor}`}>
                              {labelStyle.text}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Assignment Link Banner for Teaming Conversations */}
                  {(() => {
                    const conv = conversations.find(c => c.id === selectedConversation);
                    if (conv?.conversation_type === 'teaming' && conv?.assignment) {
                      return (
                        <a
                          href={`/assignments?id=${conv.assignment.id}`}
                          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-b border-orange-500/20 hover:from-orange-500/20 hover:to-amber-500/20 premium-transition group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-orange-400 truncate group-hover:text-orange-300">
                              {conv.assignment.title}
                            </p>
                            <p className="text-xs text-slate-400">
                              {conv.assignment.date} at {conv.assignment.time} • {conv.assignment.setting}
                            </p>
                          </div>
                          <div className="text-orange-400 group-hover:text-orange-300 group-hover:translate-x-1 premium-transition">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </a>
                      );
                    }
                    return null;
                  })()}

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
                    {/* Quick Status Emoji Bar */}
                    <div className="flex items-center gap-1 mb-3">
                      <span className="text-xs text-slate-500 mr-2">Quick status:</span>
                      {[
                        { emoji: "💚", label: "All good", message: "💚 All good here!" },
                        { emoji: "🔥", label: "On fire", message: "🔥 We're on fire!" },
                        { emoji: "🤔", label: "Thinking", message: "🤔 Need a moment to think..." },
                        { emoji: "⚡", label: "Intense", message: "⚡ Things are getting intense" },
                        { emoji: "👋", label: "Check-in", message: "👋 Just checking in!" }
                      ].map((item) => (
                        <button
                          key={item.emoji}
                          onClick={() => {
                            setNewMessageText(item.message);
                          }}
                          title={item.label}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-lg premium-transition hover:scale-110 active:scale-95"
                        >
                          {item.emoji}
                        </button>
                      ))}
                    </div>
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
                        {conn.user.avatar_url ? (
                          <img
                            src={conn.user.avatar_url}
                            alt={conn.user.display_name}
                            className={`w-10 h-10 rounded-full object-cover premium-transition ring-2 ring-slate-700 ${isSelected ? 'scale-105 ring-teal-500/50' : ''}`}
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white premium-transition ${isSelected ? 'scale-105' : ''}`}>
                            {getInitials(conn.user.display_name)}
                          </div>
                        )}
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
