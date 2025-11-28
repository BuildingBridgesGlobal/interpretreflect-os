"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import TodaySnapshot from "@/components/dashboard/TodaySnapshot";
import QuadrantPerformance from "@/components/dashboard/QuadrantPerformance";
import QuadrantBurnout from "@/components/dashboard/QuadrantBurnout";
import QuadrantDomains from "@/components/dashboard/QuadrantDomains";
import QuadrantSupportStack from "@/components/dashboard/QuadrantSupportStack";
import FirstActionsStrip from "@/components/dashboard/FirstActionsStrip";

type OnboardingData = {
  role?: string;
  years_experience?: string;
  settings?: string[];
  week_load_score?: number;
  primary_goal?: "burnout" | "recovery" | "growth" | "season";
};

export default function AppDashboard() {
  const searchParams = useSearchParams();
  const firstRun = searchParams.get("firstRun") === "1";
  const [data, setData] = useState<OnboardingData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ir_onboarding");
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const loadSeed = data?.week_load_score ?? 5;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Simple nav */}
      <header className="border-b border-slate-800 px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-lg font-bold text-teal-400">InterpretReflect OS</span>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link href="/app" className="hover:text-teal-300">Dashboard</Link>
            <Link href="/app/skills" className="hover:text-teal-300">Skills</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {firstRun && (
          <div className="rounded-xl bg-teal-900/30 border border-teal-700/50 px-4 py-3 text-sm text-teal-200">
            Welcome! Your OS is now set up. Here's your personalized dashboard.
          </div>
        )}

        <TodaySnapshot data={data} />

        {firstRun && <FirstActionsStrip />}

        <div className="grid gap-6 md:grid-cols-2">
          <QuadrantPerformance seed={loadSeed} />
          <QuadrantBurnout />
          <QuadrantDomains />
          <QuadrantSupportStack />
        </div>
      </main>
    </div>
  );
}
