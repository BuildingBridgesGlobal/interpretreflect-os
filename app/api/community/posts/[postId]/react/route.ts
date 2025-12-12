import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// Valid reaction types matching the database constraint
const VALID_REACTIONS = ["celebration", "thinking", "fire", "solidarity"] as const;
type ReactionType = typeof VALID_REACTIONS[number];

// POST - Add a reaction to a post
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;
    const postId = params.postId;

    // Get reaction type from body
    const body = await req.json();
    const { reaction_type } = body;

    // Validate reaction type
    if (!reaction_type || !VALID_REACTIONS.includes(reaction_type)) {
      return NextResponse.json(
        { error: "Invalid reaction type. Must be one of: celebration, thinking, fire, solidarity" },
        { status: 400 }
      );
    }

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .select("id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Insert reaction (will fail if already exists due to UNIQUE constraint)
    const { error: reactionError } = await supabase
      .from("post_reactions")
      .insert({
        post_id: postId,
        user_id: userId,
        reaction_type
      });

    if (reactionError) {
      // Check if it's a duplicate key error (already reacted with this type)
      if (reactionError.code === "23505") {
        return NextResponse.json(
          { error: "You have already added this reaction" },
          { status: 400 }
        );
      }
      console.error("Error adding reaction:", reactionError);
      return NextResponse.json(
        { error: "Failed to add reaction" },
        { status: 500 }
      );
    }

    // Get updated reaction counts
    const { data: updatedPost } = await supabase
      .from("community_posts")
      .select("celebration_count, thinking_count, fire_count, solidarity_count")
      .eq("id", postId)
      .single();

    // Get user's reactions on this post
    const { data: userReactions } = await supabase
      .from("post_reactions")
      .select("reaction_type")
      .eq("post_id", postId)
      .eq("user_id", userId);

    return NextResponse.json({
      success: true,
      reactions: {
        celebration_count: updatedPost?.celebration_count || 0,
        thinking_count: updatedPost?.thinking_count || 0,
        fire_count: updatedPost?.fire_count || 0,
        solidarity_count: updatedPost?.solidarity_count || 0
      },
      user_reactions: userReactions?.map(r => r.reaction_type) || []
    });

  } catch (error: any) {
    console.error("Add reaction error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove a reaction from a post
export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;
    const postId = params.postId;

    // Get reaction type from query params
    const { searchParams } = new URL(req.url);
    const reactionType = searchParams.get("reaction_type");

    // Validate reaction type
    if (!reactionType || !VALID_REACTIONS.includes(reactionType as ReactionType)) {
      return NextResponse.json(
        { error: "Invalid reaction type. Must be one of: celebration, thinking, fire, solidarity" },
        { status: 400 }
      );
    }

    // Delete reaction
    const { error: deleteError } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("reaction_type", reactionType);

    if (deleteError) {
      console.error("Error removing reaction:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove reaction" },
        { status: 500 }
      );
    }

    // Get updated reaction counts
    const { data: updatedPost } = await supabase
      .from("community_posts")
      .select("celebration_count, thinking_count, fire_count, solidarity_count")
      .eq("id", postId)
      .single();

    // Get user's remaining reactions on this post
    const { data: userReactions } = await supabase
      .from("post_reactions")
      .select("reaction_type")
      .eq("post_id", postId)
      .eq("user_id", userId);

    return NextResponse.json({
      success: true,
      reactions: {
        celebration_count: updatedPost?.celebration_count || 0,
        thinking_count: updatedPost?.thinking_count || 0,
        fire_count: updatedPost?.fire_count || 0,
        solidarity_count: updatedPost?.solidarity_count || 0
      },
      user_reactions: userReactions?.map(r => r.reaction_type) || []
    });

  } catch (error: any) {
    console.error("Remove reaction error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// GET - Get reactions for a post (including which ones the current user has made)
export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;

    // Get reaction counts from post
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .select("celebration_count, thinking_count, fire_count, solidarity_count")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Check if user is authenticated to get their reactions
    const { user } = await validateAuth(req);
    let userReactions: string[] = [];

    if (user) {
      const { data: reactions } = await supabase
        .from("post_reactions")
        .select("reaction_type")
        .eq("post_id", postId)
        .eq("user_id", user.id);

      userReactions = reactions?.map(r => r.reaction_type) || [];
    }

    return NextResponse.json({
      reactions: {
        celebration_count: post.celebration_count || 0,
        thinking_count: post.thinking_count || 0,
        fire_count: post.fire_count || 0,
        solidarity_count: post.solidarity_count || 0
      },
      user_reactions: userReactions
    });

  } catch (error: any) {
    console.error("Get reactions error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
