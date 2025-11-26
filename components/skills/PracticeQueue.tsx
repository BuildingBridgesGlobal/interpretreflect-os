"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type PracticeItem = {
  id: string;
  skillId: string;
  skillName: string;
  sessionType: "drill" | "simulation" | "prep" | "review";
  suggestedDuration: number;
  reason: string;
};

type Props = {
  userId: string;
  items: PracticeItem[];
  onSessionLogged?: () => void;
};

export const PracticeQueue: React.FC<Props> = ({ userId, items, onSessionLogged }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async (item: PracticeItem) => {
    if (!userId) {
      setError("You must be signed in to log practice.");
      return;
    }

    if (!supabase) {
      setError("Supabase not configured.");
      return;
    }

    setError(null);
    setLoadingId(item.id);

    try {
      // user_id is set by database trigger
      const { error: practiceError } = await supabase.from("practice_sessions").insert({
        skill_id: Number(item.skillId),
        session_type: item.sessionType,
        duration_minutes: item.suggestedDuration,
        quality_rating: null,
        notes: `Queued from Skills OS: ${item.reason}`,
      } as any);
      if (practiceError) throw practiceError;

      const { error: eventError } = await supabase.from("agent_events").insert({
        agent: "skills",
        event_type: "session_started",
        metadata: {
          skill_id: Number(item.skillId),
          skill_name: item.skillName,
          session_type: item.sessionType,
          suggested_duration: item.suggestedDuration,
          source: "practice_queue",
        },
      } as any);
      if (eventError) throw eventError;

      if (onSessionLogged) onSessionLogged();
    } catch (err: any) {
      setError("Could not log practice right now. You can still run the drill.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">Practice queue</p>
      <p className="mt-1 text-sm text-slate-300">A prioritized list of what to practice next, based on your goals and recent work.</p>
      {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Once you set a skill goal and complete a few sessions, Catalyst will suggest targeted practice here.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between rounded-xl bg-slate-950/80 p-3 text-sm">
              <div>
                <p className="font-medium text-slate-100">{item.skillName}</p>
                <p className="text-xs text-slate-400">{item.sessionType.toUpperCase()} · {item.suggestedDuration} min</p>
                <p className="mt-1 text-xs text-slate-400">{item.reason}</p>
              </div>
              <button
                type="button"
                onClick={() => handleStart(item)}
                disabled={loadingId === item.id}
                className="rounded-lg border border-teal-400/60 px-3 py-1 text-xs font-semibold text-teal-300 hover:bg-teal-400/10 disabled:opacity-60"
              >
                {loadingId === item.id ? "Logging..." : "Start"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
