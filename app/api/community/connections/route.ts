import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const supabase = supabaseAdmin;

// POST - Send connection request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requester_id, addressee_id } = body;

    if (!requester_id || !addressee_id) {
      return NextResponse.json(
        { error: "requester_id and addressee_id are required" },
        { status: 400 }
      );
    }

    if (requester_id === addressee_id) {
      return NextResponse.json(
        { error: "Cannot connect with yourself" },
        { status: 400 }
      );
    }

    // Check if connection already exists (in either direction)
    const { data: existing } = await supabase
      .from("connections")
      .select("*")
      .or(`and(requester_id.eq.${requester_id},addressee_id.eq.${addressee_id}),and(requester_id.eq.${addressee_id},addressee_id.eq.${requester_id})`)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Connection already exists", status: existing.status },
        { status: 400 }
      );
    }

    // Create connection request
    const { data: connection, error: connectionError } = await supabase
      .from("connections")
      .insert({
        requester_id,
        addressee_id,
        status: "pending"
      })
      .select()
      .single();

    if (connectionError) {
      console.error("Error creating connection:", connectionError);
      return NextResponse.json(
        { error: "Failed to create connection request", details: connectionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      connection
    });

  } catch (error: any) {
    console.error("Connection request error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Accept or decline connection request
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { connection_id, user_id, action } = body; // action: 'accept' or 'decline'

    if (!connection_id || !user_id || !action) {
      return NextResponse.json(
        { error: "connection_id, user_id, and action are required" },
        { status: 400 }
      );
    }

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    // Verify the user is the addressee of this request
    const { data: connection, error: fetchError } = await supabase
      .from("connections")
      .select("*")
      .eq("id", connection_id)
      .eq("addressee_id", user_id)
      .eq("status", "pending")
      .single();

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: "Connection request not found or already processed" },
        { status: 404 }
      );
    }

    // Update the connection status
    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    const { data: updated, error: updateError } = await supabase
      .from("connections")
      .update({
        status: newStatus,
        responded_at: new Date().toISOString()
      })
      .eq("id", connection_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating connection:", updateError);
      return NextResponse.json(
        { error: "Failed to update connection", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      connection: updated
    });

  } catch (error: any) {
    console.error("Connection update error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// GET - Get user's connections
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const status = searchParams.get("status") || "accepted";
    const type = searchParams.get("type"); // 'pending_received', 'pending_sent', 'accepted'

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("connections")
      .select(`
        *,
        requester:community_profiles!connections_requester_id_fkey(
          user_id,
          display_name,
          bio,
          strong_domains,
          specialties,
          years_experience,
          open_to_mentoring
        ),
        addressee:community_profiles!connections_addressee_id_fkey(
          user_id,
          display_name,
          bio,
          strong_domains,
          specialties,
          years_experience,
          open_to_mentoring
        )
      `);

    // Filter based on type
    if (type === 'pending_received') {
      query = query.eq("addressee_id", userId).eq("status", "pending");
    } else if (type === 'pending_sent') {
      query = query.eq("requester_id", userId).eq("status", "pending");
    } else {
      // All connections for this user with given status
      query = query
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq("status", status);
    }

    const { data: connections, error: connectionsError } = await query;

    if (connectionsError) {
      console.error("Error fetching connections:", connectionsError);
      return NextResponse.json(
        { error: "Failed to fetch connections", details: connectionsError.message },
        { status: 500 }
      );
    }

    // Transform to show the "other" person in each connection
    const transformedConnections = connections?.map(conn => {
      const isRequester = conn.requester_id === userId;
      const otherPerson = isRequester ? conn.addressee : conn.requester;

      return {
        connection_id: conn.id,
        status: conn.status,
        requested_at: conn.requested_at,
        responded_at: conn.responded_at,
        is_requester: isRequester,
        user: otherPerson
      };
    }) || [];

    return NextResponse.json({
      connections: transformedConnections
    });

  } catch (error: any) {
    console.error("Fetch connections error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove connection or cancel request
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connection_id");
    const userId = searchParams.get("user_id");

    if (!connectionId || !userId) {
      return NextResponse.json(
        { error: "connection_id and user_id are required" },
        { status: 400 }
      );
    }

    // Verify user is part of this connection
    const { data: connection } = await supabase
      .from("connections")
      .select("*")
      .eq("id", connectionId)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Delete the connection
    const { error: deleteError } = await supabase
      .from("connections")
      .delete()
      .eq("id", connectionId);

    if (deleteError) {
      console.error("Error deleting connection:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete connection", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Connection removed"
    });

  } catch (error: any) {
    console.error("Delete connection error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
