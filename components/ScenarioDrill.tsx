"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface Character {
  name: string;
  role: string;
  age?: number;
  background: string;
}

interface ScoreImpact {
  linguistic_accuracy: number;
  role_space_management: number;
  equipartial_fidelity: number;
  interaction_management: number;
  cultural_competence: number;
}

interface Option {
  id: string;
  text: string;
  is_optimal: boolean;
  consequences: Record<string, boolean>;
  score_impact: ScoreImpact;
  next_point: string;
  feedback: string;
}

interface DecisionPoint {
  id: string;
  scene: string;
  options: Option[];
}

interface ScenarioSetup {
  context: string;
  characters: Record<string, Character>;
  setting: string;
}

interface Ending {
  description: string;
  score_modifier: number;
}

interface ScenarioData {
  setup: ScenarioSetup;
  decision_points: DecisionPoint[];
  endings: Record<string, Ending>;
}

interface ScoringCategory {
  id: string;
  label: string;
  max: number;
  description: string;
}

interface ScoringRubric {
  categories: ScoringCategory[];
  total_max_score: number;
}

interface TimerSettings {
  practice: number;
  standard: number;
  pressure: number;
  expert: number;
}

interface Scenario {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category: string;
  difficulty_base: string;
  ecci_focus: string[];
  scenario_data: ScenarioData;
  timer_settings: TimerSettings;
  scoring_rubric: ScoringRubric;
  estimated_duration_minutes: number;
}

interface DecisionMade {
  decision_point_id: string;
  option_chosen: string;
  time_taken_ms: number;
  timed_out: boolean;
}

type Difficulty = "practice" | "standard" | "pressure" | "expert";

interface ScenarioDrillProps {
  scenario: Scenario;
  difficulty: Difficulty;
  unlockedDifficulties: Difficulty[];
  onComplete: (result: AttemptResult) => void;
  onExit: () => void;
}

interface AttemptResult {
  decisions_made: DecisionMade[];
  consequence_flags: Record<string, boolean>;
  scores: Record<string, number>;
  total_score: number;
  percentage_score: number;
  ending_id: string;
  total_time_ms: number;
  timeouts_count: number;
}

// Difficulty config
const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; icon: string }> = {
  practice: { label: "Practice", color: "emerald", icon: "leaf" },
  standard: { label: "Standard", color: "blue", icon: "target" },
  pressure: { label: "Pressure", color: "orange", icon: "flame" },
  expert: { label: "Expert", color: "red", icon: "zap" },
};

// Helper to find decision point by ID (handles branching)
function findDecisionPoint(
  decisionPoints: DecisionPoint[],
  pointId: string
): DecisionPoint | null {
  // First check main decision points
  const mainPoint = decisionPoints.find((dp) => dp.id === pointId);
  if (mainPoint) return mainPoint;

  // Check for branching points (they may be embedded in the scenario data)
  // For now, return null if not found in main array
  return null;
}

