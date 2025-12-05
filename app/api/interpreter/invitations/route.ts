import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to verify auth and get user ID from session token
async function verifyAuthAndGetUser(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user.id;
}

/**
 * GET /api/interpreter/invitations
 * Fetch pending organization invitations for the current user
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

    // Get pending invitations with organization details
    const { data: invitations, error } = await supabaseAdmin
      .from("organization_members")
      .select(`
        id,
        status,
        invited_at,
        role,
        organizations (
          id,
          name
        )
      `)
      .eq("user_id", userId)
      .eq("status", "pending");

    if (error) {
      console.error("Error fetching invitations:", error);
      return NextResponse.json(
        { error: "Failed to fetch invitations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invitations: invitations || [],
    });
  } catch (error: any) {
    console.error("Invitations fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/interpreter/invitations
 * Accept or decline an organization invitation
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

    const { membership_id, accept } = await req.json();

    if (!membership_id || typeof accept !== "boolean") {
      return NextResponse.json(
        { error: "membership_id and accept (boolean) are required" },
        { status: 400 }
      );
    }

    // Verify this invitation belongs to the user and is pending
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from("organization_members")
      .select("id, status, organizations(name)")
      .eq("id", membership_id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "This invitation is no longer pending" },
        { status: 400 }
      );
    }

    // Update the invitation status
    // When accepting, set default data sharing preferences (all ON - convenience-first)
    const updateData = accept
      ? {
          status: "active",
          is_active: true,
          joined_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          data_sharing_preferences: {
            share_prep_completion: true,
            share_debrief_completion: true,
            share_credential_status: true,
            share_checkin_streaks: true,
            share_module_progress: true,
          },
        }
      : {
          status: "declined",
          declined_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

    const { error: updateError } = await supabaseAdmin
      .from("organization_members")
      .update(updateData)
      .eq("id", membership_id);

    if (updateError) {
      console.error("Error responding to invitation:", updateError);
      return NextResponse.json(
        { error: "Failed to respond to invitation" },
        { status: 500 }
      );
    }

    const orgName = (invitation.organizations as any)?.name || "the organization";

    return NextResponse.json({
      success: true,
      message: accept
        ? `You have joined ${orgName}`
        : `Invitation to ${orgName} declined`,
    });
  } catch (error: any) {
    console.error("Invitation response error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
