"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AgentEvent = {
  id: string;
  agent: string;
  event_type: string;
  metadata: any;
  created_at: string;
};

type PracticeSession = {
  id: string;
  skill_key: string | null;
  session_type: string;
  duration_minutes: number | null;
  created_at: string;
};

type Props = { userId: string };

export const CatalystChat: React.FC<Props> = ({ userId }) => {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!supabase || !userId) return;
      setLoading(true);
      setError(null);
      const { data: eventsData } = await supabase
        .from("agent_events")
        .select("id, agent, event_type, metadata, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      const { data: sessionsData } = await supabase
        .from("practice_sessions")
        .select("id, skill_key, session_type, duration_minutes, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      setEvents((eventsData ?? []) as AgentEvent[]);
      setSessions((sessionsData ?? []) as PracticeSession[]);
      setLoading(false);
    };
    load();
  }, [userId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!userId) {
      setError("You must be signed in to chat with Catalyst.");
      return;
    }
    if (!supabase) {
      setError("Supabase not configured.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await (supabase.from("agent_events") as any).insert({
        user_id: userId,
        agent: "catalyst",
        event_type: "user_message",
        metadata: { message: input },
      });
      setInput("");
    } catch (err: any) {
      setError("Something went wrong sending your question.");
    } finally {
      setSending(false);
    }
  };

  const recentRecommendations = events.filter(
    (e) => (e.agent === "practice" || e.agent === "skills") && (e.event_type === "practice_recommendation" || e.event_type === "recommendation")
  );

  return (
    <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60">
        <header className="border-b border-slate-800 px-4 py-3">
          <h1 className="text-sm font-semibold text-slate-100">Catalyst</h1>
          <p className="text-xs text-slate-400">Your multi-agent coach for assignments, skills, and load.</p>
        </header>
        <div className="flex-1 px-4 py-3 text-xs text-slate-400">
          <p>Ask about your next assignment, which skills to focus on, or how to manage your current load. I pull from your Skills OS and practice.</p>
        </div>
        <div className="border-t border-slate-800 px-4 py-3">
          {error && <p className="mb-2 text-xs text-rose-400">{error}</p>}
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder="Example: ‘Given my goals, what should I prep for tomorrow’s medical appointment?’"
              className="flex-1 resize-none rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="h-9 rounded-lg bg-teal-400 px-4 text-xs font-semibold text-slate-950 hover:bg-teal-300 disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-teal-300">Recent recommendations</p>
          {loading ? (
            <p className="mt-2 text-xs text-slate-400">Loading...</p>
          ) : recentRecommendations.length === 0 ? (
            <p className="mt-2 text-xs text-slate-400">No recent recommendations yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              {recentRecommendations.slice(0, 5).map((e) => (
                <li key={e.id} className="rounded-lg bg-slate-950/70 p-2">
                  <span className="font-medium">{e.metadata?.skill_name ?? e.metadata?.skill_id ?? "Skill"}</span>
                  {e.metadata?.session_type && (
                    <span className="ml-1 text-slate-400">· {String(e.metadata.session_type).toUpperCase()}</span>
                  )}
                  {e.metadata?.reason && (
                    <p className="mt-1 text-[0.7rem] text-slate-400">{e.metadata.reason}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-amber-300">Recent practice</p>
          {loading ? (
            <p className="mt-2 text-xs text-slate-400">Loading...</p>
          ) : sessions.length === 0 ? (
            <p className="mt-2 text-xs text-slate-400">No practice logged yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              {sessions.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span>{new Date(s.created_at).toLocaleDateString()} · {s.session_type.toUpperCase()}</span>
                  {s.duration_minutes && <span className="text-slate-400">{s.duration_minutes} min</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </section>
  );
};