// Timer Progress Ring Component
function TimerRing({
  timeRemaining,
  totalTime,
  size = 80,
}: {
  timeRemaining: number;
  totalTime: number;
  size?: number;
}) {
  const percentage = (timeRemaining / totalTime) * 100;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on time remaining
  let strokeColor = "#10b981"; // green
  if (percentage <= 50 && percentage > 25) {
    strokeColor = "#f59e0b"; // amber
  } else if (percentage <= 25 && percentage > 10) {
    strokeColor = "#f97316"; // orange
  } else if (percentage <= 10) {
    strokeColor = "#ef4444"; // red
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-100"
        />
      </svg>
      {/* Time display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-mono font-bold text-lg"
          style={{ color: strokeColor }}
        >
          {Math.ceil(timeRemaining / 1000)}
        </span>
      </div>
    </div>
  );
}

// Stadium Pulse Effect Component
function PulseOverlay({
  intensity,
}: {
  intensity: "none" | "low" | "medium" | "high" | "critical";
}) {
  if (intensity === "none") return null;

  const pulseConfig = {
    low: {
      color: "rgba(245, 158, 11, 0.15)", // amber
      animation: "pulse-slow",
      blur: "40px",
    },
    medium: {
      color: "rgba(249, 115, 22, 0.25)", // orange
      animation: "pulse-medium",
      blur: "60px",
    },
    high: {
      color: "rgba(239, 68, 68, 0.35)", // red
      animation: "pulse-fast",
      blur: "80px",
    },
    critical: {
      color: "rgba(239, 68, 68, 0.5)", // intense red
      animation: "pulse-critical",
      blur: "100px",
    },
  };

  const config = pulseConfig[intensity];

  return (
    <>
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes pulse-medium {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes pulse-fast {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes pulse-critical {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-40">
        {/* Top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-32"
          style={{
            background: `linear-gradient(to bottom, ${config.color}, transparent)`,
            animation: `${config.animation} ${intensity === "critical" ? "0.3s" : intensity === "high" ? "0.5s" : intensity === "medium" ? "0.8s" : "1.2s"} ease-in-out infinite`,
            filter: `blur(${config.blur})`,
          }}
        />
        {/* Bottom edge */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32"
          style={{
            background: `linear-gradient(to top, ${config.color}, transparent)`,
            animation: `${config.animation} ${intensity === "critical" ? "0.3s" : intensity === "high" ? "0.5s" : intensity === "medium" ? "0.8s" : "1.2s"} ease-in-out infinite`,
            filter: `blur(${config.blur})`,
          }}
        />
        {/* Left edge */}
        <div
          className="absolute top-0 bottom-0 left-0 w-32"
          style={{
            background: `linear-gradient(to right, ${config.color}, transparent)`,
            animation: `${config.animation} ${intensity === "critical" ? "0.3s" : intensity === "high" ? "0.5s" : intensity === "medium" ? "0.8s" : "1.2s"} ease-in-out infinite`,
            filter: `blur(${config.blur})`,
          }}
        />
        {/* Right edge */}
        <div
          className="absolute top-0 bottom-0 right-0 w-32"
          style={{
            background: `linear-gradient(to left, ${config.color}, transparent)`,
            animation: `${config.animation} ${intensity === "critical" ? "0.3s" : intensity === "high" ? "0.5s" : intensity === "medium" ? "0.8s" : "1.2s"} ease-in-out infinite`,
            filter: `blur(${config.blur})`,
          }}
        />
        {/* Corner intensifiers */}
        {(intensity === "high" || intensity === "critical") && (
          <>
            <div
              className="absolute top-0 left-0 w-48 h-48"
              style={{
                background: `radial-gradient(circle at top left, ${config.color}, transparent 70%)`,
                animation: `${config.animation} ${intensity === "critical" ? "0.3s" : "0.5s"} ease-in-out infinite`,
              }}
            />
            <div
              className="absolute top-0 right-0 w-48 h-48"
              style={{
                background: `radial-gradient(circle at top right, ${config.color}, transparent 70%)`,
                animation: `${config.animation} ${intensity === "critical" ? "0.3s" : "0.5s"} ease-in-out infinite`,
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-48 h-48"
              style={{
                background: `radial-gradient(circle at bottom left, ${config.color}, transparent 70%)`,
                animation: `${config.animation} ${intensity === "critical" ? "0.3s" : "0.5s"} ease-in-out infinite`,
              }}
            />
            <div
              className="absolute bottom-0 right-0 w-48 h-48"
              style={{
                background: `radial-gradient(circle at bottom right, ${config.color}, transparent 70%)`,
                animation: `${config.animation} ${intensity === "critical" ? "0.3s" : "0.5s"} ease-in-out infinite`,
              }}
            />
          </>
        )}
      </div>
    </>
  );
}

// Main ScenarioDrill Component
export default function ScenarioDrill({
  scenario,
  difficulty,
  unlockedDifficulties,
  onComplete,
  onExit,
}: ScenarioDrillProps) {
  // State
  const [phase, setPhase] = useState<"intro" | "playing" | "result">("intro");
  const [currentPointId, setCurrentPointId] = useState<string>("dp1");
  const [decisionsMade, setDecisionsMade] = useState<DecisionMade[]>([]);
  const [consequenceFlags, setConsequenceFlags] = useState<Record<string, boolean>>({});
  const [scores, setScores] = useState<Record<string, number>>({
    linguistic_accuracy: 0,
    role_space_management: 0,
    equipartial_fidelity: 0,
    interaction_management: 0,
    cultural_competence: 0,
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [decisionStartTime, setDecisionStartTime] = useState<number>(0);
  const [totalTimeMs, setTotalTimeMs] = useState<number>(0);
  const [timeoutsCount, setTimeoutsCount] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [lastFeedback, setLastFeedback] = useState<string>("");
  const [endingId, setEndingId] = useState<string>("");

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Get timer duration for current difficulty
  const timerDuration = scenario.timer_settings[difficulty] * 1000;

  // Get current decision point
  const currentPoint = findDecisionPoint(
    scenario.scenario_data.decision_points,
    currentPointId
  );

  // Calculate pulse intensity based on time remaining
  const getPulseIntensity = useCallback((): "none" | "low" | "medium" | "high" | "critical" => {
    if (phase !== "playing" || !timerDuration) return "none";
    const percentage = (timeRemaining / timerDuration) * 100;
    if (percentage > 50) return "none";
    if (percentage > 25) return "low";
    if (percentage > 10) return "medium";
    if (percentage > 0) return "high";
    return "critical";
  }, [phase, timeRemaining, timerDuration]);

  // Start the drill
  const startDrill = useCallback(() => {
    setPhase("playing");
    startTimeRef.current = Date.now();
    setTimeRemaining(timerDuration);
    setDecisionStartTime(Date.now());
  }, [timerDuration]);

  // Handle option selection
  const selectOption = useCallback(
    (option: Option, timedOut: boolean = false) => {
      if (showFeedback) return; // Prevent double-selection

      const timeTaken = Date.now() - decisionStartTime;

      // Record decision
      const decision: DecisionMade = {
        decision_point_id: currentPointId,
        option_chosen: option.id,
        time_taken_ms: timeTaken,
        timed_out: timedOut,
      };

      setDecisionsMade((prev) => [...prev, decision]);

      // Update consequences
      setConsequenceFlags((prev) => ({ ...prev, ...option.consequences }));

      // Update scores
      setScores((prev) => ({
        linguistic_accuracy: prev.linguistic_accuracy + (option.score_impact.linguistic_accuracy || 0),
        role_space_management: prev.role_space_management + (option.score_impact.role_space_management || 0),
        equipartial_fidelity: prev.equipartial_fidelity + (option.score_impact.equipartial_fidelity || 0),
        interaction_management: prev.interaction_management + (option.score_impact.interaction_management || 0),
        cultural_competence: prev.cultural_competence + (option.score_impact.cultural_competence || 0),
      }));

      if (timedOut) {
        setTimeoutsCount((prev) => prev + 1);
      }

      setSelectedOption(option.id);
      setLastFeedback(option.feedback);
      setShowFeedback(true);

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    },
    [currentPointId, decisionStartTime, showFeedback]
  );

  // Handle timeout - select most passive option (typically B)
  const handleTimeout = useCallback(() => {
    if (!currentPoint) return;

    // Find the "most passive" option - typically option B (second option)
    // This simulates "freezing" under pressure
    const passiveOption = currentPoint.options[1] || currentPoint.options[0];
    selectOption(passiveOption, true);
  }, [currentPoint, selectOption]);

  // Continue to next decision point
  const continueToNext = useCallback(() => {
    const lastDecision = decisionsMade[decisionsMade.length - 1];
    const selectedOpt = currentPoint?.options.find(
      (o) => o.id === lastDecision?.option_chosen
    );

    if (!selectedOpt) return;

    const nextPointId = selectedOpt.next_point;

    // Check if this is an ending
    if (nextPointId.startsWith("ending_")) {
      const endKey = nextPointId.replace("ending_", "");
      setEndingId(endKey);
      setTotalTimeMs(Date.now() - startTimeRef.current);
      setPhase("result");
      return;
    }

    // Check if next point exists
    const nextPoint = findDecisionPoint(
      scenario.scenario_data.decision_points,
      nextPointId
    );

    if (!nextPoint) {
      // No more points, determine ending based on score
      const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
      const percentage = (totalScore / 100) * 100;
      let ending = "good";
      if (percentage >= 90) ending = "optimal";
      else if (percentage >= 70) ending = "good";
      else if (percentage >= 50) ending = "mixed";
      else if (percentage >= 30) ending = "poor";
      else ending = "failed";

      setEndingId(ending);
      setTotalTimeMs(Date.now() - startTimeRef.current);
      setPhase("result");
      return;
    }

    // Move to next point
    setCurrentPointId(nextPointId);
    setSelectedOption(null);
    setShowFeedback(false);
    setTimeRemaining(timerDuration);
    setDecisionStartTime(Date.now());
  }, [decisionsMade, currentPoint, scenario.scenario_data.decision_points, scores, timerDuration]);

  // Timer effect
  useEffect(() => {
    if (phase !== "playing" || showFeedback) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 100;
        if (newTime <= 0) {
          handleTimeout();
          return 0;
        }
        return newTime;
      });
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [phase, showFeedback, handleTimeout]);

  // Calculate final result
  const calculateResult = useCallback((): AttemptResult => {
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const ending = scenario.scenario_data.endings[endingId];
    const finalScore = Math.max(0, Math.min(100, totalScore + (ending?.score_modifier || 0)));

    return {
      decisions_made: decisionsMade,
      consequence_flags: consequenceFlags,
      scores,
      total_score: finalScore,
      percentage_score: finalScore,
      ending_id: endingId,
      total_time_ms: totalTimeMs,
      timeouts_count: timeoutsCount,
    };
  }, [scores, endingId, scenario.scenario_data.endings, decisionsMade, consequenceFlags, totalTimeMs, timeoutsCount]);

  // Render intro phase
  if (phase === "intro") {
    const setup = scenario.scenario_data.setup;
    const diffConfig = DIFFICULTY_CONFIG[difficulty];

    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onExit}
              className="text-slate-400 hover:text-white transition-colors"
            >
              &larr; Exit Drill
            </button>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium bg-${diffConfig.color}-500/20 text-${diffConfig.color}-400`}
            >
              {diffConfig.label} Mode
            </div>
          </div>

          {/* Scenario Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold mb-2">{scenario.title}</h1>
            {scenario.subtitle && (
              <p className="text-slate-400 text-lg">{scenario.subtitle}</p>
            )}
          </motion.div>

          {/* Context Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700"
          >
            <h2 className="text-lg font-semibold mb-3 text-emerald-400">
              Scenario Context
            </h2>
            <p className="text-slate-300 leading-relaxed">{setup.context}</p>
          </motion.div>

          {/* Characters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
          >
            {Object.entries(setup.characters).map(([key, char]) => (
              <div
                key={key}
                className="bg-slate-800/30 rounded-lg p-4 border border-slate-700"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                    {char.name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold">{char.name}</h3>
                    <p className="text-sm text-slate-400">{char.role}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400">{char.background}</p>
              </div>
            ))}
          </motion.div>

          {/* Setting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/30 rounded-lg p-4 mb-8 border border-slate-700"
          >
            <div className="flex items-center gap-2 text-slate-400">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{setup.setting}</span>
            </div>
          </motion.div>

          {/* Timer Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-4 mb-8 border border-amber-500/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-amber-200">
                  Timed Decisions: {scenario.timer_settings[difficulty]} seconds per choice
                </p>
                <p className="text-sm text-amber-300/70">
                  If time runs out, the most passive response will be selected automatically
                </p>
              </div>
            </div>
          </motion.div>

          {/* Start Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <button
              onClick={startDrill}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/25"
            >
              Begin Scenario
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Render playing phase
  if (phase === "playing") {
    if (!currentPoint) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
          <p>Loading next scene...</p>
        </div>
      );
    }

    const pulseIntensity = getPulseIntensity();

    return (
      <>
        <PulseOverlay intensity={pulseIntensity} />
        <div className="min-h-screen bg-slate-900 text-white p-6 relative z-10">
          <div className="max-w-3xl mx-auto">
            {/* Header with timer */}
            <div className="flex items-center justify-between mb-8">
              <div className="text-sm text-slate-400">
                Decision {decisionsMade.length + 1}
              </div>
              <TimerRing
                timeRemaining={timeRemaining}
                totalTime={timerDuration}
              />
            </div>

            {/* Scene */}
            <motion.div
              key={currentPointId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-700"
            >
              <p className="text-lg leading-relaxed whitespace-pre-line">
                {currentPoint.scene}
              </p>
            </motion.div>

            {/* Options */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {!showFeedback ? (
                  <motion.div
                    key="options"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {currentPoint.options.map((option, index) => (
                      <motion.button
                        key={option.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => selectOption(option)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          pulseIntensity === "critical"
                            ? "border-red-500/50 bg-slate-800/70 hover:bg-red-500/10"
                            : pulseIntensity === "high"
                            ? "border-orange-500/30 bg-slate-800/60 hover:bg-orange-500/10"
                            : "border-slate-700 bg-slate-800/40 hover:bg-slate-700/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-medium">
                            {option.id}
                          </span>
                          <p className="pt-1">{option.text}</p>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="feedback"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Selected option with feedback */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600">
                      <div className="flex items-start gap-3 mb-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-medium">
                          {selectedOption}
                        </span>
                        <p className="pt-1 text-slate-300">
                          {currentPoint.options.find((o) => o.id === selectedOption)?.text}
                        </p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3 border-l-2 border-emerald-500">
                        <p className="text-sm text-slate-300">{lastFeedback}</p>
                      </div>
                    </div>

                    {/* Continue button */}
                    <button
                      onClick={continueToNext}
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all"
                    >
                      Continue
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Render result phase
  if (phase === "result") {
    const result = calculateResult();
    const ending = scenario.scenario_data.endings[endingId];
    const categories = scenario.scoring_rubric.categories;

    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">Scenario Complete</h1>
            <p className="text-slate-400">{scenario.title}</p>
          </motion.div>

          {/* Score Circle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#374151"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={
                    result.percentage_score >= 80
                      ? "#10b981"
                      : result.percentage_score >= 60
                      ? "#f59e0b"
                      : "#ef4444"
                  }
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (result.percentage_score / 100) * 440}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{Math.round(result.percentage_score)}</span>
                <span className="text-sm text-slate-400">out of 100</span>
              </div>
            </div>
          </motion.div>

          {/* Ending Description */}
          {ending && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700"
            >
              <p className="text-lg text-slate-300 leading-relaxed">
                {ending.description}
              </p>
            </motion.div>
          )}

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/30 rounded-xl p-6 mb-6 border border-slate-700"
          >
            <h3 className="text-lg font-semibold mb-4">ECCI Category Scores</h3>
            <div className="space-y-4">
              {categories.map((cat) => {
                const score = result.scores[cat.id] || 0;
                const percentage = (score / cat.max) * 100;
                return (
                  <div key={cat.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{cat.label}</span>
                      <span className="text-slate-400">
                        {score}/{cat.max}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className={`h-full rounded-full ${
                          percentage >= 80
                            ? "bg-emerald-500"
                            : percentage >= 60
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            <div className="bg-slate-800/30 rounded-lg p-4 text-center border border-slate-700">
              <p className="text-2xl font-bold">{decisionsMade.length}</p>
              <p className="text-sm text-slate-400">Decisions</p>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-4 text-center border border-slate-700">
              <p className="text-2xl font-bold">
                {Math.round(result.total_time_ms / 1000)}s
              </p>
              <p className="text-sm text-slate-400">Total Time</p>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-4 text-center border border-slate-700">
              <p className="text-2xl font-bold">{result.timeouts_count}</p>
              <p className="text-sm text-slate-400">Timeouts</p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-4"
          >
            <button
              onClick={onExit}
              className="flex-1 py-4 bg-slate-700 rounded-xl font-semibold hover:bg-slate-600 transition-colors"
            >
              Back to Drills
            </button>
            <button
              onClick={() => onComplete(result)}
              className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all"
            >
              Debrief with Elya
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}
