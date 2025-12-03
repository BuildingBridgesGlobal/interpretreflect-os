"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AgencySignUpPage() {
  const router = useRouter();

  // User fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Organization fields
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("agency");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1); // 1 = organization info, 2 = account info

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!organizationName.trim()) {
      setError("Please enter your organization name");
      return;
    }

    setStep(2);
  };

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
      // Call the agency registration API
      const response = await fetch("/api/agency/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          organizationName,
          organizationType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // Sign in the user after successful registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Account created but sign in failed - redirect to sign in page
        router.push("/signin?message=Account created. Please sign in.");
        return;
      }

      // Redirect to agency dashboard
      router.push("/agency");
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
              Interpret<span className="text-teal-400">Reflect</span>
            </span>
          </a>
          <h1 className="text-2xl font-semibold text-slate-100 mb-2">
            Create Agency Account
          </h1>
          <p className="text-slate-400 text-sm">
            {step === 1
              ? "Tell us about your organization"
              : "Create your administrator account"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 1 ? "bg-teal-400 text-slate-950" : "bg-slate-700 text-slate-400"
          }`}>
            1
          </div>
          <div className={`w-12 h-1 ${step >= 2 ? "bg-teal-400" : "bg-slate-700"}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 2 ? "bg-teal-400 text-slate-950" : "bg-slate-700 text-slate-400"
          }`}>
            2
          </div>
        </div>

        {/* Sign Up Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          {step === 1 ? (
            <form onSubmit={handleNext} className="space-y-5">
              {/* Organization Name Field */}
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-slate-300 mb-2">
                  Organization Name
                </label>
                <input
                  id="organizationName"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                  placeholder="Acme Interpreting Services"
                />
              </div>

              {/* Organization Type Field */}
              <div>
                <label htmlFor="organizationType" className="block text-sm font-medium text-slate-300 mb-2">
                  Organization Type
                </label>
                <select
                  id="organizationType"
                  value={organizationType}
                  onChange={(e) => setOrganizationType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                >
                  <option value="agency">Interpreting Agency</option>
                  <option value="education">Educational Institution (ITP)</option>
                  <option value="government">Government Program</option>
                  <option value="nonprofit">Non-Profit Organization</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Next Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-teal-400 hover:bg-teal-300 text-slate-950 font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-950 shadow-lg shadow-teal-400/20"
              >
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-5">
              {/* Full Name Field */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-2">
                  Your Full Name
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
                <p className="text-xs text-slate-500 mt-1">You'll be the organization administrator</p>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Work Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                  placeholder="you@yourcompany.com"
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

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 px-4 border border-slate-700 text-slate-300 font-medium rounded-lg hover:bg-slate-800 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-teal-400 hover:bg-teal-300 text-slate-950 font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-400/20"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          )}

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Already have an agency account?{" "}
              <a
                href="/signin"
                className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
              >
                Sign in
              </a>
            </p>
          </div>

          {/* Interpreter Sign Up Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500">
              Individual interpreter?{" "}
              <a
                href="/signup"
                className="text-slate-400 hover:text-slate-300 transition-colors"
              >
                Sign up here
              </a>
            </p>
          </div>

          {/* Back to Home Link */}
          <div className="mt-4 text-center">
            <a href="/" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">
              Back to home
            </a>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 mb-3">Your data is secure</p>
          <div className="flex items-center justify-center gap-6 text-slate-600">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs">256-bit encryption</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs">SOC 2 compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
