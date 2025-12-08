"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

type VerificationResult = {
  valid: boolean;
  verified?: boolean;
  status?: string;
  error?: string;
  message?: string;
  certificate?: {
    certificate_number: string;
    title: string;
    description: string;
    ceu_value: number;
    rid_category: string;
    learning_objectives: string[];
    assessment_passed: boolean;
    completed_at: string;
    issued_at: string;
    issued_by: string;
    sponsor_number: string;
    status: string;
  };
  holder?: {
    name: string;
    rid_member_number: string | null;
  };
  verification?: {
    verified_at: string;
    verification_url: string;
    message: string;
  };
};

export default function VerifyCertificatePage() {
  const params = useParams();
  const certificateId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (certificateId) {
      verifyCertificate();
    }
  }, [certificateId]);

  const verifyCertificate = async () => {
    try {
      const response = await fetch(`/api/verify-certificate/${certificateId}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        valid: false,
        error: "Verification failed",
        message: "Unable to verify certificate. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-teal-500/30 border-t-teal-500 animate-spin" />
          <p className="text-slate-400">Verifying certificate...</p>
        </motion.div>
      </div>
    );
  }

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

      <main className="container mx-auto max-w-4xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {result?.valid && result.certificate ? (
            // Valid certificate display
            <div className="space-y-6">
              {/* Verification Badge */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-500/20 border border-emerald-500/40"
                >
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-emerald-400 font-medium">Verified Certificate</span>
                </motion.div>
              </div>

              {/* Certificate Card */}
              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 overflow-hidden">
                {/* Certificate Header */}
                <div className="p-8 border-b border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-sm text-teal-400 mb-2">Certificate of Completion</p>
                      <h2 className="text-2xl font-semibold text-slate-100">{result.certificate.title}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">Certificate Number</p>
                      <p className="font-mono text-slate-300">{result.certificate.certificate_number}</p>
                    </div>
                  </div>

                  {result.certificate.description && (
                    <p className="text-slate-400">{result.certificate.description}</p>
                  )}
                </div>

                {/* Certificate Details */}
                <div className="p-8 grid md:grid-cols-2 gap-8">
                  {/* Holder Info */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-3">Issued To</h3>
                    <p className="text-lg text-slate-100">{result.holder?.name}</p>
                    {result.holder?.rid_member_number && (
                      <p className="text-sm text-slate-400 mt-1">RID Member #{result.holder.rid_member_number}</p>
                    )}
                  </div>

                  {/* CEU Info */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-3">CEU Credits</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-teal-400">{result.certificate.ceu_value}</span>
                      <span className="text-slate-400">CEU</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{result.certificate.rid_category}</p>
                  </div>

                  {/* Dates */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-3">Completion Date</h3>
                    <p className="text-slate-100">{formatDate(result.certificate.completed_at)}</p>
                  </div>

                  {/* Issuer */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-3">Issued By</h3>
                    <p className="text-slate-100">{result.certificate.issued_by}</p>
                    <p className="text-sm text-slate-500">RID Sponsor #{result.certificate.sponsor_number}</p>
                  </div>
                </div>

                {/* Learning Objectives */}
                {result.certificate.learning_objectives && result.certificate.learning_objectives.length > 0 && (
                  <div className="p-8 border-t border-slate-700">
                    <h3 className="text-sm font-medium text-slate-400 mb-4">Learning Objectives Achieved</h3>
                    <ul className="space-y-3">
                      {result.certificate.learning_objectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-3 text-slate-300 text-sm">
                          <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Verification Footer */}
                <div className="p-6 bg-slate-800/50 border-t border-slate-700">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Verified {formatDate(result.verification?.verified_at || new Date().toISOString())}</span>
                    </div>
                    <p className="text-emerald-400">{result.verification?.message}</p>
                  </div>
                </div>
              </div>

              {/* RID Notice */}
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-slate-100 font-medium mb-1">About RID CEUs</h4>
                    <p className="text-sm text-slate-400">
                      This certificate was issued by InterpretReflect, an approved RID Sponsor (#2309).
                      CEU credits earned through InterpretReflect may be applied toward RID certification maintenance requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Invalid or not found certificate
            <div className="text-center py-16">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center"
              >
                <svg className="w-10 h-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </motion.div>

              <h2 className="text-2xl font-semibold text-slate-100 mb-2">
                {result?.status === "revoked" ? "Certificate Revoked" : "Certificate Not Found"}
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                {result?.message || "We could not find a certificate with the provided ID. Please check the certificate number and try again."}
              </p>

              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 max-w-md mx-auto">
                <p className="text-sm text-slate-400 mb-4">Looking for a certificate number?</p>
                <p className="text-sm text-slate-500">
                  Certificate numbers are in the format <span className="font-mono text-slate-300">IR-YYYY-NNNNNN</span> (e.g., IR-2025-000001) and can be found on the certificate itself.
                </p>
              </div>
            </div>
          )}
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
