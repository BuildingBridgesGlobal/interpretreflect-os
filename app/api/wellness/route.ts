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

    return NextResponse.json({
      success: true,
      checkins,
      stats,
      mostRecent,
      hoursWorkedThisWeek,
      restDaysThisMonth,
    });
  } catch (error: any) {
    console.error("Wellness check-ins fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new wellness check-in
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      feeling,
      hours_worked_this_week,
      rest_days_this_month,
      notes,
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

    const { data: checkin, error } = await supabase
      .from("wellness_checkins")
      .insert({
        user_id,
        feeling,
        hours_worked_this_week,
        rest_days_this_month,
        notes,
      })
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
