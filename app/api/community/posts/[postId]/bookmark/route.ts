import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// POST - Bookmark a post
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const user_id = user!.id;
    const postId = params.postId;

    // Insert bookmark
    const { error: bookmarkError } = await supabase
      .from("post_bookmarks")
      .insert({
        post_id: postId,
        user_id
      });

    if (bookmarkError) {
      if (bookmarkError.code === "23505") {
        return NextResponse.json(
          { error: "Post already bookmarked" },
          { status: 400 }
        );
      }
      console.error("Error bookmarking post:", bookmarkError);
      return NextResponse.json(
        { error: "Failed to bookmark post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Bookmark post error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove bookmark
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

    // Delete bookmark
    const { error: deleteError } = await supabase
      .from("post_bookmarks")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error removing bookmark:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove bookmark" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Remove bookmark error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
