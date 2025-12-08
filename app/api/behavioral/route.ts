import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const supabase = supabaseAdmin;

/**
 * GET - Fetch user's behavioral data summary
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dataType = searchParams.get("type") || "summary";
    const days = parseInt(searchParams.get("days") || "7");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    if (dataType === "summary") {
      // Get wellness metrics summary
      const { data: metrics } = await supabase
        .from("daily_wellness_metrics")
        .select("*")
        .eq("user_id", user.id)
        .gte("metric_date", startDate.toISOString().split("T")[0])
        .order("metric_date", { ascending: false });

      // Get recent sessions summary
      const { data: sessions } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("started_at", startDate.toISOString())
        .order("started_at", { ascending: false })
        .limit(20);

      // Get pending interventions
      const { data: interventions } = await supabase
        .from("proactive_interventions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("priority", { ascending: true })
        .limit(5);

      // Calculate aggregates
      const avgStress = metrics?.length
        ? metrics.reduce((sum, m) => sum + (m.stress_score || 0), 0) / metrics.length
        : null;

      const avgBurnoutRisk = metrics?.length
        ? metrics.reduce((sum, m) => sum + (m.burnout_risk_score || 0), 0) / metrics.length
        : null;

      const totalSessions = sessions?.length || 0;
      const totalReflections = sessions?.reduce((sum, s) => sum + (s.reflections_completed || 0), 0) || 0;

      return NextResponse.json({
        success: true,
        summary: {
          period_days: days,
          avg_stress_score: avgStress ? Math.round(avgStress) : null,
          avg_burnout_risk: avgBurnoutRisk ? Math.round(avgBurnoutRisk) : null,
          total_sessions: totalSessions,
          total_reflections: totalReflections,
          current_burnout_level: metrics?.[0]?.burnout_risk_level || "unknown",
          stress_trend: calculateTrend(metrics?.map(m => m.stress_score).filter(Boolean) || []),
        },
        daily_metrics: metrics || [],
        recent_sessions: sessions || [],
        pending_interventions: interventions || [],
      });
    }

    if (dataType === "signals") {
      // Get recent behavioral signals
      const { data: signals } = await supabase
        .from("behavioral_signals")
        .select("*")
        .eq("user_id", user.id)
        .gte("recorded_at", startDate.toISOString())
        .order("recorded_at", { ascending: false })
        .limit(100);

      return NextResponse.json({
        success: true,
        signals: signals || [],
      });
    }

    return NextResponse.json({ error: "Invalid data type" }, { status: 400 });
  } catch (error: any) {
    console.error("Behavioral data error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Record behavioral signals in batch
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, signals, session_data } = body;

    // Handle batch signal recording
    if (action === "record_signals" && signals?.length) {
      const signalRecords = signals.map((s: any) => ({
        user_id: user.id,
        session_id: s.session_id || null,
        signal_type: s.signal_type,
        signal_category: s.signal_category,
        signal_value: s.signal_value || null,
        signal_label: s.signal_label || null,
        signal_metadata: s.signal_metadata || {},
        context_page: s.context_page || null,
        source: "app",
      }));

      const { error: insertError } = await supabase
        .from("behavioral_signals")
        .insert(signalRecords);

      if (insertError) {
        console.error("Signal insert error:", insertError);
        return NextResponse.json({ error: "Failed to record signals" }, { status: 500 });
      }

      return NextResponse.json({ success: true, recorded: signals.length });
    }

    // Handle session start
    if (action === "start_session") {
      const { data: sessionId, error: sessionError } = await supabase.rpc("start_user_session", {
        p_user_id: user.id,
        p_device_type: session_data?.device_type || "web",
        p_entry_trigger: session_data?.entry_trigger || "user_initiated",
        p_entry_source: session_data?.entry_source || null,
        p_entry_context: session_data?.entry_context || {},
      });

      if (sessionError) {
        console.error("Session start error:", sessionError);
        return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
      }

      return NextResponse.json({ success: true, session_id: sessionId });
    }

    // Handle wellness check
    if (action === "wellness_check") {
      const { mood, stress, energy, notes } = body;

      // Record mood signal
      if (mood !== undefined) {
        await supabase.rpc("record_behavioral_signal", {
          p_user_id: user.id,
          p_signal_type: "mood_check",
          p_signal_category: "emotional",
          p_signal_value: mood,
          p_signal_label: getMoodLabel(mood),
          p_signal_metadata: { notes },
          p_session_id: null,
          p_context_page: "/wellness",
          p_source: "app",
        });
      }

      // Record stress signal
      if (stress !== undefined) {
        await supabase.rpc("record_behavioral_signal", {
          p_user_id: user.id,
          p_signal_type: "stress_indicator",
          p_signal_category: "emotional",
          p_signal_value: stress * 10,
          p_signal_label: null,
          p_signal_metadata: { originalScale: "1-10" },
          p_session_id: null,
          p_context_page: "/wellness",
          p_source: "app",
        });
      }

      // Record energy signal
      if (energy !== undefined) {
        await supabase.rpc("record_behavioral_signal", {
          p_user_id: user.id,
          p_signal_type: "energy_level",
          p_signal_category: "emotional",
          p_signal_value: energy * 10,
          p_signal_label: null,
          p_signal_metadata: { originalScale: "1-10" },
          p_session_id: null,
          p_context_page: "/wellness",
          p_source: "app",
        });
      }

      // Trigger daily wellness calculation
      await supabase.rpc("calculate_daily_wellness", {
        p_user_id: user.id,
        p_date: new Date().toISOString().split("T")[0],
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Behavioral API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper functions
function calculateTrend(values: number[]): "improving" | "stable" | "worsening" | "unknown" {
  if (values.length < 3) return "unknown";

  const recent = values.slice(0, 3);
  const older = values.slice(3, 6);

  if (older.length === 0) return "stable";

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  const diff = recentAvg - olderAvg;

  // For stress, lower is better
  if (diff < -5) return "improving";
  if (diff > 5) return "worsening";
  return "stable";
}

function getMoodLabel(level: number): string {
  if (level <= 1) return "very_low";
  if (level <= 2) return "low";
  if (level <= 3) return "neutral";
  if (level <= 4) return "good";
  return "great";
}
