"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import Link from "next/link";

// Animation styles
const animationStyles = `
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

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  @keyframes heartPop {
    0% { transform: scale(1); }
    25% { transform: scale(1.3); }
    50% { transform: scale(0.9); }
    75% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.4s ease-out forwards;
  }

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

  .animate-heart-pop {
    animation: heartPop 0.4s ease-out;
  }

  .premium-card {
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .premium-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.4);
  }

  .stagger-item {
    opacity: 0;
    animation: fadeInUp 0.4s ease-out forwards;
  }

  .stagger-item:nth-child(1) { animation-delay: 0ms; }
  .stagger-item:nth-child(2) { animation-delay: 50ms; }
  .stagger-item:nth-child(3) { animation-delay: 100ms; }
  .stagger-item:nth-child(4) { animation-delay: 150ms; }
  .stagger-item:nth-child(5) { animation-delay: 200ms; }
`;

// Types
interface CommunityProfile {
  user_id: string;
  display_name: string;
  bio: string | null;
  years_experience: string | number | null;
  specialties: string[] | null;
  strong_domains: string[] | null;
  weak_domains: string[] | null;
  open_to_mentoring: boolean | null;
  looking_for_mentor: boolean | null;
  is_deaf_interpreter: boolean | null;
  offer_support_in?: string[] | null;
  seeking_guidance_in?: string[] | null;
  avatar_url?: string | null;
  connections_count?: number;
  posts_count?: number;
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
}

