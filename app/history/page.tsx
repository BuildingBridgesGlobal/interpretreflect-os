"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// History page now redirects to Assignments with past tab selected
// This consolidates assignment history into a single location
export default function HistoryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/assignments?tab=past");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-slate-400">Redirecting to assignments...</div>
    </div>
  );
}
