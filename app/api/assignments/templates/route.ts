import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const supabase = supabaseAdmin;

// GET - List all templates for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const { data: templates, error } = await supabase
      .from("assignment_templates")
      .select("*")
      .eq("user_id", userId)
      .order("times_used", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json(
        { error: "Failed to fetch templates", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error("Templates fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new template
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      template_name,
      description,
      assignment_type,
      setting,
      location_type = "in_person",
      location_details,
      duration_minutes = 60,
      default_title,
      is_recurring = false,
      recurrence_pattern,
      is_team_assignment = false,
      team_size = 1,
    } = body;

    // Validate required fields
    if (!user_id || !template_name || !assignment_type) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, template_name, assignment_type" },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from("assignment_templates")
      .insert({
        user_id,
        template_name,
        description,
        assignment_type,
        setting,
        location_type,
        location_details,
        duration_minutes,
        default_title,
        is_recurring,
        recurrence_pattern,
        is_team_assignment,
        team_size,
        times_used: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating template:", error);
      return NextResponse.json(
        { error: "Failed to create template", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error("Template creation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a template
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("template_id");
    const userId = searchParams.get("user_id");

    if (!templateId || !userId) {
      return NextResponse.json(
        { error: "template_id and user_id are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("assignment_templates")
      .delete()
      .eq("id", templateId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting template:", error);
      return NextResponse.json(
        { error: "Failed to delete template", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error: any) {
    console.error("Template deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
