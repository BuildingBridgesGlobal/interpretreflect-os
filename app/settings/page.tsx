"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Billing Tab Component
function BillingTab({ userData, showMessage }: { userData: any; showMessage: (type: "success" | "error", text: string) => void }) {
  const [credits, setCredits] = useState({ monthly: 0, topup: 0, total: 0 });
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const tier = userData?.subscription_tier || "free";
  const cycle = userData?.subscription_cycle || "monthly";
  const status = userData?.subscription_status || "active";

  // Load credits on mount
  useEffect(() => {
    const loadCredits = async () => {
      if (tier !== "pro") {
        setLoadingCredits(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        const response = await fetch("/api/ceu?action=credits", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setCredits({
            monthly: data.monthly_credits || 0,
            topup: data.topup_credits || 0,
            total: (data.monthly_credits || 0) + (data.topup_credits || 0),
          });
        }
      } catch (error) {
        console.error("Error loading credits:", error);
      } finally {
        setLoadingCredits(false);
      }
    };

    loadCredits();
  }, [tier]);

  // Load billing history
  useEffect(() => {
    const loadHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        // Fetch credit transactions as billing history
        // Use type assertion since table may not be in schema yet
        const { data, error } = await (supabase as any)
          .from("credit_transactions")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!error && data) {
          setBillingHistory(data);
        }
      } catch (error) {
        console.error("Error loading billing history:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, []);

  // Handle upgrade
  const handleUpgrade = async (targetTier: "growth" | "pro", targetCycle: "monthly" | "yearly") => {
    setLoadingCheckout(`${targetTier}-${targetCycle}`);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showMessage("error", "Please sign in to upgrade");
      setLoadingCheckout(null);
      return;
    }

    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tier: targetTier, cycle: targetCycle }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showMessage("error", data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      showMessage("error", "Failed to start checkout");
    } finally {
      setLoadingCheckout(null);
    }
  };

  // Handle top-up purchase
  const handleTopUp = async (packageName: string) => {
    setLoadingCheckout(`topup-${packageName}`);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showMessage("error", "Please sign in to purchase credits");
      setLoadingCheckout(null);
      return;
    }

    try {
      const response = await fetch("/api/credits/topup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ package: packageName }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showMessage("error", data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Top-up error:", error);
      showMessage("error", "Failed to start checkout");
    } finally {
      setLoadingCheckout(null);
    }
  };

  // Handle manage subscription (Stripe Customer Portal)
  const handleManageSubscription = async () => {
    setLoadingCheckout("manage");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showMessage("error", "Please sign in");
      setLoadingCheckout(null);
      return;
    }

    try {
      const response = await fetch("/api/create-portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showMessage("error", data.error || "Failed to open billing portal");
      }
    } catch (error) {
      console.error("Portal error:", error);
      showMessage("error", "Failed to open billing portal");
    } finally {
      setLoadingCheckout(null);
    }
  };

  const getTierDisplay = () => {
    switch (tier) {
      case "pro":
        return { name: "Pro", color: "violet", price: cycle === "yearly" ? "$300/year" : "$30/month" };
      case "growth":
        return { name: "Growth", color: "teal", price: cycle === "yearly" ? "$150/year" : "$15/month" };
      default:
        return { name: "Free", color: "slate", price: "$0" };
    }
  };

  const tierDisplay = getTierDisplay();

  return (
    <div className="max-w-2xl space-y-6">
      {/* Current Plan Card */}
      <div className={`rounded-xl border ${
        tier === "pro" ? "border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-purple-500/10" :
        tier === "growth" ? "border-teal-500/50 bg-gradient-to-br from-teal-500/10 to-emerald-500/10" :
        "border-slate-600 bg-slate-900/50"
      } p-6`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Current Plan</h3>
            <p className={`text-sm mt-1 ${
              tier === "pro" ? "text-violet-400" :
              tier === "growth" ? "text-teal-400" :
              "text-slate-400"
            }`}>
              {tierDisplay.name} Plan
            </p>
          </div>
          <div className="flex items-center gap-2">
            {status === "active" && tier !== "free" && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                Active
              </span>
            )}
            {status === "past_due" && (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                Past Due
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-400">Price</p>
            <p className={`text-xl font-bold ${
              tier === "pro" ? "text-violet-400" :
              tier === "growth" ? "text-teal-400" :
              "text-slate-400"
            }`}>
              {tierDisplay.price}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-400">CEU Credits</p>
            <p className="text-xl font-bold text-amber-400">
              {tier === "pro" ? "4/mo" : "0"}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-400">Elya</p>
            <p className="text-xl font-bold text-emerald-400">
              {tier === "free" ? "5/mo" : "Unlimited"}
            </p>
          </div>
        </div>

        {/* Tier Actions */}
        {tier === "free" && (
          <div className="space-y-2">
            <button
              onClick={() => handleUpgrade("growth", "monthly")}
              disabled={loadingCheckout !== null}
              className="w-full px-4 py-2 rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-400 transition-colors disabled:opacity-50"
            >
              {loadingCheckout === "growth-monthly" ? "Loading..." : "Upgrade to Growth - $15/mo"}
            </button>
            <button
              onClick={() => handleUpgrade("pro", "monthly")}
              disabled={loadingCheckout !== null}
              className="w-full px-4 py-2 rounded-lg bg-violet-500 text-white font-medium hover:bg-violet-400 transition-colors disabled:opacity-50"
            >
              {loadingCheckout === "pro-monthly" ? "Loading..." : "Upgrade to Pro - $30/mo"}
            </button>
          </div>
        )}

        {tier === "growth" && (
          <div className="space-y-2">
            <button
              onClick={() => handleUpgrade("pro", "monthly")}
              disabled={loadingCheckout !== null}
              className="w-full px-4 py-2 rounded-lg bg-violet-500 text-white font-medium hover:bg-violet-400 transition-colors disabled:opacity-50"
            >
              {loadingCheckout === "pro-monthly" ? "Loading..." : "Upgrade to Pro - $30/mo"}
            </button>
            <button
              onClick={handleManageSubscription}
              disabled={loadingCheckout !== null}
              className="w-full px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loadingCheckout === "manage" ? "Loading..." : "Manage Subscription"}
            </button>
          </div>
        )}

        {tier === "pro" && (
          <button
            onClick={handleManageSubscription}
            disabled={loadingCheckout !== null}
            className="w-full px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loadingCheckout === "manage" ? "Loading..." : "Manage Subscription"}
          </button>
        )}
      </div>

      {/* CEU Credits Card (Pro only) */}
      {tier === "pro" && (
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">CEU Credits</h3>
              <p className="text-sm text-slate-400">Use credits to access CEU modules</p>
            </div>
          </div>

          {loadingCredits ? (
            <div className="text-center py-4 text-slate-400">Loading credits...</div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-400">Monthly</p>
                  <p className="text-2xl font-bold text-amber-400">{credits.monthly}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-400">Top-Up</p>
                  <p className="text-2xl font-bold text-teal-400">{credits.topup}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-800/50 border border-amber-500/30">
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-2xl font-bold text-white">{credits.total}</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Monthly credits refresh on your billing date. Top-up credits never expire.
              </p>

              {/* Top-Up Packages */}
              <div className="border-t border-slate-700 pt-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Buy More Credits</h4>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleTopUp("small")}
                    disabled={loadingCheckout !== null}
                    className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-teal-500/50 hover:bg-slate-800 transition-all text-center disabled:opacity-50"
                  >
                    <p className="text-lg font-bold text-teal-400">2</p>
                    <p className="text-xs text-slate-400">credits</p>
                    <p className="text-sm font-medium text-slate-200 mt-1">$5</p>
                  </button>
                  <button
                    onClick={() => handleTopUp("medium")}
                    disabled={loadingCheckout !== null}
                    className="p-3 rounded-lg border border-teal-500/50 bg-teal-500/10 hover:bg-teal-500/20 transition-all text-center relative disabled:opacity-50"
                  >
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-teal-500 text-white text-[10px] font-medium rounded-full">
                      Best Value
                    </span>
                    <p className="text-lg font-bold text-teal-400">4</p>
                    <p className="text-xs text-slate-400">credits</p>
                    <p className="text-sm font-medium text-slate-200 mt-1">$8</p>
                  </button>
                  <button
                    onClick={() => handleTopUp("large")}
                    disabled={loadingCheckout !== null}
                    className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-teal-500/50 hover:bg-slate-800 transition-all text-center disabled:opacity-50"
                  >
                    <p className="text-lg font-bold text-teal-400">8</p>
                    <p className="text-xs text-slate-400">credits</p>
                    <p className="text-sm font-medium text-slate-200 mt-1">$14</p>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Plan Comparison */}
      <div className="rounded-xl border border-slate-600 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Compare Plans</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-2 px-3 text-left text-slate-400 font-medium">Feature</th>
                <th className="py-2 px-3 text-center text-slate-400 font-medium">Free</th>
                <th className="py-2 px-3 text-center text-teal-400 font-medium">Growth</th>
                <th className="py-2 px-3 text-center text-violet-400 font-medium">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="py-2 px-3 text-slate-300">Elya Conversations</td>
                <td className="py-2 px-3 text-center text-slate-400">5/month</td>
                <td className="py-2 px-3 text-center text-teal-400">Unlimited</td>
                <td className="py-2 px-3 text-center text-violet-400">Unlimited</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-300">Assignment Prep & Debrief</td>
                <td className="py-2 px-3 text-center text-slate-500">-</td>
                <td className="py-2 px-3 text-center text-teal-400">✓</td>
                <td className="py-2 px-3 text-center text-violet-400">✓</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-300">AI Insights & Patterns</td>
                <td className="py-2 px-3 text-center text-slate-500">-</td>
                <td className="py-2 px-3 text-center text-teal-400">✓</td>
                <td className="py-2 px-3 text-center text-violet-400">✓</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-300">Burnout Monitoring</td>
                <td className="py-2 px-3 text-center text-slate-500">-</td>
                <td className="py-2 px-3 text-center text-teal-400">✓</td>
                <td className="py-2 px-3 text-center text-violet-400">✓</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-300">CEU Credits</td>
                <td className="py-2 px-3 text-center text-slate-500">-</td>
                <td className="py-2 px-3 text-center text-slate-500">-</td>
                <td className="py-2 px-3 text-center text-amber-400">4/month</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-300">CEU Modules & Certificates</td>
                <td className="py-2 px-3 text-center text-slate-500">-</td>
                <td className="py-2 px-3 text-center text-slate-500">-</td>
                <td className="py-2 px-3 text-center text-violet-400">✓</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-300">Credit Top-Ups</td>
                <td className="py-2 px-3 text-center text-slate-500">-</td>
                <td className="py-2 px-3 text-center text-slate-500">-</td>
                <td className="py-2 px-3 text-center text-violet-400">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex gap-3 text-center text-xs text-slate-500">
          <span className="flex-1">$0/month</span>
          <span className="flex-1">$15/month</span>
          <span className="flex-1">$30/month</span>
        </div>
      </div>

      {/* Credit Transaction History (Pro only) */}
      {tier === "pro" && (
        <div className="rounded-xl border border-slate-600 bg-slate-900/50 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Credit History</h3>
          {loadingHistory ? (
            <div className="text-center py-4 text-slate-400">Loading...</div>
          ) : billingHistory.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No credit transactions yet</p>
          ) : (
            <div className="space-y-2">
              {billingHistory.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tx.amount > 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
                    }`}>
                      {tx.amount > 0 ? (
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-200">{tx.description}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${tx.amount > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount} credits
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Credential {
  id: string;
  credential_type: string;
  credential_name: string;
  issuing_organization: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  status: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<"account" | "profile" | "agencies" | "credentials" | "preferences" | "billing" | "privacy">("account");

  // Account form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Credentials states
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [credentialForm, setCredentialForm] = useState({
    credential_type: "certification",
    credential_name: "",
    issuing_organization: "",
    issue_date: "",
    expiration_date: "",
  });

  // Community Profile form states
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [openToMentoring, setOpenToMentoring] = useState(false);

  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [communityUpdates, setCommunityUpdates] = useState(true);
  const [trainingReminders, setTrainingReminders] = useState(true);

  // Privacy
  const [profileVisibility, setProfileVisibility] = useState("everyone");
  const [dataSharing, setDataSharing] = useState("anonymous");

  // Agency Privacy - data sharing preferences per agency
  interface AgencyMembership {
    id: string;
    organization_id: string;
    role: string;
    status: string;
    data_sharing_preferences: {
      share_prep_completion: boolean;
      share_debrief_completion: boolean;
      share_credential_status: boolean;
      share_checkin_streaks: boolean;
      share_module_progress: boolean;
    };
    organizations: {
      id: string;
      name: string;
    } | null;
  }
  const [agencyMemberships, setAgencyMemberships] = useState<AgencyMembership[]>([]);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [savingAgencyPrefs, setSavingAgencyPrefs] = useState<string | null>(null);

  // My Agencies tab state
  interface ConnectedAgency {
    id: string;
    organization_id: string;
    role: string;
    status: string;
    joined_at: string | null;
    organizations: { id: string; name: string } | null;
  }
  const [connectedAgencies, setConnectedAgencies] = useState<ConnectedAgency[]>([]);
  const [loadingConnectedAgencies, setLoadingConnectedAgencies] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [connectingToAgency, setConnectingToAgency] = useState(false);
  const [disconnectingAgency, setDisconnectingAgency] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setUserData(profile);

      // Populate form fields
      if (profile) {
        const profileData = profile as any;
        // Account
        setFullName(profileData.full_name || "");
        setEmail(session.user.email || "");
        // Community Profile
        setBio(profileData.bio || "");
        setLinkedinUrl(profileData.linkedin_url || "");
        setOpenToMentoring(profileData.open_to_mentoring || false);
        // Preferences
        setEmailNotifications(profileData.email_notifications ?? true);
        setWeeklyReports(profileData.weekly_reports ?? true);
        setCommunityUpdates(profileData.community_updates ?? true);
        setTrainingReminders(profileData.training_reminders ?? true);
        // Privacy
        setProfileVisibility(profileData.profile_visibility || "everyone");
        setDataSharing(profileData.data_sharing || "anonymous");
      }

      setLoading(false);
    };
    loadUserData();
  }, [router]);

  // Helper to show save feedback
  const showMessage = (type: "success" | "error", text: string) => {
    setSaveMessage({ type, text });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleSaveAccount = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showMessage("error", "Session expired. Please sign in again.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        updated_at: new Date().toISOString()
      })
      .eq("id", session.user.id);

    setSaving(false);
    if (error) {
      showMessage("error", "Failed to save. Please try again.");
      console.error("Save error:", error);
    } else {
      showMessage("success", "Account settings saved!");
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showMessage("error", "Session expired. Please sign in again.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        bio,
        linkedin_url: linkedinUrl,
        open_to_mentoring: openToMentoring,
        updated_at: new Date().toISOString()
      })
      .eq("id", session.user.id);

    setSaving(false);
    if (error) {
      showMessage("error", "Failed to save. Please try again.");
      console.error("Save error:", error);
    } else {
      showMessage("success", "Profile saved!");
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showMessage("error", "Session expired. Please sign in again.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        email_notifications: emailNotifications,
        weekly_reports: weeklyReports,
        community_updates: communityUpdates,
        training_reminders: trainingReminders,
        updated_at: new Date().toISOString()
      })
      .eq("id", session.user.id);

    setSaving(false);
    if (error) {
      showMessage("error", "Failed to save. Please try again.");
      console.error("Save error:", error);
    } else {
      showMessage("success", "Preferences saved!");
    }
  };

  const handleSavePrivacy = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showMessage("error", "Session expired. Please sign in again.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        profile_visibility: profileVisibility,
        data_sharing: dataSharing,
        updated_at: new Date().toISOString()
      })
      .eq("id", session.user.id);

    setSaving(false);
    if (error) {
      showMessage("error", "Failed to save. Please try again.");
      console.error("Save error:", error);
    } else {
      showMessage("success", "Privacy settings saved!");
    }
  };

  // Load connected agencies for My Agencies tab
  const loadConnectedAgencies = async () => {
    setLoadingConnectedAgencies(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const response = await fetch("/api/interpreter/agencies", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConnectedAgencies(data.agencies || []);
      }
    } catch (error) {
      console.error("Error loading connected agencies:", error);
    } finally {
      setLoadingConnectedAgencies(false);
    }
  };

  // Connect to agency using invite code
  const handleConnectToAgency = async () => {
    if (!inviteCode.trim()) {
      showMessage("error", "Please enter an invite code");
      return;
    }

    setConnectingToAgency(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showMessage("error", "Session expired. Please sign in again.");
      setConnectingToAgency(false);
      return;
    }

    try {
      const response = await fetch("/api/interpreter/agencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "connect",
          code: inviteCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage("success", data.message || "Successfully connected to agency!");
        setInviteCode("");
        loadConnectedAgencies();
        // Also refresh the privacy memberships
        loadAgencyMemberships();
      } else {
        showMessage("error", data.error || "Failed to connect to agency");
      }
    } catch (error) {
      console.error("Error connecting to agency:", error);
      showMessage("error", "Failed to connect. Please try again.");
    } finally {
      setConnectingToAgency(false);
    }
  };

  // Disconnect from agency
  const handleDisconnectFromAgency = async (membershipId: string, agencyName: string) => {
    if (!confirm(`Are you sure you want to disconnect from ${agencyName}? You can reconnect using an invite code later.`)) {
      return;
    }

    setDisconnectingAgency(membershipId);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showMessage("error", "Session expired. Please sign in again.");
      setDisconnectingAgency(null);
      return;
    }

    try {
      const response = await fetch("/api/interpreter/agencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "disconnect",
          membership_id: membershipId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage("success", data.message || "Disconnected from agency");
        loadConnectedAgencies();
        // Also refresh the privacy memberships
        loadAgencyMemberships();
      } else {
        showMessage("error", data.error || "Failed to disconnect");
      }
    } catch (error) {
      console.error("Error disconnecting from agency:", error);
      showMessage("error", "Failed to disconnect. Please try again.");
    } finally {
      setDisconnectingAgency(null);
    }
  };

  // Load agency memberships for privacy settings
  const loadAgencyMemberships = async () => {
    setLoadingAgencies(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const response = await fetch("/api/interpreter/privacy", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAgencyMemberships(data.memberships || []);
      }
    } catch (error) {
      console.error("Error loading agency memberships:", error);
    } finally {
      setLoadingAgencies(false);
    }
  };

  // Save agency data sharing preferences
  const handleSaveAgencyPreferences = async (membershipId: string, preferences: AgencyMembership["data_sharing_preferences"]) => {
    setSavingAgencyPrefs(membershipId);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showMessage("error", "Session expired. Please sign in again.");
      setSavingAgencyPrefs(null);
      return;
    }

    try {
      const response = await fetch("/api/interpreter/privacy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          membership_id: membershipId,
          preferences,
        }),
      });

      if (response.ok) {
        showMessage("success", "Agency privacy settings saved!");
      } else {
        const data = await response.json();
        showMessage("error", data.error || "Failed to save agency preferences");
      }
    } catch (error) {
      console.error("Error saving agency preferences:", error);
      showMessage("error", "Failed to save. Please try again.");
    } finally {
      setSavingAgencyPrefs(null);
    }
  };

  // Toggle a specific preference for an agency
  const toggleAgencyPreference = (membershipId: string, key: keyof AgencyMembership["data_sharing_preferences"]) => {
    setAgencyMemberships(prev => prev.map(m => {
      if (m.id === membershipId) {
        return {
          ...m,
          data_sharing_preferences: {
            ...m.data_sharing_preferences,
            [key]: !m.data_sharing_preferences[key],
          },
        };
      }
      return m;
    }));
  };

  // Load credentials
  const loadCredentials = async () => {
    setLoadingCredentials(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("credentials")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCredentials(data);
    }
    setLoadingCredentials(false);
  };

  // Load credentials when tab changes
  useEffect(() => {
    if (selectedTab === "credentials" && credentials.length === 0) {
      loadCredentials();
    }
  }, [selectedTab]);

  // Load agencies when My Agencies tab is selected
  useEffect(() => {
    if (selectedTab === "agencies" && connectedAgencies.length === 0) {
      loadConnectedAgencies();
    }
  }, [selectedTab]);

  // Load agency memberships when privacy tab is selected
  useEffect(() => {
    if (selectedTab === "privacy" && agencyMemberships.length === 0) {
      loadAgencyMemberships();
    }
  }, [selectedTab]);

  const handleOpenCredentialModal = (credential?: Credential) => {
    if (credential) {
      setEditingCredential(credential);
      setCredentialForm({
        credential_type: credential.credential_type,
        credential_name: credential.credential_name,
        issuing_organization: credential.issuing_organization || "",
        issue_date: credential.issue_date || "",
        expiration_date: credential.expiration_date || "",
      });
    } else {
      setEditingCredential(null);
      setCredentialForm({
        credential_type: "certification",
        credential_name: "",
        issuing_organization: "",
        issue_date: "",
        expiration_date: "",
      });
    }
    setShowCredentialModal(true);
  };

  const handleSaveCredential = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showMessage("error", "Session expired. Please sign in again.");
      setSaving(false);
      return;
    }

    if (!credentialForm.credential_name.trim()) {
      showMessage("error", "Credential name is required");
      setSaving(false);
      return;
    }

    const credentialData = {
      user_id: session.user.id,
      credential_type: credentialForm.credential_type,
      credential_name: credentialForm.credential_name.trim(),
      issuing_organization: credentialForm.issuing_organization.trim() || null,
      issue_date: credentialForm.issue_date || null,
      expiration_date: credentialForm.expiration_date || null,
    };

    if (editingCredential) {
      // Update existing
      const { error } = await supabase
        .from("credentials")
        .update(credentialData)
        .eq("id", editingCredential.id);

      if (error) {
        showMessage("error", "Failed to update credential");
        console.error("Update error:", error);
      } else {
        showMessage("success", "Credential updated!");
        setShowCredentialModal(false);
        loadCredentials();
      }
    } else {
      // Create new
      const { error } = await supabase
        .from("credentials")
        .insert(credentialData);

      if (error) {
        showMessage("error", "Failed to add credential");
        console.error("Insert error:", error);
      } else {
        showMessage("success", "Credential added!");
        setShowCredentialModal(false);
        loadCredentials();
      }
    }
    setSaving(false);
  };

  const handleDeleteCredential = async (credentialId: string) => {
    if (!confirm("Are you sure you want to delete this credential?")) return;

    const { error } = await supabase
      .from("credentials")
      .delete()
      .eq("id", credentialId);

    if (error) {
      showMessage("error", "Failed to delete credential");
      console.error("Delete error:", error);
    } else {
      showMessage("success", "Credential deleted");
      loadCredentials();
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400";
      case "expiring_soon":
        return "bg-amber-500/20 border border-amber-500/30 text-amber-400";
      case "expired":
        return "bg-rose-500/20 border border-rose-500/30 text-rose-400";
      default:
        return "bg-slate-500/20 border border-slate-500/30 text-slate-400";
    }
  };

  const formatCredentialStatus = (status: string | null) => {
    switch (status) {
      case "active":
        return "Active";
      case "expiring_soon":
        return "Expiring Soon";
      case "expired":
        return "Expired";
      default:
        return status || "Active";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Minimal Header with Back Button */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-50">Settings</h1>
          <p className="mt-1 text-sm text-slate-300">Manage your account, preferences, and privacy</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-slate-800 overflow-x-auto">
          {[
            { key: "account", label: "Account" },
            { key: "profile", label: "Community Profile" },
            { key: "agencies", label: "My Agencies" },
            { key: "credentials", label: "Credentials" },
            { key: "preferences", label: "Preferences" },
            { key: "billing", label: "Billing" },
            { key: "privacy", label: "Privacy & Data" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                selectedTab === tab.key
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {/* Save Message Toast */}
        {saveMessage && (
          <div className={`fixed top-20 right-6 px-4 py-3 rounded-lg shadow-lg z-50 ${
            saveMessage.type === "success"
              ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
              : "bg-rose-500/20 border border-rose-500/50 text-rose-400"
          }`}>
            {saveMessage.text}
          </div>
        )}

        {selectedTab === "account" && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-xl border border-slate-600 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Account Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <p className="text-xs text-slate-500 mt-1">This name will be used across the platform</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                </div>

                <button
                  onClick={handleSaveAccount}
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-rose-500/50 bg-rose-500/5 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Danger Zone</h3>
              <p className="text-sm text-slate-300 mb-4">Irreversible actions</p>
              <button className="px-4 py-2 rounded-lg border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        )}

        {selectedTab === "profile" && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-xl border border-slate-600 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Community Profile</h3>
              <p className="text-sm text-slate-300 mb-4">This information is visible to other interpreters in the Community tab</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Tell other interpreters about yourself, your specialties, and what you're passionate about..."
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <p className="text-xs text-slate-500 mt-1">Max 500 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">LinkedIn Profile (Optional)</label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                  <div>
                    <p className="text-sm font-medium text-slate-100">Open to Mentoring</p>
                    <p className="text-xs text-slate-400">Show up in mentor recommendations for other interpreters</p>
                  </div>
                  <button
                    onClick={() => setOpenToMentoring(!openToMentoring)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      openToMentoring ? "bg-teal-500" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                        openToMentoring ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "agencies" && (
          <div className="max-w-2xl space-y-6">
            {/* Connect to Agency */}
            <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Connect to Agency</h3>
                  <p className="text-sm text-slate-400">Enter the invite code provided by your agency</p>
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter code (e.g., ACME-1234)"
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400 uppercase tracking-wider font-mono"
                  maxLength={20}
                />
                <button
                  onClick={handleConnectToAgency}
                  disabled={connectingToAgency || !inviteCode.trim()}
                  className="px-6 py-3 rounded-lg bg-violet-500 text-white font-medium hover:bg-violet-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {connectingToAgency ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Connect
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Connected Agencies List */}
            <div className="rounded-xl border border-slate-600 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Your Agencies</h3>

              {loadingConnectedAgencies ? (
                <div className="text-center py-8 text-slate-400">Loading agencies...</div>
              ) : connectedAgencies.length === 0 ? (
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">No agencies connected yet</p>
                  <p className="text-xs text-slate-500">Get an invite code from your agency to connect and sync your data.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {connectedAgencies.map((agency) => (
                    <div key={agency.id} className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <span className="text-violet-400 font-bold text-sm">
                              {agency.organizations?.name?.charAt(0) || "A"}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-100">
                              {agency.organizations?.name || "Agency"}
                            </h4>
                            <p className="text-xs text-slate-500">
                              Connected {agency.joined_at ? new Date(agency.joined_at).toLocaleDateString() : "recently"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                            Active
                          </span>
                          <button
                            onClick={() => handleDisconnectFromAgency(agency.id, agency.organizations?.name || "this agency")}
                            disabled={disconnectingAgency === agency.id}
                            className="text-xs text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-50"
                          >
                            {disconnectingAgency === agency.id ? "Disconnecting..." : "Disconnect"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">How Agency Connections Work</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>You can connect to <strong className="text-slate-100">multiple agencies</strong> simultaneously</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Control what data each agency sees in <strong className="text-slate-100">Privacy & Data</strong> settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Disconnect anytime - <strong className="text-slate-100">you're always in control</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Your debrief content and wellness details are <strong className="text-slate-100">never shared</strong></span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {selectedTab === "credentials" && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-xl border border-slate-600 bg-slate-900/50 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-1">Professional Credentials</h3>
                  <p className="text-sm text-slate-300">Manage your certifications, licenses, and professional credentials</p>
                </div>
                <button
                  onClick={() => handleOpenCredentialModal()}
                  className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Credential
                </button>
              </div>

              <div className="space-y-3">
                {loadingCredentials ? (
                  <div className="text-center py-8 text-slate-400">Loading credentials...</div>
                ) : credentials.length === 0 ? (
                  <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">No credentials added yet</p>
                    <button
                      onClick={() => handleOpenCredentialModal()}
                      className="text-sm text-teal-400 hover:text-teal-300"
                    >
                      Add your first credential
                    </button>
                  </div>
                ) : (
                  credentials.map((cred) => (
                    <div key={cred.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(cred.status)}`}>
                              {formatCredentialStatus(cred.status)}
                            </span>
                            <h4 className="text-sm font-semibold text-slate-100">{cred.credential_name}</h4>
                          </div>
                          <p className="text-xs text-slate-500 mb-1 capitalize">{cred.credential_type}</p>
                          {cred.issuing_organization && (
                            <p className="text-xs text-slate-400 mb-1">Issued by: {cred.issuing_organization}</p>
                          )}
                          <div className="flex gap-4 mt-2">
                            {cred.issue_date && (
                              <p className="text-xs text-slate-400">
                                Issued: {new Date(cred.issue_date).toLocaleDateString()}
                              </p>
                            )}
                            {cred.expiration_date && (
                              <p className={`text-xs ${cred.status === "expired" ? "text-rose-400" : cred.status === "expiring_soon" ? "text-amber-400" : "text-slate-400"}`}>
                                Expires: {new Date(cred.expiration_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenCredentialModal(cred)}
                            className="text-xs text-teal-400 hover:text-teal-300 px-2 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCredential(cred.id)}
                            className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/50 bg-blue-500/10 p-5">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">Credential Reminders</h3>
              <p className="text-sm text-slate-300">
                We'll notify you 3 months before any credential expires so you have time to renew. All credentials are stored securely and your agency can view your credential status.
              </p>
            </div>
          </div>
        )}

        {/* Credential Add/Edit Modal */}
        {showCredentialModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-100">
                    {editingCredential ? "Edit Credential" : "Add Credential"}
                  </h2>
                  <button
                    onClick={() => setShowCredentialModal(false)}
                    className="text-slate-400 hover:text-slate-300"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Credential Type</label>
                    <select
                      value={credentialForm.credential_type}
                      onChange={(e) => setCredentialForm({ ...credentialForm, credential_type: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                      <option value="certification">Certification</option>
                      <option value="license">License</option>
                      <option value="degree">Degree</option>
                      <option value="training">Training/CEU</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Credential Name *</label>
                    <input
                      type="text"
                      value={credentialForm.credential_name}
                      onChange={(e) => setCredentialForm({ ...credentialForm, credential_name: e.target.value })}
                      placeholder="e.g., NIC Certification, State License"
                      className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Issuing Organization</label>
                    <input
                      type="text"
                      value={credentialForm.issuing_organization}
                      onChange={(e) => setCredentialForm({ ...credentialForm, issuing_organization: e.target.value })}
                      placeholder="e.g., RID, State Board"
                      className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Issue Date</label>
                      <input
                        type="date"
                        value={credentialForm.issue_date}
                        onChange={(e) => setCredentialForm({ ...credentialForm, issue_date: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Expiration Date</label>
                      <input
                        type="date"
                        value={credentialForm.expiration_date}
                        onChange={(e) => setCredentialForm({ ...credentialForm, expiration_date: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowCredentialModal(false)}
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCredential}
                      disabled={saving}
                      className="flex-1 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50"
                    >
                      {saving ? "Saving..." : editingCredential ? "Update" : "Add Credential"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "preferences" && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-xl border border-slate-600 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Email Notifications</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                  <div>
                    <p className="text-sm font-medium text-slate-100">Email Notifications</p>
                    <p className="text-xs text-slate-400">Receive email updates from InterpretReflect</p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      emailNotifications ? "bg-teal-500" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                        emailNotifications ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                  <div>
                    <p className="text-sm font-medium text-slate-100">Weekly Performance Reports</p>
                    <p className="text-xs text-slate-400">Get your weekly competency progress summary</p>
                  </div>
                  <button
                    onClick={() => setWeeklyReports(!weeklyReports)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      weeklyReports ? "bg-teal-500" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                        weeklyReports ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                  <div>
                    <p className="text-sm font-medium text-slate-100">Community Updates</p>
                    <p className="text-xs text-slate-400">Connection requests, messages, and discussions</p>
                  </div>
                  <button
                    onClick={() => setCommunityUpdates(!communityUpdates)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      communityUpdates ? "bg-teal-500" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                        communityUpdates ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                  <div>
                    <p className="text-sm font-medium text-slate-100">Training Reminders</p>
                    <p className="text-xs text-slate-400">Get notified about recommended training modules</p>
                  </div>
                  <button
                    onClick={() => setTrainingReminders(!trainingReminders)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      trainingReminders ? "bg-teal-500" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                        trainingReminders ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "billing" && (
          <BillingTab userData={userData} showMessage={showMessage} />
        )}

        {selectedTab === "privacy" && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-xl border border-slate-600 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Privacy Settings</h3>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                  <p className="text-sm font-medium text-slate-100 mb-2">Profile Visibility</p>
                  <p className="text-xs text-slate-400 mb-3">Control who can see your profile in the Community tab</p>
                  <select
                    value={profileVisibility}
                    onChange={(e) => setProfileVisibility(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="connections">Connections Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                  <p className="text-sm font-medium text-slate-100 mb-2">Anonymous Data Sharing</p>
                  <p className="text-xs text-slate-400 mb-3">Help improve recommendations by sharing anonymized usage patterns</p>
                  <select
                    value={dataSharing}
                    onChange={(e) => setDataSharing(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    <option value="anonymous">Share anonymously</option>
                    <option value="none">Do not share</option>
                  </select>
                </div>

                <button
                  onClick={handleSavePrivacy}
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Privacy Settings"}
                </button>
              </div>
            </div>

            {/* Agency Visibility Section */}
            <div className="rounded-xl border border-violet-500/30 bg-slate-900/50 p-6">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg font-semibold text-slate-100">Agency Visibility</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">Control what data your agencies can see about your activity. Your debrief content and wellness check-in details are <strong className="text-slate-300">never</strong> shared.</p>

              {loadingAgencies ? (
                <div className="text-center py-8 text-slate-400">Loading agency memberships...</div>
              ) : agencyMemberships.length === 0 ? (
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400">You're not part of any agency yet.</p>
                  <p className="text-xs text-slate-500 mt-1">These settings will appear when you join an agency.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {agencyMemberships.map((membership) => (
                    <div key={membership.id} className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <span className="text-violet-400 font-bold text-sm">
                              {membership.organizations?.name?.charAt(0) || "A"}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-100">
                              {membership.organizations?.name || "Agency"}
                            </h4>
                            <p className="text-xs text-slate-500 capitalize">{membership.role}</p>
                          </div>
                        </div>
                      </div>

                      {/* Quick Summary: What Can This Agency See? */}
                      <div className="mb-4 p-3 rounded-lg bg-slate-900/70 border border-slate-700">
                        <p className="text-xs font-medium text-slate-400 mb-2">What {membership.organizations?.name || "this agency"} can see:</p>
                        <div className="flex flex-wrap gap-2">
                          {membership.data_sharing_preferences?.share_prep_completion && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              Prep rates
                            </span>
                          )}
                          {membership.data_sharing_preferences?.share_debrief_completion && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              Debrief rates
                            </span>
                          )}
                          {membership.data_sharing_preferences?.share_credential_status && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              Credentials
                            </span>
                          )}
                          {membership.data_sharing_preferences?.share_checkin_streaks && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              Streaks
                            </span>
                          )}
                          {membership.data_sharing_preferences?.share_module_progress && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              Modules
                            </span>
                          )}
                          {!membership.data_sharing_preferences?.share_prep_completion &&
                           !membership.data_sharing_preferences?.share_debrief_completion &&
                           !membership.data_sharing_preferences?.share_credential_status &&
                           !membership.data_sharing_preferences?.share_checkin_streaks &&
                           !membership.data_sharing_preferences?.share_module_progress && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-700 text-slate-400 text-xs">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                              All data hidden
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Your debrief content and check-in details are never shared.</p>
                      </div>

                      <div className="space-y-3">
                        {/* Prep Completion */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                          <div>
                            <p className="text-sm text-slate-200">Prep completion status</p>
                            <p className="text-xs text-slate-500">Show when you've prepped for assignments</p>
                          </div>
                          <button
                            onClick={() => toggleAgencyPreference(membership.id, "share_prep_completion")}
                            aria-label="Toggle prep completion sharing"
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              membership.data_sharing_preferences?.share_prep_completion ? "bg-violet-500" : "bg-slate-700"
                            }`}
                          >
                            <div
                              className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                                membership.data_sharing_preferences?.share_prep_completion ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Debrief Completion */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                          <div>
                            <p className="text-sm text-slate-200">Debrief completion status</p>
                            <p className="text-xs text-slate-500">Show when you've completed debriefs (not content)</p>
                          </div>
                          <button
                            onClick={() => toggleAgencyPreference(membership.id, "share_debrief_completion")}
                            aria-label="Toggle debrief completion sharing"
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              membership.data_sharing_preferences?.share_debrief_completion ? "bg-violet-500" : "bg-slate-700"
                            }`}
                          >
                            <div
                              className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                                membership.data_sharing_preferences?.share_debrief_completion ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Credential Status */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                          <div>
                            <p className="text-sm text-slate-200">Credential status</p>
                            <p className="text-xs text-slate-500">Show your credential expiration status</p>
                          </div>
                          <button
                            onClick={() => toggleAgencyPreference(membership.id, "share_credential_status")}
                            aria-label="Toggle credential status sharing"
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              membership.data_sharing_preferences?.share_credential_status ? "bg-violet-500" : "bg-slate-700"
                            }`}
                          >
                            <div
                              className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                                membership.data_sharing_preferences?.share_credential_status ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Check-in Streaks */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                          <div>
                            <p className="text-sm text-slate-200">Check-in streaks</p>
                            <p className="text-xs text-slate-500">Show your wellness check-in streak count</p>
                          </div>
                          <button
                            onClick={() => toggleAgencyPreference(membership.id, "share_checkin_streaks")}
                            aria-label="Toggle check-in streaks sharing"
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              membership.data_sharing_preferences?.share_checkin_streaks ? "bg-violet-500" : "bg-slate-700"
                            }`}
                          >
                            <div
                              className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                                membership.data_sharing_preferences?.share_checkin_streaks ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Module Progress */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                          <div>
                            <p className="text-sm text-slate-200">Module progress</p>
                            <p className="text-xs text-slate-500">Show your training module completion</p>
                          </div>
                          <button
                            onClick={() => toggleAgencyPreference(membership.id, "share_module_progress")}
                            aria-label="Toggle module progress sharing"
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              membership.data_sharing_preferences?.share_module_progress ? "bg-violet-500" : "bg-slate-700"
                            }`}
                          >
                            <div
                              className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                                membership.data_sharing_preferences?.share_module_progress ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Save Button for this agency */}
                        <button
                          onClick={() => handleSaveAgencyPreferences(membership.id, membership.data_sharing_preferences)}
                          disabled={savingAgencyPrefs === membership.id}
                          className="w-full mt-2 px-4 py-2 rounded-lg bg-violet-500 text-white font-medium hover:bg-violet-400 transition-colors disabled:opacity-50"
                        >
                          {savingAgencyPrefs === membership.id ? "Saving..." : "Save Agency Settings"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-600 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Data Export</h3>
              <p className="text-sm text-slate-300 mb-4">Download a copy of your data including debriefs, assignments, and performance history</p>
              <button className="px-4 py-2 rounded-lg border border-teal-500/50 text-teal-400 hover:bg-teal-500/10 transition-colors">
                Request Data Export
              </button>
            </div>

            <div className="rounded-xl border border-blue-500/50 bg-blue-500/10 p-4">
              <p className="text-sm text-slate-300">
                <strong className="text-slate-100">Your privacy matters.</strong> We never sell your data. All debrief content is encrypted, and anonymous data is only shared if you opt in. Read our <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
