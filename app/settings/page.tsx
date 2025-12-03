"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<"account" | "profile" | "credentials" | "preferences" | "billing" | "privacy">("account");

  // Account form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
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

        {selectedTab === "credentials" && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-xl border border-slate-600 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Professional Credentials</h3>
              <p className="text-sm text-slate-300 mb-4">Manage your certifications, licenses, and professional credentials</p>

              <div className="space-y-4">
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-100 mb-1">Certifications & Licenses</h4>
                      <p className="text-xs text-slate-400">Upload and track your professional credentials</p>
                    </div>
                  </div>
                  <button className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-slate-600 hover:border-teal-500 text-slate-400 hover:text-teal-400 transition-all flex items-center justify-center gap-2">
                    <span className="text-lg">📄</span>
                    <span className="text-sm font-medium">Add Credential</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Example credential cards - will be populated from database */}
                  <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded-md bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-medium">
                            Active
                          </span>
                          <h4 className="text-sm font-semibold text-slate-100">NIC Certification</h4>
                        </div>
                        <p className="text-xs text-slate-400 mb-1">Issued: Jan 2020</p>
                        <p className="text-xs text-slate-400">Expires: Jan 2026</p>
                      </div>
                      <button className="text-xs text-slate-400 hover:text-slate-300">View</button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium">
                            Expiring Soon
                          </span>
                          <h4 className="text-sm font-semibold text-slate-100">State License</h4>
                        </div>
                        <p className="text-xs text-slate-400 mb-1">Issued: March 2022</p>
                        <p className="text-xs text-amber-400">Expires: March 2025 (2 months)</p>
                      </div>
                      <button className="text-xs text-slate-400 hover:text-slate-300">View</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/50 bg-blue-500/10 p-5">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">Credential Reminders</h3>
              <p className="text-sm text-slate-300">
                We'll notify you 3 months before any credential expires so you have time to renew. All credentials are stored securely and encrypted.
              </p>
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
          <div className="max-w-2xl space-y-6">
            <div className="rounded-xl border border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Current Plan</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {userData?.subscription_tier === "trial" ? "Free Trial" :
                     userData?.subscription_tier === "basic" ? "Basic Plan" :
                     userData?.subscription_tier === "professional" ? "Professional Plan" :
                     "Free Plan"}
                  </p>
                </div>
                {userData?.subscription_tier === "trial" && userData?.trial_ends_at && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                    Ends {new Date(userData.trial_ends_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-400">Monthly</p>
                  <p className="text-xl font-bold text-violet-400">
                    {userData?.subscription_tier === "professional" ? "$29" :
                     userData?.subscription_tier === "basic" ? "$19" : "$0"}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-400">Debriefs</p>
                  <p className="text-xl font-bold text-teal-400">Unlimited</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-400">CEU Tracking</p>
                  <p className="text-xl font-bold text-emerald-400">Included</p>
                </div>
              </div>

              <button className="w-full px-4 py-2 rounded-lg bg-violet-500 text-white font-medium hover:bg-violet-400 transition-colors">
                Upgrade Plan
              </button>
            </div>

            <div className="rounded-xl border border-slate-600 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Payment Method</h3>
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-7 rounded bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                    VISA
                  </div>
                  <div>
                    <p className="text-sm text-slate-200">•••• 4242</p>
                    <p className="text-xs text-slate-500">Expires 12/25</p>
                  </div>
                </div>
                <button className="text-sm text-teal-400 hover:text-teal-300">Update</button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-600 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Billing History</h3>
              <div className="space-y-3">
                {[
                  { date: "Jan 1, 2025", amount: "$29.00", status: "Paid" },
                  { date: "Dec 1, 2024", amount: "$29.00", status: "Paid" },
                  { date: "Nov 1, 2024", amount: "$29.00", status: "Paid" }
                ].map((invoice, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-300">{invoice.date}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs">
                        {invoice.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-100">{invoice.amount}</span>
                      <button className="text-sm text-teal-400 hover:text-teal-300">Download</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
