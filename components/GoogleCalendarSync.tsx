"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type GoogleCalendarSyncProps = {
  onSyncComplete?: () => void;
};

type CalendarStatus = {
  connected: boolean;
  calendarId?: string;
  calendarName?: string;
  autoSyncEnabled?: boolean;
  lastSyncAt?: string;
  syncedEventsCount?: number;
  pendingEventsCount?: number;
};

// Share connection status globally for SyncToCalendarButton
let globalCalendarConnected = false;

export default function GoogleCalendarSync({ onSyncComplete }: GoogleCalendarSyncProps) {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/calendar/google?action=status", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        globalCalendarConnected = data.connected;
      } else if (response.status === 503) {
        // Google Calendar not configured on server
        setError("not_configured");
      }
    } catch (error) {
      console.error("Failed to load calendar status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/calendar/google?action=connect", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      } else if (response.status === 503) {
        setError("not_configured");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to connect to Google Calendar");
      }
    } catch (error) {
      console.error("Failed to get auth URL:", error);
      alert("Failed to connect to Google Calendar");
    }
  };

  const handleToggleAutoSync = async () => {
    if (!status) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const newValue = !status.autoSyncEnabled;

      const response = await fetch("/api/calendar/google", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update_preferences",
          sync_preferences: { sync_new_assignments: newValue },
        }),
      });

      if (response.ok) {
        setStatus({ ...status, autoSyncEnabled: newValue });
      }
    } catch (error) {
      console.error("Failed to toggle auto-sync:", error);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Calendar? Your synced events will remain in Google Calendar.")) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/calendar/google", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setStatus({ connected: false });
        setShowSettings(false);
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/calendar/google", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "sync_all" }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Synced ${result.synced} assignments to Google Calendar${result.failed > 0 ? ` (${result.failed} failed)` : ""}`);
        await loadStatus();
        onSyncComplete?.();
      }
    } catch (error) {
      console.error("Failed to sync:", error);
      alert("Failed to sync assignments");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <div className="w-4 h-4 border-2 border-slate-600 border-t-teal-400 rounded-full animate-spin" />
        Loading calendar...
      </div>
    );
  }

  // If Google Calendar isn't configured on the server, don't show the button
  if (error === "not_configured") {
    return null;
  }

  if (!status?.connected) {
    return (
      <button
        onClick={handleConnect}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Connect Google Calendar
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        {/* Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-emerald-400 font-medium">
            {status.calendarName || "Google Calendar"}
          </span>
        </div>

        {/* Sync Button */}
        {status.pendingEventsCount && status.pendingEventsCount > 0 ? (
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-400 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {syncing ? (
              <>
                <div className="w-4 h-4 border-2 border-teal-600 border-t-teal-300 rounded-full animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync {status.pendingEventsCount} Pending
              </>
            )}
          </button>
        ) : (
          <span className="text-xs text-slate-500">All synced</span>
        )}

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Settings Dropdown */}
      {showSettings && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-700 bg-slate-900 shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-semibold text-slate-100 mb-1">Google Calendar Settings</h3>
            <p className="text-xs text-slate-500">
              {status.syncedEventsCount || 0} events synced
              {status.lastSyncAt && (
                <> &bull; Last sync: {new Date(status.lastSyncAt).toLocaleDateString()}</>
              )}
            </p>
          </div>

          <div className="p-4 space-y-4">
            {/* Auto-sync toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Auto-sync new assignments</p>
                <p className="text-xs text-slate-500">Automatically add to calendar</p>
              </div>
              <button
                onClick={handleToggleAutoSync}
                aria-label={status.autoSyncEnabled ? "Disable auto-sync" : "Enable auto-sync"}
                className={`w-10 h-6 rounded-full ${status.autoSyncEnabled ? 'bg-teal-500' : 'bg-slate-700'} relative cursor-pointer transition-colors`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${status.autoSyncEnabled ? 'left-5' : 'left-1'}`} />
              </button>
            </div>

            {/* Sync all button */}
            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? "Syncing..." : "Sync All Assignments"}
            </button>

            {/* Disconnect */}
            <button
              onClick={handleDisconnect}
              className="w-full text-center text-sm text-red-400 hover:text-red-300 py-2"
            >
              Disconnect Google Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sync button for individual assignment cards
export function SyncToCalendarButton({
  assignmentId,
  isSynced,
  onSync
}: {
  assignmentId: string;
  isSynced?: boolean;
  onSync?: () => void;
}) {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(isSynced);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // Check connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsConnected(false);
          return;
        }

        const response = await fetch("/api/calendar/google?action=status", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsConnected(data.connected);
        } else {
          setIsConnected(false);
        }
      } catch {
        setIsConnected(false);
      }
    };

    // Use cached value if available, otherwise check
    if (globalCalendarConnected) {
      setIsConnected(true);
    } else {
      checkConnection();
    }
  }, []);

  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSyncing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/calendar/google", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "sync",
          assignment_id: assignmentId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSynced(true);
          onSync?.();
        } else {
          alert(result.error || "Failed to sync");
        }
      }
    } catch (error) {
      console.error("Sync error:", error);
      alert("Failed to sync to calendar");
    } finally {
      setSyncing(false);
    }
  };

  // Don't show anything if not connected or still checking
  if (isConnected === null || isConnected === false) {
    return null;
  }

  if (synced) {
    return (
      <div className="flex items-center gap-1 text-xs text-emerald-400">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Synced
      </div>
    );
  }

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-400 transition-colors disabled:opacity-50"
      title="Sync to Google Calendar"
    >
      {syncing ? (
        <div className="w-3.5 h-3.5 border border-slate-500 border-t-teal-400 rounded-full animate-spin" />
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
      <span>Sync</span>
    </button>
  );
}
