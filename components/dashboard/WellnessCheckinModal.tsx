"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

type WellnessCheckinModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCheckinAdded: () => void;
};

type FeelingOption = {
  value: "energized" | "calm" | "okay" | "drained" | "overwhelmed";
  label: string;
  emoji: string;
  description: string;
  color: string;
};

const feelingOptions: FeelingOption[] = [
  {
    value: "energized",
    label: "Energized",
    emoji: "🟢",
    description: "I feel motivated and full of energy",
    color: "emerald",
  },
  {
    value: "calm",
    label: "Calm",
    emoji: "🔵",
    description: "I feel peaceful and centered",
    color: "blue",
  },
  {
    value: "okay",
    label: "Okay",
    emoji: "🟡",
    description: "I'm managing, neither great nor bad",
    color: "amber",
  },
  {
    value: "drained",
    label: "Drained",
    emoji: "🟠",
    description: "I feel tired and low on resources",
    color: "orange",
  },
  {
    value: "overwhelmed",
    label: "Overwhelmed",
    emoji: "🔴",
    description: "I feel overloaded and stressed",
    color: "rose",
  },
];

export default function WellnessCheckinModal({
  isOpen,
  onClose,
  onCheckinAdded,
}: WellnessCheckinModalProps) {
  const [selectedFeeling, setSelectedFeeling] = useState<
    FeelingOption["value"] | null
  >(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedFeeling) return;

    setSaving(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("You must be logged in to add a check-in");
        setSaving(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("wellness_checkins")
        .insert({
          user_id: session.user.id,
          feeling: selectedFeeling,
          notes: notes.trim() || null,
        });

      if (insertError) throw insertError;

      // Reset form
      setSelectedFeeling(null);
      setNotes("");
      onCheckinAdded();
      onClose();
    } catch (err: any) {
      console.error("Error saving check-in:", err);
      setError(err.message || "Failed to save check-in");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedFeeling(null);
    setNotes("");
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    How are you feeling?
                  </h2>
                  <p className="text-xs text-slate-400">
                    Quick wellness check-in
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Feeling Options */}
                <div className="space-y-2 mb-4">
                  {feelingOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedFeeling(option.value)}
                      className={`w-full p-3 rounded-xl border transition-all text-left flex items-center gap-3 ${
                        selectedFeeling === option.value
                          ? `border-${option.color}-500/50 bg-${option.color}-500/10`
                          : "border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                      }`}
                    >
                      <span className="text-xl">{option.emoji}</span>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            selectedFeeling === option.value
                              ? `text-${option.color}-400`
                              : "text-slate-200"
                          }`}
                        >
                          {option.label}
                        </p>
                        <p className="text-xs text-slate-500">
                          {option.description}
                        </p>
                      </div>
                      {selectedFeeling === option.value && (
                        <svg
                          className={`w-5 h-5 text-${option.color}-400`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>

                {/* Optional Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Any notes? (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What's contributing to how you feel?"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none text-sm"
                    rows={2}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!selectedFeeling || saving}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    selectedFeeling && !saving
                      ? "bg-violet-500 hover:bg-violet-400 text-white"
                      : "bg-slate-700 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {saving ? "Saving..." : "Save Check-in"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
