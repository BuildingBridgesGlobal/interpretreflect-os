"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

// US States for license selection
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
];

type CEUInfoGateProps = {
  userId: string;
  moduleId: string;
  moduleTitle: string;
  ceuValue: number;
  onComplete: (wantsCeu: boolean) => void;
  onCancel: () => void;
};

type CEUInfo = {
  fullName: string;
  ridMemberNumber: string;
  phone: string;
  certificationTypeSelection: "CMP" | "ACET" | "none" | "";
  licensedStates: string[];
};

type RetakeEligibility = {
  eligible: boolean;
  reason: string;
  existingCertificateDate: string | null;
  eligibleAfter: string | null;
};

export default function CEUInfoGate({
  userId,
  moduleId,
  moduleTitle,
  ceuValue,
  onComplete,
  onCancel,
}: CEUInfoGateProps) {
  const [step, setStep] = useState<"choice" | "form" | "already_earned">("choice");
  const [loading, setLoading] = useState(false);
  const [existingInfo, setExistingInfo] = useState<CEUInfo | null>(null);
  const [hasExistingInfo, setHasExistingInfo] = useState(false);
  const [retakeEligibility, setRetakeEligibility] = useState<RetakeEligibility | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  const [formData, setFormData] = useState<CEUInfo>({
    fullName: "",
    ridMemberNumber: "",
    phone: "",
    certificationTypeSelection: "",
    licensedStates: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CEUInfo, string>>>({});

  useEffect(() => {
    loadExistingInfo();
    checkRetakeEligibility();
  }, [userId, moduleId]);

  const loadExistingInfo = async () => {
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("full_name, rid_member_number, phone, certification_type, licensed_states, ceu_info_completed")
      .eq("id", userId)
      .single();

    if (profile) {
      const info: CEUInfo = {
        fullName: profile.full_name || "",
        ridMemberNumber: profile.rid_member_number || "",
        phone: profile.phone || "",
        certificationTypeSelection: profile.certification_type || "",
        licensedStates: profile.licensed_states || [],
      };
      setFormData(info);

      if (profile.ceu_info_completed) {
        setExistingInfo(info);
        setHasExistingInfo(true);
      }
    }
  };

  const checkRetakeEligibility = async () => {
    setCheckingEligibility(true);
    try {
      // Check for existing certificate for this module within 3 years
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

      const { data: existingCert } = await (supabase as any)
        .from("ceu_certificates")
        .select("id, issued_at, certificate_number")
        .eq("user_id", userId)
        .eq("module_id", moduleId)
        .eq("status", "active")
        .order("issued_at", { ascending: false })
        .limit(1)
        .single();

      if (existingCert) {
        const issuedDate = new Date(existingCert.issued_at);
        const eligibleAfterDate = new Date(issuedDate);
        eligibleAfterDate.setFullYear(eligibleAfterDate.getFullYear() + 3);

        if (issuedDate > threeYearsAgo) {
          // Not eligible - earned within last 3 years
          setRetakeEligibility({
            eligible: false,
            reason: "You earned CEU credit for this module within the last 3 years.",
            existingCertificateDate: issuedDate.toISOString(),
            eligibleAfter: eligibleAfterDate.toISOString(),
          });
          setStep("already_earned");
        } else {
          // Eligible - more than 3 years ago
          setRetakeEligibility({
            eligible: true,
            reason: "More than 3 years since last certificate - eligible for new CEU.",
            existingCertificateDate: issuedDate.toISOString(),
            eligibleAfter: null,
          });
        }
      } else {
        // No existing certificate
        setRetakeEligibility({
          eligible: true,
          reason: "No previous certificate for this module.",
          existingCertificateDate: null,
          eligibleAfter: null,
        });
      }
    } catch (err) {
      // On error, assume eligible (fail open for better UX)
      console.error("Error checking retake eligibility:", err);
      setRetakeEligibility({
        eligible: true,
        reason: "Eligibility check unavailable.",
        existingCertificateDate: null,
        eligibleAfter: null,
      });
    } finally {
      setCheckingEligibility(false);
    }
  };

  const validateRIDNumber = (value: string): boolean => {
    if (!value) return true; // Optional
    // RID numbers are typically 5-6 digits
    return /^\d{4,6}$/.test(value.replace(/\s/g, ""));
  };

  const validatePhone = (value: string): boolean => {
    if (!value) return true; // Optional but recommended
    // Basic phone validation
    const cleaned = value.replace(/\D/g, "");
    return cleaned.length >= 10;
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CEUInfo, string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full legal name is required";
    }

    if (formData.ridMemberNumber && !validateRIDNumber(formData.ridMemberNumber)) {
      newErrors.ridMemberNumber = "Please enter a valid RID member number (4-6 digits)";
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.certificationTypeSelection) {
      newErrors.certificationTypeSelection = "Please select your certification type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      // Using type assertion for new columns not yet in generated types
      const { error } = await (supabase as any)
        .from("profiles")
        .update({
          full_name: formData.fullName.trim(),
          rid_member_number: formData.ridMemberNumber.trim() || null,
          phone: formData.phone.trim() || null,
          certification_type: formData.certificationTypeSelection || null,
          licensed_states: formData.licensedStates.length > 0 ? formData.licensedStates : null,
          ceu_info_completed: true,
          ceu_info_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      onComplete(true);
    } catch (error) {
      console.error("Error saving CEU info:", error);
      setErrors({ fullName: "Failed to save. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipCEU = () => {
    onComplete(false);
  };

  const toggleState = (state: string) => {
    setFormData((prev) => ({
      ...prev,
      licensedStates: prev.licensedStates.includes(state)
        ? prev.licensedStates.filter((s) => s !== state)
        : [...prev.licensedStates, state],
    }));
  };

  // Loading state while checking eligibility
  if (checkingEligibility) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-xl text-center"
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-teal-500/30 border-t-teal-500 animate-spin" />
          <p className="text-slate-400">Checking eligibility...</p>
        </motion.div>
      </motion.div>
    );
  }

  // User already earned CEU within 3 years - show info and option to proceed without CEU
  if (step === "already_earned" && retakeEligibility) {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl"
        >
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">CEU Already Earned</h2>
            <p className="text-slate-400 text-sm">
              You've already received CEU credit for this module
            </p>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="text-amber-200 mb-2">
                  Per RID policy, CEU credit can only be earned once every 3 years for the same content.
                </p>
                {retakeEligibility.existingCertificateDate && (
                  <p className="text-slate-400">
                    <span className="text-slate-300">Previous certificate:</span>{" "}
                    {formatDate(retakeEligibility.existingCertificateDate)}
                  </p>
                )}
                {retakeEligibility.eligibleAfter && (
                  <p className="text-slate-400">
                    <span className="text-slate-300">Eligible again:</span>{" "}
                    {formatDate(retakeEligibility.eligibleAfter)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 mb-6">
            <h3 className="text-sm font-medium text-slate-200 mb-2">What you can do:</h3>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Take the quiz to refresh your knowledge</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>View your existing certificate in your CEU Dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Explore other modules for additional CEUs</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSkipCEU}
              className="w-full py-3 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
            >
              Take Quiz Without CEU Credit
            </button>
            <a
              href="/ceu"
              className="w-full py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View My Certificates
            </a>
            <button
              onClick={onCancel}
              className="w-full py-2 text-slate-500 text-sm hover:text-slate-400 transition-colors"
            >
              Go back
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // If user already has CEU info, show streamlined confirm
  if (hasExistingInfo && step === "choice") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl"
        >
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-teal-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Ready for CEU Quiz</h2>
            <p className="text-slate-400 text-sm">
              Complete the quiz to earn <span className="text-teal-400 font-medium">{ceuValue} CEUs</span>
            </p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 mb-6">
            <p className="text-xs text-slate-500 mb-2">Your CEU information</p>
            <p className="text-slate-200 font-medium">{existingInfo?.fullName}</p>
            {existingInfo?.ridMemberNumber && (
              <p className="text-slate-400 text-sm">RID #{existingInfo.ridMemberNumber}</p>
            )}
            <button
              onClick={() => setStep("form")}
              className="text-teal-400 text-xs mt-2 hover:underline"
            >
              Edit my information
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onComplete(true)}
              className="w-full py-3 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
            >
              Continue to Quiz
            </button>
            <button
              onClick={handleSkipCEU}
              className="w-full py-2 text-slate-400 text-sm hover:text-slate-300 transition-colors"
            >
              Skip CEU credit for this module
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Initial choice: Want CEUs or not
  if (step === "choice") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl"
        >
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500/20 to-violet-500/20 border border-teal-500/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">CEU Quiz</h2>
            <p className="text-slate-400 text-sm">
              This quiz is worth <span className="text-teal-400 font-medium">{ceuValue} Professional Studies CEUs</span>
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setStep("form")}
              className="w-full py-4 px-4 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-teal-500 flex items-center justify-center group-hover:bg-teal-500 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="text-slate-100 font-medium">Yes, I want CEUs</p>
                  <p className="text-slate-400 text-xs">I'll provide my RID information</p>
                </div>
              </div>
            </button>

            <button
              onClick={handleSkipCEU}
              className="w-full py-4 px-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-slate-600 group-hover:border-slate-500 transition-colors" />
                <div>
                  <p className="text-slate-300">No, just test my knowledge</p>
                  <p className="text-slate-500 text-xs">Skip CEU credit for this module</p>
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={onCancel}
            className="w-full mt-4 py-2 text-slate-500 text-sm hover:text-slate-400 transition-colors"
          >
            Go back
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // Full CEU info form
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl my-8"
      >
        <div className="mb-6">
          <button
            onClick={() => setStep("choice")}
            className="text-slate-400 hover:text-slate-300 text-sm flex items-center gap-1 mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h2 className="text-xl font-semibold text-slate-100 mb-1">CEU Information</h2>
          <p className="text-slate-400 text-sm">
            This information will appear on your CEU certificate and be submitted to RID.
          </p>
        </div>

        <div className="space-y-5">
          {/* Full Legal Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Full Legal Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="As it appears on your RID certification"
              className={`w-full px-4 py-2.5 rounded-lg border ${
                errors.fullName ? "border-rose-500" : "border-slate-700"
              } bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500`}
            />
            {errors.fullName && <p className="text-rose-400 text-xs mt-1">{errors.fullName}</p>}
          </div>

          {/* RID Member Number */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              RID Member Number
            </label>
            <input
              type="text"
              value={formData.ridMemberNumber}
              onChange={(e) => setFormData({ ...formData, ridMemberNumber: e.target.value })}
              placeholder="Leave blank if not certified"
              className={`w-full px-4 py-2.5 rounded-lg border ${
                errors.ridMemberNumber ? "border-rose-500" : "border-slate-700"
              } bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500`}
            />
            {errors.ridMemberNumber ? (
              <p className="text-rose-400 text-xs mt-1">{errors.ridMemberNumber}</p>
            ) : (
              <p className="text-slate-500 text-xs mt-1">Find your number at rid.org/member-portal</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
              className={`w-full px-4 py-2.5 rounded-lg border ${
                errors.phone ? "border-rose-500" : "border-slate-700"
              } bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500`}
            />
            {errors.phone && <p className="text-rose-400 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Certification Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Certification Type <span className="text-rose-400">*</span>
            </label>
            <div className="space-y-2">
              {[
                { value: "CMP", label: "NIC/NAD/RID Certified (CMP eligible)" },
                { value: "ACET", label: "Not yet certified (ACET eligible)" },
                { value: "none", label: "Not seeking RID certification" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, certificationTypeSelection: option.value as "CMP" | "ACET" | "none" })}
                  className={`w-full py-3 px-4 rounded-lg border text-left transition-colors ${
                    formData.certificationTypeSelection === option.value
                      ? "border-teal-500 bg-teal-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formData.certificationTypeSelection === option.value
                          ? "border-teal-500 bg-teal-500"
                          : "border-slate-500"
                      }`}
                    >
                      {formData.certificationTypeSelection === option.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                      )}
                    </div>
                    <span className={formData.certificationTypeSelection === option.value ? "text-slate-100" : "text-slate-300"}>
                      {option.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {errors.certificationTypeSelection && (
              <p className="text-rose-400 text-xs mt-1">{errors.certificationTypeSelection}</p>
            )}
          </div>

          {/* State Licenses */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              State(s) Where Licensed
            </label>
            <p className="text-slate-500 text-xs mb-3">Select all that apply (optional)</p>
            <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-2 rounded-lg border border-slate-700 bg-slate-800/50">
              {US_STATES.map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => toggleState(state)}
                  className={`py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                    formData.licensedStates.includes(state)
                      ? "bg-teal-500 text-slate-900"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
            {formData.licensedStates.length > 0 && (
              <p className="text-teal-400 text-xs mt-2">
                Selected: {formData.licensedStates.join(", ")}
              </p>
            )}
          </div>

          {/* Acknowledgment */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <p className="text-slate-400 text-xs">
              By continuing, I understand I must complete 100% of the content and pass the assessment to receive CEUs.
              My information will be submitted to RID on my behalf.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue to Quiz"}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2 text-slate-500 text-sm hover:text-slate-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
