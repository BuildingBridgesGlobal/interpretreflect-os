"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CertificatePDF from "./CertificatePDF";

type AssessmentQuestion = {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correct_answer: string;
  explanation: string;
};

type AssessmentResult = {
  success: boolean;
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  passThreshold: number;
  attemptNumber: number;
  feedback: {
    question_id: string;
    question: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
  }[];
  certificate?: {
    id: string;
    certificate_number: string;
    ceu_value: number;
    rid_category?: string;
    issued_at?: string;
  };
  message: string;
};

type Props = {
  moduleId: string;
  moduleTitle: string;
  ceuValue: number;
  questions: AssessmentQuestion[];
  passThreshold: number;
  onComplete: (passed: boolean, certificate?: any) => void;
  onBack: () => void;
  accessToken?: string;
};

export default function AssessmentQuiz({
  moduleId,
  moduleTitle,
  ceuValue,
  questions,
  passThreshold,
  onComplete,
  onBack,
  accessToken,
}: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [startedAt] = useState(new Date().toISOString());

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  const selectAnswer = (questionId: string, answerId: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const submitAssessment = async () => {
    if (!allAnswered || submitting) return;

    setSubmitting(true);

    try {
      const response = await fetch("/api/ceu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await getToken()) || ""}`,
        },
        body: JSON.stringify({
          action: "submit_assessment",
          module_id: moduleId,
          answers,
          started_at: startedAt,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        setSubmitted(true);
      } else {
        console.error("Assessment submission failed:", data.error);
        alert("Failed to submit assessment. Please try again.");
      }
    } catch (error) {
      console.error("Assessment submission error:", error);
      alert("Failed to submit assessment. Please try again.");
    }

    setSubmitting(false);
  };

  const getToken = async () => {
    // Get the session token from Supabase
    const { supabase } = await import("@/lib/supabaseClient");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const retakeAssessment = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setSubmitted(false);
    setResult(null);
    setShowReview(false);
  };

  // Results View
  if (submitted && result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Result Header */}
        <div className="text-center mb-8">
          {result.passed ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-emerald-400 mb-2">
                Congratulations!
              </h2>
              <p className="text-slate-300">{result.message}</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-amber-400 mb-2">
                Keep Learning
              </h2>
              <p className="text-slate-300">{result.message}</p>
            </motion.div>
          )}
        </div>

        {/* Score Card */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400">Your Score</span>
            <span
              className={`text-3xl font-bold ${
                result.passed ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {result.score}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.score}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-3 rounded-full ${
                result.passed ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">
              {result.correctCount} of {result.totalQuestions} correct
            </span>
            <span className="text-slate-500">
              Pass threshold: {result.passThreshold}%
            </span>
          </div>
        </div>

        {/* Certificate Info (if passed) */}
        {result.passed && result.certificate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-teal-500/10 rounded-xl border border-teal-500/30 p-6 mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-teal-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-teal-400 mb-1">
                  CEU Certificate Issued
                </h3>
                <p className="text-slate-300 text-sm mb-2">
                  Certificate #{result.certificate.certificate_number}
                </p>
                <p className="text-slate-400 text-sm mb-3">
                  You earned{" "}
                  <span className="text-teal-400 font-medium">
                    {result.certificate.ceu_value} CEU
                  </span>{" "}
                  in Professional Studies
                </p>
                <button
                  onClick={() => setShowCertificate(true)}
                  className="px-4 py-2 rounded-lg bg-teal-500/20 border border-teal-500/50 text-teal-400 text-sm font-medium hover:bg-teal-500/30 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View & Download Certificate
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Certificate Modal */}
        <AnimatePresence>
          {showCertificate && result?.certificate && (
            <CertificatePDF
              certificate={{
                ...result.certificate,
                title: moduleTitle,
                assessment_score: result.score,
                rid_category: result.certificate.rid_category || "Professional Studies",
                issued_at: result.certificate.issued_at || new Date().toISOString(),
              }}
              onClose={() => setShowCertificate(false)}
              accessToken={accessToken}
            />
          )}
        </AnimatePresence>

        {/* Review Toggle */}
        <button
          onClick={() => setShowReview(!showReview)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 transition-colors mb-4"
        >
          <span>Review Your Answers</span>
          <svg
            className={`w-5 h-5 transition-transform ${
              showReview ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Answer Review */}
        <AnimatePresence>
          {showReview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 mb-6"
            >
              {result.feedback.map((item, index) => (
                <div
                  key={item.question_id}
                  className={`p-4 rounded-lg border ${
                    item.is_correct
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                        item.is_correct
                          ? "bg-emerald-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-slate-200 text-sm mb-2">
                        {item.question}
                      </p>
                      <div className="text-xs space-y-1">
                        <p className="text-slate-400">
                          Your answer:{" "}
                          <span
                            className={
                              item.is_correct
                                ? "text-emerald-400"
                                : "text-red-400"
                            }
                          >
                            {
                              questions
                                .find((q) => q.id === item.question_id)
                                ?.options.find((o) => o.id === item.user_answer)
                                ?.text
                            }
                          </span>
                        </p>
                        {!item.is_correct && (
                          <p className="text-slate-400">
                            Correct answer:{" "}
                            <span className="text-emerald-400">
                              {
                                questions
                                  .find((q) => q.id === item.question_id)
                                  ?.options.find(
                                    (o) => o.id === item.correct_answer
                                  )?.text
                              }
                            </span>
                          </p>
                        )}
                        <p className="text-slate-500 mt-2 italic">
                          {item.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!result.passed && (
            <button
              onClick={retakeAssessment}
              className="flex-1 px-6 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Retake Assessment
            </button>
          )}
          <button
            onClick={() => onComplete(result.passed, result.certificate)}
            className="flex-1 px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
          >
            {result.passed ? "View Certificate" : "Continue Learning"}
          </button>
        </div>
      </motion.div>
    );
  }

  // Quiz View
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs uppercase tracking-wider text-teal-500 font-medium">
            CEU Assessment
          </span>
          <span className="text-xs text-slate-500">
            ({ceuValue} CEU upon passing)
          </span>
        </div>
        <h2 className="text-xl font-medium text-slate-50 mb-2">
          Knowledge Check
        </h2>
        <p className="text-slate-400 text-sm">
          Answer all questions to complete this module and earn your CEU
          certificate. You need {passThreshold}% to pass.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => goToQuestion(index)}
            className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
              index === currentQuestionIndex
                ? "bg-teal-500 text-slate-950"
                : answers[q.id]
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                : "bg-slate-800 text-slate-500 border border-slate-700"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 mb-6"
        >
          <p className="text-lg text-slate-100 mb-6">{currentQuestion.question}</p>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => selectAnswer(currentQuestion.id, option.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-teal-500/20 border-teal-500 text-slate-100"
                      : "bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                        isSelected
                          ? "bg-teal-500 text-slate-950"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {option.id.toUpperCase()}
                    </span>
                    <span className="text-sm">{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() =>
            currentQuestionIndex === 0
              ? onBack()
              : goToQuestion(currentQuestionIndex - 1)
          }
          className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-sm"
        >
          {currentQuestionIndex === 0 ? "← Back to Module" : "← Previous"}
        </button>

        {isLastQuestion ? (
          <button
            onClick={submitAssessment}
            disabled={!allAnswered || submitting}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
              allAnswered && !submitting
                ? "bg-teal-500 text-slate-950 hover:bg-teal-400"
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }`}
          >
            {submitting ? "Submitting..." : `Submit (${answeredCount}/${questions.length})`}
          </button>
        ) : (
          <button
            onClick={() => goToQuestion(currentQuestionIndex + 1)}
            className="px-6 py-2.5 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
          >
            Next →
          </button>
        )}
      </div>
    </motion.div>
  );
}
