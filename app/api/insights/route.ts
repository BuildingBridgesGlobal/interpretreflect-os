import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params or auth header
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Fetch user's recent debriefs (last 30 days)
    const { data: recentDebriefs, error: debriefsError } = await supabase
      .from("debriefs")
      .select("*")
      .eq("user_id", userId)
      .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("date", { ascending: false })
      .limit(10);

    if (debriefsError) {
      console.error("Error fetching debriefs:", debriefsError);
    }

    // Fetch user's skill assessments (last 3 months)
    const { data: skillAssessments, error: skillsError } = await supabase
      .from("skill_assessments")
      .select(`
        *,
        skill:skills(name, domain)
      `)
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    if (skillsError) {
      console.error("Error fetching skill assessments:", skillsError);
    }

    // Fetch user's active skill goals
    const { data: skillGoals, error: goalsError } = await supabase
      .from("skill_goals")
      .select(`
        *,
        skill:skills(name, domain)
      `)
      .eq("user_id", userId)
      .is("achieved_at", null)
      .order("created_at", { ascending: false });

    if (goalsError) {
      console.error("Error fetching skill goals:", goalsError);
    }

    // Fetch recent milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from("milestones")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(5);

    if (milestonesError) {
      console.error("Error fetching milestones:", milestonesError);
    }

    // Fetch recent performance flags (strengths & development areas)
    const { data: performanceFlags, error: flagsError } = await supabase
      .from("performance_flags")
      .select(`
        *,
        debrief:debriefs(date, assignment_type)
      `)
      .in("debrief_id", recentDebriefs?.map(d => d.id) || [])
      .order("created_at", { ascending: false })
      .limit(20);

    if (flagsError) {
      console.error("Error fetching performance flags:", flagsError);
    }

    // Calculate insights

    // 1. Total sessions this month
    const totalSessionsThisMonth = recentDebriefs?.length || 0;

    // 2. Average performance score
    const avgPerformance = recentDebriefs?.length
      ? Math.round(
          recentDebriefs.reduce((sum, d) => sum + (d.performance_score || 0), 0) /
            recentDebriefs.length
        )
      : 0;

    // 3. Top strength skill (most improved or highest scored)
    const strengthSkills = performanceFlags
      ?.filter((f) => f.flag_type === "strength")
      .map((f) => f.description) || [];

    const topStrength = strengthSkills[0] || "Active learning demonstrated";

    // 4. Development focus (most common development flag)
    const developmentAreas = performanceFlags
      ?.filter((f) => f.flag_type === "development")
      .map((f) => f.description) || [];

    const developmentFocus =
      developmentAreas[0] || "Continue building cross-setting confidence";

    // 5. Active goals count
    const activeGoalsCount = skillGoals?.length || 0;

    // 6. Recent breakthrough
    const recentBreakthrough = performanceFlags?.find(
      (f) => f.flag_type === "breakthrough"
    );

    // 7. Skill growth trends (by domain)
    const skillsByDomain: Record<string, any[]> = {
      Linguistic: [],
      Cultural: [],
      Cognitive: [],
      Interpersonal: [],
    };

    skillAssessments?.forEach((assessment) => {
      const domain = assessment.skill?.domain;
      if (domain && skillsByDomain[domain]) {
        skillsByDomain[domain].push(assessment);
      }
    });

    const domainAverages = Object.entries(skillsByDomain).map(([domain, assessments]) => ({
      domain,
      avgLevel: assessments.length
        ? Math.round(assessments.reduce((sum, a) => sum + a.level, 0) / assessments.length)
        : 0,
      count: assessments.length,
    }));

    // 8. Most common assignment type
    const assignmentTypes = recentDebriefs?.map((d) => d.assignment_type) || [];
    const mostCommonType =
      assignmentTypes.reduce(
        (acc, type) => {
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    const primarySetting = Object.keys(mostCommonType).sort(
      (a, b) => mostCommonType[b] - mostCommonType[a]
    )[0] || "Various settings";

    // Return structured insights
    return NextResponse.json({
      summary: {
        totalSessionsThisMonth,
        avgPerformance,
        topStrength,
        developmentFocus,
        activeGoalsCount,
        primarySetting,
      },
      skillTrends: {
        byDomain: domainAverages,
        topSkills: skillAssessments
          ?.filter((a) => a.level >= 80)
          .map((a) => ({
            name: a.skill?.name,
            level: a.level,
            domain: a.skill?.domain,
          }))
          .slice(0, 5) || [],
      },
      recentActivity: {
        debriefs: recentDebriefs?.slice(0, 5).map((d) => ({
          id: d.id,
          date: d.date,
          type: d.assignment_type,
          headline: d.headline,
          score: d.performance_score,
        })) || [],
        milestones: milestones?.map((m) => ({
          date: m.date,
          label: m.label,
          type: m.type,
          description: m.description,
        })) || [],
        breakthrough: recentBreakthrough
          ? {
              description: recentBreakthrough.description,
              date: recentBreakthrough.debrief?.date,
            }
          : null,
      },
      performanceFlags: {
        strengths: strengthSkills.slice(0, 3),
        developmentAreas: developmentAreas.slice(0, 3),
      },
      goals: skillGoals?.map((g) => ({
        id: g.id,
        skillName: g.skill?.name,
        domain: g.skill?.domain,
        currentLevel: g.current_level,
        targetLevel: g.target_level,
        progress: g.current_level / g.target_level,
      })) || [],
    });
  } catch (error: any) {
    console.error("Error in /api/insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch insights", details: error.message },
      { status: 500 }
    );
  }
}
