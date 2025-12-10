"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [selectedTier, setSelectedTier] = useState<"growth" | "pro">("growth");
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setError("");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to upgrade");
        return;
      }

      // Get the correct price from billing_prices table
      console.log("Querying billing_prices for:", { tier: selectedTier, cycle: selectedCycle });
      const { data: prices, error: priceErr } = await (supabase as any)
        .from("billing_prices")
        .select("*")
        .eq("tier", selectedTier)
        .eq("cycle", selectedCycle)
        .eq("is_active", true)
        .limit(1);

      console.log("Query result:", { prices, priceErr });

      if (priceErr) {
        console.error("Database error:", priceErr);
        setError(`Database error: ${priceErr.message}`);
        return;
      }

      if (!prices || prices.length === 0) {
        console.error("No prices found for:", { tier: selectedTier, cycle: selectedCycle });
        setError(`No pricing found for ${selectedTier} ${selectedCycle}`);
        return;
      }

      const priceInfo = prices[0] as any;

      // Call your API to create Stripe checkout session
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const resp = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          price_id: priceInfo.stripe_price_id,
          mode: "subscription",
          tier: selectedTier,
          cycle: selectedCycle,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { url } = await resp.json();
      if (url) {
        window.location.href = url;
      } else {
        setError("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Upgrade error:", err);
      setError(err.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  const prices = {
    growth: { monthly: 15, yearly: 150 },
    pro: { monthly: 30, yearly: 300 },
  };

  const currentPrice = prices[selectedTier][selectedCycle];
  const monthlySavings = selectedCycle === "yearly"
    ? selectedTier === "growth" ? 30 : 60
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-50">Upgrade Your Plan</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tier Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Choose Your Plan
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedTier("growth")}
                className={`p-4 rounded-lg border transition-all ${
                  selectedTier === "growth"
                    ? "border-teal-400 bg-teal-500/10"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                }`}
              >
                <div className="text-lg font-semibold text-slate-50">Growth</div>
                <div className="text-sm text-slate-400">Unlimited Elya + Insights</div>
                <div className="text-xs text-teal-400 mt-1">$15/mo</div>
              </button>
              <button
                onClick={() => setSelectedTier("pro")}
                className={`p-4 rounded-lg border transition-all relative ${
                  selectedTier === "pro"
                    ? "border-teal-400 bg-teal-500/10"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                }`}
              >
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
                  CEU
                </div>
                <div className="text-lg font-semibold text-slate-50">Pro</div>
                <div className="text-sm text-slate-400">Growth + 0.2 RID CEUs/mo</div>
                <div className="text-xs text-teal-400 mt-1">$30/mo</div>
              </button>
            </div>
          </div>

          {/* Billing Cycle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Billing Cycle
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedCycle("monthly")}
                className={`p-4 rounded-lg border transition-all ${
                  selectedCycle === "monthly"
                    ? "border-teal-400 bg-teal-500/10"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                }`}
              >
                <div className="text-lg font-semibold text-slate-50">Monthly</div>
                <div className="text-sm text-slate-400">${prices[selectedTier].monthly}/mo</div>
              </button>
              <button
                onClick={() => setSelectedCycle("yearly")}
                className={`p-4 rounded-lg border transition-all relative ${
                  selectedCycle === "yearly"
                    ? "border-teal-400 bg-teal-500/10"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                }`}
              >
                <div className="absolute -top-2 -right-2 bg-teal-400 text-slate-950 text-xs font-semibold px-2 py-1 rounded">
                  Save ${monthlySavings}
                </div>
                <div className="text-lg font-semibold text-slate-50">Yearly</div>
                <div className="text-sm text-slate-400">${prices[selectedTier].yearly}/yr</div>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Summary */}
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300">Plan:</span>
              <span className="text-slate-50 font-semibold">
                {selectedTier === "growth" ? "Growth" : "Pro"} ({selectedCycle === "monthly" ? "Monthly" : "Yearly"})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Total:</span>
              <span className="text-2xl text-teal-400 font-bold">
                ${currentPrice}{selectedCycle === "monthly" ? "/mo" : "/yr"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-700 rounded-lg text-slate-300 font-medium hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-teal-400 rounded-lg text-slate-950 font-semibold hover:bg-teal-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Continue to Checkout"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
