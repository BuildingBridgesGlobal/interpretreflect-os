"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { CatalystChat } from "@/components/coach/CatalystChat";
import { supabase } from "@/lib/supabaseClient";

export default function CoachPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signin");
        return;
      }
      setUserId(user.id);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

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
        <div className="container mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-50 tracking-tight">
              Catalyst Coach
            </h1>
            <p className="mt-1 text-sm md:text-base text-slate-400">
              Your AI coaching team for every assignment
            </p>
          </div>

          {/* Coach Chat */}
          <CatalystChat userId={userId} />
        </div>
      </div>
    </div>
  );
}
