"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SupabaseStatus() {
  const [envOk, setEnvOk] = useState(false);
  const [authOk, setAuthOk] = useState<boolean | null>(null);
  const [dbReachable, setDbReachable] = useState<boolean | null>(null);

  useEffect(() => {
    const hasEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    setEnvOk(hasEnv);
    if (hasEnv && supabase) {
      supabase.auth.getSession().then((res) => setAuthOk(res.error ? false : true));
      supabase
        .from("onboarding")
        .select("id", { head: true, count: "exact" })
        .then((res) => setDbReachable(!res.error))
        .catch(() => setDbReachable(false));
    } else {
      setAuthOk(false);
      setDbReachable(false);
    }
  }, []);

  return (
    <div className="mb-4 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-[0.8rem] text-slate-300">
      <p>Supabase environment: {envOk ? "configured" : "missing"}</p>
      <p>Auth client: {authOk === null ? "checking" : authOk ? "ok" : "error"}</p>
      <p>DB reachable: {dbReachable === null ? "checking" : dbReachable ? "ok" : "error or RLS blocking"}</p>
    </div>
  );
}
