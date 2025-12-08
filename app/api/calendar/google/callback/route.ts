import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTokensFromCode, createOAuth2Client, isGoogleCalendarConfigured } from "@/lib/googleCalendar";
import { google } from "googleapis";

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof str === "string" && uuidRegex.test(str);
}

/**
 * GET /api/calendar/google/callback
 * OAuth callback handler for Google Calendar
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Check if configured
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.redirect(
      `${appUrl}/assignments?calendar_error=${encodeURIComponent("Google Calendar integration is not configured")}`
    );
  }

  // Handle OAuth errors
  if (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(
      `${appUrl}/assignments?calendar_error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/assignments?calendar_error=No authorization code received`
    );
  }

  // Parse state to get user ID with validation
  let userId: string | null = null;
  try {
    if (state) {
      // Limit state size to prevent DoS
      if (state.length > 1000) {
        throw new Error("State too large");
      }
      const decoded = JSON.parse(Buffer.from(state, "base64").toString());
      userId = decoded.userId;
    }
  } catch (e) {
    console.error("Failed to parse state:", e);
  }

  // Validate userId is a valid UUID
  if (!userId || !isValidUUID(userId)) {
    return NextResponse.redirect(
      `${appUrl}/assignments?calendar_error=Invalid session state`
    );
  }

  // Verify the user exists
  const { data: userExists } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (!userExists?.user) {
    return NextResponse.redirect(
      `${appUrl}/assignments?calendar_error=User not found`
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("No tokens received from Google");
    }

    // Get user's primary calendar info
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    let calendarName = "Primary Calendar";
    try {
      const calendarInfo = await calendar.calendars.get({ calendarId: "primary" });
      calendarName = calendarInfo.data.summary || "Primary Calendar";
    } catch (e) {
      // Use default name if we can't get calendar info
    }

    // Calculate token expiry
    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000); // Default 1 hour

    // Store tokens in database
    const { error: upsertError } = await supabaseAdmin.rpc("upsert_calendar_token", {
      p_user_id: userId,
      p_provider: "google",
      p_access_token: tokens.access_token,
      p_refresh_token: tokens.refresh_token,
      p_token_expires_at: expiresAt.toISOString(),
      p_calendar_id: "primary",
      p_calendar_name: calendarName,
    });

    if (upsertError) {
      console.error("Failed to store tokens:", upsertError);
      throw new Error("Failed to save calendar connection");
    }

    // Log successful connection
    await supabaseAdmin.from("calendar_sync_log").insert({
      user_id: userId,
      action: "create",
      status: "success",
      details: {
        calendar_name: calendarName,
        provider: "google",
      },
    });

    // Redirect back to assignments with success message
    return NextResponse.redirect(
      `${appUrl}/assignments?calendar_connected=true&calendar_name=${encodeURIComponent(calendarName)}`
    );
  } catch (e: any) {
    console.error("Google Calendar callback error:", e);

    // Log the error
    if (userId) {
      await supabaseAdmin.from("calendar_sync_log").insert({
        user_id: userId,
        action: "create",
        status: "failed",
        error_message: e.message,
      });
    }

    return NextResponse.redirect(
      `${appUrl}/assignments?calendar_error=${encodeURIComponent(e.message || "Failed to connect calendar")}`
    );
  }
}
