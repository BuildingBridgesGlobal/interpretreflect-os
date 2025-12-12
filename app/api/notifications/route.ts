import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// GET - Fetch user's notifications
export async function GET(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unread_only") === "true";

    // Build query for notifications
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: notifications, error: notificationsError } = await query;

    if (notificationsError) {
      console.error("Error fetching notifications:", notificationsError);
      return NextResponse.json(
        { error: "Failed to fetch notifications", details: notificationsError.message },
        { status: 500 }
      );
    }

    if (!notifications || notifications.length === 0) {
      // Get unread count even if no notifications in current page
      const { count: unreadCount } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      return NextResponse.json({
        notifications: [],
        unread_count: unreadCount || 0,
        has_more: false
      });
    }

    // Get actor profiles for notifications
    const actorIds = [...new Set(notifications.filter(n => n.actor_user_id).map(n => n.actor_user_id))];
    const { data: profiles } = await supabase
      .from("community_profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", actorIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Get post details for notifications that reference posts
    const postIds = [...new Set(notifications.filter(n => n.post_id).map(n => n.post_id))];
    let postMap = new Map();
    if (postIds.length > 0) {
      const { data: posts } = await supabase
        .from("community_posts")
        .select("id, content, post_type")
        .in("id", postIds);
      postMap = new Map(posts?.map(p => [p.id, p]) || []);
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    // Combine data
    const notificationsWithDetails = notifications.map(notification => {
      const actor = profileMap.get(notification.actor_user_id);
      const post = postMap.get(notification.post_id);

      return {
        ...notification,
        actor: actor ? {
          display_name: actor.display_name,
          avatar_url: actor.avatar_url
        } : null,
        post: post ? {
          content: post.content.substring(0, 100) + (post.content.length > 100 ? "..." : ""),
          post_type: post.post_type
        } : null
      };
    });

    return NextResponse.json({
      notifications: notificationsWithDetails,
      unread_count: unreadCount || 0,
      has_more: notifications.length === limit
    });

  } catch (error: any) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const body = await req.json();
    const { notification_ids, mark_all_read } = body;

    if (mark_all_read) {
      // Mark all notifications as read
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (updateError) {
        console.error("Error marking all as read:", updateError);
        return NextResponse.json(
          { error: "Failed to mark notifications as read" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read"
      });
    }

    if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
      return NextResponse.json(
        { error: "notification_ids array is required" },
        { status: 400 }
      );
    }

    // Mark specific notifications as read
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .in("id", notification_ids);

    if (updateError) {
      console.error("Error marking notifications as read:", updateError);
      return NextResponse.json(
        { error: "Failed to mark notifications as read" },
        { status: 500 }
      );
    }

    // Get new unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    return NextResponse.json({
      success: true,
      unread_count: unreadCount || 0
    });

  } catch (error: any) {
    console.error("Mark notifications read error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
