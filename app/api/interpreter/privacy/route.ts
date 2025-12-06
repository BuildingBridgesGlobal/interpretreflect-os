import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Verify the user from the Authorization header
 */
async function verifyAuthAndGetUser(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user.id;
}

/**
 * GET /api/interpreter/privacy
 * Get interpreter's agency memberships with their data sharing preferences
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await verifyAuthAndGetUser(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all active agency memberships with data sharing preferences
    const { data: memberships, error } = await supabaseAdmin
      .from("organization_members")
      .select(`
        id,
        organization_id,
        role,
        status,
        data_sharing_preferences,
        organizations (
          id,
          name
        )
      `)
      .eq("user_id", userId)
      .eq("status", "active");

    if (error) {
      console.error("Error fetching memberships:", error);
      return NextResponse.json(
        { error: "Failed to fetch agency memberships" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      memberships: memberships || [],
    });
  } catch (error) {
    console.error("Privacy API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/interpreter/privacy
 * Update data sharing preferences for a specific agency membership
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await verifyAuthAndGetUser(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { membership_id, preferences } = body;

    if (!membership_id || !preferences) {
      return NextResponse.json(
        { error: "Missing membership_id or preferences" },
        { status: 400 }
      );
    }

    // Validate the preferences object has expected keys
    const validKeys = [
      "share_prep_completion",
      "share_debrief_completion",
      "share_credential_status",
      "share_checkin_streaks",
      "share_module_progress",
    ];

    const cleanedPreferences: Record<string, boolean> = {};
    for (const key of validKeys) {
      cleanedPreferences[key] = preferences[key] === true;
    }

    // Verify the membership belongs to this user
    const { data: membership, error: verifyError } = await supabaseAdmin
      .from("organization_members")
      .select("id, user_id")
      .eq("id", membership_id)
      .eq("user_id", userId)
      .single();

    if (verifyError || !membership) {
      return NextResponse.json(
        { error: "Membership not found or unauthorized" },
        { status: 403 }
      );
    }

    // Update the preferences
    const { error: updateError } = await supabaseAdmin
      .from("organization_members")
      .update({
        data_sharing_preferences: cleanedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq("id", membership_id);

    if (updateError) {
      console.error("Error updating preferences:", updateError);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Privacy preferences updated",
    });
  } catch (error) {
    console.error("Privacy API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
