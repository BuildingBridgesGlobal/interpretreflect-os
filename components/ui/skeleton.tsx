"use client";

import { motion } from "framer-motion";

// ============================================================================
// SKELETON LOADING COMPONENTS
// Modern shimmer effect loading states
// ============================================================================

interface SkeletonProps {
  className?: string;
}

// Base skeleton with shimmer animation
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-slate-800/50 ${className}`}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-700/30 to-transparent"
        animate={{ translateX: ["100%", "-100%"] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
}

// Card skeleton
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

// List item skeleton
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/30 bg-slate-800/20">
      <Skeleton className="w-12 h-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="w-16 h-8 rounded-lg" />
    </div>
  );
}

// Dashboard stats skeleton
export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

// Chat message skeleton
export function SkeletonMessage({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />}
      <div className={`space-y-2 max-w-md ${isUser ? "items-end" : ""}`}>
        <Skeleton className={`h-4 ${isUser ? "w-48" : "w-64"}`} />
        <Skeleton className={`h-4 ${isUser ? "w-32" : "w-56"}`} />
        {!isUser && <Skeleton className="h-4 w-40" />}
      </div>
    </div>
  );
}

// Module card skeleton
export function SkeletonModule() {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

// Assignment card skeleton
export function SkeletonAssignment() {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-6 w-3/4" />
        </div>
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

// Full page loading skeleton
export function SkeletonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>

        {/* Stats */}
        <SkeletonStats />

        {/* Main content */}
        <div className="grid md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* List */}
        <div className="space-y-3">
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </div>
      </div>
    </div>
  );
}

// Dashboard loading skeleton
export function SkeletonDashboard() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-180px)]">
      {/* Main chat area */}
      <div className="flex-1 lg:w-[70%] flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="flex-1 rounded-2xl border border-slate-700/50 bg-slate-800/20 p-4">
          <div className="space-y-4">
            <SkeletonMessage />
            <SkeletonMessage isUser />
            <SkeletonMessage />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:w-[30%] space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
