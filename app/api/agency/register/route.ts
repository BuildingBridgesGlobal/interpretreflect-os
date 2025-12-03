import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use admin client for creating users and organizations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/agency/register
 * Register a new agency with an admin user
 * Creates: user account, organization, and organization membership
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, organizationName, organizationType } = body;

    // Validate required fields
    if (!email || !password || !fullName || !organizationName) {
      return NextResponse.json(
        { error: "All fields are required: email, password, fullName, organizationName" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if organization name already exists
    const { data: existingOrg } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .ilike("name", organizationName.trim())
      .single();

    if (existingOrg) {
      return NextResponse.json(
        { error: "An organization with this name already exists" },
        { status: 400 }
      );
    }

    // Create the user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true, // Auto-confirm email for agency signups
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error("Error creating user:", authError);
      if (authError.message.includes("already registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Create the organization
    const { data: organization, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: organizationName.trim(),
        type: organizationType || "agency",
        subscription_tier: "trial", // Start with trial tier
        created_by: userId,
      })
      .select()
      .single();

    if (orgError) {
      console.error("Error creating organization:", orgError);
      // Cleanup: delete the user if org creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 }
      );
    }

    // Create the organization membership (user as owner)
    const { error: memberError } = await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: organization.id,
        user_id: userId,
        role: "owner",
        is_active: true,
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error("Error creating membership:", memberError);
      // Cleanup: delete org and user if membership creation fails
      await supabaseAdmin.from("organizations").delete().eq("id", organization.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Failed to create organization membership" },
        { status: 500 }
      );
    }

    // Update the user's profile with org_id and role
    await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
        email: email.toLowerCase(),
        organization_id: organization.id,
        role: "admin", // Set profile role to admin for agency users
      })
      .eq("id", userId);

    return NextResponse.json({
      success: true,
      message: "Agency account created successfully",
      organization: {
        id: organization.id,
        name: organization.name,
      },
    });
  } catch (error: any) {
    console.error("Agency registration error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
