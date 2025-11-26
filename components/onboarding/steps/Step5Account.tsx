"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Step5Account({ email, password, weekly_summary_opt_in, primary_goal, selected_skill_ids, skill_levels_by_id, onChange, onSubmit }: { email?: string; password?: string; weekly_summary_opt_in?: boolean; primary_goal?: "burnout" | "recovery" | "growth" | "season"; selected_skill_ids?: number[]; skill_levels_by_id?: Record<number, number>; onChange: (partial: { email?: string; password?: string; weekly_summary_opt_in?: boolean }) => void; onSubmit: () => void }) {
  const [valid, setValid] = useState(false);
  const validate = (e?: string, p?: string) => {
    const ok = !!e && !!p && p.length >= 6;
    setValid(ok);
  };
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    try {
      if (!supabase) {
        setError("Supabase not configured.");
        return;
      }
      const { error: signUpError } = await supabase.auth.signUp({ email: email!, password: password! });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (selected_skill_ids?.length || skill_levels_by_id) {
        // user_id is set by database trigger
        const goalsRows = (selected_skill_ids ?? []).map((skill_id) => ({ skill_id, target_level: 4, source: "onboarding" }));
        if (goalsRows.length) {
          await supabase.from("skill_goals").insert(goalsRows as any);
        }
        const assessmentsRows = Object.entries(skill_levels_by_id ?? {}).map(([skillId, level]) => ({ skill_id: Number(skillId), level, source: "onboarding" }));
        if (assessmentsRows.length) {
          await supabase.from("skill_assessments").insert(assessmentsRows as any);
        }
        await supabase.from("agent_events").insert({ agent: "onboarding", event_type: "skills_captured", metadata: { primary_goal, selected_skill_ids, skill_levels_by_id } } as any);
      }
      onSubmit();
    } catch (e: any) {
      setError("Signup failed. Check Supabase config.");
    }
  };

  return (
    <div className="space-y-4">
      <input type="email" placeholder="Email" value={email ?? ""} onChange={(ev) => { onChange({ email: ev.target.value }); validate(ev.target.value, password); }} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200" />
      <input type="password" placeholder="Password (min 6 chars)" value={password ?? ""} onChange={(ev) => { onChange({ password: ev.target.value }); validate(email, ev.target.value); }} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200" />
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={weekly_summary_opt_in ?? false} onChange={(ev) => onChange({ weekly_summary_opt_in: ev.target.checked })} className="h-4 w-4 rounded border-slate-700 bg-slate-900" />
        Send me a weekly OS summary.
      </label>
      {error && <p className="text-[0.8rem] text-amber-300">{error}</p>}
      <button disabled={!valid} onClick={handleSubmit} className={`inline-flex items-center rounded-lg px-5 py-2 text-sm font-semibold ${valid ? "bg-teal-400 text-slate-950 hover:bg-teal-300" : "bg-slate-800 text-slate-400"}`}>Create account & see my OS</button>
    </div>
  );
}
