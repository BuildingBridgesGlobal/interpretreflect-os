"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Notification types
type NotificationType =
  | "comment_on_post"
  | "reply_to_comment"
  | "reaction_on_post"
  | "connection_request"
  | "connection_accepted"
  | "mention";

interface Notification {
  id: string;
  type: NotificationType;
  actor_user_id: string | null;
  post_id: string | null;
  comment_id: string | null;
  reaction_type: string | null;
  is_read: boolean;
  created_at: string;
  actor: {
    display_name: string;
    avatar_url: string | null;
  } | null;
  post: {
    content: string;
    post_type: string;
  } | null;
}

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAgencyAdmin, setIsAgencyAdmin] = useState(false);
  const [learnDropdownOpen, setLearnDropdownOpen] = useState(false);
  const learnDropdownRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Check if user is logged in
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          checkAgencyAdmin(session.user.id);
        }
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          checkAgencyAdmin(session.user.id);
        } else {
          setIsAgencyAdmin(false);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const checkAgencyAdmin = async (userId: string) => {
    try {
      // Use the RPC function to avoid RLS recursion issues
      const { data: isAdmin, error } = await (supabase as any)
        .rpc("is_org_admin", { p_user_id: userId });

      // Silently handle errors - user just won't see agency link
      if (error) {
        setIsAgencyAdmin(false);
        return;
      }

      setIsAgencyAdmin(isAdmin === true);
    } catch {
      // Function might not exist or other error - silently fail
      setIsAgencyAdmin(false);
    }
  };

  // Close Learn dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (learnDropdownRef.current && !learnDropdownRef.current.contains(event.target as Node)) {
        setLearnDropdownOpen(false);
      }
    };

    if (learnDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [learnDropdownOpen]);

  // Fetch notification count
  const fetchNotificationCount = useCallback(async () => {
    if (!user) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) return;

      const response = await fetch("/api/notifications/count", {
        headers: {
          "Authorization": `Bearer ${session.session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  }, [user]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoadingNotifications(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) return;

      const response = await fetch("/api/notifications?limit=10", {
        headers: {
          "Authorization": `Bearer ${session.session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [user]);

  // Mark notifications as read
  const markAsRead = async (notificationIds?: string[]) => {
    if (!user) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) return;

      const body = notificationIds
        ? { notification_ids: notificationIds }
        : { mark_all_read: true };

      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${session.session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);

        // Update local notifications state
        if (notificationIds) {
          setNotifications(prev =>
            prev.map(n =>
              notificationIds.includes(n.id) ? { ...n, is_read: true } : n
            )
          );
        } else {
          setNotifications(prev =>
            prev.map(n => ({ ...n, is_read: true }))
          );
        }
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Poll for notification count every 30 seconds
  useEffect(() => {
    if (user) {
      fetchNotificationCount();
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotificationCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (notificationOpen && user) {
      fetchNotifications();
    }
  }, [notificationOpen, user, fetchNotifications]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };

    if (notificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationOpen]);

  // Get notification message
  const getNotificationMessage = (notification: Notification): string => {
    const actorName = notification.actor?.display_name || "Someone";

    switch (notification.type) {
      case "comment_on_post":
        return `${actorName} commented on your post`;
      case "reply_to_comment":
        return `${actorName} replied to your comment`;
      case "reaction_on_post":
        const reactionEmoji = {
          celebration: "🙌",
          thinking: "💭",
          fire: "🔥",
          solidarity: "🫂"
        }[notification.reaction_type || ""] || "👍";
        return `${actorName} reacted ${reactionEmoji} to your post`;
      case "connection_request":
        return `${actorName} wants to connect`;
      case "connection_accepted":
        return `${actorName} accepted your connection request`;
      case "mention":
        return `${actorName} mentioned you`;
      default:
        return "You have a new notification";
    }
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      markAsRead([notification.id]);
    }

    // Navigate to the relevant page
    if (notification.post_id) {
      router.push(`/community?post=${notification.post_id}`);
    } else if (notification.type === "connection_request" || notification.type === "connection_accepted") {
      router.push("/community?tab=friends");
    }

    setNotificationOpen(false);
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      router.push("/");
    }
  };

  const isActive = (path: string) => pathname === path;
  const isLearnActive = () =>
    pathname?.startsWith("/skills") ||
    pathname?.startsWith("/workshops") ||
    pathname?.startsWith("/ceu");

  return (
    <nav className="border-b border-white/[0.06] bg-ir-bg-primary/95 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - links to dashboard when logged in, landing page when not */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <span className="text-xl font-semibold text-slate-100">
              Interpret<span className="text-teal-400">Reflect</span>
            </span>
          </Link>

          {/* Navigation Links - Only show if user is logged in */}
          {mounted && user && (
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "text-teal-400"
                    : "text-slate-300 hover:text-teal-300"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/assignments"
                className={`text-sm font-medium transition-colors ${
                  isActive("/assignments") || pathname?.startsWith("/assignments")
                    ? "text-teal-400"
                    : "text-slate-300 hover:text-teal-300"
                }`}
              >
                Assignments
              </Link>

              {/* Learn Dropdown */}
              <div className="relative" ref={learnDropdownRef}>
                <button
                  onClick={() => setLearnDropdownOpen(!learnDropdownOpen)}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                    isLearnActive()
                      ? "text-teal-400"
                      : "text-slate-300 hover:text-teal-300"
                  }`}
                >
                  Learn
                  <svg
                    className={`w-4 h-4 transition-transform ${learnDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {learnDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 rounded-lg border border-slate-700 bg-slate-950 shadow-xl shadow-black/50 z-20 overflow-hidden">
                    <div className="py-1">
                      <Link
                        href="/skills"
                        onClick={() => setLearnDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isActive("/skills")
                            ? "bg-teal-500/10 text-teal-400"
                            : "text-slate-200 hover:bg-slate-800 hover:text-teal-300"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                        <div>
                          <div className="font-medium">Skills Library</div>
                          <div className="text-xs text-slate-500">Micro-learning modules</div>
                        </div>
                      </Link>
                      <Link
                        href="/workshops"
                        onClick={() => setLearnDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          pathname?.startsWith("/workshops")
                            ? "bg-teal-500/10 text-teal-400"
                            : "text-slate-200 hover:bg-slate-800 hover:text-teal-300"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                        </svg>
                        <div>
                          <div className="font-medium">CEU Workshops</div>
                          <div className="text-xs text-slate-500">Earn CEUs with RID-approved content</div>
                        </div>
                      </Link>
                      <div className="border-t border-slate-800 my-1" />
                      <Link
                        href="/ceu"
                        onClick={() => setLearnDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isActive("/ceu")
                            ? "bg-teal-500/10 text-teal-400"
                            : "text-slate-200 hover:bg-slate-800 hover:text-teal-300"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <div>
                          <div className="font-medium">My CEUs</div>
                          <div className="text-xs text-slate-500">View certificates & progress</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/community"
                className={`text-sm font-medium transition-colors ${
                  isActive("/community")
                    ? "text-teal-400"
                    : "text-slate-300 hover:text-teal-300"
                }`}
              >
                Community
              </Link>
              <Link
                href="/wellness"
                className={`text-sm font-medium transition-colors ${
                  isActive("/wellness")
                    ? "text-teal-400"
                    : "text-slate-300 hover:text-teal-300"
                }`}
              >
                Wellness
              </Link>
            </div>
          )}

          {/* Mobile Menu Button & Auth Buttons */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button - only show when logged in */}
            {mounted && user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-300 hover:text-teal-300 hover:bg-slate-800 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            )}

            {!mounted ? (
              // Placeholder to prevent hydration mismatch - shows nothing during SSR
              <div className="h-10 w-24" />
            ) : user ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setNotificationOpen(!notificationOpen)}
                    className="relative p-2 rounded-lg text-slate-300 hover:text-teal-300 hover:bg-slate-800 transition-colors"
                    aria-label="Notifications"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {/* Badge */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-700 bg-slate-950 shadow-xl shadow-black/50 z-20 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                        <h3 className="font-semibold text-slate-100">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAsRead()}
                            className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-96 overflow-y-auto">
                        {loadingNotifications ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="text-center py-8 px-4">
                            <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <p className="text-slate-400 text-sm">No notifications yet</p>
                            <p className="text-slate-500 text-xs mt-1">We&apos;ll notify you when someone interacts with your posts</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 last:border-0 ${
                                !notification.is_read ? "bg-teal-500/5" : ""
                              }`}
                            >
                              {/* Avatar or Icon */}
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                {notification.actor?.avatar_url ? (
                                  <img
                                    src={notification.actor.avatar_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-lg">
                                    {notification.type === "comment_on_post" ? "💬" :
                                     notification.type === "reply_to_comment" ? "↩️" :
                                     notification.type === "reaction_on_post" ? (
                                       notification.reaction_type === "celebration" ? "🙌" :
                                       notification.reaction_type === "thinking" ? "💭" :
                                       notification.reaction_type === "fire" ? "🔥" :
                                       notification.reaction_type === "solidarity" ? "🫂" : "👍"
                                     ) :
                                     notification.type === "connection_request" ? "👋" :
                                     notification.type === "connection_accepted" ? "🤝" : "🔔"}
                                  </span>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notification.is_read ? "text-slate-100" : "text-slate-300"}`}>
                                  {getNotificationMessage(notification)}
                                </p>
                                {notification.post && (
                                  <p className="text-xs text-slate-500 truncate mt-0.5">
                                    &ldquo;{notification.post.content}&rdquo;
                                  </p>
                                )}
                                <p className="text-xs text-slate-500 mt-1">
                                  {formatRelativeTime(notification.created_at)}
                                </p>
                              </div>

                              {/* Unread indicator */}
                              {!notification.is_read && (
                                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-teal-400 mt-2" />
                              )}
                            </button>
                          ))
                        )}
                      </div>

                      {/* Footer - View All */}
                      {notifications.length > 0 && (
                        <div className="border-t border-slate-800 px-4 py-2">
                          <Link
                            href="/community?tab=notifications"
                            onClick={() => setNotificationOpen(false)}
                            className="block text-center text-sm text-teal-400 hover:text-teal-300 transition-colors py-1"
                          >
                            View all notifications
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.02] px-4 py-2 text-sm font-medium text-slate-200 hover:border-teal-500/30 hover:text-teal-300 transition-colors"
                  >
                    <span className="max-w-[150px] truncate">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Account'}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <>
                      {/* Backdrop to close dropdown when clicking outside */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setDropdownOpen(false)}
                      />

                      {/* Dropdown Menu */}
                      <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-700 bg-slate-950 shadow-xl shadow-black/50 z-20">
                        <div className="py-1">
                          {isAgencyAdmin && (
                            <Link
                              href="/agency"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-teal-300 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Agency Dashboard
                            </Link>
                          )}
                          <Link
                            href="/journal"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-teal-300 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Journal
                          </Link>
                          <Link
                            href="/settings"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-teal-300 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                          </Link>
                          <a
                            href="mailto:support@interpretreflect.com"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-teal-300 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Help & Support
                          </a>
                          <div className="border-t border-white/[0.06] my-1" />
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              handleLogout();
                            }}
                            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-teal-300 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="rounded-lg border border-white/[0.1] px-4 py-2 text-sm font-medium text-slate-200 hover:border-teal-500/30 hover:text-teal-300 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mounted && user && mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-slate-950 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile Menu Panel */}
          <div className="md:hidden fixed top-16 left-0 right-0 bg-slate-950 border-b border-slate-800 z-50 shadow-xl shadow-black/50 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="container mx-auto max-w-7xl px-4 py-4">
              <div className="flex flex-col gap-1">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/dashboard")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/assignments"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/assignments") || pathname?.startsWith("/assignments")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  Assignments
                </Link>

                {/* Learn Section Header */}
                <div className="px-4 py-2 mt-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Learn</p>
                </div>
                <Link
                  href="/skills"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/skills")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  Skills Library
                </Link>
                <Link
                  href="/workshops"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname?.startsWith("/workshops")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  CEU Workshops
                </Link>
                <Link
                  href="/ceu"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/ceu")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  My CEUs
                </Link>

                {/* Connect Section */}
                <div className="px-4 py-2 mt-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Connect</p>
                </div>
                <Link
                  href="/community"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/community")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  Community
                </Link>
                <Link
                  href="/wellness"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/wellness")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  Wellness
                </Link>

                {/* Account Section */}
                <div className="px-4 py-2 mt-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</p>
                </div>
                <Link
                  href="/journal"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/journal")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  Journal
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/settings")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  Settings
                </Link>
                {isAgencyAdmin && (
                  <Link
                    href="/agency"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive("/agency")
                        ? "bg-violet-500/20 text-violet-400"
                        : "text-slate-300 hover:bg-slate-800 hover:text-violet-300"
                    }`}
                  >
                    Agency Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
