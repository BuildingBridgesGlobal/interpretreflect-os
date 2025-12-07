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
 * GET /api/interpreter/agencies
 * Get all agencies the interpreter is connected to (including pending/removed status for history)
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

    // Get all agency memberships for this user
    const { data: memberships, error } = await supabaseAdmin
      .from("organization_members")
      .select(`
        id,
        organization_id,
        role,
        status,
        joined_at,
        removed_at,
        data_sharing_preferences,
        organizations (
          id,
          name
        )
      `)
      .eq("user_id", userId)
      .order("joined_at", { ascending: false });

    if (error) {
      console.error("Error fetching agencies:", error);
      return NextResponse.json(
        { error: "Failed to fetch agencies" },
        { status: 500 }
      );
    }

    // Filter to only show active memberships by default
    const activeAgencies = (memberships || []).filter(m => m.status === "active");

    return NextResponse.json({
      success: true,
      agencies: activeAgencies,
      // Also return removed agencies for reference
      removedAgencies: (memberships || []).filter(m => m.status === "removed"),
    });
  } catch (error) {
    console.error("Agencies API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/interpreter/agencies
 * Connect to an agency using an invite code, or disconnect from an agency
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
    const { action, code, membership_id } = body;

    // ===== CONNECT TO AGENCY =====
    if (action === "connect") {
      if (!code) {
        return NextResponse.json(
          { error: "Invite code is required" },
          { status: 400 }
        );
      }

      // Normalize the code
      const normalizedCode = code.trim().toUpperCase();

      // Look up the invite code
      const { data: inviteCode, error: codeError } = await supabaseAdmin
        .from("agency_invite_codes")
        .select(`
          id,
          code,
          organization_id,
          expires_at,
          max_uses,
          current_uses,
          is_active,
          organizations (
            id,
            name
          )
        `)
        .eq("code", normalizedCode)
        .single();

      if (codeError || !inviteCode) {
        return NextResponse.json(
          { error: "Invalid invite code. Please check and try again." },
          { status: 404 }
        );
      }

      // Validate code status
      if (!inviteCode.is_active) {
        return NextResponse.json(
          { error: "This invite code has been deactivated." },
          { status: 400 }
        );
      }

      if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
        return NextResponse.json(
          { error: "This invite code has expired." },
          { status: 400 }
        );
      }

      if (inviteCode.max_uses && inviteCode.current_uses >= inviteCode.max_uses) {
        return NextResponse.json(
          { error: "This invite code has reached its maximum uses." },
          { status: 400 }
        );
      }

      const organizationId = inviteCode.organization_id;
      const organizationName = (inviteCode.organizations as any)?.name || "Agency";

      // Check if user already has a membership with this agency
      const { data: existingMembership } = await supabaseAdmin
        .from("organization_members")
        .select("id, status")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .single();

      if (existingMembership) {
        if (existingMembership.status === "active") {
          return NextResponse.json(
            { error: `You're already connected to ${organizationName}.` },
            { status: 400 }
          );
        }

        // Re-activate a removed membership
        if (existingMembership.status === "removed") {
          const { error: reactivateError } = await supabaseAdmin
            .from("organization_members")
            .update({
              status: "active",
              is_active: true,
              joined_at: new Date().toISOString(),
              removed_at: null,
              updated_at: new Date().toISOString(),
              invite_code_id: inviteCode.id,
              data_sharing_preferences: {
                share_prep_completion: true,
                share_debrief_completion: true,
                share_credential_status: true,
                share_checkin_streaks: true,
                share_module_progress: true,
              },
            })
            .eq("id", existingMembership.id);

          if (reactivateError) {
            console.error("Error reactivating membership:", reactivateError);
            return NextResponse.json(
              { error: "Failed to reconnect to agency" },
              { status: 500 }
            );
          }

          // Increment code usage
          // Note: For true atomicity, consider using a database function
          // This is safe enough for the expected usage pattern
          try {
            await supabaseAdmin
              .from("agency_invite_codes")
              .update({
                current_uses: (inviteCode.current_uses || 0) + 1,
                updated_at: new Date().toISOString(),
              })
              .eq("id", inviteCode.id);
          } catch (updateErr) {
            console.error("Error updating invite code usage:", updateErr);
            // Non-critical error - don't fail the connection
          }

          return NextResponse.json({
            success: true,
            message: `Reconnected to ${organizationName}!`,
            organizationName,
            organizationId,
          });
        }
      }

      // Create new membership
      const { data: newMembership, error: memberError } = await supabaseAdmin
        .from("organization_members")
        .insert({
          organization_id: organizationId,
          user_id: userId,
          role: "member",
          status: "active",
          is_active: true,
          joined_at: new Date().toISOString(),
          invite_code_id: inviteCode.id,
          data_sharing_preferences: {
            share_prep_completion: true,
            share_debrief_completion: true,
            share_credential_status: true,
            share_checkin_streaks: true,
            share_module_progress: true,
          },
        })
        .select()
        .single();

      if (memberError) {
        console.error("Error creating membership:", memberError);
        return NextResponse.json(
          { error: "Failed to connect to agency" },
          { status: 500 }
        );
      }

      // Increment code usage
      try {
        await supabaseAdmin
          .from("agency_invite_codes")
          .update({
            current_uses: (inviteCode.current_uses || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", inviteCode.id);
      } catch (updateErr) {
        console.error("Error updating invite code usage:", updateErr);
        // Non-critical error - don't fail the connection
      }

      return NextResponse.json({
        success: true,
        message: `Successfully connected to ${organizationName}!`,
        organizationName,
        organizationId,
        membershipId: newMembership.id,
      });
    }

    // ===== DISCONNECT FROM AGENCY =====
    if (action === "disconnect") {
      if (!membership_id) {
        return NextResponse.json(
          { error: "Membership ID is required" },
          { status: 400 }
        );
      }

      // Verify the membership belongs to this user
      const { data: membership, error: verifyError } = await supabaseAdmin
        .from("organization_members")
        .select(`
          id,
          user_id,
          role,
          organizations (name)
        `)
        .eq("id", membership_id)
        .eq("user_id", userId)
        .single();

      if (verifyError || !membership) {
        return NextResponse.json(
          { error: "Membership not found" },
          { status: 404 }
        );
      }

      // Don't allow owners to disconnect (they should transfer ownership first)
      if (membership.role === "owner") {
        return NextResponse.json(
          { error: "Owners cannot disconnect from their agency. Transfer ownership first." },
          { status: 400 }
        );
      }

      // Update status to removed (soft delete)
      const { error: removeError } = await supabaseAdmin
        .from("organization_members")
        .update({
          status: "removed",
          is_active: false,
          removed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", membership_id);

      if (removeError) {
        console.error("Error disconnecting from agency:", removeError);
        return NextResponse.json(
          { error: "Failed to disconnect from agency" },
          { status: 500 }
        );
      }

      const orgName = (membership.organizations as any)?.name || "agency";

      return NextResponse.json({
        success: true,
        message: `Disconnected from ${orgName}`,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'connect' or 'disconnect'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Agencies API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
