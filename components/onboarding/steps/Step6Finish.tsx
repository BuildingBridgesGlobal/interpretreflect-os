"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Step6FinishProps = {
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

  onChange: (partial: { weekly_summary_opt_in?: boolean }) => void;
};

export default function Step6Finish({
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
}: Step6FinishProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!supabase) {
        setError("Supabase not configured.");
        setLoading(false);
        return;
      }

      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("Not signed in. Please sign in first.");
        setLoading(false);
        return;
      }

      // Update the profile with all onboarding data
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
        })
        .eq("id", session.user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        setError("Failed to save your preferences. Please try again.");
        setLoading(false);
        return;
      }

      // Create skill goals from selected skills
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
          // Don't fail the whole onboarding if skill goals fail
        }
      }

      // Log onboarding completion event (silently fail if RLS blocks it)
      try {
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
      } catch (eventError) {
        // Non-critical, just log it
        console.warn("Could not log onboarding event:", eventError);
      }

      // Success! Redirect to dashboard
      setLoading(false);
      router.push("/dashboard?welcome=true");
    } catch (e: any) {
      console.error("Onboarding completion error:", e);
      setError("Failed to complete onboarding. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
        <h3 className="text-lg font-semibold text-slate-50 mb-3">You're all set!</h3>
        <p className="text-sm text-slate-300 mb-4">
          Your InterpreterOS is being configured based on your goals and preferences. You'll have access to:
        </p>
        <ul className="space-y-2 text-sm text-slate-300 mb-4">
          <li>✓ Performance tracking dashboard</li>
          <li>✓ Assignment prep tools</li>
          <li>✓ Skill development tracking</li>
          <li>✓ Professional insights & analytics</li>
        </ul>
        <p className="text-xs text-slate-400">
          You can update your preferences anytime in Settings.
        </p>
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          checked={weekly_summary_opt_in ?? false}
          onChange={(ev) => onChange({ weekly_summary_opt_in: ev.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900"
        />
        <span>
          Send me a weekly performance summary<br />
          <span className="text-xs text-slate-500">A digest of your patterns, insights, and progress every Sunday</span>
        </span>
      </label>

      {error && <p className="text-sm text-amber-300 bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2">{error}</p>}

      <button
        onClick={handleFinish}
        disabled={loading}
        className={`w-full inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold ${
          loading
            ? "bg-slate-800 text-slate-400 cursor-not-allowed"
            : "bg-teal-400 text-slate-950 hover:bg-teal-300"
        }`}
      >
        {loading ? "Setting up your OS..." : "Go to my dashboard →"}
      </button>
    </div>
  );
}
