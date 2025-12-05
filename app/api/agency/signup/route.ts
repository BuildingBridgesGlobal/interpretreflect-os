import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/agency/signup
 * Creates an agency admin account using a validated activation code
 */
export async function POST(req: NextRequest) {
  try {
    const { codeId, code, email, password, fullName } = await req.json();

    // Validate required fields
    if (!codeId || !code || !email || !password || !fullName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Re-validate the code to ensure it's still valid
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from("agency_codes")
      .select("id, code, organization_name, organization_id, status, expires_at")
      .eq("id", codeId)
      .eq("code", code.trim().toUpperCase())
      .single();

    if (codeError || !codeData) {
      return NextResponse.json(
        { error: "Invalid activation code" },
        { status: 400 }
      );
    }

    // Check code status
    if (codeData.status === "used") {
      return NextResponse.json(
        { error: "This activation code has already been used" },
        { status: 400 }
      );
    }

    if (codeData.status === "expired" || (codeData.expires_at && new Date(codeData.expires_at) < new Date())) {
      return NextResponse.json(
        { error: "This activation code has expired" },
        { status: 400 }
      );
    }

    if (codeData.status === "revoked") {
      return NextResponse.json(
        { error: "This activation code is no longer valid" },
        { status: 400 }
      );
    }

    // Create the user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true, // Auto-confirm email for agency admins
      user_metadata: {
        full_name: fullName,
        role: "agency_admin",
      },
    });

    if (authError) {
      // Check for duplicate email
      if (authError.message.includes("already been registered") || authError.message.includes("already exists")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in instead." },
          { status: 400 }
        );
      }
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Create or use existing organization
    let organizationId = codeData.organization_id;

    if (!organizationId) {
      // Create a new organization
      const { data: orgData, error: orgError } = await supabaseAdmin
        .from("organizations")
        .insert({
          name: codeData.organization_name,
          owner_id: userId,
        })
        .select("id")
        .single();

      if (orgError) {
        console.error("Organization creation error:", orgError);
        // Try to clean up the user we just created
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { error: "Failed to create organization" },
          { status: 500 }
        );
      }

      organizationId = orgData.id;

      // Update the code with the organization ID
      await supabaseAdmin
        .from("agency_codes")
        .update({ organization_id: organizationId })
        .eq("id", codeId);
    }

    // Create or update the user's profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        full_name: fullName,
        email: email.toLowerCase(),
        role: "agency_admin",
        organization_id: organizationId,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Continue anyway, profile might be created by trigger
    }

    // Add user to organization_members as owner with default data sharing settings
    const { error: memberError } = await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role: "owner",
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
      // Continue anyway, the important parts are done
    }

    // Mark the activation code as used
    const { error: updateError } = await supabaseAdmin
      .from("agency_codes")
      .update({
        status: "used",
        used_by: userId,
        used_at: new Date().toISOString(),
      })
      .eq("id", codeId);

    if (updateError) {
      console.error("Code update error:", updateError);
      // Continue anyway, account was created successfully
    }

    return NextResponse.json({
      success: true,
      message: "Agency account created successfully",
      organizationId,
      userId,
    });

  } catch (error: any) {
    console.error("Agency signup error:", error);
    return NextResponse.json(
      { error: "Failed to create agency account" },
      { status: 500 }
    );
  }
}
