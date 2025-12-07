import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Helper to verify auth and get user ID from session token
async function verifyAuthAndGetUser(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user.id;
}

/**
 * GET /api/ceu
 * Fetch CEU summary, certificates, and progress for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await verifyAuthAndGetUser(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // Get user's credit balance
    if (action === "credits") {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("monthly_credits, topup_credits, credits_reset_at, subscription_tier")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching credits:", profileError);
        return NextResponse.json(
          { error: "Failed to fetch credits" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        credits: {
          monthly: profile?.monthly_credits || 0,
          topup: profile?.topup_credits || 0,
          total: (profile?.monthly_credits || 0) + (profile?.topup_credits || 0),
          reset_at: profile?.credits_reset_at,
          tier: profile?.subscription_tier || "free",
        },
      });
    }

    // Get CEU dashboard data using the optimized database function
    if (action === "dashboard") {
      const { data: dashboardData, error: dashboardError } = await supabaseAdmin
        .rpc("get_user_ceu_dashboard", { p_user_id: userId });

      if (dashboardError) {
        console.error("Error fetching CEU dashboard:", dashboardError);
        return NextResponse.json(
          { error: "Failed to fetch CEU dashboard" },
          { status: 500 }
        );
      }

      const row = dashboardData?.[0];
      return NextResponse.json({
        success: true,
        dashboard: row ? {
          cycle_start: row.cycle_start,
          cycle_end: row.cycle_end,
          professional_studies: {
            earned: parseFloat(row.professional_studies_earned) || 0,
            required: parseFloat(row.professional_studies_required) || 6.0,
            percent: row.professional_studies_percent || 0,
          },
          ppo: {
            earned: parseFloat(row.ppo_earned) || 0,
            required: parseFloat(row.ppo_required) || 1.0,
            percent: row.ppo_percent || 0,
          },
          general_studies: {
            earned: parseFloat(row.general_studies_earned) || 0,
            max: parseFloat(row.general_studies_max) || 2.0,
          },
          total: {
            earned: parseFloat(row.total_earned) || 0,
            required: parseFloat(row.total_required) || 8.0,
            percent: row.total_percent || 0,
          },
          is_compliant: row.is_compliant || false,
          certificates_count: row.certificates_count || 0,
          recent_certificates: row.recent_certificates || [],
        } : null,
      });
    }

    // Get CEU summary for current cycle (original detailed view)
    if (action === "summary" || !action) {
      const currentYear = new Date().getFullYear();
      const cycleStart = `${currentYear}-01-01`;
      const cycleEnd = `${currentYear}-12-31`;

      let { data: summary, error: summaryError } = await supabaseAdmin
        .from("user_ceu_summary")
        .select("*")
        .eq("user_id", userId)
        .eq("cycle_start_date", cycleStart)
        .single();

      if (summaryError && summaryError.code === "PGRST116") {
        // No summary exists, create one
        const { data: newSummary, error: insertError } = await supabaseAdmin
          .from("user_ceu_summary")
          .insert({
            user_id: userId,
            cycle_start_date: cycleStart,
            cycle_end_date: cycleEnd,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating CEU summary:", insertError);
        } else {
          summary = newSummary;
        }
      }

      // Get certificates for this user
      const { data: certificates } = await supabaseAdmin
        .from("ceu_certificates")
        .select(`
          *,
          skill_modules (
            module_code,
            title
          ),
          skill_series (
            series_code,
            title
          )
        `)
        .eq("user_id", userId)
        .eq("status", "active")
        .order("issued_at", { ascending: false });

      // Get module progress with CEU info
      const { data: moduleProgress } = await supabaseAdmin
        .from("user_module_progress")
        .select(`
          *,
          skill_modules (
            id,
            module_code,
            title,
            duration_minutes,
            ceu_value,
            rid_category,
            rid_subcategory,
            ceu_eligible,
            learning_objectives,
            assessment_questions,
            assessment_pass_threshold
          )
        `)
        .eq("user_id", userId);

      // Calculate CEUs available (modules completed but not yet certified)
      const completedModules = moduleProgress?.filter(
        (p) => p.status === "completed" && !p.certificate_id
      ) || [];

      const availableCEUs = completedModules.reduce((total, p) => {
        const module = p.skill_modules as any;
        if (module?.ceu_eligible && module?.ceu_value) {
          // Only count if assessment passed or no assessment required
          if (!module.assessment_questions || p.assessment_passed) {
            return total + parseFloat(module.ceu_value);
          }
        }
        return total;
      }, 0);

      return NextResponse.json({
        success: true,
        summary: summary || {
          professional_studies_earned: 0,
          professional_studies_required: 6.0,
          ppo_earned: 0,
          ppo_required: 1.0,
          general_studies_earned: 0,
          general_studies_max: 2.0,
          total_earned: 0,
          total_required: 8.0,
          is_compliant: false,
        },
        certificates: certificates || [],
        moduleProgress: moduleProgress || [],
        availableCEUs: Math.round(availableCEUs * 100) / 100,
        cycle: {
          start: cycleStart,
          end: cycleEnd,
          year: currentYear,
        },
      });
    }

    // Get single certificate details
    if (action === "certificate") {
      const certificateId = searchParams.get("id");
      if (!certificateId) {
        return NextResponse.json(
          { error: "Certificate ID required" },
          { status: 400 }
        );
      }

      const { data: certificate, error } = await supabaseAdmin
        .from("ceu_certificates")
        .select(`
          *,
          skill_modules (
            module_code,
            title,
            description,
            ecci_domain
          ),
          skill_series (
            series_code,
            title,
            description,
            ecci_domain
          )
        `)
        .eq("id", certificateId)
        .eq("user_id", userId)
        .single();

      if (error || !certificate) {
        return NextResponse.json(
          { error: "Certificate not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        certificate,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("CEU fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ceu
 * Submit assessment, issue certificate, etc.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await verifyAuthAndGetUser(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action } = body;

    // Submit module assessment
    if (action === "submit_assessment") {
      const { module_id, answers, started_at } = body;

      if (!module_id || !answers) {
        return NextResponse.json(
          { error: "module_id and answers are required" },
          { status: 400 }
        );
      }

      // Get module with assessment questions
      const { data: module, error: moduleError } = await supabaseAdmin
        .from("skill_modules")
        .select("*")
        .eq("id", module_id)
        .single();

      if (moduleError || !module) {
        return NextResponse.json(
          { error: "Module not found" },
          { status: 404 }
        );
      }

      if (!module.assessment_questions || !module.ceu_eligible) {
        return NextResponse.json(
          { error: "This module does not have an assessment" },
          { status: 400 }
        );
      }

      // Calculate score
      const questions = module.assessment_questions as any[];
      let correctCount = 0;

      for (const question of questions) {
        if (answers[question.id] === question.correct_answer) {
          correctCount++;
        }
      }

      const score = Math.round((correctCount / questions.length) * 100);
      const passed = score >= (module.assessment_pass_threshold || 80);

      // Get attempt number
      const { count } = await supabaseAdmin
        .from("module_assessment_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("module_id", module_id);

      const attemptNumber = (count || 0) + 1;

      // Record attempt
      const { data: attempt, error: attemptError } = await supabaseAdmin
        .from("module_assessment_attempts")
        .insert({
          user_id: userId,
          module_id,
          attempt_number: attemptNumber,
          answers,
          score,
          passed,
          started_at: started_at || new Date().toISOString(),
          time_spent_seconds: started_at
            ? Math.round((Date.now() - new Date(started_at).getTime()) / 1000)
            : null,
        })
        .select()
        .single();

      if (attemptError) {
        console.error("Error recording attempt:", attemptError);
        return NextResponse.json(
          { error: "Failed to record assessment attempt" },
          { status: 500 }
        );
      }

      // Update user_module_progress
      await supabaseAdmin
        .from("user_module_progress")
        .update({
          assessment_completed: true,
          assessment_score: score,
          assessment_passed: passed,
          assessment_attempts: attemptNumber,
        })
        .eq("user_id", userId)
        .eq("module_id", module_id);

      // If passed, issue certificate
      let certificate: any = null;
      if (passed) {
        const certificateResult = await issueCertificate(userId, module, attempt.id);
        if (certificateResult.success && certificateResult.certificate) {
          const issuedCert = certificateResult.certificate;
          certificate = issuedCert;

          // Link certificate to progress and attempt
          await supabaseAdmin
            .from("user_module_progress")
            .update({ certificate_id: issuedCert.id })
            .eq("user_id", userId)
            .eq("module_id", module_id);

          await supabaseAdmin
            .from("module_assessment_attempts")
            .update({ certificate_id: issuedCert.id })
            .eq("id", attempt.id);
        }
      }

      // Build feedback
      const feedback = questions.map((q: any) => ({
        question_id: q.id,
        question: q.question,
        user_answer: answers[q.id],
        correct_answer: q.correct_answer,
        is_correct: answers[q.id] === q.correct_answer,
        explanation: q.explanation,
      }));

      return NextResponse.json({
        success: true,
        score,
        passed,
        correctCount,
        totalQuestions: questions.length,
        passThreshold: module.assessment_pass_threshold || 80,
        attemptNumber,
        feedback,
        certificate,
        message: passed
          ? `Congratulations! You passed with ${score}%. Your CEU certificate has been issued.`
          : `You scored ${score}%. You need ${module.assessment_pass_threshold || 80}% to pass. You can retake the assessment.`,
      });
    }

    // Issue certificate for completed module (if assessment not required or already passed)
    if (action === "issue_certificate") {
      const { module_id } = body;

      if (!module_id) {
        return NextResponse.json(
          { error: "module_id is required" },
          { status: 400 }
        );
      }

      // Get module
      const { data: module, error: moduleError } = await supabaseAdmin
        .from("skill_modules")
        .select("*")
        .eq("id", module_id)
        .single();

      if (moduleError || !module) {
        return NextResponse.json(
          { error: "Module not found" },
          { status: 404 }
        );
      }

      if (!module.ceu_eligible) {
        return NextResponse.json(
          { error: "This module is not CEU eligible" },
          { status: 400 }
        );
      }

      // Check if user has completed the module
      const { data: progress, error: progressError } = await supabaseAdmin
        .from("user_module_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("module_id", module_id)
        .single();

      if (progressError || !progress || progress.status !== "completed") {
        return NextResponse.json(
          { error: "Module not completed" },
          { status: 400 }
        );
      }

      // Check if certificate already issued
      if (progress.certificate_id) {
        return NextResponse.json(
          { error: "Certificate already issued for this module" },
          { status: 400 }
        );
      }

      // If assessment required, check if passed
      if (module.assessment_questions && !progress.assessment_passed) {
        return NextResponse.json(
          { error: "Assessment must be passed before certificate can be issued" },
          { status: 400 }
        );
      }

      // Issue certificate
      const result = await issueCertificate(userId, module);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      // Link certificate to progress
      await supabaseAdmin
        .from("user_module_progress")
        .update({ certificate_id: result.certificate.id })
        .eq("user_id", userId)
        .eq("module_id", module_id);

      return NextResponse.json({
        success: true,
        certificate: result.certificate,
        message: "CEU certificate issued successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("CEU action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to issue a CEU certificate
 * Uses the database function for safe certificate number generation
 */
