import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const supabase = supabaseAdmin;

// POST - Bookmark a post
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const body = await req.json();
    const { user_id } = body;
    const postId = params.postId;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

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
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const postId = params.postId;

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

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
