import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/interpreter/join-org
 * Links an interpreter to their organization after signup
 * This uses the service role to reliably create the membership record
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, organizationId } = await req.json();

    // Validate required fields
    if (!userId || !organizationId) {
      return NextResponse.json(
        { error: "Missing userId or organizationId" },
        { status: 400 }
      );
    }

    // Verify the organization exists
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("id, name")
      .eq("id", organizationId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Update the user's profile with the organization_id
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ organization_id: organizationId })
      .eq("id", userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Continue - profile might be created by trigger later
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .single();

    if (!existingMember) {
      // Add user to organization_members as an interpreter/member
      // Default data sharing: all ON (convenience-first). Interpreters can opt out in Settings > Privacy.
      const { error: memberError } = await supabaseAdmin
        .from("organization_members")
        .insert({
          organization_id: organizationId,
          user_id: userId,
          role: "member",
          is_active: true,
          status: "active",
          data_sharing_preferences: {
            share_prep_completion: true,
            share_debrief_completion: true,
            share_credential_status: true,
            share_checkin_streaks: true,
            share_module_progress: true,
          },
        });

      if (memberError) {
        console.error("Member creation error:", memberError);
        return NextResponse.json(
          { error: "Failed to add user to organization" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully joined organization",
      organizationName: org.name,
    });

  } catch (error: any) {
    console.error("Join org error:", error);
    return NextResponse.json(
      { error: "Failed to join organization" },
      { status: 500 }
    );
  }
}
