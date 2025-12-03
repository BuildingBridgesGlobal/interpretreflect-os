"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AgencySignUpPage() {
  // Optionally auto-redirect after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "https://lunacal.ai/interpretreflect/agency-discovery-call-interpretreflect";
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-lg px-6 text-center">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl font-semibold text-slate-50">
              Interpret<span className="text-teal-400">Reflect</span>
            </span>
          </Link>
        </div>

        {/* Content Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-slate-100 mb-3">
            Agency Accounts Require a Discovery Call
          </h1>

          <p className="text-slate-400 text-sm mb-6">
            Every agency has unique needs. We customize InterpretReflect for your organization's size,
            feature requirements, and workflow. Schedule a quick 30-minute call to discuss your needs.
          </p>

          <div className="space-y-4">
            <a
              href="https://lunacal.ai/interpretreflect/agency-discovery-call-interpretreflect"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 px-4 bg-teal-400 hover:bg-teal-300 text-slate-950 font-semibold rounded-lg transition-all shadow-lg shadow-teal-400/20"
            >
              Schedule Discovery Call
            </a>

            <Link
              href="/for-agencies"
              className="block w-full py-3 px-4 border border-slate-700 text-slate-300 font-medium rounded-lg hover:bg-slate-800 transition-all"
            >
              Learn More About Agency Features
            </Link>
          </div>

          <p className="text-xs text-slate-500 mt-6">
            Redirecting to scheduling page in 5 seconds...
          </p>
        </div>

        {/* Contact Info */}
        <div className="mt-8">
          <p className="text-sm text-slate-500">
            Questions? Email us at{" "}
            <a href="mailto:info@interpretreflect.com" className="text-teal-400 hover:text-teal-300">
              info@interpretreflect.com
            </a>
          </p>
        </div>

        {/* Back Link */}
        <div className="mt-4">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">
            Back to home
          </Link>
        </div>

        {/* Trust Signals */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-6 text-slate-600">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs">SDVOSB Certified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-xs">RID CEU Sponsor #2309</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
