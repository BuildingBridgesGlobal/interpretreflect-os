import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

/**
 * POST - Create minimal community profile (Essence Profile approach)
 *
 * Philosophy: Trauma-informed, low-friction onboarding
 * - Collects only essential fields upfront
 * - ECCI domains (offer_support_in, seeking_guidance_in) left empty - will be auto-detected from debriefs
 * - Profile is private by default (is_searchable: false)
 * - Profile grows organically as user engages with platform
 */
export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const user_id = user!.id;

    const body = await req.json();
    const {
      display_name,
      bio,
      is_deaf_interpreter,
      open_to_mentoring: explicit_open_to_mentoring, // Explicit checkbox from onboarding
      years_experience,
      primary_settings,      // Array of 1-3 specialty settings
      community_intent       // 'connect' | 'guidance' | 'share' | 'all'
    } = body;

    // Validate required fields
    if (!display_name) {
      return NextResponse.json(
        { error: "display_name is required" },
        { status: 400 }
      );
    }

    if (!years_experience) {
      return NextResponse.json(
        { error: "years_experience is required" },
        { status: 400 }
      );
    }

    if (!primary_settings || primary_settings.length === 0 || primary_settings.length > 3) {
      return NextResponse.json(
        { error: "primary_settings must contain 1-3 items" },
        { status: 400 }
      );
    }

    if (!community_intent) {
      return NextResponse.json(
        { error: "community_intent is required" },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const { data: existing } = await supabase
      .from("community_profiles")
      .select("id")
      .eq("user_id", user_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Profile already exists. Use PUT to update." },
        { status: 400 }
      );
    }

    // Determine initial mentoring flags
    // Use explicit checkbox if provided, otherwise infer from community_intent
    let open_to_mentoring = explicit_open_to_mentoring || false;
    let looking_for_mentor = false;

    // If user didn't explicitly check mentor box but selected "share" intent, suggest mentoring
    if (!explicit_open_to_mentoring && (community_intent === "share" || community_intent === "all")) {
      open_to_mentoring = true;
    }
    if (community_intent === "guidance" || community_intent === "all") {
      looking_for_mentor = true;
    }

    // Create minimal profile - ECCI domains intentionally left empty
    const { data: profile, error: createError } = await supabase
      .from("community_profiles")
      .insert({
        user_id,
        display_name,
        bio: bio || null,
        is_deaf_interpreter: is_deaf_interpreter || false,
        years_experience,

        // Primary settings (1-3 items)
        settings_work_in: primary_settings,
        specialties: primary_settings, // Legacy field compatibility

        // ECCI domains - left EMPTY for auto-detection from debriefs
        offer_support_in: [],
        seeking_guidance_in: [],
        strong_domains: [],  // Legacy field
        weak_domains: [],    // Legacy field

        // Mentoring preferences based on intent
        open_to_mentoring,
        looking_for_mentor,
        seeking_mentor: looking_for_mentor, // Legacy field

        // Empty arrays for fields to be populated later
        certifications: [],

        // Privacy: Private by default, user can make searchable later
        is_searchable: false
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating profile:", createError);
      return NextResponse.json(
        { error: "Failed to create profile", details: createError.message },
        { status: 500 }
      );
    }

    // Log successful onboarding for analytics
    console.log(`✅ Community profile created for user ${user_id} (${display_name})`);
    console.log(`   Intent: ${community_intent}, Settings: ${primary_settings.join(", ")}`);

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        message: "Profile created! Your ECCI strengths will emerge as you complete debriefs."
      }
    });

  } catch (error: any) {
    console.error("Profile onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
