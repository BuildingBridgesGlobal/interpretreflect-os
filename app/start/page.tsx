"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function StartPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlOrgId = searchParams.get("org");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Organization state (simplified - only via invite link)
  const [organizationId, setOrganizationId] = useState<string | null>(urlOrgId);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(!!urlOrgId);

  // Check if user is already signed in AND load organization name if invite link
  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkUser();

    // Load organization name if org ID is present (invite link from agency)
    const loadOrganization = async () => {
      if (urlOrgId && supabase) {
        setLoadingOrg(true);
        try {
          const { data } = await supabase
            .from("organizations")
            .select("id, name")
            .eq("id", urlOrgId)
            .single();

          if (data) {
            setOrganizationId(data.id);
            setOrganizationName(data.name);
          } else {
            // Invalid org ID in URL - clear it
            setOrganizationId(null);
          }
        } catch {
          setOrganizationId(null);
        }
        setLoadingOrg(false);
      }
    };
    loadOrganization();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.push("/dashboard");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, urlOrgId]);

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

      // If user was invited via organization link, link them to the organization
      // Use the server API for reliable organization membership creation
      if (data?.user && organizationId) {
        try {
          const response = await fetch("/api/interpreter/join-org", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: data.user.id,
              organizationId: organizationId,
            }),
          });

          if (!response.ok) {
            const result = await response.json();
            console.error("Failed to join organization:", result.error);
            // Don't fail signup - user was created, they just weren't linked
            // They can be added manually by agency admin
          }
        } catch (joinError) {
          console.error("Join org API error:", joinError);
          // Continue with signup even if org linking fails
        }
      }

      // Check if email confirmation is required
      if (data?.user && !data?.session) {
        setUserEmail(email);
        setEmailSent(true);
        setLoading(false);
        return;
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
      setLoading(false);
    } catch {
      setError("Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  // Email confirmation screen
  if (emailSent) {
    return (
      <div className="min-h-screen w-full bg-slate-950 relative overflow-hidden flex items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.12)_2px,transparent_2px),linear-gradient(90deg,rgba(6,182,212,0.12)_2px,transparent_2px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)]" />

        <div className="relative z-10 w-full max-w-md px-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
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
                Click the link in the email to verify your account.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 mt-0.5">*</span>
                  <span>The link expires in 24 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 mt-0.5">*</span>
                  <span>Check your spam folder if you don&apos;t see it</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <p className="text-sm text-slate-400 mb-3">
                Didn&apos;t receive the email?
              </p>
              <button
                onClick={async () => {
                  setLoading(true);
                  const { error: resendError } = await supabase.auth.resend({
                    type: 'signup',
                    email: userEmail,
                  });
                  setLoading(false);
                  if (resendError) {
                    setError(resendError.message);
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

            <div className="mt-6">
              <a href="/signin" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">
                Back to sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 relative overflow-hidden flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.12)_2px,transparent_2px),linear-gradient(90deg,rgba(6,182,212,0.12)_2px,transparent_2px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)]" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl font-semibold text-slate-50">
              Interpreter<span className="text-teal-400">OS</span>
            </span>
          </a>
          <h1 className="text-2xl font-semibold text-slate-100 mb-2">
            {organizationName ? "Join your team" : "Start your 7-day free trial"}
          </h1>
          <p className="text-slate-400 text-sm">
            {organizationName ? "Create your account to get started" : "No credit card required"}
          </p>
        </div>

        {/* Organization Invite Banner - when org is linked via invite link */}
        {loadingOrg ? (
          <div className="mb-6 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-slate-700 rounded animate-pulse w-32 mb-2" />
                <div className="h-5 bg-slate-700 rounded animate-pulse w-48" />
              </div>
            </div>
          </div>
        ) : organizationName && (
          <div className="mb-6 rounded-xl border border-violet-500/50 bg-violet-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-300 mb-1">
                  You&apos;ve been invited to join
                </p>
                <p className="text-base font-bold text-slate-100">{organizationName}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Your account will be linked to this agency
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sign Up Form */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSignUp} className="space-y-5">
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

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-teal-400 hover:bg-teal-300 text-slate-950 font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-400/20"
            >
              {loading
                ? "Creating account..."
                : organizationName
                  ? "Join team & start"
                  : "Create account & start trial"}
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

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <a href="/" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">
              Back to home
            </a>
          </div>
        </div>

        {/* Trust Indicators */}
        {!organizationName && (
          <div className="mt-8 text-center space-y-2 text-xs text-slate-500">
            <p>7-day free trial - No credit card required</p>
            <p>Cancel anytime - Your data stays private</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StartPageLoading() {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400">Loading...</div>
    </div>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={<StartPageLoading />}>
      <StartPageContent />
    </Suspense>
  );
}
