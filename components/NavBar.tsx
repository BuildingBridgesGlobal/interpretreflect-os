"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAgencyAdmin, setIsAgencyAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user is logged in
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          checkAgencyAdmin(session.user.id);
        }
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          checkAgencyAdmin(session.user.id);
        } else {
          setIsAgencyAdmin(false);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const checkAgencyAdmin = async (userId: string) => {
    const { data: membership } = await (supabase as any)
      .from("organization_members")
      .select("role")
      .eq("user_id", userId)
      .eq("is_active", true)
      .in("role", ["admin", "owner", "manager"])
      .limit(1)
      .single();

    setIsAgencyAdmin(!!membership);
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      router.push("/");
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b border-white/[0.06] bg-ir-bg-primary/95 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - links to dashboard when logged in, landing page when not */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <span className="text-xl font-semibold text-slate-100">
              Interpret<span className="text-teal-400">Reflect</span>
            </span>
          </Link>

          {/* Navigation Links - Only show if user is logged in */}
          {mounted && user && (
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "text-teal-400"
                    : "text-slate-300 hover:text-teal-300"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/journal"
                className={`text-sm font-medium transition-colors ${
                  isActive("/journal")
                    ? "text-teal-400"
                    : "text-slate-300 hover:text-teal-300"
                }`}
              >
                Journal
              </Link>
              <Link
                href="/assignments"
                className={`text-sm font-medium transition-colors ${
                  isActive("/assignments") || pathname?.startsWith("/assignments")
                    ? "text-teal-400"
                    : "text-slate-300 hover:text-teal-300"
                }`}
              >
                Assignments
              </Link>
              <Link
                href="/skills"
                className={`text-sm font-medium transition-colors ${
                  isActive("/skills")
                    ? "text-teal-400"
                    : "text-slate-300 hover:text-teal-300"
                }`}
              >
                Skills
              </Link>
              <Link
                href="/community"
                className={`text-sm font-medium transition-colors ${
                  isActive("/community")
                    ? "text-teal-400"
                    : "text-slate-300 hover:text-teal-300"
                }`}
              >
                Community
              </Link>
              <Link
                href="/wellness"
                className={`text-sm font-medium transition-colors ${
                  isActive("/wellness")
                    ? "text-teal-400"
                    : "text-slate-300 hover:text-teal-300"
                }`}
              >
                Wellness
              </Link>
              <Link
                href="/ceu"
                className={`text-sm font-medium transition-colors ${
                  isActive("/ceu")
                    ? "text-teal-400"
                    : "text-slate-300 hover:text-teal-300"
                }`}
              >
                My CEUs
              </Link>
            </div>
          )}

          {/* Mobile Menu Button & Auth Buttons */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button - only show when logged in */}
            {mounted && user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-300 hover:text-teal-300 hover:bg-slate-800 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            )}

            {!mounted ? (
              // Placeholder to prevent hydration mismatch - shows nothing during SSR
              <div className="h-10 w-24" />
            ) : user ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.02] px-4 py-2 text-sm font-medium text-slate-200 hover:border-teal-500/30 hover:text-teal-300 transition-colors"
                  >
                    <span className="max-w-[150px] truncate">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Account'}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <>
                      {/* Backdrop to close dropdown when clicking outside */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setDropdownOpen(false)}
                      />

                      {/* Dropdown Menu */}
                      <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-700 bg-slate-950 shadow-xl shadow-black/50 z-20">
                        <div className="py-1">
                          {isAgencyAdmin && (
                            <Link
                              href="/agency"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-teal-300 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Agency Dashboard
                            </Link>
                          )}
                          <Link
                            href="/ceu"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-teal-300 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            My CEUs
                          </Link>
                          <Link
                            href="/settings"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-teal-300 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                          </Link>
                          <a
                            href="mailto:support@interpretreflect.com"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-teal-300 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Help & Support
                          </a>
                          <div className="border-t border-white/[0.06] my-1" />
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              handleLogout();
                            }}
                            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-teal-300 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="rounded-lg border border-white/[0.1] px-4 py-2 text-sm font-medium text-slate-200 hover:border-teal-500/30 hover:text-teal-300 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mounted && user && mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-slate-950 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile Menu Panel */}
          <div className="md:hidden fixed top-16 left-0 right-0 bg-slate-950 border-b border-slate-800 z-50 shadow-xl shadow-black/50">
            <div className="container mx-auto max-w-7xl px-4 py-4">
              <div className="flex flex-col gap-1">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/dashboard")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/journal"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/journal")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  Journal
                </Link>
                <Link
                  href="/assignments"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/assignments") || pathname?.startsWith("/assignments")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  Assignments
                </Link>
                <Link
                  href="/skills"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/skills")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  Skills
                </Link>
                <Link
                  href="/community"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/community")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  Community
                </Link>
                <Link
                  href="/wellness"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/wellness")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  Wellness
                </Link>
                <Link
                  href="/ceu"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/ceu")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  My CEUs
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/settings")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                  }`}
                >
                  Settings
                </Link>
                {isAgencyAdmin && (
                  <Link
                    href="/agency"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive("/agency")
                        ? "bg-violet-500/20 text-violet-400"
                        : "text-slate-300 hover:bg-slate-800 hover:text-violet-300"
                    }`}
                  >
                    Agency Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
