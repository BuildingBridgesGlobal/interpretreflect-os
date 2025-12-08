/**
 * Behavioral Data Model - Client-side utilities
 *
 * Enables:
 * - Session tracking (app usage patterns)
 * - Behavioral signal recording
 * - Stress/wellness signal capture
 * - Wearable data sync preparation
 */

import { supabase } from "./supabaseClient";

// ============================================================================
// TYPES
// ============================================================================

export type EntryTrigger =
  | "user_initiated"
  | "notification"
  | "email_link"
  | "elya_prompt"
  | "calendar_reminder"
  | "wearable_trigger"
  | "deep_link"
  | "scheduled";

export type DeviceType = "web" | "mobile" | "pwa" | "watch" | "tablet";

export type SignalType =
  // Engagement
  | "page_view"
  | "feature_click"
  | "scroll_depth"
  | "time_on_page"
  // Emotional
  | "mood_check"
  | "stress_indicator"
  | "energy_level"
  | "frustration_signal"
  // Cognitive
  | "focus_duration"
  | "task_switch"
  | "response_latency"
  | "decision_hesitation"
  // Communication
  | "message_sentiment"
  | "conversation_length"
  | "topic_shift"
  // Physical (wearables)
  | "heart_rate"
  | "hrv"
  | "activity_level"
  | "sleep_quality"
  | "stress_score"
  // Workflow
  | "assignment_stress"
  | "prep_engagement"
  | "debrief_depth";

export type SignalCategory =
  | "engagement"
  | "emotional"
  | "cognitive"
  | "communication"
  | "physical"
  | "workflow";

export interface SessionConfig {
  deviceType?: DeviceType;
  entryTrigger?: EntryTrigger;
  entrySource?: string;
  entryContext?: Record<string, unknown>;
  userMoodStart?: number;
}

export interface SessionData {
  sessionId: string;
  startedAt: Date;
  toolsAccessed: string[];
  pagesVisited: string[];
  reflectionsCompleted: number;
  conversationsStarted: number;
  accessToken: string; // Store token for session end
}

export interface BehavioralSignal {
  signalType: SignalType;
  signalCategory: SignalCategory;
  value?: number;
  label?: string;
  metadata?: Record<string, unknown>;
  contextPage?: string;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

let currentSession: SessionData | null = null;

/**
 * Start a new user session
 */
export async function startSession(config: SessionConfig = {}): Promise<SessionData | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // Use API endpoint instead of direct RPC (more reliable before migration applied)
    const response = await fetch("/api/behavioral", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: "start_session",
        session_data: {
          device_type: config.deviceType || detectDeviceType(),
          entry_trigger: config.entryTrigger || "user_initiated",
          entry_source: config.entrySource || window.location.pathname,
          entry_context: config.entryContext || {},
        },
      }),
    });

    if (!response.ok) {
      console.error("Failed to start session");
      return null;
    }

    const data = await response.json();

    currentSession = {
      sessionId: data.session_id,
      startedAt: new Date(),
      toolsAccessed: [],
      pagesVisited: [window.location.pathname],
      reflectionsCompleted: 0,
      conversationsStarted: 0,
      accessToken: session.access_token,
    };

    // Set up session end on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleSessionEnd);
      window.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return currentSession;
  } catch (err) {
    console.error("Session start error:", err);
    return null;
  }
}

/**
 * End the current session
 */
export async function endSession(userMoodEnd?: number): Promise<void> {
  if (!currentSession) return;

  try {
    const payload = JSON.stringify({
      session_id: currentSession.sessionId,
      tools_accessed: currentSession.toolsAccessed,
      reflections_completed: currentSession.reflectionsCompleted,
      user_mood_end: userMoodEnd || null,
    });

    // Use fetch with keepalive for auth header support
    await fetch("/api/behavioral/end-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentSession.accessToken}`,
      },
      body: payload,
      keepalive: true,
    });
  } catch (err) {
    console.error("Session end error:", err);
  } finally {
    currentSession = null;
    if (typeof window !== "undefined") {
      window.removeEventListener("beforeunload", handleSessionEnd);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  }
}

/**
 * Get current session (if active)
 */
export function getCurrentSession(): SessionData | null {
  return currentSession;
}

/**
 * Track tool access in current session
 */
export function trackToolAccess(toolName: string): void {
  if (currentSession && !currentSession.toolsAccessed.includes(toolName)) {
    currentSession.toolsAccessed.push(toolName);
  }
}

