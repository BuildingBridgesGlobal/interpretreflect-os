"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

type Drill = {
  id: string;
  drill_code: string;
  drill_type: string;
  scenario_text: string;
  context_details: any;
  question: string;
  correct_answer: string;
  options: any[];
  explanation: string;
  incorrect_feedback: any;
  learning_points: any[];
  difficulty_level: number;
  estimated_seconds: number;
  subcategory: {
    title: string;
    category: {
      title: string;
      category_code: string;
    };
  };
};

type DrillFeedback = {
  correct: boolean;
  feedback?: string;
  correct_answer?: string;
  explanation: string;
  learning_points: any[];
};

export default function DrillSessionPage() {
  const router = useRouter();
  const params = useParams();
  const category = params.category as string;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(3);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<DrillFeedback | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animateIn, setAnimateIn] = useState(true);

  useEffect(() => {
    loadData();
  }, [category]);

  // Timer effect
  useEffect(() => {
    if (!showFeedback && !sessionComplete && drills.length > 0) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showFeedback, sessionComplete, startTime, drills.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/signin");
      return;
    }

    setUser(session.user);

    // Fetch drills for this category
    const response = await fetch(
      `/api/drills?category=${category}&count=5&user_id=${session.user.id}`
    );

    if (response.ok) {
      const data = await response.json();
      setDrills(data.drills);
    } else {
      console.error("Failed to load drills");
    }

    setLoading(false);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !user || isSubmitting) return;

    setIsSubmitting(true);
    const responseTime = Math.floor((Date.now() - startTime) / 1000);
    const currentDrill = drills[currentIndex];

    try {
      // Submit the attempt
      const response = await fetch("/api/drills/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          drill_id: currentDrill.id,
          user_answer: selectedAnswer,
          confidence_level: confidence,
          response_time_seconds: responseTime
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback);
        setShowFeedback(true);

        // Update session stats
        setSessionStats(prev => ({
          correct: prev.correct + (data.feedback.correct ? 1 : 0),
          total: prev.total + 1
        }));
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextDrill = () => {
    // Animate out
    setAnimateIn(false);

    setTimeout(() => {
      if (currentIndex < drills.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
        setConfidence(3);
        setShowFeedback(false);
        setFeedback(null);
        setStartTime(Date.now());
        setElapsedTime(0);
      } else {
        setSessionComplete(true);
      }
      // Animate in
      setAnimateIn(true);
    }, 200);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading drills...</div>
      </div>
    );
  }

  if (drills.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950">
        <NavBar />
        <div className="container mx-auto max-w-4xl px-4 py-12 text-center">
          <h1 className="text-2xl font-semibold text-slate-100 mb-4">No Drills Available</h1>
          <p className="text-slate-400 mb-6">
            There are no drills available for this category yet.
          </p>
          <button
            onClick={() => router.push("/skills")}
            className="px-6 py-3 bg-teal-500 text-slate-950 rounded-lg font-medium hover:bg-teal-400 transition-colors"
          >
            Back to Skills
          </button>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const accuracy = Math.round((sessionStats.correct / sessionStats.total) * 100);
    const performanceLevel = accuracy >= 80 ? "Excellent" : accuracy >= 60 ? "Good" : accuracy >= 40 ? "Developing" : "Keep Practicing";
    const performanceColor = accuracy >= 80 ? "text-emerald-400" : accuracy >= 60 ? "text-teal-400" : accuracy >= 40 ? "text-amber-400" : "text-slate-400";

    return (
      <div className="min-h-screen bg-slate-950">
        <NavBar />
        <div className="container mx-auto max-w-4xl px-4 py-12">
          {/* Session Complete - Enhanced */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border-2 border-teal-500 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-12 h-12 ${performanceColor}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Session Complete</h1>
            <p className={`text-lg ${performanceColor} font-medium`}>{performanceLevel}</p>
          </div>

          {/* Stats Card - Enhanced */}
          <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900/80 to-slate-800/50 p-8 mb-8">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className="text-4xl font-bold text-teal-400 mb-2">{sessionStats.total}</div>
                <div className="text-sm text-slate-400">Drills Completed</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className="text-4xl font-bold text-emerald-400 mb-2">{sessionStats.correct}</div>
                <div className="text-sm text-slate-400">Correct Answers</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className={`text-4xl font-bold ${performanceColor} mb-2`}>{accuracy}%</div>
                <div className="text-sm text-slate-400">Accuracy</div>
              </div>
            </div>

            {/* Progress visualization */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Session Progress</span>
                <span className="text-sm text-slate-400">{sessionStats.correct}/{sessionStats.total} correct</span>
              </div>
              <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-1000"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>
          </div>

          {/* Encouragement message */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6 mb-8 text-center">
            <p className="text-slate-300">
              {accuracy >= 80
                ? "Outstanding work! You're demonstrating strong interpreter judgment. Keep reinforcing these skills."
                : accuracy >= 60
                ? "Good progress! You're building solid decision-making skills. Regular practice will strengthen your instincts."
                : accuracy >= 40
                ? "You're on the right track! These scenarios are challenging — keep practicing to build your confidence."
                : "Every drill is a learning opportunity. Review the feedback and try again — you'll improve with practice!"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-lg border border-teal-500 text-teal-400 font-medium hover:bg-teal-500/10 transition-all hover:scale-105"
            >
              Practice Again
            </button>
            <button
              onClick={() => router.push("/skills")}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-medium hover:from-teal-400 hover:to-emerald-400 transition-all hover:scale-105"
            >
              Back to Skills
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentDrill = drills[currentIndex];
  const progress = ((currentIndex + 1) / drills.length) * 100;

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-4xl px-4 py-6">
        {/* Progress Bar - Enhanced */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">
                Drill {currentIndex + 1} of {drills.length}
              </span>
              <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-xs">
                {currentDrill.subcategory.category.title}
              </span>
            </div>
            {/* Timer */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`text-sm font-mono ${elapsedTime > (currentDrill.estimated_seconds || 90) ? 'text-amber-400' : 'text-slate-400'}`}>
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Mini progress dots */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {drills.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx < currentIndex
                    ? sessionStats.correct > idx - (sessionStats.total - sessionStats.correct)
                      ? 'bg-emerald-500'
                      : 'bg-red-500'
                    : idx === currentIndex
                    ? 'bg-teal-400 scale-125'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        <div className={`transition-all duration-200 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {!showFeedback ? (
          <>
            {/* Scenario Card */}
            <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900/80 to-slate-800/30 p-8 mb-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium">
                    {currentDrill.subcategory.title}
                  </span>
                  <span className="text-slate-500 text-sm">
                    {"★".repeat(currentDrill.difficulty_level)}
                  </span>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                    {currentDrill.scenario_text}
                  </p>
                </div>
              </div>

              {currentDrill.question && (
                <div className="pt-6 border-t border-slate-700">
                  <p className="text-lg font-medium text-slate-100 mb-6">
                    {currentDrill.question}
                  </p>

                  {/* Answer Options */}
                  <div className="space-y-3">
                    {currentDrill.options.map((option: any) => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedAnswer(option.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedAnswer === option.id
                            ? "border-teal-500 bg-teal-500/10"
                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            selectedAnswer === option.id
                              ? "border-teal-500 bg-teal-500"
                              : "border-slate-600"
                          }`}>
                            {selectedAnswer === option.id && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-300 mb-1">
                              {option.id.toUpperCase()}.
                            </div>
                            <div className="text-slate-300">
                              {option.text}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confidence Slider */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-4">
                How confident are you in your answer?
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={confidence}
                  onChange={(e) => setConfidence(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Not confident</span>
                  <span className="text-teal-400 font-medium">Confidence: {confidence}/5</span>
                  <span>Very confident</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer || isSubmitting}
              className="w-full py-4 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-semibold text-lg hover:from-teal-400 hover:to-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:from-teal-500 disabled:to-emerald-500 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Answer"
              )}
            </button>
          </>
        ) : (
          <>
            {/* Feedback Card */}
            <div className={`rounded-xl border-2 p-8 mb-6 ${
              feedback?.correct
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-red-500 bg-red-500/10"
            }`}>
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  feedback?.correct
                    ? "bg-emerald-500/20 border-2 border-emerald-500"
                    : "bg-red-500/20 border-2 border-red-500"
                }`}>
                  <span className={`text-2xl ${
                    feedback?.correct ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {feedback?.correct ? "✓" : "✗"}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className={`text-2xl font-semibold mb-2 ${
                    feedback?.correct ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {feedback?.correct ? "Correct!" : "Not Quite"}
                  </h2>
                  {!feedback?.correct && feedback?.correct_answer && (
                    <p className="text-slate-300">
                      The correct answer was <span className="font-semibold text-white">{feedback.correct_answer.toUpperCase()}</span>
                    </p>
                  )}
                </div>
              </div>

              {!feedback?.correct && feedback?.feedback && (
                <div className="mb-6 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                  <p className="text-slate-300 leading-relaxed">{feedback.feedback}</p>
                </div>
              )}

              <div className="mb-6 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
                  Why This Matters
                </h3>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                  {feedback?.explanation}
                </p>
              </div>

              {feedback?.learning_points && feedback.learning_points.length > 0 && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
                    Key Takeaways
                  </h3>
                  <ul className="space-y-2">
                    {feedback.learning_points.map((point: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextDrill}
              className="w-full py-4 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-semibold text-lg hover:from-teal-400 hover:to-emerald-400 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {currentIndex < drills.length - 1 ? "Next Drill →" : "Finish Session"}
            </button>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
