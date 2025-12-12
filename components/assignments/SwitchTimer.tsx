"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

type TeamMember = {
  id: string;
  user_id: string;
  role: string;
  display_name?: string;
  full_name?: string;
  email?: string;
};

type SwitchRecord = {
  from_user_id: string;
  to_user_id: string;
  duration_seconds: number;
  switched_at: string;
};

type SwitchTimerProps = {
  assignmentId: string;
  teamMembers: TeamMember[];
  currentUserId: string;
  isLive: boolean;
  onActiveInterpreterChange?: (userId: string) => void;
};

const DURATION_PRESETS = [
  { label: "15 min", seconds: 15 * 60 },
  { label: "20 min", seconds: 20 * 60 },
  { label: "25 min", seconds: 25 * 60 },
  { label: "30 min", seconds: 30 * 60 },
];

export default function SwitchTimer({
  assignmentId,
  teamMembers,
  currentUserId,
  isLive,
  onActiveInterpreterChange,
}: SwitchTimerProps) {
  const [selectedDuration, setSelectedDuration] = useState(DURATION_PRESETS[1].seconds); // 20 min default
  const [timeRemaining, setTimeRemaining] = useState(selectedDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [activeInterpreterIndex, setActiveInterpreterIndex] = useState(0);
  const [switchHistory, setSwitchHistory] = useState<SwitchRecord[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [hasAlerted, setHasAlerted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeInterpreter = teamMembers[activeInterpreterIndex];
  const nextInterpreter = teamMembers[(activeInterpreterIndex + 1) % teamMembers.length];

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/switch-alert.mp3");
      audioRef.current.volume = 0.5;
    }
  }, []);

  // Load switch history from assignment
  useEffect(() => {
    const loadSwitchHistory = async () => {
      const { data } = await (supabase as any)
        .from("assignments")
        .select("switch_history")
        .eq("id", assignmentId)
        .single();

      if (data?.switch_history) {
        setSwitchHistory(data.switch_history as SwitchRecord[]);
      }
    };

    loadSwitchHistory();
  }, [assignmentId]);

  // Save switch history to assignment
  const saveSwitchHistory = useCallback(async (history: SwitchRecord[]) => {
    await (supabase as any)
      .from("assignments")
      .update({ switch_history: history })
      .eq("id", assignmentId);
  }, [assignmentId]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;

          // Alert at 1 minute remaining
          if (newTime === 60 && alertsEnabled && !hasAlerted) {
            triggerAlert("warning");
            setHasAlerted(true);
          }

          // Alert at 0
          if (newTime === 0 && alertsEnabled) {
            triggerAlert("switch");
          }

          return newTime;
        });
      }, 1000);
    } else if (timeRemaining === 0 && isRunning) {
      // Auto-pause when timer reaches 0
      setIsRunning(false);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timeRemaining, alertsEnabled, hasAlerted]);

  // Notify parent of active interpreter change
  useEffect(() => {
    if (activeInterpreter && onActiveInterpreterChange) {
      onActiveInterpreterChange(activeInterpreter.user_id);
    }
  }, [activeInterpreter, onActiveInterpreterChange]);

  const triggerAlert = (type: "warning" | "switch") => {
    // Audio alert
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Audio play failed, likely due to user not interacting with page
      });
    }

    // Vibration alert (mobile)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (type === "warning") {
        navigator.vibrate([200, 100, 200]);
      } else {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }
    }
  };

  const startTimer = () => {
    setIsRunning(true);
    setHasAlerted(false);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeRemaining(selectedDuration);
    setHasAlerted(false);
  };

  const switchInterpreter = async () => {
    const previousInterpreter = activeInterpreter;
    const elapsedTime = selectedDuration - timeRemaining;

    // Record the switch
    const switchRecord: SwitchRecord = {
      from_user_id: previousInterpreter.user_id,
      to_user_id: nextInterpreter.user_id,
      duration_seconds: elapsedTime,
      switched_at: new Date().toISOString(),
    };

    const newHistory = [...switchHistory, switchRecord];
    setSwitchHistory(newHistory);
    await saveSwitchHistory(newHistory);

    // Move to next interpreter
    setActiveInterpreterIndex((prev) => (prev + 1) % teamMembers.length);

    // Reset timer
    setTimeRemaining(selectedDuration);
    setHasAlerted(false);

    // Keep running if was running
    if (!isRunning) {
      setIsRunning(true);
    }
  };

  const selectDuration = (seconds: number) => {
    setSelectedDuration(seconds);
    if (!isRunning) {
      setTimeRemaining(seconds);
    }
    setShowSettings(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = () => {
    return ((selectedDuration - timeRemaining) / selectedDuration) * 100;
  };

  const getProgressColor = () => {
    const percentage = (timeRemaining / selectedDuration) * 100;
    if (percentage <= 10) return "bg-red-500";
    if (percentage <= 25) return "bg-amber-500";
    return "bg-green-500";
  };

  const getMemberDisplayName = (member: TeamMember) => {
    return member.display_name || member.full_name || member.email?.split("@")[0] || "Unknown";
  };

  const getTotalActiveTime = (userId: string) => {
    return switchHistory
      .filter((s) => s.from_user_id === userId)
      .reduce((acc, s) => acc + s.duration_seconds, 0);
  };

  if (teamMembers.length < 2) {
    return null; // Don't show timer for solo assignments
  }

  return (
    <div className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-slate-900/50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide">
          Switch Timer
        </h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-3">
          {/* Duration Presets */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Switch Interval</p>
            <div className="grid grid-cols-4 gap-1">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.seconds}
                  onClick={() => selectDuration(preset.seconds)}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                    selectedDuration === preset.seconds
                      ? "bg-green-500 text-slate-950"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alerts Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Sound & Vibration Alerts</span>
            <button
              onClick={() => setAlertsEnabled(!alertsEnabled)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                alertsEnabled ? "bg-green-500" : "bg-slate-600"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  alertsEnabled ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Current Interpreter */}
      <div className="mb-4">
        <p className="text-xs text-slate-400 mb-2">Currently Active</p>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/20 border border-green-500/30">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-slate-950 font-bold">
            {getMemberDisplayName(activeInterpreter).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-100">
              {getMemberDisplayName(activeInterpreter)}
              {activeInterpreter.user_id === currentUserId && " (You)"}
            </p>
            <p className="text-xs text-green-400 capitalize">{activeInterpreter.role}</p>
          </div>
          {isRunning && (
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
          )}
        </div>
      </div>

      {/* Timer Display */}
      <div className="mb-4">
        <div className="text-center mb-3">
          <div className={`text-5xl font-mono font-bold ${
            timeRemaining <= 60 ? "text-red-400 animate-pulse" : "text-green-400"
          }`}>
            {formatTime(timeRemaining)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {timeRemaining <= 60 && timeRemaining > 0 ? "Time to switch soon!" : "Time remaining"}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${getProgressColor()}`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Next Up */}
      <div className="mb-4">
        <p className="text-xs text-slate-400 mb-2">Next Up</p>
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
            {getMemberDisplayName(nextInterpreter).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-200">
              {getMemberDisplayName(nextInterpreter)}
              {nextInterpreter.user_id === currentUserId && " (You)"}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {!isRunning ? (
          <button
            onClick={startTimer}
            disabled={!isLive}
            className="px-3 py-2.5 rounded-lg bg-green-500 hover:bg-green-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-medium transition-colors text-sm"
          >
            Start
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="px-3 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium transition-colors text-sm"
          >
            Pause
          </button>
        )}
        <button
          onClick={resetTimer}
          className="px-3 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors text-sm"
        >
          Reset
        </button>
        <button
          onClick={switchInterpreter}
          disabled={!isLive}
          className="px-3 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium transition-colors text-sm"
        >
          Switch
        </button>
      </div>

      {/* Switch History Summary */}
      {switchHistory.length > 0 && (
        <div className="pt-3 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-2">Session Stats</p>
          <div className="space-y-1.5">
            {teamMembers.map((member) => {
              const totalTime = getTotalActiveTime(member.user_id);
              const switchCount = switchHistory.filter(
                (s) => s.from_user_id === member.user_id
              ).length;

              return (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-slate-300">
                    {getMemberDisplayName(member)}
                    {member.user_id === currentUserId && " (You)"}
                  </span>
                  <span className="text-slate-500">
                    {Math.floor(totalTime / 60)}m • {switchCount} switches
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Total switches: {switchHistory.length}
          </p>
        </div>
      )}
    </div>
  );
}
