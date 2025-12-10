"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Check, X, Sparkles, Award, MessageCircle, Brain, Shield, FileText } from "lucide-react";

type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [selectedTier, setSelectedTier] = useState<"growth" | "pro">("pro");
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

      const { data: prices, error: priceErr } = await (supabase as any)
        .from("billing_prices")
        .select("*")
        .eq("tier", selectedTier)
        .eq("cycle", selectedCycle)
        .eq("is_active", true)
        .limit(1);

      if (priceErr) {
        setError(`Database error: ${priceErr.message}`);
        return;
      }

      if (!prices || prices.length === 0) {
        setError(`No pricing found for ${selectedTier} ${selectedCycle}`);
        return;
      }

      const priceInfo = prices[0] as any;
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
      setError(err.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  const prices = {
    growth: { monthly: 15, yearly: 150 },
    pro: { monthly: 30, yearly: 300 },
  };

  const monthlyPrice = prices[selectedTier].monthly;
  const yearlyPrice = prices[selectedTier].yearly;
  const yearlyMonthlyEquivalent = Math.round(yearlyPrice / 12);
  const monthlySavingsPercent = Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full my-8">
          {/* Header */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-50">Upgrade Your Plan</h2>
                <p className="text-slate-400 mt-1">Support your interpreting practice with the right tools</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Step 1: Choose Plan */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-teal-500 text-slate-950 text-sm font-bold flex items-center justify-center">1</div>
                <h3 className="text-lg font-semibold text-slate-100">Choose your plan</h3>
              </div>

              <div className="grid gap-3">
                {/* Growth Plan */}
                <button
                  onClick={() => setSelectedTier("growth")}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedTier === "growth"
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedTier === "growth" ? "border-violet-500 bg-violet-500" : "border-slate-600"
                    }`}>
                      {selectedTier === "growth" && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-violet-400" />
                          <span className="text-lg font-semibold text-slate-50">Growth</span>
                        </div>
                        <span className="text-lg font-bold text-slate-50">${prices.growth.monthly}<span className="text-sm font-normal text-slate-400">/mo</span></span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">Daily AI support + introductory CEU workshops</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                        <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-violet-400" /> Unlimited Elya</span>
                        <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-violet-400" /> 0.1 RID CEU/mo</span>
                        <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-violet-400" /> Burnout monitoring</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Pro Plan */}
                <button
                  onClick={() => setSelectedTier("pro")}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all relative ${
                    selectedTier === "pro"
                      ? "border-teal-500 bg-teal-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="absolute -top-2.5 right-4">
                    <span className="px-2.5 py-1 rounded-full bg-teal-500 text-slate-950 text-xs font-bold">
                      Most Popular
                    </span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedTier === "pro" ? "border-teal-500 bg-teal-500" : "border-slate-600"
                    }`}>
                      {selectedTier === "pro" && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-teal-400" />
                          <span className="text-lg font-semibold text-slate-50">Pro</span>
                        </div>
                        <span className="text-lg font-bold text-slate-50">${prices.pro.monthly}<span className="text-sm font-normal text-slate-400">/mo</span></span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">Everything in Growth + RID-approved CEU workshops</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        <span className="flex items-center gap-1.5 text-slate-300"><Check className="w-3.5 h-3.5 text-teal-400" /> Everything in Growth</span>
                        <span className="flex items-center gap-1.5 text-teal-300 font-medium"><FileText className="w-3.5 h-3.5 text-teal-400" /> 0.3 RID CEUs/month</span>
                        <span className="flex items-center gap-1.5 text-slate-300"><Award className="w-3.5 h-3.5 text-teal-400" /> Official certificates</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Choose Billing */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-teal-500 text-slate-950 text-sm font-bold flex items-center justify-center">2</div>
                <h3 className="text-lg font-semibold text-slate-100">Choose billing cycle</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Monthly */}
                <button
                  onClick={() => setSelectedCycle("monthly")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedCycle === "monthly"
                      ? "border-teal-500 bg-teal-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-100">Monthly</span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedCycle === "monthly" ? "border-teal-500 bg-teal-500" : "border-slate-600"
                    }`}>
                      {selectedCycle === "monthly" && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-50">
                    ${monthlyPrice}<span className="text-sm font-normal text-slate-400">/mo</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Billed monthly, cancel anytime</p>
                </button>

                {/* Yearly */}
                <button
                  onClick={() => setSelectedCycle("yearly")}
                  className={`p-4 rounded-xl border-2 transition-all text-left relative ${
                    selectedCycle === "yearly"
                      ? "border-teal-500 bg-teal-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="absolute -top-2.5 right-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                      Save {monthlySavingsPercent}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-100">Yearly</span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedCycle === "yearly" ? "border-teal-500 bg-teal-500" : "border-slate-600"
                    }`}>
                      {selectedCycle === "yearly" && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-50">
                      ${yearlyMonthlyEquivalent}<span className="text-sm font-normal text-slate-400">/mo</span>
                    </span>
                    <span className="text-sm text-slate-500 line-through">${monthlyPrice}/mo</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    ${yearlyPrice} billed annually
                  </p>
                </button>
              </div>
            </div>

            {/* Value Summary for Pro */}
            {selectedTier === "pro" && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
                <h4 className="font-semibold text-slate-100 mb-2">What you get with Pro:</h4>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-start gap-2 text-slate-300">
                    <Check className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-teal-300">3 hours of RID-approved workshops</strong> each month (0.3 CEUs)</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-300">
                    <Check className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                    <span>Official CEU certificates for your RID records</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-300">
                    <Check className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                    <span>All Growth features: unlimited Elya, AI insights, prep/debrief tools</span>
                  </li>
                </ul>
                {selectedCycle === "yearly" && (
                  <div className="mt-3 pt-3 border-t border-teal-500/20">
                    <p className="text-sm text-emerald-400 font-medium">
                      With yearly billing, you get <strong>3.6 CEUs for ${yearlyPrice}</strong> - that's ${Math.round(yearlyPrice / 3.6)}/CEU!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800 bg-slate-950/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-slate-200 font-medium">
                  {selectedTier === "growth" ? "Growth" : "Pro"} &middot; {selectedCycle === "monthly" ? "Monthly" : "Yearly"}
                </p>
                <p className="text-sm text-slate-400">
                  {selectedCycle === "monthly" ? (
                    <>${monthlyPrice}/month</>
                  ) : (
                    <>${yearlyPrice}/year <span className="text-emerald-400">(${yearlyMonthlyEquivalent}/mo)</span></>
                  )}
                </p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-5 py-2.5 border border-slate-700 rounded-lg text-slate-300 font-medium hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Continue to Checkout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
