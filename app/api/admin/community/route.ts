import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = [
  "maddox@interpretreflect.com",
  "admin@interpretreflect.com",
  "sarah@interpretreflect.com",
];

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return { error: "Unauthorized", status: 401 };
  }

  // Check if admin by email or role
  const isAdminEmail = ADMIN_EMAILS.includes(user.email || "");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdminRole = profile?.role === "admin" || profile?.role === "super_admin";

  if (!isAdminEmail && !isAdminRole) {
    return { error: "Forbidden: Admin access required", status: 403 };
  }

  return { user, profile };
}

// GET - Fetch community moderation data
export async function GET(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") || "users";

  try {
    if (view === "users") {
      // Get all community users with their moderation status
      const { data: users, error } = await supabaseAdmin
        .from("community_profiles")
        .select(`
          user_id,
          display_name,
          bio,
          is_banned,
          banned_at,
          ban_reason,
          is_suspended,
          suspended_at,
          suspended_until,
          suspension_reason,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get user profiles for names and emails
      const userIds = users?.map(u => u.user_id) || [];

      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap: Record<string, any> = {};
      profiles?.forEach(p => { profileMap[p.id] = p; });

      // Get warning counts for each user
      const { data: warnings } = await supabaseAdmin
        .from("community_user_warnings")
        .select("user_id")
        .in("user_id", userIds);

      const warningCounts: Record<string, number> = {};
      warnings?.forEach(w => {
        warningCounts[w.user_id] = (warningCounts[w.user_id] || 0) + 1;
      });

      const usersWithData = users?.map(u => ({
        ...u,
        warning_count: warningCounts[u.user_id] || 0,
        profiles: profileMap[u.user_id] || null
      }));

      return NextResponse.json({ users: usersWithData });
    }

    if (view === "moderation_log") {
      const { data: logs, error } = await supabaseAdmin
        .from("community_moderation_log")
        .select(`
          id,
          admin_id,
          target_user_id,
          target_post_id,
          target_comment_id,
          action_type,
          reason,
          details,
          created_at
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get admin and target user info from profiles table
      const adminIds = [...new Set(logs?.map(l => l.admin_id) || [])];
      const targetIds = [...new Set(logs?.map(l => l.target_user_id).filter(Boolean) || [])];

      const { data: adminProfiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", adminIds);

      const { data: targetProfiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", targetIds);

      const { data: targetCommunityProfiles } = await supabaseAdmin
        .from("community_profiles")
        .select("user_id, display_name")
        .in("user_id", targetIds);

      const adminMap: Record<string, any> = {};
      adminProfiles?.forEach(a => { adminMap[a.id] = a; });

      const targetProfileMap: Record<string, any> = {};
      targetProfiles?.forEach(t => { targetProfileMap[t.id] = t; });

      const targetCommunityMap: Record<string, any> = {};
      targetCommunityProfiles?.forEach(t => { targetCommunityMap[t.user_id] = t; });

      const logsWithData = logs?.map(l => ({
        ...l,
        action: l.action_type, // Map action_type to action for UI
        admin_user: adminMap[l.admin_id] || null,
        target_user: {
          profiles: targetProfileMap[l.target_user_id] || null,
          display_name: targetCommunityMap[l.target_user_id]?.display_name || null
        }
      }));

      return NextResponse.json({ logs: logsWithData });
    }

    if (view === "warnings") {
      const userId = searchParams.get("user_id");

      let query = supabaseAdmin
        .from("community_user_warnings")
        .select("*")
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data: warnings, error } = await query.limit(100);
      if (error) throw error;

      return NextResponse.json({ warnings });
    }

    if (view === "stats") {
      const { data: totalUsers } = await supabaseAdmin
        .from("community_profiles")
        .select("user_id", { count: "exact", head: true });

      const { data: bannedUsers } = await supabaseAdmin
        .from("community_profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("is_banned", true);

      const { data: suspendedUsers } = await supabaseAdmin
        .from("community_profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("is_suspended", true);

      const { data: recentActions } = await supabaseAdmin
        .from("community_moderation_log")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      return NextResponse.json({
        stats: {
          total_users: totalUsers,
          banned_users: bannedUsers,
          suspended_users: suspendedUsers,
          recent_actions: recentActions
        }
      });
    }

    return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 });

  } catch (error: any) {
    console.error("Admin community GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Perform moderation actions
export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { action, user_id, reason, days, post_id, comment_id } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const adminId = auth.user.id;

    switch (action) {
      case "ban": {
        if (!user_id || !reason) {
          return NextResponse.json({ error: "user_id and reason are required" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin.rpc("ban_community_user", {
          p_admin_id: adminId,
          p_user_id: user_id,
          p_reason: reason
        });

        if (error) throw error;
        return NextResponse.json(data);
      }

      case "unban": {
        if (!user_id) {
          return NextResponse.json({ error: "user_id is required" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin.rpc("unban_community_user", {
          p_admin_id: adminId,
          p_user_id: user_id,
          p_reason: reason || "Ban lifted by admin"
        });

        if (error) throw error;
        return NextResponse.json(data);
      }

      case "suspend": {
        if (!user_id || !reason) {
          return NextResponse.json({ error: "user_id and reason are required" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin.rpc("suspend_community_user", {
          p_admin_id: adminId,
          p_user_id: user_id,
          p_reason: reason,
          p_days: days || 7
        });

        if (error) throw error;
        return NextResponse.json(data);
      }

      case "unsuspend": {
        if (!user_id) {
          return NextResponse.json({ error: "user_id is required" }, { status: 400 });
        }

        // Clear suspension
        const { error: updateError } = await supabaseAdmin
          .from("community_profiles")
          .update({
            is_suspended: false,
            suspended_at: null,
            suspended_until: null,
            suspension_reason: null,
            suspended_by: null
          })
          .eq("user_id", user_id);

        if (updateError) throw updateError;

        // Log the action
        await supabaseAdmin.from("community_moderation_log").insert({
          admin_id: adminId,
          target_user_id: user_id,
          action_type: "unsuspend",
          reason: reason || "Suspension lifted by admin"
        });

        return NextResponse.json({ success: true, message: "Suspension lifted" });
      }

      case "warn": {
        if (!user_id || !reason) {
          return NextResponse.json({ error: "user_id and reason are required" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin.rpc("warn_community_user", {
          p_admin_id: adminId,
          p_user_id: user_id,
          p_reason: reason,
          p_post_id: post_id || null,
          p_comment_id: comment_id || null
        });

        if (error) throw error;
        return NextResponse.json(data);
      }

      case "delete_post": {
        if (!post_id) {
          return NextResponse.json({ error: "post_id is required" }, { status: 400 });
        }

        // Get post info first
        const { data: post } = await supabaseAdmin
          .from("community_posts")
          .select("user_id, content")
          .eq("id", post_id)
          .single();

        // Soft delete the post
        const { error: deleteError } = await supabaseAdmin
          .from("community_posts")
          .update({ is_deleted: true })
          .eq("id", post_id);

        if (deleteError) throw deleteError;

        // Log the action
        await supabaseAdmin.from("community_moderation_log").insert({
          admin_id: adminId,
          target_user_id: post?.user_id,
          target_post_id: post_id,
          action_type: "delete_post",
          reason: reason || "Post removed by admin",
          details: { content_preview: post?.content?.substring(0, 100) }
        });

        return NextResponse.json({ success: true, message: "Post deleted" });
      }

      case "delete_comment": {
        if (!comment_id) {
          return NextResponse.json({ error: "comment_id is required" }, { status: 400 });
        }

        // Get comment info first
        const { data: comment } = await supabaseAdmin
          .from("post_comments")
          .select("user_id, content, post_id")
          .eq("id", comment_id)
          .single();

        // Soft delete the comment
        const { error: deleteError } = await supabaseAdmin
          .from("post_comments")
          .update({ is_deleted: true })
          .eq("id", comment_id);

        if (deleteError) throw deleteError;

        // Log the action
        await supabaseAdmin.from("community_moderation_log").insert({
          admin_id: adminId,
          target_user_id: comment?.user_id,
          target_post_id: comment?.post_id,
          target_comment_id: comment_id,
          action_type: "delete_comment",
          reason: reason || "Comment removed by admin",
          details: { content_preview: comment?.content?.substring(0, 100) }
        });

        return NextResponse.json({ success: true, message: "Comment deleted" });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Admin community POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