/**
 * Track page visit in current session
 */
export function trackPageVisit(pagePath: string): void {
  if (currentSession && !currentSession.pagesVisited.includes(pagePath)) {
    currentSession.pagesVisited.push(pagePath);
  }
}

/**
 * Increment reflection count
 */
export function trackReflectionCompleted(): void {
  if (currentSession) {
    currentSession.reflectionsCompleted++;
  }
}

/**
 * Increment conversation count
 */
export function trackConversationStarted(): void {
  if (currentSession) {
    currentSession.conversationsStarted++;
  }
}

// Internal handlers
function handleSessionEnd(): void {
  if (currentSession) {
    // Use fetch with keepalive for auth header support
    const payload = JSON.stringify({
      session_id: currentSession.sessionId,
      tools_accessed: currentSession.toolsAccessed,
      reflections_completed: currentSession.reflectionsCompleted,
    });
    fetch("/api/behavioral/end-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentSession.accessToken}`,
      },
      body: payload,
      keepalive: true,
    });
  }
}

function handleVisibilityChange(): void {
  if (document.visibilityState === "hidden" && currentSession) {
    // User switched tabs or minimized - could track idle time
    recordSignal({
      signalType: "task_switch",
      signalCategory: "cognitive",
      metadata: { reason: "visibility_hidden" },
    });
  }
}

// ============================================================================
// BEHAVIORAL SIGNALS
// ============================================================================

// Signal queue for batching
let signalQueue: BehavioralSignal[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Record a behavioral signal (batched for efficiency)
 */
export async function recordSignal(signal: BehavioralSignal): Promise<void> {
  signalQueue.push({
    ...signal,
    contextPage: signal.contextPage ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
  });

  // Batch signals and flush every 2 seconds
  if (!flushTimeout) {
    flushTimeout = setTimeout(flushSignals, 2000);
  }

  // Flush immediately if queue is large
  if (signalQueue.length >= 10) {
    await flushSignals();
  }
}

/**
 * Flush queued signals to the server
 */
async function flushSignals(): Promise<void> {
  if (signalQueue.length === 0) return;

  const signals = [...signalQueue];
  signalQueue = [];

  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    await fetch("/api/behavioral", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: "record_signals",
        signals: signals.map(s => ({
          session_id: currentSession?.sessionId,
          signal_type: s.signalType,
          signal_category: s.signalCategory,
          signal_value: s.value ?? null,
          signal_label: s.label ?? null,
          signal_metadata: s.metadata ?? {},
          context_page: s.contextPage,
        })),
      }),
    });
  } catch (err) {
    console.error("Signal flush error:", err);
    // Re-queue failed signals
    signalQueue = [...signals, ...signalQueue];
  }
}

/**
 * Record a mood check
 */
export async function recordMood(moodLevel: number, context?: string): Promise<void> {
  await recordSignal({
    signalType: "mood_check",
    signalCategory: "emotional",
    value: moodLevel,
    label: getMoodLabel(moodLevel),
    metadata: { context },
  });
}

/**
 * Record stress level (1-10 scale)
 */
export async function recordStress(stressLevel: number, sources?: string[]): Promise<void> {
  await recordSignal({
    signalType: "stress_indicator",
    signalCategory: "emotional",
    value: stressLevel * 10, // Convert to 0-100 scale
    metadata: { sources, originalScale: "1-10" },
  });
}

/**
 * Record energy level (1-10 scale)
 */
export async function recordEnergy(energyLevel: number): Promise<void> {
  await recordSignal({
    signalType: "energy_level",
    signalCategory: "emotional",
    value: energyLevel * 10,
    metadata: { originalScale: "1-10" },
  });
}

/**
 * Record focus duration (in seconds)
 */
export async function recordFocusDuration(seconds: number, activity: string): Promise<void> {
  await recordSignal({
    signalType: "focus_duration",
    signalCategory: "cognitive",
    value: seconds,
    metadata: { activity },
  });
}

/**
 * Record assignment-related stress
 */
export async function recordAssignmentStress(
  assignmentId: string,
  stressLevel: number,
  phase: "pre" | "during" | "post"
): Promise<void> {
  await recordSignal({
    signalType: "assignment_stress",
    signalCategory: "workflow",
    value: stressLevel * 10,
    metadata: { assignmentId, phase },
  });
}

/**
 * Record debrief engagement depth
 */
