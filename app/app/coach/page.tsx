"use client";
import React from "react";
import { CatalystChat } from "@/components/coach/CatalystChat";
import { supabase } from "@/lib/supabaseClient";

export default function CoachPage() {
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
        {userId ? <CatalystChat userId={userId} /> : <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">Sign in to use Catalyst.</div>}
      </main>
    </div>
  );
}
