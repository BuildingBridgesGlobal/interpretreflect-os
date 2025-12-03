"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Organization Info
  const [orgName, setOrgName] = useState("");
  const [subscriptionTier, setSubscriptionTier] = useState("enterprise");

  // Step 2: Invite Setup
  const [interpreterCount, setInterpreterCount] = useState("");
  const [interpreterEmails, setInterpreterEmails] = useState("");
  const [inviteMethod, setInviteMethod] = useState<"email" | "link">("link");

  // Step 3: Confirmation
  const [inviteLink, setInviteLink] = useState("");
  const [organizationId, setOrganizationId] = useState("");

  const handleStep1Submit = async () => {
    if (!orgName.trim()) {
      alert("Please enter an organization name");
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: orgName,
          admin_user_id: session.user.id,
          subscription_tier: subscriptionTier
        })
        .select()
        .single();

      if (orgError) {
        console.error("Error creating organization:", orgError);
        alert("Failed to create organization. Please try again.");
        setLoading(false);
        return;
      }

      // Update user's profile with organization_id and set role to admin
      const { error: profileError } = await (supabase as any)
        .from("profiles")
        .update({
          organization_id: org.id,
          role: "admin"
        })
        .eq("id", session.user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
      }

      setOrganizationId(org.id);
      setStep(2);
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    setLoading(true);

    try {
      if (inviteMethod === "link") {
        // Generate invite link
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/start?org=${organizationId}`;
        setInviteLink(link);
        setStep(3);
      } else {
        // Send email invites (would integrate with email service)
        // For now, just move to confirmation
        alert("Email invites feature coming soon! Use invite link for now.");
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/start?org=${organizationId}`;
        setInviteLink(link);
        setStep(3);
      }
    } catch (error) {
      console.error("Error generating invites:", error);
      alert("Failed to generate invites. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Welcome to InterpretReflect</h1>
          <p className="text-slate-300">Let's set up your organization</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-teal-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-teal-400 bg-teal-400/20' : 'border-slate-600'}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Organization</span>
            </div>

            <div className={`w-12 h-0.5 ${step > 1 ? 'bg-teal-400' : 'bg-slate-600'}`} />

            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-teal-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-teal-400 bg-teal-400/20' : 'border-slate-600'}`}>
                {step > 2 ? '✓' : '2'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Invite Team</span>
            </div>

            <div className={`w-12 h-0.5 ${step > 2 ? 'bg-teal-400' : 'bg-slate-600'}`} />

            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-teal-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-teal-400 bg-teal-400/20' : 'border-slate-600'}`}>
                3
              </div>
              <span className="text-sm font-medium hidden sm:inline">Done</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-8">
          {/* Step 1: Organization Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-50 mb-2">Organization Details</h2>
                <p className="text-sm text-slate-400">Tell us about your agency or program</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g., State Interpreting Services"
                    className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Subscription Tier
                  </label>
                  <select
                    value={subscriptionTier}
                    onChange={(e) => setSubscriptionTier(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    <option value="basic">Basic - $29/interpreter/month</option>
                    <option value="professional">Professional - $49/interpreter/month</option>
                    <option value="enterprise">Enterprise - Custom pricing</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleStep1Submit}
                  disabled={loading}
                  className="w-full px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-semibold hover:bg-teal-400 transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Continue"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Invite Setup */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-50 mb-2">Invite Your Team</h2>
                <p className="text-sm text-slate-400">How would you like to invite interpreters?</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Expected Number of Interpreters
                  </label>
                  <input
                    type="number"
                    value={interpreterCount}
                    onChange={(e) => setInterpreterCount(e.target.value)}
                    placeholder="e.g., 25"
                    className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Invite Method
                  </label>
                  <div className="space-y-3">
                    <div
                      onClick={() => setInviteMethod("link")}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        inviteMethod === "link"
                          ? "border-teal-500 bg-teal-500/10"
                          : "border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          inviteMethod === "link" ? "border-teal-500" : "border-slate-600"
                        }`}>
                          {inviteMethod === "link" && (
                            <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-100">Share Invite Link</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Get a unique link to share via email, Slack, or however you prefer
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => setInviteMethod("email")}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        inviteMethod === "email"
                          ? "border-teal-500 bg-teal-500/10"
                          : "border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          inviteMethod === "email" ? "border-teal-500" : "border-slate-600"
                        }`}>
                          {inviteMethod === "email" && (
                            <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-100">Send Email Invites</p>
                          <p className="text-xs text-slate-400 mt-1">
                            We'll send invitation emails directly to your team (coming soon)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {inviteMethod === "email" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Interpreter Email Addresses
                    </label>
                    <textarea
                      value={interpreterEmails}
                      onChange={(e) => setInterpreterEmails(e.target.value)}
                      placeholder="Enter email addresses, one per line&#10;sarah@example.com&#10;marcus@example.com"
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 rounded-lg border border-slate-600 text-slate-300 font-semibold hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleStep2Submit}
                  disabled={loading}
                  className="flex-1 px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-semibold hover:bg-teal-400 transition-colors disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Generate Invites"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-teal-500/20 border-2 border-teal-500 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✓</span>
                </div>
                <h2 className="text-xl font-semibold text-slate-50 mb-2">All Set!</h2>
                <p className="text-sm text-slate-400">Your organization has been created</p>
              </div>

              <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-5">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">Next Steps</h3>
                <ol className="space-y-2 text-sm text-slate-300">
                  <li className="flex gap-2">
                    <span className="text-blue-400">1.</span>
                    <span>Share the invite link below with your interpreters</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400">2.</span>
                    <span>They'll sign up and automatically join your organization</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400">3.</span>
                    <span>Track their progress in your admin dashboard</span>
                  </li>
                </ol>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Invite Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-semibold hover:bg-teal-400 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Anyone with this link can join your organization. Keep it secure.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => router.push("/admin")}
                  className="w-full px-6 py-3 rounded-lg bg-violet-500 text-white font-semibold hover:bg-violet-400 transition-colors"
                >
                  Go to Admin Dashboard
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Set up another organization
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