export async function recordDebriefDepth(
  assignmentId: string,
  metrics: {
    wordCount: number;
    timeSpentSeconds: number;
    emotionsExpressed: string[];
    insightsGained: number;
  }
): Promise<void> {
  await recordSignal({
    signalType: "debrief_depth",
    signalCategory: "workflow",
    value: calculateDebriefScore(metrics),
    metadata: { assignmentId, ...metrics },
  });
}

// ============================================================================
// PAGE/FEATURE TRACKING
// ============================================================================

/**
 * Record a page view
 */
export async function recordPageView(pagePath: string, pageTitle?: string): Promise<void> {
  trackPageVisit(pagePath);
  await recordSignal({
    signalType: "page_view",
    signalCategory: "engagement",
    label: pageTitle || pagePath,
    contextPage: pagePath,
  });
}

/**
 * Record a feature interaction
 */
export async function recordFeatureClick(
  featureName: string,
  featureCategory?: string
): Promise<void> {
  trackToolAccess(featureName);
  await recordSignal({
    signalType: "feature_click",
    signalCategory: "engagement",
    label: featureName,
    metadata: { category: featureCategory },
  });
}

/**
 * Record scroll depth (percentage)
 */
export async function recordScrollDepth(depthPercent: number, pagePath: string): Promise<void> {
  await recordSignal({
    signalType: "scroll_depth",
    signalCategory: "engagement",
    value: depthPercent,
    contextPage: pagePath,
  });
}

/**
 * Record time on page (in seconds)
 */
export async function recordTimeOnPage(seconds: number, pagePath: string): Promise<void> {
  await recordSignal({
    signalType: "time_on_page",
    signalCategory: "engagement",
    value: seconds,
    contextPage: pagePath,
  });
}

// ============================================================================
// ELYA CONVERSATION SIGNALS
// ============================================================================

/**
 * Record sentiment of a message in Elya conversation
 */
export async function recordMessageSentiment(
  sentiment: "positive" | "negative" | "neutral",
  sentimentScore: number,
  conversationId: string
): Promise<void> {
  await recordSignal({
    signalType: "message_sentiment",
    signalCategory: "communication",
    value: sentimentScore,
    label: sentiment,
    metadata: { conversationId },
  });
}

/**
 * Record conversation length
 */
export async function recordConversationLength(
  messageCount: number,
  durationSeconds: number,
  conversationId: string
): Promise<void> {
  await recordSignal({
    signalType: "conversation_length",
    signalCategory: "communication",
    value: messageCount,
    metadata: { durationSeconds, conversationId },
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

function detectDeviceType(): DeviceType {
  if (typeof window === "undefined") return "web";

  const ua = navigator.userAgent.toLowerCase();

  if (/watch/.test(ua)) return "watch";
  if (/tablet|ipad/.test(ua)) return "tablet";
  if (/mobile|android|iphone/.test(ua)) return "mobile";

  // Check for PWA
  if (window.matchMedia("(display-mode: standalone)").matches) return "pwa";

  return "web";
}

function getMoodLabel(level: number): string {
  if (level <= 1) return "very_low";
  if (level <= 2) return "low";
  if (level <= 3) return "neutral";
  if (level <= 4) return "good";
  return "great";
}

function calculateDebriefScore(metrics: {
  wordCount: number;
  timeSpentSeconds: number;
  emotionsExpressed: string[];
  insightsGained: number;
}): number {
  // Simple scoring algorithm
  let score = 0;

  // Word count (0-30 points)
  score += Math.min(30, metrics.wordCount / 10);

  // Time spent (0-20 points)
  score += Math.min(20, metrics.timeSpentSeconds / 30);

  // Emotions expressed (0-25 points)
  score += Math.min(25, metrics.emotionsExpressed.length * 5);

  // Insights gained (0-25 points)
  score += Math.min(25, metrics.insightsGained * 5);

  return Math.round(score);
}

// ============================================================================
// REACT HOOKS (for easy integration)
// ============================================================================

export function useBehavioralTracking() {
  return {
    // Session
    startSession,
    endSession,
    getCurrentSession,
    trackToolAccess,
    trackPageVisit,
    trackReflectionCompleted,
    trackConversationStarted,

    // Signals
    recordSignal,
    recordMood,
    recordStress,
    recordEnergy,
    recordFocusDuration,
    recordAssignmentStress,
    recordDebriefDepth,

    // Page/Feature
    recordPageView,
    recordFeatureClick,
    recordScrollDepth,
    recordTimeOnPage,

    // Conversation
    recordMessageSentiment,
    recordConversationLength,
  };
}
