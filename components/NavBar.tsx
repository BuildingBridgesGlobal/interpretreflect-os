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

  useEffect(() => {
    // Check if user is logged in
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      router.push("/");
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold text-slate-50">
              Interpret<span className="text-teal-400">Reflect</span>
            </span>
          </Link>

          {/* Navigation Links - Only show if user is logged in */}
          {user && (
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
                href="/history"
                className={`text-sm font-medium transition-colors ${
                  isActive("/history")
                    ? "text-teal-400"
                    : "text-slate-300 hover:text-teal-300"
                }`}
              >
                History
              </Link>
            </div>
          )}

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-teal-400/70 hover:text-teal-300 transition-colors"
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
                      <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-700 bg-slate-900 shadow-xl z-20">
                        <div className="py-1">
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
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-teal-400/70 hover:text-teal-300 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-300 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
