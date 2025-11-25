"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Step1GroundRules from "./steps/Step1GroundRules";
import Step2Context from "./steps/Step2Context";
import Step3WeekState from "./steps/Step3WeekState";
import Step4Goals from "./steps/Step4Goals";
import Step5Account from "./steps/Step5Account";

type Data = {
  acknowledge_not_clinical: boolean;
  role?: string;
  years_experience?: string;
  settings: string[];
  week_load_score?: number;
  week_recovery_score?: number;
  week_red_flag?: "no" | "maybe" | "yes";
  primary_goal?: "burnout" | "recovery" | "growth" | "season";
  selected_skill_ids?: number[];
  skill_levels_by_id?: Record<number, number>;
  email?: string;
  password?: string;
  weekly_summary_opt_in?: boolean;
};

const steps = [
  { key: "ground", title: "Ground rules & safety" },
  { key: "context", title: "Your interpreting world" },
  { key: "week", title: "Your last 7 days" },
  { key: "goal", title: "Focus area" },
  { key: "account", title: "Create account" },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [data, setData] = useState<Data>({ acknowledge_not_clinical: false, settings: [] });

  const pct = useMemo(() => Math.round(((index + 1) / steps.length) * 100), [index]);

  const next = () => setIndex((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setIndex((i) => Math.max(i - 1, 0));

  const saveExit = () => {
    localStorage.setItem("ir_onboarding", JSON.stringify(data));
    router.push("/");
  };

  const finish = () => {
    localStorage.setItem("ir_onboarding", JSON.stringify(data));
    router.push("/app?firstRun=1");
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[0.75rem] uppercase tracking-[0.14em] text-slate-400">Onboarding</p>
          <h1 className="mt-1 text-xl md:text-2xl font-semibold text-slate-50">{steps[index].title}</h1>
        </div>
        <div className="w-40">
          <div className="h-2 w-full rounded-full bg-slate-800">
            <div className="h-2 rounded-full bg-teal-400" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-[0.7rem] text-slate-400">{pct}%</p>
        </div>
      </div>

      <div className="mt-6">
        {index === 0 && (
          <Step1GroundRules value={data.acknowledge_not_clinical} onChange={(v) => setData({ ...data, acknowledge_not_clinical: v })} />
        )}
        {index === 1 && (
          <Step2Context
            role={data.role}
            years_experience={data.years_experience}
            settings={data.settings}
            onChange={(partial) => setData({ ...data, ...partial })}
          />
        )}
        {index === 2 && (
          <Step3WeekState
            week_load_score={data.week_load_score}
            week_recovery_score={data.week_recovery_score}
            week_red_flag={data.week_red_flag}
            onChange={(partial) => setData({ ...data, ...partial })}
          />
        )}
        {index === 3 && (
          <Step4Goals
            primary_goal={data.primary_goal}
            onChange={(partial) => setData({ ...data, ...partial })}
          />
        )}
        {index === 4 && (
          <Step5Account
            email={data.email}
            password={data.password}
            weekly_summary_opt_in={data.weekly_summary_opt_in}
            primary_goal={data.primary_goal}
            selected_skill_ids={data.selected_skill_ids}
            skill_levels_by_id={data.skill_levels_by_id}
            onChange={(partial) => setData({ ...data, ...partial })}
            onSubmit={finish}
          />
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button onClick={back} className="inline-flex items-center rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-teal-400/70 hover:text-teal-300" disabled={index === 0}>
          Back
        </button>
        <div className="flex items-center gap-3">
          <button onClick={saveExit} className="text-[0.8rem] text-slate-400">Save & exit</button>
          {index < steps.length - 1 && (
            <button onClick={next} className="inline-flex items-center rounded-lg bg-teal-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-300">
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
