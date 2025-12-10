"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import { motion, AnimatePresence } from "framer-motion";
import VideoPlayer from "@/components/VideoPlayer";
import AssessmentQuiz from "@/components/AssessmentQuiz";
import CEUEvaluation from "@/components/CEUEvaluation";

type LearningObjective = {
  id: number;
  objective: string;
};

type AssessmentQuestion = {
  id: number;
  question: string;
  options: { letter: string; text: string }[];
  correct_answer: string;
  feedback: string;
};

type Workshop = {
  id: string;
  module_code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  duration_minutes: number;
  ceu_value: number;
  rid_category: string;
  video_url: string;
  instructor_name: string | null;
  instructor_credentials: string | null;
  presentation_language: string | null;
  learning_objectives: LearningObjective[] | null;
  assessment_questions: AssessmentQuestion[] | null;
  assessment_pass_threshold: number;
  rid_activity_code: string | null;
};

type WorkshopProgress = {
  id: string;
  status: string;
  video_completed: boolean;
  assessment_completed: boolean;
  assessment_passed: boolean | null;
  assessment_score: number | null;
  evaluation_completed: boolean;
  certificate_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  time_spent_seconds: number;
};

export default function CEUWorkshopPage() {
  const router = useRouter();
  const params = useParams();
  const moduleCode = params?.moduleCode as string;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [progress, setProgress] = useState<WorkshopProgress | null>(null);
  const [currentStep, setCurrentStep] = useState<"intro" | "video" | "assessment" | "evaluation" | "complete">("intro");
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const [userTier, setUserTier] = useState<string>("free");

  useEffect(() => {
    loadWorkshopData();
  }, [moduleCode]);

  const loadWorkshopData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/signin");
      return;
    }

    setUser(session.user);
    setAccessToken(session.access_token);

    // Check user's subscription tier
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", session.user.id)
      .single();

    const tier = profile?.subscription_tier || "free";
    setUserTier(tier);

    // Load workshop data
    const { data: workshopData } = await supabase
      .from("skill_modules")
      .select("*")
      .eq("module_code", moduleCode)
      .eq("ceu_eligible", true)
      .single();

    if (!workshopData) {
      setLoading(false);
      return;
    }

    setWorkshop(workshopData as unknown as Workshop);

    // Load or create progress record
    let { data: progressData } = await supabase
      .from("user_module_progress")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("module_id", workshopData.id)
      .single();

    if (!progressData) {
      // Create initial progress
      const { data: newProgress } = await supabase
        .from("user_module_progress")
        .insert({
          user_id: session.user.id,
          module_id: workshopData.id,
          status: "in_progress",
          started_at: new Date().toISOString(),
          wants_ceu: true,
        })
        .select()
        .single();

      progressData = newProgress;
    }

    const typedProgress = progressData as unknown as WorkshopProgress;
    setProgress(typedProgress);

    // Determine current step based on progress
    if (typedProgress?.certificate_id) {
      setCurrentStep("complete");
    } else if (typedProgress?.evaluation_completed) {
      setCurrentStep("complete");
    } else if (typedProgress?.assessment_passed) {
      setCurrentStep("evaluation");
    } else if (typedProgress?.video_completed) {
      setCurrentStep("assessment");
    } else {
      setCurrentStep("intro");
    }

    setLoading(false);
  };

  const handleVideoComplete = async () => {
    if (!progress) return;

    await supabase
      .from("user_module_progress")
      .update({
        video_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", progress.id);

    setProgress({ ...progress, video_completed: true });
    setCurrentStep("assessment");
  };

  const handleAssessmentComplete = async (passed: boolean, certificate?: any) => {
    if (!progress) return;

    await supabase
      .from("user_module_progress")
      .update({
        assessment_completed: true,
        assessment_passed: passed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", progress.id);

    setProgress({ ...progress, assessment_completed: true, assessment_passed: passed });

    if (passed) {
      setCurrentStep("evaluation");
    }
    // If failed, AssessmentQuiz handles retry UI
  };

  const handleEvaluationComplete = async (certificate?: any) => {
    if (certificate) {
      router.push("/ceu?new_certificate=" + certificate.certificate_number);
    } else {
      setCurrentStep("complete");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-teal-400">Loading workshop...</div>
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-slate-950">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-slate-300 mb-2">Workshop not found</h2>
            <button
              onClick={() => router.push("/ceu")}
              className="mt-4 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
            >
              Back to CEU Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Block non-Pro users
  if (userTier !== "pro") {
    return (
      <div className="min-h-screen bg-slate-950">
        <NavBar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Pro Membership Required</h2>
            <p className="text-slate-400 mb-6">
              Upgrade to Pro to access CEU workshops, earn certificates, and track your RID certification progress.
            </p>
            <button
              onClick={() => router.push("/settings?tab=billing")}
              className="px-6 py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-lg transition-all"
            >
              Upgrade to Pro - $30/month
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Steps for progress indicator
  const steps = [
    { key: "intro", label: "Overview", completed: true },
    { key: "video", label: "Watch Video", completed: progress?.video_completed || false },
    { key: "assessment", label: "Take Quiz", completed: progress?.assessment_passed || false },
    { key: "evaluation", label: "Evaluation", completed: progress?.evaluation_completed || false },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.push("/ceu")}
            className="text-sm text-slate-400 hover:text-teal-400 mb-4 flex items-center gap-1"
          >
            ← Back to CEU Dashboard
          </button>

          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold">
                  {workshop.ceu_value?.toFixed(2)} CEU
                </span>
                <span className="px-2 py-1 rounded-full bg-violet-500/20 text-violet-400 text-xs font-medium">
                  {workshop.rid_category}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-100 mb-2">{workshop.title}</h1>
              {workshop.subtitle && (
                <p className="text-slate-400">{workshop.subtitle}</p>
              )}
              {workshop.instructor_name && (
                <p className="text-sm text-slate-500 mt-2">
                  Instructor: {workshop.instructor_name}
                  {workshop.instructor_credentials && `, ${workshop.instructor_credentials}`}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">{workshop.duration_minutes} min</p>
              {workshop.presentation_language && (
                <p className="text-xs text-slate-500">{workshop.presentation_language}</p>
              )}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-1 mb-6">
            {steps.map((step, index) => {
              const isActive = step.key === currentStep;
              const isPast = steps.findIndex(s => s.key === currentStep) > index;

              return (
                <div key={step.key} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? "bg-teal-500/20 text-teal-400 border border-teal-500/40"
                        : step.completed || isPast
                        ? "bg-slate-800 text-slate-400"
                        : "bg-slate-800/50 text-slate-600"
                    }`}
                  >
                    {step.completed ? (
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        isActive ? "bg-teal-500 text-slate-950" : "bg-slate-700 text-slate-500"
                      }`}>
                        {index + 1}
                      </span>
                    )}
                    {step.label}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-4 h-px mx-1 ${isPast || step.completed ? "bg-teal-500/50" : "bg-slate-700"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {/* Intro/Overview Step */}
          {currentStep === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Description */}
              {workshop.description && (
                <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
                  <h2 className="text-lg font-semibold text-slate-100 mb-3">About This Workshop</h2>
                  <p className="text-slate-300 leading-relaxed">{workshop.description}</p>
                </div>
              )}

              {/* Learning Objectives */}
              {workshop.learning_objectives && workshop.learning_objectives.length > 0 && (
                <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
                  <h2 className="text-lg font-semibold text-slate-100 mb-4">Learning Objectives</h2>
                  <p className="text-sm text-slate-400 mb-4">
                    After completing this workshop, you will be able to:
                  </p>
                  <ul className="space-y-3">
                    {workshop.learning_objectives.map((obj, index) => (
                      <li key={obj.id} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-slate-300">{obj.objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CEU Info */}
              <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-400 font-bold text-sm">RID</span>
                  </div>
                  <div>
                    <h3 className="text-slate-100 font-semibold mb-1">CEU Credit Information</h3>
                    <p className="text-sm text-slate-300 mb-2">
                      This workshop is worth <span className="text-teal-400 font-bold">{workshop.ceu_value} CEU</span> in
                      <span className="text-violet-400 font-medium"> {workshop.rid_category}</span>.
                    </p>
                    <p className="text-xs text-slate-400">
                      To earn CEU credit, you must watch the full video, pass the assessment quiz with
                      {workshop.assessment_pass_threshold}% or higher, and complete the evaluation form.
                    </p>
                    {workshop.rid_activity_code && (
                      <p className="text-xs text-slate-500 mt-2">
                        RID Activity Code: {workshop.rid_activity_code}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setCurrentStep("video")}
                  className="px-8 py-3 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-colors text-lg"
                >
                  Start Workshop
                </button>
              </div>
            </motion.div>
          )}

          {/* Video Step */}
          {currentStep === "video" && (
            <motion.div
              key="video"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <VideoPlayer
                videoUrl={workshop.video_url}
                title={workshop.title}
                duration={workshop.duration_minutes}
                requireFullCompletion={true}
                onComplete={handleVideoComplete}
                onAttestation={handleVideoComplete}
                initiallyCompleted={progress?.video_completed || false}
              />

              {progress?.video_completed && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setCurrentStep("assessment")}
                    className="px-8 py-3 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-colors"
                  >
                    Continue to Assessment →
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Assessment Step */}
          {currentStep === "assessment" && workshop.assessment_questions && (
            <motion.div
              key="assessment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AssessmentQuiz
                moduleId={workshop.id}
                moduleTitle={workshop.title}
                ceuValue={workshop.ceu_value}
                questions={workshop.assessment_questions.map(q => ({
                  id: String(q.id),
                  question: q.question,
                  options: q.options.map(o => ({ id: o.letter, text: o.text })),
                  correct_answer: q.correct_answer,
                  explanation: q.feedback,
                }))}
                passThreshold={workshop.assessment_pass_threshold}
                onComplete={handleAssessmentComplete}
                onBack={() => setCurrentStep("video")}
                accessToken={accessToken}
              />
            </motion.div>
          )}

          {/* Evaluation Step */}
          {currentStep === "evaluation" && progress && (
            <motion.div
              key="evaluation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CEUEvaluation
                userId={user.id}
                moduleId={workshop.id}
                moduleTitle={workshop.title}
                progressId={progress.id}
                ceuValue={workshop.ceu_value}
                accessToken={accessToken}
                onComplete={handleEvaluationComplete}
                onBack={() => setCurrentStep("assessment")}
              />
            </motion.div>
          )}

          {/* Complete Step */}
          {currentStep === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-emerald-400 mb-2">Workshop Complete!</h2>
              <p className="text-slate-300 mb-6">
                You've earned <span className="text-teal-400 font-bold">{workshop.ceu_value} CEU</span> in {workshop.rid_category}.
              </p>
              <button
                onClick={() => router.push("/ceu")}
                className="px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-colors"
              >
                View My Certificates
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RID Sponsor Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <span className="text-teal-400 font-bold text-sm">RID</span>
            </div>
            <div>
              <p className="text-sm text-slate-300">
                <span className="font-semibold">InterpretReflect is RID CEU Sponsor #2309</span>
              </p>
              <p className="text-xs text-slate-500">
                Your CEU credits will be automatically tracked and reported.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
