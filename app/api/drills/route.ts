import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch drills by category or get random drills
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryCode = searchParams.get("category");
    const count = parseInt(searchParams.get("count") || "5");
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("drills")
      .select(`
        *,
        subcategory:drill_subcategories(
          *,
          category:drill_categories(*)
        )
      `)
      .eq("is_active", true);

    // Filter by category if specified
    if (categoryCode) {
      // Get category ID first
      const { data: category } = await supabase
        .from("drill_categories")
        .select("id")
        .eq("category_code", categoryCode)
        .single();

      if (category) {
        // Get subcategories for this category
        const { data: subcategories } = await supabase
          .from("drill_subcategories")
          .select("id")
          .eq("category_id", category.id);

        if (subcategories && subcategories.length > 0) {
          const subcategoryIds = subcategories.map(s => s.id);
          query = query.in("subcategory_id", subcategoryIds);
        }
      }
    }

    const { data: drills, error } = await query.limit(100);

    if (error) {
      console.error("Error fetching drills:", error);
      return NextResponse.json(
        { error: "Failed to fetch drills" },
        { status: 500 }
      );
    }

    if (!drills || drills.length === 0) {
      return NextResponse.json(
        { error: "No drills found" },
        { status: 404 }
      );
    }

    // Get user's previous attempts for these drills
    const drillIds = drills.map(d => d.id);
    const { data: attempts } = await supabase
      .from("drill_attempts")
      .select("drill_id, is_correct, attempted_at")
      .eq("user_id", userId)
      .in("drill_id", drillIds)
      .order("attempted_at", { ascending: false });

    // Filter out drills the user has already completed correctly (optional)
    // For now, we'll include all drills but mark which ones are completed
    const drillsWithStatus = drills.map(drill => {
      const userAttempts = attempts?.filter(a => a.drill_id === drill.id) || [];
      const hasCompletedCorrectly = userAttempts.some(a => a.is_correct);

      return {
        ...drill,
        attempted: userAttempts.length > 0,
        completed: hasCompletedCorrectly,
        attempt_count: userAttempts.length
      };
    });

    // Shuffle and limit to requested count
    const shuffled = drillsWithStatus.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    return NextResponse.json({
      drills: selected,
      total_available: drillsWithStatus.length
    });

  } catch (error: any) {
    console.error("Drills fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
