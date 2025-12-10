"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

// Mood types that Elya can express
export type ElyaMood =
  | "neutral"      // Calm, default state
  | "thinking"     // Processing, contemplating
  | "listening"    // Attentive, receiving input
  | "happy"        // Celebrating, positive response
  | "empathetic"   // Understanding, supportive
  | "curious"      // Interested, asking questions
  | "encouraging"  // Motivating, cheering on
  | "focused";     // Deep work, serious topic

// Chat mode colors for the orb
export type OrbMode =
  | "default"      // Purple - general chat
  | "prep"         // Teal - assignment prep
  | "debrief"      // Blue - post-assignment
  | "research"     // Orange - research mode
  | "patterns"     // Magenta - pattern analysis
  | "freewrite";   // Pink - free writing

interface ElyaOrbProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  mood?: ElyaMood;
  mode?: OrbMode;
  isActive?: boolean;
  className?: string;
}

// Size configurations
const sizeConfig = {
  xs: { container: "w-6 h-6", inner: "w-4 h-4", glow: 8 },
  sm: { container: "w-10 h-10", inner: "w-6 h-6", glow: 12 },
  md: { container: "w-12 h-12", inner: "w-8 h-8", glow: 16 },
  lg: { container: "w-14 h-14", inner: "w-10 h-10", glow: 20 },
  xl: { container: "w-20 h-20", inner: "w-14 h-14", glow: 28 },
};

// Mode color configurations
const modeColors = {
  default: {
    primary: "#a855f7",    // Purple
    secondary: "#c084fc",  // Lighter purple
    tertiary: "#e879f9",   // Pink-purple
    glow: "rgba(168, 85, 247, 0.5)",
    glowSoft: "rgba(168, 85, 247, 0.2)",
  },
  prep: {
    primary: "#14b8a6",    // Teal
    secondary: "#2dd4bf",  // Lighter teal
    tertiary: "#5eead4",   // Light teal
    glow: "rgba(20, 184, 166, 0.5)",
    glowSoft: "rgba(20, 184, 166, 0.2)",
  },
  debrief: {
    primary: "#3b82f6",    // Blue
    secondary: "#60a5fa",  // Lighter blue
    tertiary: "#93c5fd",   // Light blue
    glow: "rgba(59, 130, 246, 0.5)",
    glowSoft: "rgba(59, 130, 246, 0.2)",
  },
  research: {
    primary: "#f59e0b",    // Orange/Amber
    secondary: "#fbbf24",  // Lighter amber
    tertiary: "#fcd34d",   // Light amber
    glow: "rgba(245, 158, 11, 0.5)",
    glowSoft: "rgba(245, 158, 11, 0.2)",
  },
  patterns: {
    primary: "#d946ef",    // Magenta
    secondary: "#e879f9",  // Lighter magenta
    tertiary: "#f0abfc",   // Light magenta
    glow: "rgba(217, 70, 239, 0.5)",
    glowSoft: "rgba(217, 70, 239, 0.2)",
  },
  freewrite: {
    primary: "#ec4899",    // Pink
    secondary: "#f472b6",  // Lighter pink
    tertiary: "#f9a8d4",   // Light pink
    glow: "rgba(236, 72, 153, 0.5)",
    glowSoft: "rgba(236, 72, 153, 0.2)",
  },
};

// Mood animation configurations
const moodAnimations = {
  neutral: {
    scale: [1, 1.02, 1],
    opacity: [0.9, 1, 0.9],
    duration: 4,
    ease: "easeInOut" as const,
  },
  thinking: {
    scale: [1, 1.08, 0.98, 1.05, 1],
    opacity: [0.8, 1, 0.85, 0.95, 0.8],
    duration: 2,
    ease: "easeInOut" as const,
  },
  listening: {
    scale: [1, 1.05, 1],
    opacity: [0.95, 1, 0.95],
    duration: 1.5,
    ease: "easeInOut" as const,
  },
  happy: {
    scale: [1, 1.15, 1, 1.1, 1],
    opacity: [1, 1, 1, 1, 1],
    duration: 0.8,
    ease: "easeOut" as const,
  },
  empathetic: {
    scale: [1, 1.03, 1],
    opacity: [0.85, 1, 0.85],
    duration: 3,
    ease: "easeInOut" as const,
  },
  curious: {
    scale: [1, 1.06, 0.98, 1.04, 1],
    opacity: [0.9, 1, 0.95, 1, 0.9],
    duration: 1.8,
    ease: "easeInOut" as const,
  },
  encouraging: {
    scale: [1, 1.1, 1.05, 1.08, 1],
    opacity: [1, 1, 1, 1, 1],
    duration: 1.2,
    ease: "easeOut" as const,
  },
  focused: {
    scale: [1, 1.01, 1],
    opacity: [0.95, 1, 0.95],
    duration: 2.5,
    ease: "easeInOut" as const,
  },
};

