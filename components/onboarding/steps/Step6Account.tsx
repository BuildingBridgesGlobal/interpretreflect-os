"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Step6AccountProps = {
  // Account fields
  email?: string;
  password?: string;
  weekly_summary_opt_in?: boolean;

  // All onboarding data to save to profiles
  roles?: string[];
  role_other?: string;
  years_experience?: string;
  settings?: string[];
  settings_other?: string;
  typical_workload?: string;
  current_challenges?: string[];
  challenges_other?: string;
  what_brought_you?: string;
  what_brought_you_other?: string;
  primary_goal?: "burnout" | "recovery" | "growth" | "season";
  selected_skill_ids?: number[];
  current_practices?: string[];

  onChange: (partial: { email?: string; password?: string; weekly_summary_opt_in?: boolean }) => void;
  onSubmit: () => void;
};

export default function Step6Account({
  email,
  password,
  weekly_summary_opt_in,
  roles,
  role_other,
  years_experience,
  settings,
  settings_other,
  typical_workload,
  current_challenges,
  challenges_other,
  what_brought_you,
  what_brought_you_other,
  primary_goal,
  selected_skill_ids,
  current_practices,
  onChange,
  onSubmit
}: Step6AccountProps) {
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

      // 1. Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email!,
        password: password!
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!authData.user) {
        setError("Signup failed. No user returned.");
        return;
      }

      // 2. Update the profile with all onboarding data
      // (profile was auto-created by trigger, now we update it)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          roles,
          role_other,
          years_experience,
          settings,
          settings_other,
          typical_workload,
          current_challenges,
          challenges_other,
          what_brought_you,
          what_brought_you_other,
          primary_goal,
          current_practices,
          weekly_summary_opt_in,
          // Set trial period: 7 days from now
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", authData.user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        // Don't fail the whole signup if profile update fails
      }

      // 3. Create skill goals from selected skills
      if (selected_skill_ids?.length) {
        const goalsRows = selected_skill_ids.map((skill_id) => ({
          skill_id,
          target_level: 4,
          source: "onboarding"
        }));

        const { error: goalsError } = await supabase
          .from("skill_goals")
          .insert(goalsRows as any);

        if (goalsError) {
          console.error("Skill goals error:", goalsError);
        }
      }

      // 4. Log onboarding completion event
      await supabase.from("agent_events").insert({
        agent: "onboarding",
        event_type: "completed",
        metadata: {
          primary_goal,
          selected_skill_ids,
          current_practices,
          roles,
          settings
        }
      } as any);

      // Success!
      onSubmit();
    } catch (e: any) {
      console.error("Signup error:", e);
      setError("Signup failed. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="email"
        placeholder="Email"
        value={email ?? ""}
        onChange={(ev) => {
          onChange({ email: ev.target.value });
          validate(ev.target.value, password);
        }}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200"
      />
      <input
        type="password"
        placeholder="Password (min 6 chars)"
        value={password ?? ""}
        onChange={(ev) => {
          onChange({ password: ev.target.value });
          validate(email, ev.target.value);
        }}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200"
      />
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={weekly_summary_opt_in ?? false}
          onChange={(ev) => onChange({ weekly_summary_opt_in: ev.target.checked })}
          className="h-4 w-4 rounded border-slate-700 bg-slate-900"
        />
        Send me a weekly OS summary.
      </label>
      {error && <p className="text-[0.8rem] text-amber-300">{error}</p>}
      <button
        disabled={!valid}
        onClick={handleSubmit}
        className={`inline-flex items-center rounded-lg px-5 py-2 text-sm font-semibold ${
          valid
            ? "bg-teal-400 text-slate-950 hover:bg-teal-300"
            : "bg-slate-800 text-slate-400"
        }`}
      >
        Create account & see my OS
      </button>
    </div>
  );
}
