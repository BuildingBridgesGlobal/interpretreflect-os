"use client";
import React from "react";
import { SkillsDashboard } from "@/components/skills/SkillsDashboard";
import { supabase } from "@/lib/supabaseClient";

export default function SkillsPage() {
  const [userId, setUserId] = React.useState<string>("");
  React.useEffect(() => {
    const run = async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? "";
      setUserId(uid);
    };
    run();
  }, []);
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="container mx-auto px-6 py-10 md:px-8 md:py-12">
        <SkillsDashboard />
      </main>
    </div>
  );
}