export function ElyaOrb({
  size = "md",
  mood = "neutral",
  mode = "default",
  isActive = true,
  className = ""
}: ElyaOrbProps) {
  const sizeStyles = sizeConfig[size];
  const colors = modeColors[mode];
  const animation = moodAnimations[mood];

  // Generate unique gradient for visual interest
  const gradientId = useMemo(() => `elya-gradient-${Math.random().toString(36).substr(2, 9)}`, []);
  const glowId = useMemo(() => `elya-glow-${Math.random().toString(36).substr(2, 9)}`, []);

  // Outer glow animation based on mood
  const glowAnimation = useMemo(() => {
    const baseGlow = sizeStyles.glow;
    switch (mood) {
      case "thinking":
        return {
          boxShadow: [
            `0 0 ${baseGlow}px ${colors.glow}, 0 0 ${baseGlow * 2}px ${colors.glowSoft}`,
            `0 0 ${baseGlow * 1.5}px ${colors.glow}, 0 0 ${baseGlow * 3}px ${colors.glowSoft}`,
            `0 0 ${baseGlow}px ${colors.glow}, 0 0 ${baseGlow * 2}px ${colors.glowSoft}`,
          ],
        };
      case "happy":
        return {
          boxShadow: [
            `0 0 ${baseGlow}px ${colors.glow}, 0 0 ${baseGlow * 2}px ${colors.glowSoft}`,
            `0 0 ${baseGlow * 2}px ${colors.glow}, 0 0 ${baseGlow * 4}px ${colors.glowSoft}`,
            `0 0 ${baseGlow}px ${colors.glow}, 0 0 ${baseGlow * 2}px ${colors.glowSoft}`,
          ],
        };
      case "encouraging":
        return {
          boxShadow: [
            `0 0 ${baseGlow * 1.2}px ${colors.glow}, 0 0 ${baseGlow * 2.5}px ${colors.glowSoft}`,
            `0 0 ${baseGlow * 1.8}px ${colors.glow}, 0 0 ${baseGlow * 3.5}px ${colors.glowSoft}`,
            `0 0 ${baseGlow * 1.2}px ${colors.glow}, 0 0 ${baseGlow * 2.5}px ${colors.glowSoft}`,
          ],
        };
      default:
        return {
          boxShadow: [
            `0 0 ${baseGlow}px ${colors.glow}, 0 0 ${baseGlow * 1.5}px ${colors.glowSoft}`,
            `0 0 ${baseGlow * 1.2}px ${colors.glow}, 0 0 ${baseGlow * 2}px ${colors.glowSoft}`,
            `0 0 ${baseGlow}px ${colors.glow}, 0 0 ${baseGlow * 1.5}px ${colors.glowSoft}`,
          ],
        };
    }
  }, [mood, colors, sizeStyles.glow]);

  // Inner orb rotation for visual depth
  const rotationAnimation = useMemo(() => {
    if (mood === "thinking") {
      return { rotate: [0, 360] };
    }
    if (mood === "curious") {
      return { rotate: [0, 15, -15, 10, -10, 0] };
    }
    return { rotate: 0 };
  }, [mood]);

  return (
    <motion.div
      className={`relative flex items-center justify-center ${sizeStyles.container} ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Outer glow ring */}
      <motion.div
        className={`absolute inset-0 rounded-full`}
        style={{
          background: `radial-gradient(circle, ${colors.glowSoft} 0%, transparent 70%)`,
        }}
        animate={isActive ? {
          ...glowAnimation,
          scale: animation.scale,
        } : {}}
        transition={{
          duration: animation.duration,
          repeat: Infinity,
          ease: animation.ease,
        }}
      />

      {/* Middle layer - softer glow */}
      <motion.div
        className={`absolute rounded-full ${sizeStyles.inner}`}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${colors.secondary}40, ${colors.primary}60, ${colors.tertiary}30)`,
          filter: "blur(2px)",
        }}
        animate={isActive ? {
          scale: animation.scale.map(s => s * 1.1),
          opacity: animation.opacity,
        } : {}}
        transition={{
          duration: animation.duration * 1.2,
          repeat: Infinity,
          ease: animation.ease,
        }}
      />

      {/* Core orb - main visual element */}
      <motion.div
        className={`relative rounded-full ${sizeStyles.inner} overflow-hidden`}
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.tertiary} 100%)`,
          boxShadow: `inset 0 -3px 8px rgba(0,0,0,0.2), inset 0 3px 8px rgba(255,255,255,0.3)`,
        }}
        animate={isActive ? {
          scale: animation.scale,
          ...rotationAnimation,
        } : {}}
        transition={{
          duration: mood === "thinking" ? 3 : animation.duration,
          repeat: Infinity,
          ease: animation.ease,
        }}
      >
        {/* Inner highlight - glass effect */}
        <motion.div
          className="absolute top-1 left-1 w-1/3 h-1/3 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)",
          }}
          animate={isActive ? {
            opacity: [0.5, 0.8, 0.5],
          } : {}}
          transition={{
            duration: animation.duration * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Particle effects for certain moods */}
        <AnimatePresence>
          {(mood === "happy" || mood === "encouraging") && isActive && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-white/60"
                  initial={{
                    opacity: 0,
                    scale: 0,
                    x: "50%",
                    y: "50%",
                  }}
                  animate={{
                    opacity: [0, 0.8, 0],
                    scale: [0, 1.5, 0],
                    x: [`50%`, `${20 + i * 30}%`],
                    y: [`50%`, `${10 + i * 25}%`],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Thinking ripple effect */}
        <AnimatePresence>
          {mood === "thinking" && isActive && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                border: `2px solid ${colors.secondary}`,
              }}
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{
                scale: [0.5, 1.2],
                opacity: [0.8, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Outer pulse ring for active states */}
      {isActive && (mood === "listening" || mood === "thinking") && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `1px solid ${colors.primary}`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
}

// Simple wrapper for backwards compatibility with existing avatar usage
export function ElyaAvatar({
  size = "md",
  isThinking = false,
  mode = "default",
  className = ""
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isThinking?: boolean;
  mode?: OrbMode;
  className?: string;
}) {
  return (
    <ElyaOrb
      size={size}
      mood={isThinking ? "thinking" : "neutral"}
      mode={mode}
      className={className}
    />
  );
}

export default ElyaOrb;
