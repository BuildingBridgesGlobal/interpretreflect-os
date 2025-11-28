"use client";

import NavBar from "@/components/NavBar";
import TodaySnapshot from "@/components/dashboard/TodaySnapshot";
import QuadrantPerformance from "@/components/dashboard/QuadrantPerformance";
import QuadrantBurnout from "@/components/dashboard/QuadrantBurnout";
import QuadrantDomains from "@/components/dashboard/QuadrantDomains";
import QuadrantSupportStack from "@/components/dashboard/QuadrantSupportStack";
import FirstActionsStrip from "@/components/dashboard/FirstActionsStrip";

export default function DashboardPage() {
  // Mock data for now - will be replaced with real data from Supabase
  const mockUserData = {
    role: "Medical Interpreter",
    years_experience: "5",
    settings: ["Medical · Inpatient", "Education · K-12"],
    week_load_score: 7,
    primary_goal: "burnout" as const,
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* AI Motif Background */}
      <div className="fixed inset-0 opacity-25 pointer-events-none z-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-teal-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(6,182,212,0.15)_2px,transparent_2px),linear-gradient(90deg,rgba(6,182,212,0.15)_2px,transparent_2px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)] pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10">
        <NavBar />
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-50 tracking-tight">
              Your Interpreter OS
            </h1>
            <p className="mt-1 text-sm md:text-base text-slate-400">
              Well-being + skills in one view
            </p>
          </div>

          {/* Today Snapshot */}
          <TodaySnapshot data={mockUserData} />

          {/* Main Dashboard Grid */}
          <div className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QuadrantPerformance seed={mockUserData.week_load_score} />
            <QuadrantBurnout redFlag="no" />
            <QuadrantDomains domains={mockUserData.settings} />
            <QuadrantSupportStack />
          </div>

          {/* First Actions Strip */}
          <FirstActionsStrip />
        </div>
      </div>
    </div>
  );
}
