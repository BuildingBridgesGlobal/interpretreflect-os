import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const supabase = supabaseAdmin;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      title,
      assignment_type,
      date,
      time,
      duration_minutes = 60,
      setting,
      location_type = "in_person",
      location_details,
      description,
      is_team_assignment = false,
      team_members = [],
      is_recurring = false,
      recurrence_pattern,
      recurrence_end_date,
    } = body;

    // Validate required fields
    if (!user_id || !title || !assignment_type || !date) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, title, assignment_type, date" },
        { status: 400 }
      );
    }

    // Handle recurring assignments
    if (is_recurring && recurrence_pattern) {
      const assignments = generateRecurringAssignments({
        user_id,
        title,
        assignment_type,
        start_date: date,
        time,
        duration_minutes,
        setting,
        location_type,
        location_details,
        description,
        is_team_assignment,
        recurrence_pattern,
        recurrence_end_date,
      });

      // Insert all recurring assignments
      const { data: createdAssignments, error } = await supabase
        .from("assignments")
        .insert(assignments)
        .select();

      if (error) {
        console.error("Error creating recurring assignments:", error);
        return NextResponse.json(
          { error: "Failed to create recurring assignments", details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Created ${createdAssignments.length} recurring assignments`,
        assignments: createdAssignments,
      });
    }

    // Single assignment creation
    const { data: assignment, error } = await supabase
      .from("assignments")
      .insert({
        user_id,
        title,
        assignment_type,
        setting,
        date,
        time,
        location_type,
        location_details,
        duration_minutes,
        description,
        is_team_assignment,
        team_size: is_team_assignment ? team_members.length + 1 : 1,
        timezone: "America/New_York",
        status: "upcoming",
        prep_status: "pending",
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating assignment:", error);
      return NextResponse.json(
        { error: "Failed to create assignment", details: error.message },
        { status: 500 }
      );
    }

    // Handle team members if provided
    if (is_team_assignment && team_members.length > 0) {
      const teamMembersToAdd = team_members.map((member: any) => ({
        assignment_id: assignment.id,
        user_id: member.user_id,
        role: member.role || "team",
        status: "confirmed",
        invited_by: user_id,
        invited_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        can_edit_assignment: false,
        can_invite_others: false,
      }));

      await (supabase as any).from("assignment_team_members").insert(teamMembersToAdd);
    }

    return NextResponse.json({
      success: true,
      assignment,
    });
  } catch (error: any) {
    console.error("Assignment creation error:", error);
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
    start_date,
    time,
    duration_minutes,
    setting,
    location_type,
    location_details,
    description,
    is_team_assignment,
    recurrence_pattern,
    recurrence_end_date,
  } = params;

  const assignments: any[] = [];
  const startDate = new Date(start_date);
  const endDate = recurrence_end_date ? new Date(recurrence_end_date) : null;
  const maxOccurrences = 52; // Limit to 52 weeks (1 year) if no end date

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
      description,
      is_team_assignment,
      team_size: 1,
      timezone: "America/New_York",
      status: "upcoming",
      prep_status: "pending",
      completed: false,
    });

    occurrences++;

    // Calculate next occurrence based on pattern
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
