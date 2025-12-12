import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// GET - Fetch user preferences
export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    // Get user preferences
    const { data: preferences, error: prefError } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (prefError && prefError.code !== "PGRST116") {
      console.error("Error fetching preferences:", prefError);
      return NextResponse.json(
        { error: "Failed to fetch preferences", details: prefError.message },
        { status: 500 }
      );
    }

    // Return defaults if no preferences exist
    const defaultPreferences = {
      sidebar_collapsed: false,
      guidelines_acknowledged: false,
      guidelines_acknowledged_at: null,
      onboarding_completed: false,
      onboarding_dismissed: false,
      onboarding_dismissed_at: null,
      feed_preferences: {},
      notification_preferences: {}
    };

    return NextResponse.json({
      preferences: preferences || defaultPreferences
    });

  } catch (error: any) {
    console.error("Preferences fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update user preferences
export async function PUT(req: NextRequest) {
  try {
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const body = await req.json();
    const {
      sidebar_collapsed,
      guidelines_acknowledged,
      onboarding_dismissed,
      feed_preferences,
      notification_preferences
    } = body;

    // Build update object
    const updateData: Record<string, any> = {
      user_id: userId,
      updated_at: new Date().toISOString()
    };

    if (typeof sidebar_collapsed === "boolean") {
      updateData.sidebar_collapsed = sidebar_collapsed;
    }

    if (typeof guidelines_acknowledged === "boolean") {
      updateData.guidelines_acknowledged = guidelines_acknowledged;
      if (guidelines_acknowledged) {
        updateData.guidelines_acknowledged_at = new Date().toISOString();
      }
    }

    if (typeof onboarding_dismissed === "boolean") {
      updateData.onboarding_dismissed = onboarding_dismissed;
      if (onboarding_dismissed) {
        updateData.onboarding_dismissed_at = new Date().toISOString();
      }
    }

    if (feed_preferences) {
      updateData.feed_preferences = feed_preferences;
    }

    if (notification_preferences) {
      updateData.notification_preferences = notification_preferences;
    }

    // Upsert preferences
    const { data: preferences, error: upsertError } = await supabase
      .from("user_preferences")
      .upsert(updateData, {
        onConflict: "user_id"
      })
      .select()
      .single();

    if (upsertError) {
      console.error("Error updating preferences:", upsertError);
      return NextResponse.json(
        { error: "Failed to update preferences", details: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences
    });

  } catch (error: any) {
    console.error("Preferences update error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
