import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

/**
 * End session endpoint - handles sendBeacon requests on page unload
 * This ensures session data is captured even when user closes tab
 */
export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { session_id, tools_accessed, reflections_completed, user_mood_end } = body;

    if (!session_id) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    // Verify the session belongs to the authenticated user
    const { data: session } = await supabaseAdmin
      .from("user_sessions")
      .select("user_id")
      .eq("id", session_id)
      .single();

    if (!session || session.user_id !== user!.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // End the session
    const { error } = await supabaseAdmin.rpc("end_user_session", {
      p_session_id: session_id,
      p_tools_accessed: tools_accessed || [],
      p_reflections_completed: reflections_completed || 0,
      p_user_mood_end: user_mood_end || null,
    });

    if (error) {
      console.error("End session error:", error);
      return NextResponse.json({ error: "Failed to end session" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("End session error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
