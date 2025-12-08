import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getAuthUrl,
  syncAssignmentToCalendar,
  syncAllAssignments,
  deleteCalendarEvent,
  getUserCalendars,
  disconnectCalendar,
  isGoogleCalendarConfigured,
  CalendarAssignment,
} from "@/lib/googleCalendar";

// Helper to get user from token
async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * GET /api/calendar/google
 * Get calendar connection status or initiate OAuth
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // Action: Get OAuth URL
  if (action === "connect") {
    // Check if Google Calendar is configured
    if (!isGoogleCalendarConfigured()) {
      return NextResponse.json(
        { error: "Google Calendar integration is not configured on this server." },
        { status: 503 }
      );
    }

    // Store user ID in state for callback
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString("base64");
    try {
      const authUrl = getAuthUrl(state);
      return NextResponse.json({ authUrl });
    } catch (error: any) {
      console.error("Failed to generate auth URL:", error);
      return NextResponse.json(
        { error: "Failed to initiate Google Calendar connection." },
        { status: 500 }
      );
    }
  }

  // Action: List user's calendars
  if (action === "calendars") {
    const calendars = await getUserCalendars(user.id);
    return NextResponse.json({ calendars });
  }

  // Action: Get sync status
  if (action === "status") {
    const { data: token } = await supabaseAdmin
      .from("user_calendar_tokens")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .eq("is_active", true)
      .single();

    const { data: syncedCount } = await supabaseAdmin
      .from("calendar_sync_events")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("sync_status", "synced");

    const { data: pendingCount } = await supabaseAdmin.rpc("get_unsynced_assignments", {
      p_user_id: user.id,
      p_provider: "google",
    });

    return NextResponse.json({
      connected: !!token,
      calendarId: token?.calendar_id,
      calendarName: token?.calendar_name,
      autoSyncEnabled: token?.auto_sync_enabled,
      syncPreferences: token?.sync_preferences,
      lastSyncAt: token?.last_sync_at,
      syncedEventsCount: syncedCount?.length || 0,
      pendingEventsCount: pendingCount?.length || 0,
    });
  }

  // Default: Get connection status
  const { data: token } = await supabaseAdmin
    .from("user_calendar_tokens")
    .select("id, calendar_id, calendar_name, auto_sync_enabled, last_sync_at")
    .eq("user_id", user.id)
    .eq("provider", "google")
    .eq("is_active", true)
    .single();

  return NextResponse.json({
    connected: !!token,
    calendarId: token?.calendar_id,
    calendarName: token?.calendar_name,
    autoSyncEnabled: token?.auto_sync_enabled,
    lastSyncAt: token?.last_sync_at,
  });
}

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof str === "string" && uuidRegex.test(str);
}

/**
 * POST /api/calendar/google
 * Sync assignment(s) to Google Calendar
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, assignment_id, assignment_ids, calendar_id, sync_preferences } = body;

  // Validate action
  const validActions = ["sync", "sync_batch", "sync_all", "unsync", "update_preferences", "set_calendar"];
  if (!action || !validActions.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Action: Sync single assignment
  if (action === "sync" && assignment_id) {
    // Validate UUID
    if (!isValidUUID(assignment_id)) {
      return NextResponse.json({ error: "Invalid assignment ID format" }, { status: 400 });
    }

    // Get assignment
    const { data: assignment, error } = await supabaseAdmin
      .from("assignments")
      .select("*")
      .eq("id", assignment_id)
      .eq("user_id", user.id)
      .single();

    if (error || !assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const result = await syncAssignmentToCalendar(user.id, assignment as CalendarAssignment);
    return NextResponse.json(result);
  }

  // Action: Sync multiple assignments
  if (action === "sync_batch" && assignment_ids?.length) {
    // Validate array and limit batch size
    if (!Array.isArray(assignment_ids)) {
      return NextResponse.json({ error: "assignment_ids must be an array" }, { status: 400 });
    }
    if (assignment_ids.length > 50) {
      return NextResponse.json({ error: "Maximum 50 assignments per batch" }, { status: 400 });
    }

    // Validate all UUIDs
    const validIds = assignment_ids.filter(isValidUUID);
    if (validIds.length === 0) {
      return NextResponse.json({ error: "No valid assignment IDs provided" }, { status: 400 });
    }

    const results: Array<{ id: string; success: boolean; eventId?: string; eventLink?: string; error?: string }> = [];

    for (const id of validIds) {
      const { data: assignment } = await supabaseAdmin
        .from("assignments")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (assignment) {
        const result = await syncAssignmentToCalendar(user.id, assignment as CalendarAssignment);
        results.push({ id, ...result });
      } else {
        results.push({ id, success: false, error: "Assignment not found" });
      }
    }

    const synced = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({ results, synced, failed });
  }

  // Action: Sync all unsynced assignments
  if (action === "sync_all") {
    const result = await syncAllAssignments(user.id);
    return NextResponse.json(result);
  }

  // Action: Delete calendar event
  if (action === "unsync" && assignment_id) {
    // Validate UUID
    if (!isValidUUID(assignment_id)) {
      return NextResponse.json({ error: "Invalid assignment ID format" }, { status: 400 });
    }

    const result = await deleteCalendarEvent(user.id, assignment_id);
    return NextResponse.json(result);
  }

  // Action: Update sync preferences
  if (action === "update_preferences" && sync_preferences) {
    // Validate sync_preferences is an object
    if (typeof sync_preferences !== "object" || sync_preferences === null) {
      return NextResponse.json({ error: "sync_preferences must be an object" }, { status: 400 });
    }

    // Whitelist allowed preference keys
    const allowedKeys = ["sync_new_assignments", "add_prep_reminders", "prep_reminder_minutes", "include_team_as_attendees", "event_color"];
    const sanitizedPrefs: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (key in sync_preferences) {
        sanitizedPrefs[key] = sync_preferences[key];
      }
    }

    const { error } = await supabaseAdmin
      .from("user_calendar_tokens")
      .update({
        sync_preferences: sanitizedPrefs,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("provider", "google");

    if (error) {
      return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Action: Change calendar
  if (action === "set_calendar" && calendar_id) {
    // Validate calendar_id (should be a string, max 255 chars)
    if (typeof calendar_id !== "string" || calendar_id.length === 0 || calendar_id.length > 255) {
      return NextResponse.json({ error: "Invalid calendar ID" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("user_calendar_tokens")
      .update({
        calendar_id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("provider", "google");

    if (error) {
      return NextResponse.json({ error: "Failed to set calendar" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action or missing required parameters" }, { status: 400 });
}

/**
 * DELETE /api/calendar/google
 * Disconnect Google Calendar
 */
export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const success = await disconnectCalendar(user.id);
  return NextResponse.json({ success });
}
