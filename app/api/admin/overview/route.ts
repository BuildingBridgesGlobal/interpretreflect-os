import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Super admin emails - only these can access this endpoint
const SUPER_ADMIN_EMAILS = [
  "maddox@interpretreflect.com",
  "admin@interpretreflect.com",
  "sarah@interpretreflect.com",
];

async function verifyAdminAccess(req: NextRequest): Promise<{ authorized: boolean; userId?: string; email?: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { authorized: false };
  }

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return { authorized: false };
  }

  const userEmail = user.email?.toLowerCase() || "";
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(userEmail);

  if (!isSuperAdmin) {
    // Check for admin role in profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const hasAdminRole = (profile as any)?.role === "admin" || (profile as any)?.role === "super_admin";
    if (!hasAdminRole) {
      return { authorized: false };
    }
  }

  return { authorized: true, userId: user.id, email: userEmail };
}

/**
 * GET /api/admin/overview
 * Returns dashboard overview metrics pulled from real data
 */
export async function GET(req: NextRequest) {
  try {
    const { authorized } = await verifyAdminAccess(req);
    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Get date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Active Users (users who have activity in last 30 days)
    // Count users with recent login or activity
    const { count: activeUsersCount } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("updated_at", thirtyDaysAgo.toISOString());

    // 2. Total CEUs Earned (all time)
    const { data: ceuData } = await supabaseAdmin
      .from("ceu_certificates")
      .select("ceu_value")
      .eq("status", "active");

    const totalCEUs = ceuData?.reduce((sum, c) => sum + (c.ceu_value || 0), 0) || 0;

    // 3. Workshops Completed (count of completed user_module_progress)
    const { count: workshopsCompleted } = await supabaseAdmin
      .from("user_module_progress")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    // 4. Average Rating from evaluations
    const { data: evaluations } = await supabaseAdmin
      .from("ceu_evaluations")
      .select("q1_objectives_clear, q2_content_relevant, q3_applicable_to_work, q4_presenter_effective");

    let avgRating = 0;
    if (evaluations && evaluations.length > 0) {
      const totalRatings = evaluations.reduce((sum, e) => {
        const avg = ((e.q1_objectives_clear || 0) + (e.q2_content_relevant || 0) +
                     (e.q3_applicable_to_work || 0) + (e.q4_presenter_effective || 0)) / 4;
        return sum + avg;
      }, 0);
      avgRating = Math.round((totalRatings / evaluations.length) * 10) / 10;
    }

    // 5. Pipeline Data
    // Count users by their progress/role
    const { count: totalProfiles } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: itpGraduates } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("career_stage", "itp_graduate");

    const { count: activeInterpreters } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .or("career_stage.eq.working_interpreter,career_stage.eq.experienced");

    // Count mentors (users with mentorship_role = mentor)
    const { count: nowMentoring } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("mentorship_role", "mentor");

    // 6. Wellness Distribution
    // Get all wellness check-ins from last 30 days
    const { data: wellnessData } = await supabaseAdmin
      .from("wellness_checkins")
      .select("feeling")
      .gte("created_at", thirtyDaysAgo.toISOString());

    const wellnessDistribution = {
      healthy: 0, // energized + calm
      warning: 0, // okay + drained
      critical: 0, // overwhelmed
    };

    wellnessData?.forEach((w) => {
      if (w.feeling === "energized" || w.feeling === "calm") {
        wellnessDistribution.healthy++;
      } else if (w.feeling === "okay" || w.feeling === "drained") {
        wellnessDistribution.warning++;
      } else if (w.feeling === "overwhelmed") {
        wellnessDistribution.critical++;
      }
    });

    // Calculate check-in completion rate (users who checked in this week vs total active)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const { data: weeklyCheckins } = await supabaseAdmin
      .from("wellness_checkins")
      .select("user_id")
      .gte("created_at", weekStart.toISOString());

    const uniqueCheckInUsers = new Set(weeklyCheckins?.map(w => w.user_id) || []);
    const checkInCompletionRate = (activeUsersCount || 1) > 0
      ? Math.round((uniqueCheckInUsers.size / (activeUsersCount || 1)) * 100)
      : 0;

    // 7. Competency Growth (from user_competency_scores if available)
    const { data: competencyData } = await supabaseAdmin
      .from("user_competency_scores")
      .select("domain, score")
      .order("created_at", { ascending: false })
      .limit(1000);

    // Group by domain and calculate averages
    const domainScores: { [key: string]: { total: number; count: number } } = {};
    competencyData?.forEach((c) => {
      if (!domainScores[c.domain]) {
        domainScores[c.domain] = { total: 0, count: 0 };
      }
      domainScores[c.domain].total += c.score || 0;
      domainScores[c.domain].count++;
    });

    const domains = Object.entries(domainScores).map(([name, data]) => ({
      name,
      average: data.count > 0 ? Math.round(data.total / data.count) : 0,
      trend: "+0%", // Would need historical comparison for real trend
    }));

    // Default domains if none exist
    const defaultDomains = [
      { name: "Linguistic", average: 0, trend: "N/A" },
      { name: "Cultural", average: 0, trend: "N/A" },
      { name: "Cognitive", average: 0, trend: "N/A" },
      { name: "Interpersonal", average: 0, trend: "N/A" },
    ];

    return NextResponse.json({
      success: true,
      overviewMetrics: {
        activeUsers: activeUsersCount || 0,
        ceuEarned: Math.round(totalCEUs * 10) / 10,
        workshopsCompleted: workshopsCompleted || 0,
        avgRating: avgRating || 0,
      },
      pipelineData: {
        itpGraduates: itpGraduates || 0,
        activeInterpreters: activeInterpreters || 0,
        nowMentoring: nowMentoring || 0,
        totalUsers: totalProfiles || 0,
      },
      competencyGrowth: {
        domains: domains.length > 0 ? domains : defaultDomains,
      },
      wellnessIndicators: {
        distribution: wellnessDistribution,
        checkInCompletionRate: Math.min(checkInCompletionRate, 100),
        totalCheckins: wellnessData?.length || 0,
      },
      generatedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error("Admin overview error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
