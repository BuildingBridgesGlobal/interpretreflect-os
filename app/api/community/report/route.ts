import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// Valid report reasons
const VALID_REASONS = ["spam", "harassment", "inappropriate", "misinformation", "other"] as const;
type ReportReason = typeof VALID_REASONS[number];

// Valid content types
const VALID_CONTENT_TYPES = ["post", "comment"] as const;
type ContentType = typeof VALID_CONTENT_TYPES[number];

// POST - Create a content report
export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const body = await req.json();
    const { content_type, content_id, reason, additional_details } = body;

    // Validate content_type
    if (!content_type || !VALID_CONTENT_TYPES.includes(content_type)) {
      return NextResponse.json(
        { error: "Invalid content type. Must be 'post' or 'comment'" },
        { status: 400 }
      );
    }

    // Validate content_id
    if (!content_id) {
      return NextResponse.json(
        { error: "content_id is required" },
        { status: 400 }
      );
    }

    // Validate reason
    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid reason. Must be one of: spam, harassment, inappropriate, misinformation, other" },
        { status: 400 }
      );
    }

    // Check if content exists
    const tableName = content_type === "post" ? "community_posts" : "post_comments";
    const { data: content, error: contentError } = await supabase
      .from(tableName)
      .select("id, user_id")
      .eq("id", content_id)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { error: `${content_type} not found` },
        { status: 404 }
      );
    }

    // Prevent self-reporting
    if (content.user_id === userId) {
      return NextResponse.json(
        { error: "You cannot report your own content" },
        { status: 400 }
      );
    }

    // Check if user already reported this content
    const { data: existingReport } = await supabase
      .from("content_reports")
      .select("id")
      .eq("reporter_user_id", userId)
      .eq("content_type", content_type)
      .eq("content_id", content_id)
      .single();

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this content" },
        { status: 400 }
      );
    }

    // Create the report
    const { data: report, error: reportError } = await supabase
      .from("content_reports")
      .insert({
        reporter_user_id: userId,
        content_type,
        content_id,
        reason,
        additional_details: additional_details?.trim() || null
      })
      .select()
      .single();

    if (reportError) {
      console.error("Error creating report:", reportError);
      return NextResponse.json(
        { error: "Failed to submit report", details: reportError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Report submitted successfully. Thank you for helping keep our community safe.",
      report_id: report.id
    });

  } catch (error: any) {
    console.error("Report creation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
