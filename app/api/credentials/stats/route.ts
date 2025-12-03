import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/credentials/stats
 * Get credential statistics for admin's organization
 * Requires admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Get session
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile and verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin" || !profile.organization_id) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Get credential stats using database function
    const { data: stats, error: statsError } = await supabase.rpc(
      "get_organization_credential_stats",
      { org_id: profile.organization_id }
    );

    if (statsError) {
      console.error("Error fetching credential stats:", statsError);
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }

    // Get total interpreters count
    const { count: interpreterCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id);

    return NextResponse.json({
      stats: stats?.[0] || {
        total_credentials: 0,
        active_count: 0,
        expiring_soon_count: 0,
        expired_count: 0
      },
      total_interpreters: interpreterCount || 0
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
