"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

type CEUEvaluationProps = {
  userId: string;
  moduleId: string;
  moduleTitle: string;
  progressId: string;
  ceuValue: number;
  accessToken?: string;
  onComplete: (certificate?: any) => void;
  onBack: () => void;
};

type EvaluationData = {
  q1ObjectivesClear: number;
  q2ContentRelevant: number;
  q3ApplicableToWork: number;
  q4PresenterEffective: number;
  q5MostValuable: string;
  q6Suggestions: string;
};

const RATING_OPTIONS = [
  { value: 5, label: "Strongly Agree" },
  { value: 4, label: "Agree" },
  { value: 3, label: "Neutral" },
  { value: 2, label: "Disagree" },
  { value: 1, label: "Strongly Disagree" },
];

export default function CEUEvaluation({
  userId,
  moduleId,
  moduleTitle,
  progressId,
  ceuValue,
  accessToken,
  onComplete,
  onBack,
}: CEUEvaluationProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EvaluationData>({
    q1ObjectivesClear: 0,
    q2ContentRelevant: 0,
    q3ApplicableToWork: 0,
    q4PresenterEffective: 0,
    q5MostValuable: "",
    q6Suggestions: "",
  });
  const [error, setError] = useState("");

  const isComplete =
    formData.q1ObjectivesClear > 0 &&
    formData.q2ContentRelevant > 0 &&
    formData.q3ApplicableToWork > 0 &&
    formData.q4PresenterEffective > 0;

  const handleSubmit = async () => {
    if (!isComplete) {
      setError("Please answer all required questions");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Insert evaluation (using type assertion for new table not yet in generated types)
      const { data: evaluation, error: evalError } = await (supabase as any)
        .from("ceu_evaluations")
        .insert({
          user_id: userId,
          module_id: moduleId,
          progress_id: progressId,
          q1_objectives_clear: formData.q1ObjectivesClear,
          q2_content_relevant: formData.q2ContentRelevant,
          q3_applicable_to_work: formData.q3ApplicableToWork,
          q4_presenter_effective: formData.q4PresenterEffective,
          q5_most_valuable: formData.q5MostValuable.trim() || null,
          q6_suggestions: formData.q6Suggestions.trim() || null,
        })
        .select()
        .single();

      if (evalError) throw evalError;

      // Update progress to mark evaluation complete (using type assertion for new columns)
      const { error: progressError } = await (supabase as any)
        .from("user_module_progress")
        .update({
          evaluation_completed: true,
          evaluation_id: evaluation.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", progressId);

      if (progressError) throw progressError;

      // NOW issue the certificate (RID requires evaluation before certificate)
      const certResponse = await fetch("/api/ceu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          action: "issue_certificate_after_evaluation",
          module_id: moduleId,
          evaluation_id: evaluation.id,
        }),
      });

      const certData = await certResponse.json();

      if (!certResponse.ok || !certData.success) {
        console.error("Certificate issuance failed:", certData.error);
        setError("Evaluation saved, but certificate generation failed. Please contact support.");
        return;
      }

      onComplete(certData.certificate);
    } catch (err) {
      console.error("Error submitting evaluation:", err);
      setError("Failed to submit evaluation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const RatingQuestion = ({
    question,
    value,
    onChange,
    questionNumber,
  }: {
    question: string;
    value: number;
    onChange: (val: number) => void;
    questionNumber: number;
  }) => (
    <div className="space-y-3">
      <p className="text-slate-200 font-medium">
        {questionNumber}. {question} <span className="text-rose-400">*</span>
      </p>
      <div className="grid grid-cols-5 gap-2">
        {RATING_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`py-2.5 px-2 rounded-lg border text-xs font-medium transition-all ${
              value === option.value
                ? "border-teal-500 bg-teal-500/20 text-teal-300"
                : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-slate-100 mb-2">Quiz Complete!</h2>
        <p className="text-slate-400">
          One more step to earn your <span className="text-teal-400 font-medium">{ceuValue} CEU</span> certificate
        </p>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-slate-100 mb-1">Workshop Evaluation</h3>
          <p className="text-slate-500 text-sm">
            Required by RID for all CEU-eligible activities. Takes about 2 minutes.
          </p>
        </div>

        <div className="space-y-6">
          <RatingQuestion
            questionNumber={1}
            question="The learning objectives were clearly stated and met."
            value={formData.q1ObjectivesClear}
            onChange={(val) => setFormData({ ...formData, q1ObjectivesClear: val })}
          />

          <RatingQuestion
            questionNumber={2}
            question="The content was relevant to my interpreting practice."
            value={formData.q2ContentRelevant}
            onChange={(val) => setFormData({ ...formData, q2ContentRelevant: val })}
          />

          <RatingQuestion
            questionNumber={3}
            question="I can apply what I learned to my work."
            value={formData.q3ApplicableToWork}
            onChange={(val) => setFormData({ ...formData, q3ApplicableToWork: val })}
          />

          <RatingQuestion
            questionNumber={4}
            question="The presenter/content was knowledgeable and effective."
            value={formData.q4PresenterEffective}
            onChange={(val) => setFormData({ ...formData, q4PresenterEffective: val })}
          />

          <div className="pt-4 border-t border-slate-800">
            <div className="space-y-4">
              <div>
                <label className="block text-slate-200 font-medium mb-2">
                  5. What was most valuable about this workshop?
                </label>
                <textarea
                  value={formData.q5MostValuable}
                  onChange={(e) => setFormData({ ...formData, q5MostValuable: e.target.value })}
                  placeholder="Share what stood out to you..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-medium mb-2">
                  6. Any suggestions for improvement?
                </label>
                <textarea
                  value={formData.q6Suggestions}
                  onChange={(e) => setFormData({ ...formData, q6Suggestions: e.target.value })}
                  placeholder="We'd love your feedback..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !isComplete}
            className="flex-1 py-3 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit & Get Certificate"}
          </button>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-6 text-center">
        <p className="text-slate-500 text-xs">
          After submitting, your certificate will be generated automatically.
        </p>
      </div>
    </motion.div>
  );
}
