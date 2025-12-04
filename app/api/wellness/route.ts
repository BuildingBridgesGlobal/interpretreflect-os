import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get wellness check-ins for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const limit = searchParams.get("limit") || "30"; // Default to last 30 check-ins
    const days = searchParams.get("days"); // Get check-ins from last N days

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("wellness_checkins")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Filter by days if provided
    if (days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      query = query.gte("created_at", daysAgo.toISOString());
    }

    // Apply limit
    query = query.limit(parseInt(limit));

    const { data: checkins, error } = await query;

    if (error) {
      console.error("Error fetching wellness check-ins:", error);
      return NextResponse.json(
        { error: "Failed to fetch check-ins", details: error.message },
        { status: 500 }
      );
    }

    // Calculate statistics (updated feeling names)
    const stats = {
      total: checkins?.length || 0,
      energized: checkins?.filter((c) => c.feeling === "energized").length || 0,
      calm: checkins?.filter((c) => c.feeling === "calm").length || 0,
      okay: checkins?.filter((c) => c.feeling === "okay").length || 0,
      drained: checkins?.filter((c) => c.feeling === "drained").length || 0,
      overwhelmed: checkins?.filter((c) => c.feeling === "overwhelmed").length || 0,
    };

    // Calculate hours worked this week from completed assignments
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const { data: weekAssignments } = await supabase
      .from("assignments")
      .select("duration_minutes")
      .eq("user_id", userId)
      .eq("completed", true)
      .gte("date", weekStart.toISOString().split('T')[0]);

    const hoursWorkedThisWeek = weekAssignments
      ? Math.round(weekAssignments.reduce((sum: number, a: any) => sum + (a.duration_minutes || 60), 0) / 60)
      : 0;

    // Calculate rest days this month (days with no assignments)
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: monthAssignments } = await supabase
      .from("assignments")
      .select("date")
      .eq("user_id", userId)
      .gte("date", monthStart.toISOString().split('T')[0]);

    // Count unique days with assignments this month
    const daysWithAssignments = new Set(monthAssignments?.map((a: any) => a.date) || []);
    const today = new Date();
    const daysSoFarThisMonth = today.getDate();
    const restDaysThisMonth = daysSoFarThisMonth - daysWithAssignments.size;

    // Get most recent check-in
    const mostRecent = checkins && checkins.length > 0 ? checkins[0] : null;

    // Check if user already checked in today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCheckin = checkins?.find((c) => {
      const checkinDate = new Date(c.created_at);
      return checkinDate >= todayStart;
    });

    // Get check-ins for trend chart (last 14 days, one per day)
    const trendDays = 14;
    const trendData: { date: string; feeling: string | null; assignment_type: string | null }[] = [];

    for (let i = trendDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Find check-in for this day
      const dayCheckin = checkins?.find((c) => {
        const checkinDate = new Date(c.created_at).toISOString().split('T')[0];
        return checkinDate === dateStr;
      });

      trendData.push({
        date: dateStr,
        feeling: dayCheckin?.feeling || null,
        assignment_type: dayCheckin?.assignment_type || null,
      });
    }

    // Calculate assignment type correlations
    const typeCorrelations: Record<string, { total: number; feelings: Record<string, number> }> = {};

    checkins?.forEach((c) => {
      if (c.assignment_type) {
        if (!typeCorrelations[c.assignment_type]) {
          typeCorrelations[c.assignment_type] = { total: 0, feelings: {} };
        }
        typeCorrelations[c.assignment_type].total++;
        typeCorrelations[c.assignment_type].feelings[c.feeling] =
          (typeCorrelations[c.assignment_type].feelings[c.feeling] || 0) + 1;
      }
    });

    // Generate insights from correlations
    const insights: string[] = [];
    Object.entries(typeCorrelations).forEach(([type, data]) => {
      if (data.total >= 3) {
        const drainedOrOverwhelmed = (data.feelings.drained || 0) + (data.feelings.overwhelmed || 0);
        const positive = (data.feelings.energized || 0) + (data.feelings.calm || 0);

        if (drainedOrOverwhelmed > data.total * 0.6) {
          insights.push(`${type} assignments tend to leave you feeling drained`);
        } else if (positive > data.total * 0.6) {
          insights.push(`You tend to feel good after ${type} assignments`);
        }
      }
    });

    return NextResponse.json({
      success: true,
      checkins,
      stats,
      mostRecent,
      hoursWorkedThisWeek,
      restDaysThisMonth,
      todayCheckin,
      trendData,
      typeCorrelations,
      insights,
    });
  } catch (error: any) {
    console.error("Wellness check-ins fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create or update a wellness check-in (rate limited to once per day)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      feeling,
      hours_worked_this_week,
      rest_days_this_month,
      notes,
      assignment_id,
      assignment_type,
      is_post_debrief,
    } = body;

    // Validate required fields
    if (!user_id || !feeling) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, feeling" },
        { status: 400 }
      );
    }

    // Validate feeling value (updated to match UI)
    const validFeelings = ["energized", "calm", "okay", "drained", "overwhelmed"];
    if (!validFeelings.includes(feeling)) {
      return NextResponse.json(
        { error: `Invalid feeling. Must be one of: ${validFeelings.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if there's already a check-in today (for general check-ins, not post-debrief)
    if (!is_post_debrief) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: existingCheckin } = await supabase
        .from("wellness_checkins")
        .select("id")
        .eq("user_id", user_id)
        .gte("created_at", todayStart.toISOString())
        .is("assignment_id", null) // Only check general check-ins, not post-debrief ones
        .limit(1)
        .single();

      if (existingCheckin) {
        // Update existing check-in instead of creating a new one
        const { data: updated, error: updateError } = await supabase
          .from("wellness_checkins")
          .update({
            feeling,
            hours_worked_this_week,
            rest_days_this_month,
            notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingCheckin.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating wellness check-in:", updateError);
          return NextResponse.json(
            { error: "Failed to update check-in", details: updateError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          checkin: updated,
          updated: true,
          message: "Updated today's check-in",
        });
      }
    }

    // Create new check-in
    // Build insert data - only include fields that exist in the table
    const insertData: Record<string, any> = {
      user_id,
      feeling,
      hours_worked_this_week,
      rest_days_this_month,
      notes,
    };

    // Try to include optional fields (may not exist in older schemas)
    if (assignment_id) insertData.assignment_id = assignment_id;
    if (assignment_type) insertData.assignment_type = assignment_type;
    if (is_post_debrief) insertData.is_post_debrief = is_post_debrief;

    const { data: checkin, error } = await supabase
      .from("wellness_checkins")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating wellness check-in:", error);
      return NextResponse.json(
        { error: "Failed to create check-in", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkin,
      updated: false,
    });
  } catch (error: any) {
    console.error("Wellness check-in creation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a wellness check-in
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkinId = searchParams.get("checkin_id");
    const userId = searchParams.get("user_id");

    if (!checkinId || !userId) {
      return NextResponse.json(
        { error: "checkin_id and user_id are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("wellness_checkins")
      .delete()
      .eq("id", checkinId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting wellness check-in:", error);
      return NextResponse.json(
        { error: "Failed to delete check-in", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Check-in deleted successfully",
    });
  } catch (error: any) {
    console.error("Wellness check-in deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
