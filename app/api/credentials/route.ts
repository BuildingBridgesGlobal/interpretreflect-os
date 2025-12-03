import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/credentials
 * Fetch credentials for the authenticated user
 * Admins can optionally fetch all credentials for their organization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationView = searchParams.get("organization") === "true";

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

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // If requesting organization view and user is admin
    if (organizationView && profile.role === "admin" && profile.organization_id) {
      // Use the database function to get all organization credentials
      const { data, error } = await supabase.rpc("get_organization_credentials", {
        org_id: profile.organization_id
      });

      if (error) {
        console.error("Error fetching organization credentials:", error);
        return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
      }

      return NextResponse.json({ credentials: data || [] });
    }

    // Otherwise, fetch user's own credentials
    const { data: credentials, error: credError } = await supabase
      .from("credentials")
      .select("*")
      .eq("user_id", user.id)
      .order("expiration_date", { ascending: true, nullsFirst: false });

    if (credError) {
      console.error("Error fetching credentials:", credError);
      return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
    }

    return NextResponse.json({ credentials: credentials || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/credentials
 * Create a new credential for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      credential_type,
      credential_name,
      issuing_organization,
      issue_date,
      expiration_date,
      file_url
    } = body;

    // Validate required fields
    if (!credential_type || !credential_name) {
      return NextResponse.json(
        { error: "credential_type and credential_name are required" },
        { status: 400 }
      );
    }

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

    // Insert credential
    const { data: credential, error: insertError } = await supabase
      .from("credentials")
      .insert({
        user_id: user.id,
        credential_type,
        credential_name,
        issuing_organization,
        issue_date,
        expiration_date,
        file_url
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating credential:", insertError);
      return NextResponse.json({ error: "Failed to create credential" }, { status: 500 });
    }

    return NextResponse.json({ credential }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/credentials?id=<credential_id>
 * Delete a credential (user can only delete their own)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get("id");

    if (!credentialId) {
      return NextResponse.json({ error: "Credential ID required" }, { status: 400 });
    }

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

    // Delete credential (RLS will ensure user can only delete their own)
    const { error: deleteError } = await supabase
      .from("credentials")
      .delete()
      .eq("id", credentialId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting credential:", deleteError);
      return NextResponse.json({ error: "Failed to delete credential" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
