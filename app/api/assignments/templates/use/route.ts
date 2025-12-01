import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Create assignment(s) from a template
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      template_id,
      user_id,
      date, // Required: when to start the assignment
      time, // Optional: override template time
      title, // Optional: override template title
      recurrence_end_date, // For recurring templates
    } = body;

    if (!template_id || !user_id || !date) {
      return NextResponse.json(
        { error: "Missing required fields: template_id, user_id, date" },
        { status: 400 }
      );
    }

    // Fetch the template
    const { data: template, error: templateError } = await supabase
      .from("assignment_templates")
      .select("*")
      .eq("id", template_id)
      .eq("user_id", user_id)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Template not found or access denied" },
        { status: 404 }
      );
    }

    // Prepare assignment data from template
    const assignmentData = {
      user_id,
      title: title || template.default_title || `${template.assignment_type} Assignment`,
      assignment_type: template.assignment_type,
      setting: template.setting,
      date,
      time: time || "09:00", // Default to 9 AM if not specified
      location_type: template.location_type,
      location_details: template.location_details,
      duration_minutes: template.duration_minutes,
      is_team_assignment: template.is_team_assignment,
      team_size: template.team_size,
      timezone: "America/New_York",
      status: "upcoming",
      prep_status: "pending",
      completed: false,
    };

    let createdAssignments;

    // Handle recurring vs one-time
    if (template.is_recurring && template.recurrence_pattern) {
      // Generate recurring assignments
      const assignments = generateRecurringAssignments({
        ...assignmentData,
        start_date: date,
        recurrence_pattern: template.recurrence_pattern,
        recurrence_end_date,
      });

      const { data, error } = await supabase
        .from("assignments")
        .insert(assignments)
        .select();

      if (error) {
        console.error("Error creating recurring assignments:", error);
        return NextResponse.json(
          { error: "Failed to create assignments from template", details: error.message },
          { status: 500 }
        );
      }

      createdAssignments = data;
    } else {
      // Single assignment
      const { data, error } = await supabase
        .from("assignments")
        .insert(assignmentData)
        .select()
        .single();

      if (error) {
        console.error("Error creating assignment:", error);
        return NextResponse.json(
          { error: "Failed to create assignment from template", details: error.message },
          { status: 500 }
        );
      }

      createdAssignments = [data];
    }

    // Update template usage stats
    await supabase
      .from("assignment_templates")
      .update({
        times_used: template.times_used + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", template_id);

    return NextResponse.json({
      success: true,
      message: `Created ${createdAssignments.length} assignment(s) from template`,
      assignments: createdAssignments,
    });
  } catch (error: any) {
    console.error("Template use error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to generate recurring assignments
function generateRecurringAssignments(params: any) {
  const {
    user_id,
    title,
    assignment_type,
    setting,
    start_date,
    time,
    location_type,
    location_details,
    duration_minutes,
    is_team_assignment,
    team_size,
    recurrence_pattern,
    recurrence_end_date,
  } = params;

  const assignments: any[] = [];
  const startDate = new Date(start_date);
  const endDate = recurrence_end_date ? new Date(recurrence_end_date) : null;
  const maxOccurrences = 52; // Limit to 52 weeks if no end date

  let currentDate = new Date(startDate);
  let occurrences = 0;

  while (occurrences < maxOccurrences) {
    if (endDate && currentDate > endDate) break;

    assignments.push({
      user_id,
      title,
      assignment_type,
      setting,
      date: currentDate.toISOString().split("T")[0],
      time,
      location_type,
      location_details,
      duration_minutes,
      is_team_assignment,
      team_size,
      timezone: "America/New_York",
      status: "upcoming",
      prep_status: "pending",
      completed: false,
    });

    occurrences++;

    // Calculate next occurrence
    switch (recurrence_pattern) {
      case "daily":
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case "weekly":
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case "biweekly":
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      default:
        // Unknown pattern - stop generating
        return assignments;
    }
  }

  return assignments;
}
