import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/agency/validate-code
 * Validates an agency activation code
 */
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: "Activation code is required" },
        { status: 400 }
      );
    }

    // Look up the code
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from("agency_codes")
      .select("id, code, organization_name, organization_id, status, expires_at")
      .eq("code", code.trim().toUpperCase())
      .single();

    if (codeError || !codeData) {
      return NextResponse.json(
        { error: "Invalid activation code. Please check and try again." },
        { status: 404 }
      );
    }

    // Check if code is already used
    if (codeData.status === "used") {
      return NextResponse.json(
        { error: "This activation code has already been used." },
        { status: 400 }
      );
    }

    // Check if code is expired
    if (codeData.status === "expired" || (codeData.expires_at && new Date(codeData.expires_at) < new Date())) {
      return NextResponse.json(
        { error: "This activation code has expired. Please contact support." },
        { status: 400 }
      );
    }

    // Check if code is revoked
    if (codeData.status === "revoked") {
      return NextResponse.json(
        { error: "This activation code is no longer valid." },
        { status: 400 }
      );
    }

    // Code is valid
    return NextResponse.json({
      valid: true,
      codeId: codeData.id,
      organizationName: codeData.organization_name,
      organizationId: codeData.organization_id,
    });
  } catch (error: any) {
    console.error("Code validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate code" },
      { status: 500 }
    );
  }
}
