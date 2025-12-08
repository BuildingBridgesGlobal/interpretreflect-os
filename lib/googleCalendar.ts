import { google, calendar_v3 } from "googleapis";
import { supabaseAdmin } from "./supabaseAdmin";

// Google OAuth Configuration - validated at runtime
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calendar/google/callback`;

// Check if Google Calendar integration is configured
export function isGoogleCalendarConfigured(): boolean {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

// Required scopes for Google Calendar
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

// Assignment type to Google Calendar color mapping
const TYPE_TO_COLOR: Record<string, string> = {
  Medical: "11",      // Tomato (red)
  Legal: "3",         // Grape (purple)
  Educational: "10",  // Basil (green)
  VRS: "7",           // Peacock (teal)
  VRI: "9",           // Blueberry (blue)
  Community: "5",     // Banana (yellow)
  "Mental Health": "1", // Lavender
  Conference: "6",    // Tangerine (orange)
  Business: "2",      // Sage (green)
  Government: "4",    // Flamingo (pink)
};

// Assignment interface for type safety
export interface CalendarAssignment {
  id: string;
  title: string;
  date: string;
  time?: string;
  timezone?: string;
  duration_minutes?: number;
  assignment_type?: string;
  setting?: string;
  location_type?: string;
  location_details?: string;
  description?: string;
  prep_status?: string;
}

// Create OAuth2 client with validation
export function createOAuth2Client() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google Calendar integration is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.");
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

// Generate authorization URL
export function getAuthUrl(state?: string) {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // Force consent to always get refresh token
    state: state,
  });
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Get authenticated calendar client for a user
export async function getCalendarClient(userId: string): Promise<calendar_v3.Calendar | null> {
  // Get stored tokens
  const { data: tokenData, error } = await supabaseAdmin
    .from("user_calendar_tokens")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google")
    .eq("is_active", true)
    .single();

  if (error || !tokenData) {
    console.error("No calendar token found for user:", userId);
    return null;
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry_date: new Date(tokenData.token_expires_at).getTime(),
  });

  // Check if token needs refresh
  const now = Date.now();
  const expiryDate = new Date(tokenData.token_expires_at).getTime();

  if (now >= expiryDate - 60000) { // Refresh if expires in less than 1 minute
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update stored token
      await supabaseAdmin
        .from("user_calendar_tokens")
        .update({
          access_token: credentials.access_token,
          token_expires_at: credentials.expiry_date
            ? new Date(credentials.expiry_date).toISOString()
            : new Date(Date.now() + 3600000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", tokenData.id);

      oauth2Client.setCredentials(credentials);

      // Log the refresh
      await supabaseAdmin.from("calendar_sync_log").insert({
        user_id: userId,
        action: "refresh_token",
        status: "success",
        details: { token_id: tokenData.id },
      });
    } catch (refreshError) {
      console.error("Failed to refresh token:", refreshError);

      // Mark token as inactive
      await supabaseAdmin
        .from("user_calendar_tokens")
        .update({ is_active: false })
        .eq("id", tokenData.id);

      // Log the error
      await supabaseAdmin.from("calendar_sync_log").insert({
        user_id: userId,
        action: "refresh_token",
        status: "failed",
        error_message: String(refreshError),
      });

      return null;
    }
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

// Sanitize text for calendar event (prevent XSS and invalid characters)
function sanitizeText(text: string | undefined | null, maxLength: number = 1000): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
    .substring(0, maxLength)
    .trim();
}

// Validate and parse date string
function parseAssignmentDate(dateStr: string, timeStr: string = "09:00:00"): Date | null {
  try {
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.warn("Invalid date format:", dateStr);
      return null;
    }
    // Validate time format (HH:MM:SS or HH:MM)
    const normalizedTime = timeStr.includes(":") ? timeStr : "09:00:00";
    const parsed = new Date(`${dateStr}T${normalizedTime}`);
    if (isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// Convert assignment to Google Calendar event
export function assignmentToCalendarEvent(assignment: CalendarAssignment): calendar_v3.Schema$Event {
  // Validate required fields
  if (!assignment.id || !assignment.title || !assignment.date) {
    throw new Error("Assignment must have id, title, and date");
  }

  // Build datetime with validation
  const startTime = assignment.time || "09:00:00";
  const timezone = assignment.timezone || "America/New_York";
  const durationMinutes = Math.min(Math.max(assignment.duration_minutes || 60, 15), 480); // 15 min to 8 hours

  const startDateTime = parseAssignmentDate(assignment.date, startTime);
  if (!startDateTime) {
    throw new Error(`Invalid date/time: ${assignment.date} ${startTime}`);
  }
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

  // Build description with prep link (sanitized)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://interpretreflect.com';
  let description = sanitizeText(assignment.description, 2000);
  description += `\n\n---\n`;
  description += `Type: ${sanitizeText(assignment.assignment_type) || "General"}\n`;
  if (assignment.setting) description += `Setting: ${sanitizeText(assignment.setting)}\n`;
  if (assignment.location_type) description += `Format: ${sanitizeText(assignment.location_type)}\n`;
  description += `\n[Prep & Details in InterpretReflect](${appUrl}/assignments/${assignment.id})`;

  // Build location (sanitized)
  let location = "";
  if (assignment.location_type === "virtual") {
    location = sanitizeText(assignment.location_details, 200) || "Virtual (link in notes)";
  } else if (assignment.location_details) {
    location = sanitizeText(assignment.location_details, 200);
  }

  // Sanitize title
  const safeTitle = sanitizeText(assignment.title, 100) || "Interpreting Assignment";

  const event: calendar_v3.Schema$Event = {
    summary: `[IR] ${safeTitle}`,
    description,
    location,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: timezone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: timezone,
    },
    colorId: TYPE_TO_COLOR[assignment.assignment_type || ""] || "8",
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 },  // 1 hour before
        { method: "popup", minutes: 15 },  // 15 min before
      ],
    },
    extendedProperties: {
      private: {
        interpretReflectId: assignment.id,
        assignmentType: assignment.assignment_type || "",
        prepStatus: assignment.prep_status || "pending",
      },
    },
  };

  return event;
}

// Parse Google API error for user-friendly message
function parseGoogleApiError(error: any): string {
  if (error.code === 401 || error.message?.includes("invalid_grant")) {
    return "Your Google Calendar connection has expired. Please reconnect.";
  }
  if (error.code === 403) {
    return "Permission denied. Please disconnect and reconnect Google Calendar.";
  }
  if (error.code === 404) {
    return "Calendar event not found. It may have been deleted in Google Calendar.";
  }
  if (error.code === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (error.code >= 500) {
    return "Google Calendar is temporarily unavailable. Please try again later.";
  }
  return error.message || "Failed to sync to calendar";
}

// Sync a single assignment to Google Calendar
export async function syncAssignmentToCalendar(
  userId: string,
  assignment: CalendarAssignment
): Promise<{ success: boolean; eventId?: string; eventLink?: string; error?: string }> {
  // Validate user ID
  if (!userId || typeof userId !== "string") {
    return { success: false, error: "Invalid user ID" };
  }

  // Validate assignment
  if (!assignment?.id || !assignment?.title || !assignment?.date) {
    return { success: false, error: "Invalid assignment data" };
  }

  try {
    const calendar = await getCalendarClient(userId);
    if (!calendar) {
      return { success: false, error: "No calendar connection. Please reconnect Google Calendar." };
    }

    // Get user's calendar settings
    const { data: tokenData } = await supabaseAdmin
      .from("user_calendar_tokens")
      .select("calendar_id, sync_preferences")
      .eq("user_id", userId)
      .eq("provider", "google")
      .single();

    const calendarId = tokenData?.calendar_id || "primary";

    // Convert assignment to calendar event (may throw if invalid)
    let event: calendar_v3.Schema$Event;
    try {
      event = assignmentToCalendarEvent(assignment);
    } catch (conversionError: any) {
      return { success: false, error: `Invalid assignment data: ${conversionError.message}` };
    }

    // Check if already synced
    const { data: existingSync } = await supabaseAdmin
      .from("calendar_sync_events")
      .select("external_event_id")
      .eq("assignment_id", assignment.id)
      .eq("user_id", userId)
      .eq("provider", "google")
      .single();

    let result: calendar_v3.Schema$Event;
    let isUpdate = false;

    if (existingSync?.external_event_id) {
      // Try to update existing event
      try {
        const response = await calendar.events.update({
          calendarId,
          eventId: existingSync.external_event_id,
          requestBody: event,
        });
        result = response.data;
        isUpdate = true;
      } catch (updateError: any) {
        // If event not found (deleted in Google), create a new one
        if (updateError.code === 404) {
          const response = await calendar.events.insert({
            calendarId,
            requestBody: event,
          });
          result = response.data;
        } else {
          throw updateError;
        }
      }
    } else {
      // Create new event
      const response = await calendar.events.insert({
        calendarId,
        requestBody: event,
      });
      result = response.data;
    }

    // Record the sync
    await supabaseAdmin.rpc("record_calendar_sync", {
      p_assignment_id: assignment.id,
      p_user_id: userId,
      p_provider: "google",
      p_external_event_id: result.id,
      p_external_calendar_id: calendarId,
      p_event_link: result.htmlLink,
    });

    // Log success
    await supabaseAdmin.from("calendar_sync_log").insert({
      user_id: userId,
      assignment_id: assignment.id,
      action: isUpdate ? "update" : "create",
      direction: "to_calendar",
      status: "success",
      details: { event_id: result.id, event_link: result.htmlLink },
    });

    return {
      success: true,
      eventId: result.id!,
      eventLink: result.htmlLink!,
    };
  } catch (error: any) {
    console.error("Calendar sync error:", error);

    const userFriendlyError = parseGoogleApiError(error);

    // Log failure
    try {
      await supabaseAdmin.from("calendar_sync_log").insert({
        user_id: userId,
        assignment_id: assignment.id,
        action: "create",
        direction: "to_calendar",
        status: "failed",
        error_message: error.message || String(error),
      });
    } catch (logError) {
      console.error("Failed to log sync error:", logError);
    }

    return { success: false, error: userFriendlyError };
  }
}

// Delete event from Google Calendar
export async function deleteCalendarEvent(
  userId: string,
  assignmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get sync record
    const { data: syncRecord } = await supabaseAdmin
      .from("calendar_sync_events")
      .select("external_event_id, external_calendar_id")
      .eq("assignment_id", assignmentId)
      .eq("user_id", userId)
      .eq("provider", "google")
      .single();

    if (!syncRecord) {
      return { success: true }; // Nothing to delete
    }

    const calendar = await getCalendarClient(userId);
    if (!calendar) {
      return { success: false, error: "No calendar connection" };
    }

    await calendar.events.delete({
      calendarId: syncRecord.external_calendar_id || "primary",
      eventId: syncRecord.external_event_id,
    });

    // Update sync record
    await supabaseAdmin
      .from("calendar_sync_events")
      .update({ sync_status: "deleted", updated_at: new Date().toISOString() })
      .eq("assignment_id", assignmentId)
      .eq("user_id", userId);

    // Update assignment
    await supabaseAdmin
      .from("assignments")
      .update({ google_calendar_synced: false })
      .eq("id", assignmentId);

    return { success: true };
  } catch (error: any) {
    console.error("Delete calendar event error:", error);
    return { success: false, error: error.message };
  }
}

// Sync all unsynced assignments
export async function syncAllAssignments(
  userId: string
): Promise<{ synced: number; failed: number; errors: string[] }> {
  const { data: unsynced } = await supabaseAdmin.rpc("get_unsynced_assignments", {
    p_user_id: userId,
    p_provider: "google",
  });

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  if (!unsynced || unsynced.length === 0) {
    return { synced: 0, failed: 0, errors: [] };
  }

  for (const assignment of unsynced) {
    const result = await syncAssignmentToCalendar(userId, assignment);
    if (result.success) {
      synced++;
    } else {
      failed++;
      errors.push(`${assignment.title}: ${result.error}`);
    }
  }

  // Log full sync
  await supabaseAdmin.from("calendar_sync_log").insert({
    user_id: userId,
    action: "full_sync",
    status: failed === 0 ? "success" : "failed",
    details: { synced, failed, total: unsynced.length },
  });

  return { synced, failed, errors };
}

// Get list of user's calendars
export async function getUserCalendars(userId: string) {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return [];

  try {
    const response = await calendar.calendarList.list();
    return response.data.items || [];
  } catch (error) {
    console.error("Failed to get calendars:", error);
    return [];
  }
}

// Disconnect calendar
export async function disconnectCalendar(userId: string): Promise<boolean> {
  try {
    await supabaseAdmin
      .from("user_calendar_tokens")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("provider", "google");

    await supabaseAdmin
      .from("calendar_sync_events")
      .update({ sync_status: "deleted" })
      .eq("user_id", userId)
      .eq("provider", "google");

    return true;
  } catch (error) {
    console.error("Failed to disconnect calendar:", error);
    return false;
  }
}
