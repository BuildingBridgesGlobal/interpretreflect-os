"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ElyaOrb, type OrbMode } from "./ElyaOrb";

// ============================================================================
// AI TYPING ANIMATION
// Modern typing indicator and streaming text effect
// ============================================================================

// Thinking dots animation
export function ThinkingDots({ color = "violet" }: { color?: string }) {
  const colorClasses: Record<string, string> = {
    violet: "bg-violet-400",
    teal: "bg-teal-400",
    blue: "bg-blue-400",
    amber: "bg-amber-400",
    purple: "bg-purple-400",
    rose: "bg-rose-400"
  };

  const bgClass = colorClasses[color] || colorClasses.violet;

  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`w-2 h-2 rounded-full ${bgClass}`}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

// Thinking indicator with text
export function ThinkingIndicator({ text = "Thinking", color = "violet" }: { text?: string; color?: string }) {
  const colorClasses: Record<string, string> = {
    violet: "text-violet-400",
    teal: "text-teal-400",
    blue: "text-blue-400",
    amber: "text-amber-400",
    purple: "text-purple-400",
    rose: "text-rose-400"
  };

  const textClass = colorClasses[color] || colorClasses.violet;

  return (
    <div className="flex items-center gap-2">
      <ThinkingDots color={color} />
      <span className={`text-sm ${textClass}`}>{text}</span>
    </div>
  );
}

// Streaming text effect - types out text character by character
interface StreamingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export function StreamingText({ text, speed = 20, onComplete, className }: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
  }, [text]);

  return (
    <span className={className}>
      {displayedText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-0.5 h-4 bg-current ml-0.5 align-middle"
        />
      )}
    </span>
  );
}

// Map color names to OrbMode
const colorToOrbMode: Record<string, OrbMode> = {
  violet: "default",
  purple: "default",
  teal: "prep",
  blue: "debrief",
  amber: "research",
  magenta: "patterns",
  rose: "freewrite"
};

// Pulsing brain/AI icon for loading states - now uses ElyaOrb
export function AILoadingIcon({ size = "md", color = "violet" }: { size?: "sm" | "md" | "lg"; color?: string }) {
  const orbSize = size === "sm" ? "xs" : size === "md" ? "sm" : "md";
  const orbMode = colorToOrbMode[color] || "default";

  return (
    <ElyaOrb
      size={orbSize}
      mood="thinking"
      mode={orbMode}
    />
  );
}

// Animated "Elya is typing" message bubble
export function ElyaTypingBubble({ color = "violet" }: { color?: string }) {
  const colorClasses: Record<string, { bg: string; border: string }> = {
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/30" },
    teal: { bg: "bg-teal-500/10", border: "border-teal-500/30" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/30" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/30" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/30" },
    rose: { bg: "bg-rose-500/10", border: "border-rose-500/30" }
  };

  const config = colorClasses[color] || colorClasses.violet;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex gap-3 items-start`}
    >
      <AILoadingIcon size="sm" color={color} />
      <div className={`rounded-xl px-4 py-3 ${config.bg} border ${config.border}`}>
        <ThinkingDots color={color} />
      </div>
    </motion.div>
  );
}

// Neural network animation background
export function NeuralBackground({ color = "violet" }: { color?: string }) {
  const colorClasses: Record<string, string> = {
    violet: "bg-violet-500",
    teal: "bg-teal-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    purple: "bg-purple-500",
    rose: "bg-rose-500"
  };

  const bgClass = colorClasses[color] || colorClasses.violet;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-1 h-1 rounded-full ${bgClass} opacity-20`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
          animate={{
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        />
      ))}
    </div>
  );
}
