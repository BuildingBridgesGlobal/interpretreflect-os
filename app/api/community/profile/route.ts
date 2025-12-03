import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get user's community profile
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const viewUserId = searchParams.get("view_user_id"); // If viewing another user's profile

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const targetUserId = viewUserId || userId;

    // Get the profile
    const { data: profile, error: profileError } = await supabase
      .from("community_profiles")
      .select("*")
      .eq("user_id", targetUserId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch profile", details: profileError.message },
        { status: 500 }
      );
    }

    // If no profile exists and this is the current user, return empty template with their name
    if (!profile && targetUserId === userId) {
      // Fetch user's full_name and email from profiles table to pre-populate display_name
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .single();

      // Use full_name, or extract name from email as fallback
      let suggestedName = userProfile?.full_name;
      if (!suggestedName && userProfile?.email) {
        // Extract name from email (e.g., "john.doe@email.com" -> "John Doe")
        const emailName = userProfile.email.split('@')[0];
        suggestedName = emailName
          .replace(/[._]/g, ' ')
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }

      return NextResponse.json({
        profile: null,
        needs_setup: true,
        suggested_display_name: suggestedName || null
      });
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Get connection count
    const { count: connectionsCount } = await supabase
      .from("connections")
      .select("*", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`);

    // Get posts count
    const { count: postsCount } = await supabase
      .from("community_posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId)
      .eq("is_deleted", false);

    // If viewing another user's profile, check connection status
    let connectionStatus = null;
    let connectionId = null;
    if (viewUserId && viewUserId !== userId) {
      const { data: connection } = await supabase
        .from("connections")
        .select("id, status, requester_id")
        .or(`and(requester_id.eq.${userId},addressee_id.eq.${viewUserId}),and(requester_id.eq.${viewUserId},addressee_id.eq.${userId})`)
        .single();

      if (connection) {
        connectionStatus = connection.status;
        connectionId = connection.id;
      }
    }

    return NextResponse.json({
      profile: {
        ...profile,
        connections_count: connectionsCount || 0,
        posts_count: postsCount || 0
      },
      connection_status: connectionStatus,
      connection_id: connectionId,
      is_own_profile: targetUserId === userId
    });

  } catch (error: any) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create community profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      display_name,
      bio,
      // New fields
      is_deaf_interpreter,
      years_experience,
      settings_work_in,
      offer_support_in,
      seeking_guidance_in,
      open_to_mentoring,
      looking_for_mentor,
      // Legacy fields (for backward compatibility)
      specialties,
      strong_domains,
      weak_domains,
      certifications,
      seeking_mentor
    } = body;

    if (!user_id || !display_name) {
      return NextResponse.json(
        { error: "user_id and display_name are required" },
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

    // Create the profile with both new and legacy fields
    const { data: profile, error: createError } = await supabase
      .from("community_profiles")
      .insert({
        user_id,
        display_name,
        bio: bio || null,
        // New fields
        is_deaf_interpreter: is_deaf_interpreter || false,
        years_experience: years_experience || null,
        settings_work_in: settings_work_in || specialties || [],
        offer_support_in: offer_support_in || strong_domains || [],
        seeking_guidance_in: seeking_guidance_in || weak_domains || [],
        looking_for_mentor: looking_for_mentor || seeking_mentor || false,
        open_to_mentoring: open_to_mentoring || false,
        // Legacy fields (also save for backward compatibility)
        specialties: settings_work_in || specialties || [],
        strong_domains: offer_support_in || strong_domains || [],
        weak_domains: seeking_guidance_in || weak_domains || [],
        seeking_mentor: looking_for_mentor || seeking_mentor || false,
        certifications: certifications || [],
        is_searchable: true
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

    return NextResponse.json({
      success: true,
      profile
    });

  } catch (error: any) {
    console.error("Profile create error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update community profile
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      display_name,
      bio,
      // New fields
      is_deaf_interpreter,
      years_experience,
      settings_work_in,
      offer_support_in,
      seeking_guidance_in,
      open_to_mentoring,
      looking_for_mentor,
      is_searchable,
      // Legacy fields (for backward compatibility)
      specialties,
      strong_domains,
      weak_domains,
      certifications,
      seeking_mentor
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updates: any = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (bio !== undefined) updates.bio = bio;

    // New fields
    if (is_deaf_interpreter !== undefined) updates.is_deaf_interpreter = is_deaf_interpreter;
    if (years_experience !== undefined) updates.years_experience = years_experience;
    if (settings_work_in !== undefined) {
      updates.settings_work_in = settings_work_in;
      updates.specialties = settings_work_in; // Also update legacy field
    }
    if (offer_support_in !== undefined) {
      updates.offer_support_in = offer_support_in;
      updates.strong_domains = offer_support_in; // Also update legacy field
    }
    if (seeking_guidance_in !== undefined) {
      updates.seeking_guidance_in = seeking_guidance_in;
      updates.weak_domains = seeking_guidance_in; // Also update legacy field
    }
    if (looking_for_mentor !== undefined) {
      updates.looking_for_mentor = looking_for_mentor;
      updates.seeking_mentor = looking_for_mentor; // Also update legacy field
    }
    if (open_to_mentoring !== undefined) updates.open_to_mentoring = open_to_mentoring;
    if (is_searchable !== undefined) updates.is_searchable = is_searchable;

    // Legacy fields (if new fields not provided)
    if (specialties !== undefined && settings_work_in === undefined) {
      updates.specialties = specialties;
      updates.settings_work_in = specialties;
    }
    if (strong_domains !== undefined && offer_support_in === undefined) {
      updates.strong_domains = strong_domains;
      updates.offer_support_in = strong_domains;
    }
    if (weak_domains !== undefined && seeking_guidance_in === undefined) {
      updates.weak_domains = weak_domains;
      updates.seeking_guidance_in = weak_domains;
    }
    if (seeking_mentor !== undefined && looking_for_mentor === undefined) {
      updates.seeking_mentor = seeking_mentor;
      updates.looking_for_mentor = seeking_mentor;
    }
    if (certifications !== undefined) updates.certifications = certifications;

    const { data: profile, error: updateError } = await supabase
      .from("community_profiles")
      .update(updates)
      .eq("user_id", user_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile
    });

  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
