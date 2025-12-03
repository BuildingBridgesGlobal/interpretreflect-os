"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * This page has been deprecated.
 * Free Write is now integrated into Elya on the Dashboard.
 * This page redirects users to the Dashboard with free-write mode enabled.
 */
export default function FreeWriteRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard with free-write mode
    router.replace('/dashboard?mode=free-write');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-400">Redirecting to Free Write...</p>
      </div>
    </div>
  );
}
