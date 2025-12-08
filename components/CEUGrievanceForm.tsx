"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

type Certificate = {
  id: string;
  certificate_number: string;
  title: string;
  issued_at: string;
};

type GrievanceFormProps = {
  userId: string;
  onClose: () => void;
  onSuccess?: () => void;
  preSelectedCertificateId?: string;
};

const GRIEVANCE_TYPES = [
  { value: "certificate_error", label: "Certificate Error", description: "Incorrect information on my certificate" },
  { value: "ceu_not_received", label: "CEU Not Received", description: "I completed the module but didn't receive CEU credit" },
  { value: "content_complaint", label: "Content Complaint", description: "Issue with course content or presentation" },
  { value: "technical_issue", label: "Technical Issue", description: "Technical problems prevented completion" },
  { value: "other", label: "Other", description: "Other CEU-related concern" },
];

export default function CEUGrievanceForm({
  userId,
  onClose,
  onSuccess,
  preSelectedCertificateId,
}: GrievanceFormProps) {
  const [step, setStep] = useState<"type" | "details" | "submitted">("type");
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(true);

  const [formData, setFormData] = useState({
    grievance_type: "",
    certificate_id: preSelectedCertificateId || "",
    description: "",
    contact_preference: "email",
  });

  useEffect(() => {
    loadCertificates();
  }, [userId]);

  const loadCertificates = async () => {
    try {
      const { data } = await (supabase as any)
        .from("ceu_certificates")
        .select("id, certificate_number, title, issued_at")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("issued_at", { ascending: false });

      setCertificates((data as Certificate[]) || []);
    } catch (error) {
      console.error("Error loading certificates:", error);
    } finally {
      setLoadingCerts(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.grievance_type || !formData.description.trim()) return;
    setLoading(true);

    try {
      const { error } = await (supabase as any).from("ceu_grievances").insert({
        user_id: userId,
        grievance_type: formData.grievance_type,
        certificate_id: formData.certificate_id || null,
        description: formData.description.trim(),
        status: "open",
      });

      if (error) throw error;

      setStep("submitted");
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting grievance:", error);
      alert("Failed to submit grievance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Submit CEU Grievance</h2>
              <p className="text-sm text-slate-400 mt-0.5">Report an issue with your CEU credit</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Step: Select Type */}
            {step === "type" && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400 mb-4">What type of issue are you experiencing?</p>

                <div className="space-y-2">
                  {GRIEVANCE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setFormData({ ...formData, grievance_type: type.value });
                        setStep("details");
                      }}
                      className="w-full p-4 rounded-xl border border-slate-700 hover:border-teal-500/50 hover:bg-slate-800/50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 group-hover:bg-teal-500/20 flex items-center justify-center transition-colors">
                          {type.value === "certificate_error" && (
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          {type.value === "ceu_not_received" && (
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {type.value === "content_complaint" && (
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          )}
                          {type.value === "technical_issue" && (
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                          {type.value === "other" && (
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200 group-hover:text-teal-400 transition-colors">{type.label}</p>
                          <p className="text-xs text-slate-500">{type.description}</p>
                        </div>
                        <svg className="w-5 h-5 text-slate-600 ml-auto group-hover:text-teal-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step: Details */}
            {step === "details" && (
              <div className="space-y-5">
                <button
                  onClick={() => setStep("type")}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/30">
                  <p className="text-sm text-teal-400 font-medium">
                    {GRIEVANCE_TYPES.find((t) => t.value === formData.grievance_type)?.label}
                  </p>
                </div>

                {/* Certificate Selection */}
                {certificates.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Related Certificate (optional)
                    </label>
                    <select
                      value={formData.certificate_id}
                      onChange={(e) => setFormData({ ...formData, certificate_id: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">No specific certificate</option>
                      {certificates.map((cert) => (
                        <option key={cert.id} value={cert.id}>
                          {cert.certificate_number} - {cert.title} ({formatDate(cert.issued_at)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Describe the issue <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Please provide as much detail as possible..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Include relevant details such as dates, module names, and specific errors
                  </p>
                </div>

                {/* Info Notice */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400">
                    Your grievance will be reviewed within 2-3 business days. We'll contact you via email with updates and resolution.
                    For urgent matters, email{" "}
                    <a href="mailto:ceu@interpretreflect.com" className="text-teal-400 hover:underline">
                      ceu@interpretreflect.com
                    </a>
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.description.trim()}
                  className="w-full py-3 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Submitting..." : "Submit Grievance"}
                </button>
              </div>
            )}

            {/* Step: Submitted */}
            {step === "submitted" && (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Grievance Submitted</h3>
                <p className="text-sm text-slate-400 mb-6">
                  We've received your grievance and will review it within 2-3 business days.
                  You'll receive email updates on the status.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
