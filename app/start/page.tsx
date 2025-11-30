"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function StartPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Check if user is already signed in
  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User is already signed in, redirect to dashboard
        router.push("/dashboard");
      }
    };
    checkUser();

    // Listen for auth state changes (like email confirmation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // User just confirmed their email, redirect to dashboard
          router.push("/dashboard");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!supabase) {
      setError("Authentication is not configured. Please set up Supabase.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (data?.user && !data?.session) {
        // Email confirmation is enabled - show confirmation screen
        setUserEmail(email);
        setEmailSent(true);
        setLoading(false);
        return;
      }

      // Success! Session created immediately (no email confirmation required)
      // Redirect to dashboard where they can upgrade
      router.push("/dashboard");
      setLoading(false);
    } catch (err: any) {
      setError("Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  // Email confirmation screen
  if (emailSent) {
    return (
      <div className="min-h-screen w-full bg-slate-950 relative overflow-hidden flex items-center justify-center">
        {/* AI Motif Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-3xl" />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.12)_2px,transparent_2px),linear-gradient(90deg,rgba(6,182,212,0.12)_2px,transparent_2px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)]" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-md px-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
            {/* Email Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-teal-400/10 border border-teal-400/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h1 className="text-2xl font-semibold text-slate-100 mb-3">
              Check your email
            </h1>

            <p className="text-slate-300 mb-2">
              We sent a confirmation link to:
            </p>

            <p className="text-teal-400 font-medium mb-6">
              {userEmail}
            </p>

            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-slate-300 mb-3">
                Click the link in the email to verify your account and continue to onboarding.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 mt-0.5">•</span>
                  <span>The link expires in 24 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 mt-0.5">•</span>
                  <span>Check your spam folder if you don't see it</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 mt-0.5">•</span>
                  <span>After clicking the link, you'll be redirected to complete your setup</span>
                </li>
              </ul>
            </div>

            {/* Resend option */}
            <div className="pt-4 border-t border-slate-800">
              <p className="text-sm text-slate-400 mb-3">
                Didn't receive the email?
              </p>
              <button
                onClick={async () => {
                  setLoading(true);
                  const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: userEmail,
                  });
                  setLoading(false);
                  if (error) {
                    setError(error.message);
                  } else {
                    setError(null);
                  }
                }}
                disabled={loading}
                className="text-sm text-teal-400 hover:text-teal-300 font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Sending..." : "Resend confirmation email"}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Back to sign in */}
            <div className="mt-6">
              <a href="/signin" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">
                ← Back to sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 relative overflow-hidden flex items-center justify-center">
      {/* AI Motif Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.12)_2px,transparent_2px),linear-gradient(90deg,rgba(6,182,212,0.12)_2px,transparent_2px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl font-semibold text-slate-50">
              Interpreter<span className="text-teal-400">OS</span>
            </span>
          </a>
          <h1 className="text-2xl font-semibold text-slate-100 mb-2">
            Start your 7-day free trial
          </h1>
          <p className="text-slate-400 text-sm">
            No credit card required • Cancel anytime
          </p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSignUp} className="space-y-5">
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
                minLength={6}
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                placeholder="At least 6 characters"
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
              {loading ? "Creating account..." : "Create account & start trial"}
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

        {/* Trust Indicators */}
        <div className="mt-8 text-center space-y-2 text-xs text-slate-500">
          <p>✓ 7-day free trial • No credit card required</p>
          <p>✓ Cancel anytime • Your data stays private</p>
        </div>
      </div>
    </div>
  );
}