// Post type configurations
const POST_TYPES = {
  general: { label: "Post", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", color: "slate" },
  win: { label: "Win", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", color: "amber" },
  question: { label: "Question", icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "blue" },
  insight: { label: "Insight", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", color: "violet" },
  reflection: { label: "Reflection", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", color: "rose" }
};

// Skeleton components
const ProfileHeaderSkeleton = () => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full skeleton-shimmer bg-slate-800" />
      <div className="flex-1 text-center md:text-left">
        <div className="h-8 w-48 rounded skeleton-shimmer bg-slate-800 mx-auto md:mx-0 mb-3" />
        <div className="h-4 w-32 rounded skeleton-shimmer bg-slate-800 mx-auto md:mx-0 mb-4" />
        <div className="h-16 w-full rounded skeleton-shimmer bg-slate-800 mb-4" />
        <div className="flex gap-4 justify-center md:justify-start">
          <div className="h-10 w-24 rounded-lg skeleton-shimmer bg-slate-800" />
          <div className="h-10 w-24 rounded-lg skeleton-shimmer bg-slate-800" />
        </div>
      </div>
    </div>
  </div>
);

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
        </div>
      </div>
    </div>
    <div className="p-4 space-y-2">
      <div className="h-4 w-full rounded skeleton-shimmer bg-slate-800" />
      <div className="h-4 w-3/4 rounded skeleton-shimmer bg-slate-800" />
    </div>
    <div className="px-4 pb-4 flex items-center gap-4">
      <div className="h-8 w-16 rounded-lg skeleton-shimmer bg-slate-800" />
      <div className="h-8 w-16 rounded-lg skeleton-shimmer bg-slate-800" />
    </div>
  </div>
);

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const profileUserId = params.userId as string;

  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Get auth token
  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, []);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/community/profile?view_user_id=${profileUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to load profile");
        return;
      }

      const data = await response.json();
      setProfile(data.profile);
      setConnectionStatus(data.connection_status);
      setConnectionId(data.connection_id);
      setIsOwnProfile(data.is_own_profile);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
    }
  }, [profileUserId, getAuthToken, router]);

  // Fetch user's posts
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`/api/community/posts?author_id=${profileUserId}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  }, [profileUserId, getAuthToken]);

  // Handle connect/disconnect
  const handleConnection = async (action: "connect" | "disconnect" | "cancel" | "accept") => {
    setActionLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      if (action === "connect") {
        const response = await fetch("/api/community/connections", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ addressee_id: profileUserId })
        });

        if (response.ok) {
          setConnectionStatus("pending");
        }
      } else if (action === "disconnect" || action === "cancel") {
        if (!connectionId) return;
        const response = await fetch(`/api/community/connections?connection_id=${connectionId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          setConnectionStatus(null);
          setConnectionId(null);
        }
      } else if (action === "accept") {
        if (!connectionId) return;
        const response = await fetch("/api/community/connections", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ connection_id: connectionId, action: "accept" })
        });

        if (response.ok) {
          setConnectionStatus("accepted");
          // Refresh profile to update connection count
          fetchProfile();
        }
      }
    } catch (err) {
      console.error("Connection action error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle like post
  const handleLikePost = async (postId: string, isLiked: boolean) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch("/api/community/posts/like", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ post_id: postId, action: isLiked ? "unlike" : "like" })
      });

      if (response.ok) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              liked_by_user: !isLiked,
              likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
            };
          }
          return post;
        }));
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setCurrentUserId(session.user.id);
      setLoading(false);
    };
    init();
  }, [router]);

  // Fetch data when ready
  useEffect(() => {
    if (!loading && currentUserId && profileUserId) {
      fetchProfile();
      fetchPosts();
    }
  }, [loading, currentUserId, profileUserId, fetchProfile, fetchPosts]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950">
        <NavBar />
        <div className="pt-20 px-4">
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Profile Not Found</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <Link
              href="/community"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Community
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      <NavBar />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 premium-transition hover:-translate-x-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Community
          </Link>

          {/* Profile Header */}
          {!profile ? (
            <ProfileHeaderSkeleton />
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 mb-6 animate-fade-in-up">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <div className="relative">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-slate-700"
                    />
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center border-4 border-slate-700">
                      <span className="text-4xl md:text-5xl font-bold text-white">
                        {profile.display_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {profile.open_to_mentoring && (
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      Mentor
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                    {profile.display_name}
                  </h1>

                  {/* Experience & Tags */}
                  <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start mb-4">
                    {profile.years_experience && (
                      <span className="text-sm text-slate-400">
                        {profile.years_experience} years experience
                      </span>
                    )}
                    {profile.is_deaf_interpreter && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                        Deaf Interpreter
                      </span>
                    )}
                    {profile.looking_for_mentor && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                        Seeking Mentor
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-slate-300 mb-4 max-w-2xl">{profile.bio}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-6 justify-center md:justify-start mb-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">{profile.connections_count || 0}</div>
                      <div className="text-xs text-slate-400">Friends</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">{profile.posts_count || 0}</div>
                      <div className="text-xs text-slate-400">Posts</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!isOwnProfile && (
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      {connectionStatus === "accepted" ? (
                        <button
                          onClick={() => handleConnection("disconnect")}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg premium-transition hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                          </svg>
                          Connected
                        </button>
                      ) : connectionStatus === "pending" ? (
                        <button
                          onClick={() => handleConnection("cancel")}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 rounded-lg premium-transition hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pending
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnection("connect")}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg premium-transition hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          Connect
                        </button>
                      )}
                    </div>
                  )}

                  {isOwnProfile && (
                    <Link
                      href="/settings"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg premium-transition hover:scale-105 active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </Link>
                  )}
                </div>
              </div>

              {/* Domains/Specialties */}
              {(profile.strong_domains?.length || profile.specialties?.length || profile.offer_support_in?.length) && (
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Areas of Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {[...(profile.strong_domains || []), ...(profile.specialties || []), ...(profile.offer_support_in || [])]
                      .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
                      .map((domain, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-teal-500/20 text-teal-300 text-sm rounded-full premium-transition hover:bg-teal-500/30 hover:scale-105"
                        >
                          {domain}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Seeking guidance in */}
              {(profile.weak_domains?.length || profile.seeking_guidance_in?.length) && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Seeking Guidance In</h3>
                  <div className="flex flex-wrap gap-2">
                    {[...(profile.weak_domains || []), ...(profile.seeking_guidance_in || [])]
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .map((domain, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full premium-transition hover:bg-blue-500/30 hover:scale-105"
                        >
                          {domain}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Posts Section */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              {isOwnProfile ? "Your Posts" : "Posts"}
              <span className="text-sm font-normal text-slate-400">({posts.length})</span>
            </h2>

            {loadingPosts ? (
              <div className="space-y-4">
                <PostSkeleton />
                <PostSkeleton />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-slate-800 bg-slate-900/50">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <p className="text-slate-400">
                  {isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post, index) => {
                  const postType = POST_TYPES[post.post_type] || POST_TYPES.general;
                  return (
                    <div
                      key={post.id}
                      className="stagger-item rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden premium-card"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Post Header */}
                      <div className="p-4 pb-0">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          {post.author.avatar_url ? (
                            <img
                              src={post.author.avatar_url}
                              alt={post.author.display_name}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-white">
                                {post.author.display_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white truncate">
                                {post.author.display_name}
                              </span>
                              <span className="text-xs text-slate-500">•</span>
                              <span className="text-xs text-slate-500">{formatDate(post.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-${postType.color}-500/20 text-${postType.color}-300`}>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={postType.icon} />
                                </svg>
                                {postType.label}
                              </span>
                              {post.is_edited && (
                                <span className="text-xs text-slate-500">(edited)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="p-4">
                        <p className="text-slate-200 whitespace-pre-wrap">{post.content}</p>

                        {post.image_url && (
                          <div className="mt-3 rounded-lg overflow-hidden">
                            <img
                              src={post.image_url}
                              alt="Post image"
                              className="max-h-96 w-auto object-contain"
                            />
                          </div>
                        )}

                        {/* Tags */}
                        {(post.ecci_domains?.length > 0 || post.setting_tags?.length > 0) && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {post.ecci_domains?.map((domain, i) => (
                              <span key={`d-${i}`} className="px-2 py-0.5 bg-teal-500/20 text-teal-300 text-xs rounded-full">
                                {domain}
                              </span>
                            ))}
                            {post.setting_tags?.map((tag, i) => (
                              <span key={`t-${i}`} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Post Actions */}
                      <div className="px-4 pb-4 flex items-center gap-4">
                        <button
                          onClick={() => handleLikePost(post.id, post.liked_by_user)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                            post.liked_by_user
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                          }`}
                        >
                          <svg
                            className={`w-4 h-4 ${post.liked_by_user ? "animate-heart-pop" : ""}`}
                            fill={post.liked_by_user ? "currentColor" : "none"}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span className="text-sm">{post.likes_count}</span>
                        </button>
                        <Link
                          href={`/community?post=${post.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="text-sm">{post.comments_count}</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