async function issueCertificate(
  userId: string,
  module: any,
  assessmentAttemptId?: string
): Promise<{ success: boolean; certificate?: any; error?: string }> {
  try {
    // Get assessment score if applicable
    let assessmentScore = null;
    if (assessmentAttemptId) {
      const { data: attempt } = await supabaseAdmin
        .from("module_assessment_attempts")
        .select("score")
        .eq("id", assessmentAttemptId)
        .single();
      assessmentScore = attempt?.score;
    }

    // Try using the database function first (handles certificate number generation safely)
    const { data: certificateId, error: rpcError } = await supabaseAdmin
      .rpc("issue_ceu_certificate", {
        p_user_id: userId,
        p_module_id: module.id,
        p_series_id: null,
        p_assessment_score: assessmentScore,
      });

    if (!rpcError && certificateId) {
      // Fetch the full certificate record
      const { data: certificate, error: fetchError } = await supabaseAdmin
        .from("ceu_certificates")
        .select("*")
        .eq("id", certificateId)
        .single();

      if (fetchError || !certificate) {
        console.error("Error fetching issued certificate:", fetchError);
        return { success: false, error: "Certificate issued but fetch failed" };
      }

      return { success: true, certificate };
    }

    // Fallback to manual insertion if RPC fails
    console.warn("RPC issue_ceu_certificate failed, using fallback:", rpcError?.message);

    // Get user's module progress for timing info
    const { data: progress } = await supabaseAdmin
      .from("user_module_progress")
      .select("started_at, completed_at, time_spent_seconds")
      .eq("user_id", userId)
      .eq("module_id", module.id)
      .single();

    // Generate certificate number (fallback method)
    const year = new Date().getFullYear();
    const { count } = await supabaseAdmin
      .from("ceu_certificates")
      .select("*", { count: "exact", head: true })
      .like("certificate_number", `IR-${year}-%`);

    const sequence = ((count || 0) + 1).toString().padStart(6, "0");
    const certificateNumber = `IR-${year}-${sequence}`;

    // Create certificate (fallback)
    const { data: certificate, error } = await supabaseAdmin
      .from("ceu_certificates")
      .insert({
        user_id: userId,
        module_id: module.id,
        certificate_number: certificateNumber,
        title: module.title,
        description: module.description,
        ceu_value: module.ceu_value,
        rid_category: module.rid_category || "Professional Studies",
        rid_subcategory: module.rid_subcategory,
        learning_objectives_achieved: module.learning_objectives || [],
        assessment_score: assessmentScore,
        assessment_passed: true,
        started_at: progress?.started_at,
        completed_at: progress?.completed_at || new Date().toISOString(),
        time_spent_minutes: progress?.time_spent_seconds
          ? Math.round(progress.time_spent_seconds / 60)
          : module.duration_minutes,
        rid_activity_type: "SIA",
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Error issuing certificate:", error);
      return { success: false, error: "Failed to issue certificate" };
    }

    return { success: true, certificate };
  } catch (error: any) {
    console.error("Certificate issuance error:", error);
    return { success: false, error: error.message };
  }
}
