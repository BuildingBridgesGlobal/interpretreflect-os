"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import Link from "next/link";

interface Workshop {
  id: string;
  module_code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  duration_minutes: number;
  ceu_value: number | null;
  rid_category: string | null;
  rid_activity_code: string | null;
  instructor_name: string | null;
  instructor_credentials: string | null;
  presentation_language: string | null;
}

export default function WorkshopsPage() {
  const router = useRouter();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "ps" | "gsd" | "ppod">("all");
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndLoadWorkshops();
  }, []);

  const checkAuthAndLoadWorkshops = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Not logged in - redirect to sign in
      router.push("/signin?redirect=/workshops");
      return;
    }

    setIsAuthenticated(true);

    // Get user's subscription tier
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", session.user.id)
      .single();

    const tier = profile?.subscription_tier || "free";
    setSubscriptionTier(tier);

    // Only load workshops if user has access (growth or pro)
    if (tier === "growth" || tier === "pro") {
      await loadWorkshops();
    } else {
      setLoading(false);
    }
  };

  const loadWorkshops = async () => {
    try {
      const { data } = await supabase
        .from("skill_modules")
        .select(`
          id,
          module_code,
          title,
          subtitle,
          description,
          duration_minutes,
          ceu_value,
          rid_category,
          rid_activity_code,
          instructor_name,
          instructor_credentials,
          presentation_language
        `)
        .eq("ceu_eligible", true)
        .eq("is_active", true)
        .eq("publish_status", "published")
        .order("title", { ascending: true });

      if (data) {
        setWorkshops(data as unknown as Workshop[]);
      }
    } catch (error) {
      console.error("Error loading workshops:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? "s" : ""}`;
  };

  const filteredWorkshops = workshops.filter((w) => {
    if (filter === "all") return true;
    const category = w.rid_category?.toLowerCase() || "";
    if (filter === "ps") return category.includes("professional");
    if (filter === "gsd") return category.includes("general");
    if (filter === "ppod") return category.includes("ethics") || category.includes("ppod");
    return true;
  });

  // Show loading state while checking auth
  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show paywall for free users
  if (subscriptionTier === "free") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <NavBar />
        <main className="container mx-auto max-w-2xl px-4 md:px-6 py-12 md:py-16">
          <div className="text-center">
            {/* Lock Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-teal-500/20 border border-amber-500/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold mb-3">CEU Workshops</h1>
            <p className="text-lg text-slate-400 mb-8">
              Earn RID-approved CEU credits with our on-demand professional development workshops.
            </p>

            {/* Feature List */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-8 text-left">
              <h2 className="font-semibold text-slate-200 mb-4">What you get with Growth or Pro:</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">RID-approved CEU workshops (Provider #2309)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">On-demand video content in ASL with English captions</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Instant certificates upon completion</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Professional Studies, General Studies, and Ethics content</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-semibold text-lg hover:from-teal-400 hover:to-cyan-400 transition-all shadow-lg shadow-teal-500/25"
            >
              Upgrade to Access Workshops
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>

            <p className="text-sm text-slate-500 mt-4">
              Growth starts at $19/month · Pro includes 0.3 CEUs/month
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <NavBar />

      <main className="container mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-amber-500/20 border border-teal-500/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">CEU Workshops</h1>
              <p className="text-sm text-slate-400">RID Approved Provider #2309</p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm text-slate-400 mr-2">Filter by:</span>
          {[
            { key: "all", label: "All Workshops" },
            { key: "ps", label: "Professional Studies" },
            { key: "gsd", label: "General Studies" },
            { key: "ppod", label: "Ethics (PPOD)" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key as typeof filter)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === item.key
                  ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                  : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700/50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4">
            <p className="text-2xl font-bold text-teal-400">{workshops.length}</p>
            <p className="text-xs text-slate-400">Available</p>
          </div>
          <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4">
            <p className="text-2xl font-bold text-amber-400">
              {workshops.reduce((acc, w) => acc + (w.ceu_value || 0), 0).toFixed(2)}
            </p>
            <p className="text-xs text-slate-400">Total CEUs</p>
          </div>
          <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4">
            <p className="text-2xl font-bold text-violet-400">On-Demand</p>
            <p className="text-xs text-slate-400">Format</p>
          </div>
          <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4">
            <p className="text-2xl font-bold text-emerald-400">Instant</p>
            <p className="text-xs text-slate-400">Certificates</p>
          </div>
        </div>

        {/* Workshop Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading workshops...</p>
          </div>
        ) : filteredWorkshops.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-slate-800 bg-slate-900/30">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-slate-400 mb-2">
              {filter === "all" ? "No workshops available yet" : "No workshops match this filter"}
            </p>
            <p className="text-sm text-slate-500">
              {filter === "all" ? "Check back soon for new workshops" : "Try a different category"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWorkshops.map((workshop) => (
              <div
                key={workshop.id}
                className="group rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden hover:border-teal-500/50 transition-all"
              >
                {/* Workshop Header */}
                <div className="h-24 bg-gradient-to-br from-teal-500/10 via-violet-500/10 to-amber-500/10 relative px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-950/70 text-teal-400">
                      {workshop.rid_category || "Professional Studies"}
                    </span>
                    {workshop.ceu_value && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
                        {workshop.ceu_value} CEU
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-base mb-1 group-hover:text-teal-400 transition-colors line-clamp-2">
                    {workshop.title}
                  </h3>

                  {workshop.subtitle && (
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">{workshop.subtitle}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDuration(workshop.duration_minutes)}
                    </span>
                    {workshop.instructor_name && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        {workshop.instructor_name}
                      </span>
                    )}
                  </div>

                  {workshop.rid_activity_code && (
                    <p className="text-xs text-slate-600 mb-3">
                      RID Activity: {workshop.rid_activity_code}
                    </p>
                  )}

                  <Link
                    href={`/ceu/workshop/${workshop.module_code}`}
                    className="block w-full text-center py-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 text-sm font-medium hover:bg-teal-500/20 transition-colors"
                  >
                    Start Workshop
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            <Link href="/ceu" className="text-teal-400 hover:underline">
              View your CEU records and certificates
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
