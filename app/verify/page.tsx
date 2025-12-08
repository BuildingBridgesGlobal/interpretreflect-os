"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function VerifyPage() {
  const router = useRouter();
  const [certificateNumber, setCertificateNumber] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = certificateNumber.trim();
    if (!trimmed) {
      setError("Please enter a certificate number");
      return;
    }

    // Navigate to verification page
    router.push(`/verify/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">IR</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-100">InterpretReflect</h1>
              <p className="text-sm text-slate-400">Certificate Verification</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-teal-500/20 to-violet-500/20 border border-teal-500/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-slate-100 mb-4">Verify a Certificate</h1>
          <p className="text-slate-400 max-w-md mx-auto">
            Enter a certificate number to verify its authenticity and view the details of CEU credits earned.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-slate-700 bg-slate-900/80 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="certificate" className="block text-sm font-medium text-slate-300 mb-2">
                Certificate Number
              </label>
              <input
                id="certificate"
                type="text"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="IR-2025-000001"
                className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-lg text-center"
              />
              {error && (
                <p className="mt-2 text-sm text-rose-400">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
            >
              Verify Certificate
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-sm text-slate-400 text-center">
              Certificate numbers are found on the certificate document in the format{" "}
              <span className="font-mono text-slate-300">IR-YYYY-NNNNNN</span>
            </p>
          </div>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 grid md:grid-cols-2 gap-4"
        >
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-slate-100 font-medium mb-2">RID Approved</h3>
            <p className="text-sm text-slate-400">
              All certificates are issued by InterpretReflect, an approved RID Sponsor (#2309).
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-slate-100 font-medium mb-2">Secure Verification</h3>
            <p className="text-sm text-slate-400">
              Each certificate has a unique number that can be verified at any time.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <p className="text-center text-sm text-slate-500">
            InterpretReflect - RID Approved Sponsor #2309
          </p>
        </div>
      </footer>
    </div>
  );
}
