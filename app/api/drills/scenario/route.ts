import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof str === "string" && uuidRegex.test(str);
}

// Helper to get user from token
async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * GET /api/drills/scenario
 * Get available scenarios or a specific scenario
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const category = searchParams.get("category");

  // Get specific scenario by slug
  if (slug) {
    const { data: scenario, error } = await supabaseAdmin
      .from("scenario_drills")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (error || !scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    // Get user's progress for this scenario
    const { data: progress } = await supabaseAdmin
      .from("user_drill_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("scenario_id", scenario.id)
      .single();

    // Get user's recent attempts
    const { data: recentAttempts } = await supabaseAdmin
      .from("user_scenario_attempts")
      .select("id, difficulty, total_score, percentage_score, completed_at")
      .eq("user_id", user.id)
      .eq("scenario_id", scenario.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      scenario,
      progress: progress || {
        unlocked_difficulties: ["practice"],
        best_scores: {},
        total_attempts: 0,
      },
      recent_attempts: recentAttempts || [],
    });
  }

  // List all published scenarios
  let query = supabaseAdmin
    .from("scenario_drills")
    .select("id, slug, title, subtitle, category, difficulty_base, ecci_focus, estimated_duration_minutes, play_count, avg_score, is_featured")
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data: scenarios, error } = await query;

  if (error) {
    console.error("Error fetching scenarios:", error);
    return NextResponse.json({ error: "Failed to fetch scenarios" }, { status: 500 });
  }

  // Get user's progress for all scenarios
  const { data: userProgress } = await supabaseAdmin
    .from("user_drill_progress")
    .select("scenario_id, unlocked_difficulties, best_scores, total_completions")
    .eq("user_id", user.id);

  const progressMap = new Map(
    (userProgress || []).map((p) => [p.scenario_id, p])
  );

  const scenariosWithProgress = (scenarios || []).map((s) => ({
    ...s,
    user_progress: progressMap.get(s.id) || null,
  }));

  return NextResponse.json({ scenarios: scenariosWithProgress });
}

/**
 * POST /api/drills/scenario
 * Save a scenario attempt or start a new one
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, scenario_id, difficulty, attempt_data } = body;

  // Validate scenario_id
  if (!scenario_id || !isValidUUID(scenario_id)) {
    return NextResponse.json({ error: "Invalid scenario ID" }, { status: 400 });
  }

  // Validate difficulty
  const validDifficulties = ["practice", "standard", "pressure", "expert"];
  if (!difficulty || !validDifficulties.includes(difficulty)) {
    return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
  }

  // Verify scenario exists
  const { data: scenario, error: scenarioError } = await supabaseAdmin
    .from("scenario_drills")
    .select("id, title")
    .eq("id", scenario_id)
    .eq("is_published", true)
    .single();

  if (scenarioError || !scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  // Action: Start a new attempt
  if (action === "start") {
    // Check if difficulty is unlocked
    const { data: progress } = await supabaseAdmin
      .from("user_drill_progress")
      .select("unlocked_difficulties")
      .eq("user_id", user.id)
      .eq("scenario_id", scenario_id)
      .single();

    const unlockedDifficulties = progress?.unlocked_difficulties || ["practice"];
    if (!unlockedDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: "This difficulty level is not yet unlocked" },
        { status: 403 }
      );
    }

    // Create new attempt record
    const { data: attempt, error: createError } = await supabaseAdmin
      .from("user_scenario_attempts")
      .insert({
        user_id: user.id,
        scenario_id,
        difficulty,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating attempt:", createError);
      return NextResponse.json({ error: "Failed to start attempt" }, { status: 500 });
    }

    return NextResponse.json({ attempt_id: attempt.id, started: true });
  }

  // Action: Complete an attempt
  if (action === "complete") {
    if (!attempt_data) {
      return NextResponse.json({ error: "Missing attempt data" }, { status: 400 });
    }

    const {
      decisions_made,
      consequence_flags,
      scores,
      total_score,
      percentage_score,
      ending_id,
      total_time_ms,
      timeouts_count,
    } = attempt_data;

    // Validate scores object
    if (!scores || typeof scores !== "object") {
      return NextResponse.json({ error: "Invalid scores data" }, { status: 400 });
    }

    // Validate numeric values
    if (typeof total_score !== "number" || typeof percentage_score !== "number") {
      return NextResponse.json({ error: "Invalid score values" }, { status: 400 });
    }

    // Save the completed attempt
    const { data: attempt, error: saveError } = await supabaseAdmin
      .from("user_scenario_attempts")
      .insert({
        user_id: user.id,
        scenario_id,
        difficulty,
        decisions_made: decisions_made || [],
        consequence_flags: consequence_flags || {},
        scores,
        total_score: Math.round(total_score),
        max_possible_score: 100,
        percentage_score: Math.round(percentage_score * 100) / 100,
        ending_id: ending_id || "unknown",
        total_time_ms: total_time_ms || 0,
        timeouts_count: timeouts_count || 0,
        status: "completed",
        started_at: new Date(Date.now() - (total_time_ms || 0)).toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving attempt:", saveError);
      return NextResponse.json({ error: "Failed to save attempt" }, { status: 500 });
    }

    // Update user progress and check for unlocks
    const { data: progressResult } = await supabaseAdmin.rpc("update_drill_progress", {
      p_user_id: user.id,
      p_scenario_id: scenario_id,
      p_difficulty: difficulty,
      p_score: Math.round(percentage_score),
    });

    return NextResponse.json({
      success: true,
      attempt_id: attempt.id,
      progress_update: progressResult,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

/**
 * GET /api/drills/scenario/stats
 * Get user's overall drill statistics for Elya context
 */
export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get overall drill stats
  const { data: stats } = await supabaseAdmin.rpc("get_user_drill_stats", {
    p_user_id: user.id,
  });

  // Get recent attempts for debrief context
  const { data: recentAttempts } = await supabaseAdmin.rpc("get_recent_drill_attempts", {
    p_user_id: user.id,
    p_limit: 5,
  });

  // Get weakest skill areas based on recent attempts
  const { data: categoryScores } = await supabaseAdmin
    .from("user_scenario_attempts")
    .select("scores")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(10);

  // Aggregate category scores to find weak areas
  const categoryTotals: Record<string, { sum: number; count: number }> = {};
  (categoryScores || []).forEach((attempt) => {
    const scores = attempt.scores as Record<string, number>;
    Object.entries(scores).forEach(([category, score]) => {
      if (!categoryTotals[category]) {
        categoryTotals[category] = { sum: 0, count: 0 };
      }
      categoryTotals[category].sum += score;
      categoryTotals[category].count += 1;
    });
  });

  const categoryAverages = Object.entries(categoryTotals)
    .map(([category, { sum, count }]) => ({
      category,
      average: Math.round((sum / count) * 10) / 10,
      max: 20,
    }))
    .sort((a, b) => a.average - b.average);

  return NextResponse.json({
    stats: stats || {},
    recent_attempts: recentAttempts || [],
    skill_areas: categoryAverages,
    needs_improvement: categoryAverages.filter((c) => c.average < 15).map((c) => c.category),
  });
}
