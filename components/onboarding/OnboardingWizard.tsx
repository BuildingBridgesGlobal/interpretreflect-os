"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Step1GroundRules from "./steps/Step1GroundRules";
import Step2Context from "./steps/Step2Context";
import Step3WeekState from "./steps/Step3WeekState";
import Step4Goals from "./steps/Step4Goals";
import Step5SkillsPractices from "./steps/Step5SkillsPractices";
import Step6Finish from "./steps/Step6Finish";

type Data = {
  acknowledge_not_clinical: boolean;
  roles: string[];
  role_other?: string;
  years_experience?: string;
  settings: string[];
  settings_other?: string;
  typical_workload?: string;
  current_challenges?: string[];
  challenges_other?: string;
  what_brought_you?: string;
  what_brought_you_other?: string;
  primary_goal?: "burnout" | "recovery" | "growth" | "season";
  selected_skill_ids?: number[];
  current_practices?: string[];
  weekly_summary_opt_in?: boolean;
};

const steps = [
  { key: "ground", title: "Ground rules & safety" },
  { key: "context", title: "Your interpreting world" },
  { key: "week", title: "Tell us about you" },
  { key: "goal", title: "Your primary goal" },
  { key: "skills", title: "Your growth focus" },
  { key: "finish", title: "All set!" },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [data, setData] = useState<Data>({ acknowledge_not_clinical: false, roles: [], settings: [] });

  const pct = useMemo(() => Math.round(((index + 1) / steps.length) * 100), [index]);

  const next = () => setIndex((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setIndex((i) => Math.max(i - 1, 0));

  const saveExit = () => {
    localStorage.setItem("ir_onboarding", JSON.stringify(data));
    router.push("/");
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
            roles={data.roles}
            role_other={data.role_other}
            years_experience={data.years_experience}
            settings={data.settings}
            settings_other={data.settings_other}
            onChange={(partial) => setData({ ...data, ...partial })}
          />
        )}
        {index === 2 && (
          <Step3WeekState
            typical_workload={data.typical_workload}
            current_challenges={data.current_challenges}
            challenges_other={data.challenges_other}
            what_brought_you={data.what_brought_you}
            what_brought_you_other={data.what_brought_you_other}
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
          <Step5SkillsPractices
            selected_skill_ids={data.selected_skill_ids}
            current_practices={data.current_practices}
            onChange={(partial) => setData({ ...data, ...partial })}
          />
        )}
        {index === 5 && (
          <Step6Finish
            weekly_summary_opt_in={data.weekly_summary_opt_in}
            roles={data.roles}
            role_other={data.role_other}
            years_experience={data.years_experience}
            settings={data.settings}
            settings_other={data.settings_other}
            typical_workload={data.typical_workload}
            current_challenges={data.current_challenges}
            challenges_other={data.challenges_other}
            what_brought_you={data.what_brought_you}
            what_brought_you_other={data.what_brought_you_other}
            primary_goal={data.primary_goal}
            selected_skill_ids={data.selected_skill_ids}
            current_practices={data.current_practices}
            onChange={(partial) => setData({ ...data, ...partial })}
          />
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button onClick={back} className="inline-flex items-center rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-teal-400/70 hover:text-teal-300" disabled={index === 0}>
          Back
        </button>
        <div className="flex items-center gap-3">
          {index < steps.length - 1 && <button onClick={saveExit} className="text-[0.8rem] text-slate-400">Save & exit</button>}
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
