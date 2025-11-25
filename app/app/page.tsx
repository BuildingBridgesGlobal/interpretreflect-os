"use client";
import React, { useEffect, useMemo, useState } from "react";
import TodaySnapshot from "@/components/dashboard/TodaySnapshot";
import QuadrantPerformance from "@/components/dashboard/QuadrantPerformance";
import QuadrantDomains from "@/components/dashboard/QuadrantDomains";
import QuadrantBurnout from "@/components/dashboard/QuadrantBurnout";
import QuadrantSupportStack from "@/components/dashboard/QuadrantSupportStack";
import FirstActionsStrip from "@/components/dashboard/FirstActionsStrip";

type Data = {
  acknowledge_not_clinical: boolean;
  role?: string;
  years_experience?: string;
  settings: string[];
  week_load_score?: number;
  week_recovery_score?: number;
  week_red_flag?: "no" | "maybe" | "yes";
  primary_goal?: "burnout" | "recovery" | "growth" | "season";
};

export default function Page() {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => {
    const raw = localStorage.getItem("ir_onboarding");
    if (raw) setData(JSON.parse(raw));
  }, []);

  const perfSeed = useMemo(() => data?.week_load_score ?? 5, [data]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-12 md:py-16">
        <TodaySnapshot data={data} />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuadrantPerformance seed={perfSeed} />
          <QuadrantDomains domains={data?.settings ?? []} />
          <QuadrantBurnout redFlag={data?.week_red_flag} />
          <QuadrantSupportStack />
        </div>
        <div className="mt-12">
          <FirstActionsStrip />
        </div>
      </div>
    </main>
  );
}
