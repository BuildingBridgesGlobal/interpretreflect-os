import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const supabase = supabaseAdmin;

// POST - Submit a drill attempt
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      drill_id,
      session_id,
      user_answer,
      confidence_level,
      response_time_seconds
    } = body;

    if (!user_id || !drill_id || !user_answer) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, drill_id, user_answer" },
        { status: 400 }
      );
    }

    // Get the drill to check correct answer
    const { data: drill, error: drillError } = await supabase
      .from("drills")
      .select("*, subcategory:drill_subcategories(*, category:drill_categories(*))")
      .eq("id", drill_id)
      .single();

    if (drillError || !drill) {
      return NextResponse.json(
        { error: "Drill not found" },
        { status: 404 }
      );
    }

    // Check if answer is correct
    const isCorrect = user_answer === drill.correct_answer;

    // Insert the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("drill_attempts")
      .insert({
        user_id,
        drill_id,
        session_id,
        user_answer,
        confidence_level,
        response_time_seconds,
        is_correct: isCorrect
      })
      .select()
      .single();

    if (attemptError) {
      console.error("Error creating attempt:", attemptError);
      return NextResponse.json(
        { error: "Failed to record attempt" },
        { status: 500 }
      );
    }

    // Update category stats
    if (drill.subcategory?.category) {
      await updateCategoryStats(user_id, drill.subcategory.category.id, isCorrect);
    }

    // Calculate and update readiness score
    await calculateReadinessScore(user_id);

    // Get feedback for the answer
    const feedback = isCorrect
      ? {
          correct: true,
          explanation: drill.explanation,
          learning_points: drill.learning_points
        }
      : {
          correct: false,
          feedback: drill.incorrect_feedback?.[user_answer] || "This answer is not correct. Review the explanation to understand why.",
          correct_answer: drill.correct_answer,
          explanation: drill.explanation,
          learning_points: drill.learning_points
        };

    return NextResponse.json({
      success: true,
      attempt,
      feedback,
      drill: {
        id: drill.id,
        drill_code: drill.drill_code,
        category: drill.subcategory?.category?.title,
        difficulty_level: drill.difficulty_level
      }
    });

  } catch (error: any) {
    console.error("Attempt submission error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to update category stats
async function updateCategoryStats(userId: string, categoryId: string, isCorrect: boolean) {
  // Get current stats
  const { data: existingStats } = await supabase
    .from("user_category_stats")
    .select("*")
    .eq("user_id", userId)
    .eq("category_id", categoryId)
    .single();

  if (existingStats) {
    // Update existing stats
    const newAttemptsCount = existingStats.drills_attempted + 1;
    const newCorrectCount = existingStats.drills_correct + (isCorrect ? 1 : 0);
    const newAccuracy = (newCorrectCount / newAttemptsCount) * 100;

    await supabase
      .from("user_category_stats")
      .update({
        drills_attempted: newAttemptsCount,
        drills_correct: newCorrectCount,
        accuracy: newAccuracy,
        last_practiced_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .eq("category_id", categoryId);
  } else {
    // Create new stats
    await supabase
      .from("user_category_stats")
      .insert({
        user_id: userId,
        category_id: categoryId,
        drills_attempted: 1,
        drills_correct: isCorrect ? 1 : 0,
        accuracy: isCorrect ? 100 : 0,
        last_practiced_at: new Date().toISOString()
      });
  }
}

// Helper function to calculate readiness score
async function calculateReadinessScore(userId: string) {
  try {
    await supabase.rpc("calculate_readiness_score", { p_user_id: userId });
  } catch (error) {
    console.error("Error calculating readiness score:", error);
    // Non-critical, don't throw
  }
}
