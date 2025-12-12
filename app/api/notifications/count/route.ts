import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// GET - Get unread notification count (lightweight endpoint for polling)
export async function GET(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    // Get unread count
    const { count: unreadCount, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error fetching notification count:", error);
      return NextResponse.json(
        { error: "Failed to fetch notification count" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      unread_count: unreadCount || 0
    });

  } catch (error: any) {
    console.error("Notification count error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
