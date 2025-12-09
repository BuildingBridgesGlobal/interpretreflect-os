import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// Types
export type AffiliationCategory = "identity" | "background" | "specialty";

export interface CommunityAffiliation {
  id: string;
  name: string;
  short_code: string;
  category: AffiliationCategory;
  aligned_org: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export interface UserAffiliation {
  id: string;
  user_id: string;
  affiliation_id: string;
  visible_in_community: boolean;
  affiliation?: CommunityAffiliation;
}

// GET - Fetch all affiliations and optionally user's selections
export async function GET(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category"); // Optional filter by category
    const includeUserSelections = searchParams.get("include_user") === "true";

    // Fetch all active affiliations
    let affiliationsQuery = supabase
      .from("community_affiliations")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (category) {
      affiliationsQuery = affiliationsQuery.eq("category", category);
    }

    const { data: affiliations, error: affiliationsError } = await affiliationsQuery;

    console.log("Affiliations query result:", { count: affiliations?.length, error: affiliationsError });

    if (affiliationsError) {
      console.error("Error fetching affiliations:", affiliationsError);
      return NextResponse.json(
        { error: "Failed to fetch affiliations", details: affiliationsError.message },
        { status: 500 }
      );
    }

    // If requested, also fetch user's selections
    let userAffiliations: UserAffiliation[] = [];
    if (includeUserSelections) {
      const { data: userAffData, error: userAffError } = await supabase
        .from("user_affiliations")
        .select(`
          id,
          user_id,
          affiliation_id,
          visible_in_community,
          community_affiliations (
            id,
            name,
            short_code,
            category,
            aligned_org,
            description,
            display_order
          )
        `)
        .eq("user_id", userId);

      if (userAffError) {
        console.error("Error fetching user affiliations:", userAffError);
      } else {
        userAffiliations = (userAffData || []).map((ua: any) => ({
          id: ua.id,
          user_id: ua.user_id,
          affiliation_id: ua.affiliation_id,
          visible_in_community: ua.visible_in_community,
          affiliation: ua.community_affiliations
        }));
      }
    }

    // Group affiliations by category
    const grouped = {
      identity: affiliations?.filter(a => a.category === "identity") || [],
      background: affiliations?.filter(a => a.category === "background") || [],
      specialty: affiliations?.filter(a => a.category === "specialty") || []
    };

    return NextResponse.json({
      success: true,
      affiliations: affiliations || [],
      grouped,
      userAffiliations: includeUserSelections ? userAffiliations : undefined
    });
  } catch (error: any) {
    console.error("Affiliations fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Add or update user's affiliation selection
export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const body = await req.json();
    const { affiliation_id, visible_in_community = true } = body;

    if (!affiliation_id) {
      return NextResponse.json(
        { error: "affiliation_id is required" },
        { status: 400 }
      );
    }

    // Verify affiliation exists
    const { data: affiliation, error: affError } = await supabase
      .from("community_affiliations")
      .select("id, name")
      .eq("id", affiliation_id)
      .eq("is_active", true)
      .single();

    if (affError || !affiliation) {
      return NextResponse.json(
        { error: "Invalid or inactive affiliation" },
        { status: 400 }
      );
    }

    // Upsert user affiliation (insert or update if exists)
    const { data: userAffiliation, error: upsertError } = await supabase
      .from("user_affiliations")
      .upsert({
        user_id: userId,
        affiliation_id,
        visible_in_community
      }, {
        onConflict: "user_id,affiliation_id"
      })
      .select()
      .single();

    if (upsertError) {
      console.error("Error upserting user affiliation:", upsertError);
      return NextResponse.json(
        { error: "Failed to save affiliation", details: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userAffiliation,
      message: `Added ${affiliation.name} to your profile`
    });
  } catch (error: any) {
    console.error("Add affiliation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove a user's affiliation
export async function DELETE(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const { searchParams } = new URL(req.url);
    const affiliationId = searchParams.get("affiliation_id");

    if (!affiliationId) {
      return NextResponse.json(
        { error: "affiliation_id is required" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("user_affiliations")
      .delete()
      .eq("user_id", userId)
      .eq("affiliation_id", affiliationId);

    if (deleteError) {
      console.error("Error deleting user affiliation:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove affiliation", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Affiliation removed from your profile"
    });
  } catch (error: any) {
    console.error("Delete affiliation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update visibility of a user's affiliation
export async function PATCH(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const body = await req.json();
    const { affiliation_id, visible_in_community } = body;

    if (!affiliation_id || typeof visible_in_community !== "boolean") {
      return NextResponse.json(
        { error: "affiliation_id and visible_in_community (boolean) are required" },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("user_affiliations")
      .update({ visible_in_community })
      .eq("user_id", userId)
      .eq("affiliation_id", affiliation_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating affiliation visibility:", updateError);
      return NextResponse.json(
        { error: "Failed to update affiliation", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userAffiliation: updated,
      message: visible_in_community ? "Affiliation now visible in community" : "Affiliation hidden from community"
    });
  } catch (error: any) {
    console.error("Update affiliation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
