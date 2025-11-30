"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!supabase) {
      setError("Authentication is not configured. Please set up Supabase.");
      setLoading(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Redirect to dashboard on success
      router.push("/dashboard");
    } catch (err: any) {
      setError("Failed to sign in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl font-semibold text-slate-50">
              Interpreter<span className="text-teal-400">OS</span>
            </span>
          </a>
          <h1 className="text-2xl font-semibold text-slate-100 mb-2">
            Welcome back
          </h1>
          <p className="text-slate-400 text-sm">
            Sign in to your account
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-teal-400 hover:bg-teal-300 text-slate-950 font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-400/20"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account?{" "}
              <a
                href="/start"
                className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
              >
                Get started
              </a>
            </p>
          </div>

          {/* Back to Home Link */}
          <div className="mt-4 text-center">
            <a href="/" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">
              ← Back to home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
