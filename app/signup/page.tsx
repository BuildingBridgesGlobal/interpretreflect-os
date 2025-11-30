"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    if (!supabase) {
      setError("Authentication is not configured. Please set up Supabase.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Update profile table with full name
      if (data.user) {
        await supabase
          .from("profiles")
          .update({ full_name: fullName })
          .eq("id", data.user.id);
      }

      // Redirect to dashboard after successful signup
      router.push("/dashboard");
    } catch (err: any) {
      setError("Failed to create account. Please try again.");
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
            Create your account
          </h1>
          <p className="text-slate-400 text-sm">
            Sign up to get started
          </p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <form onSubmit={handleSignUp} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                placeholder="John Smith"
              />
            </div>

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
                placeholder="At least 8 characters"
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                placeholder="Re-enter your password"
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{" "}
              <a
                href="/signin"
                className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
              >
                Sign in
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
