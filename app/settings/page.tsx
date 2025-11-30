"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<"account" | "profile" | "preferences" | "billing" | "privacy">("account");

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [openToMentoring, setOpenToMentoring] = useState(false);

  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [communityUpdates, setCommunityUpdates] = useState(true);
  const [trainingReminders, setTrainingReminders] = useState(true);

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
        setFullName(profileData.full_name || "");
        setEmail(session.user.email || "");
        setBio(profileData.bio || "");
        setYearsExperience(profileData.years_experience?.toString() || "");
        setCertifications(profileData.certifications || []);
        setSpecialties(profileData.specialties || []);
        setLinkedinUrl(profileData.linkedin_url || "");
        setOpenToMentoring(profileData.open_to_mentoring || false);
      }

      setLoading(false);
    };
    loadUserData();
  }, [router]);

  const handleSaveAccount = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        bio,
        years_experience: parseInt(yearsExperience) || 0,
        certifications,
        specialties,
        linkedin_url: linkedinUrl,
        open_to_mentoring: openToMentoring
      })
      .eq("id", session.user.id);

    setSaving(false);
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from("profiles")
      .update({
        email_notifications: emailNotifications,
        weekly_reports: weeklyReports,
        community_updates: communityUpdates,
        training_reminders: trainingReminders
      } as any)
      .eq("id", session.user.id);

    setSaving(false);
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
          <p className="mt-1 text-sm text-slate-400">Manage your account, preferences, and privacy</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-slate-800 overflow-x-auto">
          {[
            { key: "account", label: "Account" },
            { key: "profile", label: "Community Profile" },
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
        {selectedTab === "account" && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Account Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
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

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
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

            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Danger Zone</h3>
              <p className="text-sm text-slate-400 mb-4">Irreversible actions</p>
              <button className="px-4 py-2 rounded-lg border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        )}

        {selectedTab === "profile" && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Community Profile</h3>
              <p className="text-sm text-slate-400 mb-4">This information is visible to other interpreters in the Community tab</p>

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
                  onClick={handleSaveAccount}
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "preferences" && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
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
            <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-6">
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

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
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

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
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
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Privacy Settings</h3>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                  <p className="text-sm font-medium text-slate-100 mb-2">Profile Visibility</p>
                  <p className="text-xs text-slate-400 mb-3">Control who can see your profile in the Community tab</p>
                  <select className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400">
                    <option>Everyone</option>
                    <option>Connections Only</option>
                    <option>Private</option>
                  </select>
                </div>

                <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                  <p className="text-sm font-medium text-slate-100 mb-2">ECCI Data Sharing</p>
                  <p className="text-xs text-slate-400 mb-3">Allow anonymous ECCI data to help improve recommendations</p>
                  <select className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400">
                    <option>Share anonymously</option>
                    <option>Do not share</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Data Export</h3>
              <p className="text-sm text-slate-400 mb-4">Download a copy of your data including debriefs, assignments, and performance history</p>
              <button className="px-4 py-2 rounded-lg border border-teal-500/50 text-teal-400 hover:bg-teal-500/10 transition-colors">
                Request Data Export
              </button>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-sm text-slate-300">
                <strong className="text-slate-100">Your privacy matters.</strong> We never sell your data. All debrief content is encrypted, and ECCI data is only shared anonymously if you opt in. Read our <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
