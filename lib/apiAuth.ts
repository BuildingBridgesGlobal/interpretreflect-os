/**
 * API Route Authentication Helper
 *
 * Provides consistent auth validation across all API routes.
 * Uses Supabase auth to validate Bearer tokens from Authorization header.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { User } from "@supabase/supabase-js";

export interface AuthResult {
  user: User | null;
  error: NextResponse | null;
}

/**
 * Validate the authenticated user from the request.
 *
 * Usage:
 * ```
 * const { user, error } = await validateAuth(req);
 * if (error) return error;
 * // user is now guaranteed to be non-null
 * ```
 */
export async function validateAuth(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return {
        user: null,
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    return { user, error: null };
  } catch (err) {
    console.error("Auth validation error:", err);
    return {
      user: null,
      error: NextResponse.json({ error: "Authentication failed" }, { status: 401 }),
    };
  }
}

/**
 * Get user ID from request, with fallback to query param for backwards compatibility.
 * DEPRECATED: Use validateAuth() instead for proper security.
 *
 * This function validates that if a user_id is provided in query params,
 * it matches the authenticated user. If no user_id is provided, uses the
 * authenticated user's ID.
 */
export async function getAuthenticatedUserId(
  req: NextRequest,
  queryParamName: string = "user_id"
): Promise<{ userId: string | null; error: NextResponse | null }> {
  const { user, error } = await validateAuth(req);

  if (error) {
    return { userId: null, error };
  }

  const { searchParams } = new URL(req.url);
  const requestedUserId = searchParams.get(queryParamName);

  // If a user_id was provided, verify it matches the authenticated user
  if (requestedUserId && requestedUserId !== user!.id) {
    return {
      userId: null,
      error: NextResponse.json(
        { error: "Forbidden: Cannot access other user's data" },
        { status: 403 }
      ),
    };
  }

  return { userId: user!.id, error: null };
}
