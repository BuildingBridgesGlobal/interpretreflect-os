"use client";

import React from "react";
import Link from "next/link";
import { Shield, Heart, Users, AlertTriangle, Ban, MessageCircle, Lock, Scale, ArrowLeft } from "lucide-react";

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-violet-500/20">
              <Shield className="w-8 h-8 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-50">Community Guidelines</h1>
              <p className="text-slate-400 mt-1">Creating a welcoming, supportive space for all interpreters</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Introduction */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-slate-300 leading-relaxed">
            InterpretReflect is a professional community built by and for interpreters. Our community thrives when
            every member feels respected, supported, and valued. These guidelines ensure our space remains welcoming,
            productive, and encouraging for interpreters of all backgrounds, experiences, and identities.
          </p>
          <p className="text-slate-400 mt-4 text-sm">
            By participating in our community, you agree to abide by these guidelines. Violations may result in
            content removal, temporary suspension, or permanent ban from the community.
          </p>
        </div>

        {/* Core Values */}
        <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-6">
          <h2 className="text-xl font-semibold text-violet-400 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-violet-400 mt-1">✦</span>
              <div>
                <span className="text-slate-100 font-medium">Respect</span>
                <p className="text-sm text-slate-400">Every member deserves dignity and consideration</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-violet-400 mt-1">✦</span>
              <div>
                <span className="text-slate-100 font-medium">Inclusion</span>
                <p className="text-sm text-slate-400">All interpreters are welcome regardless of background</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-violet-400 mt-1">✦</span>
              <div>
                <span className="text-slate-100 font-medium">Professionalism</span>
                <p className="text-sm text-slate-400">We uphold the standards of our profession</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-violet-400 mt-1">✦</span>
              <div>
                <span className="text-slate-100 font-medium">Growth</span>
                <p className="text-sm text-slate-400">We support each other's professional development</p>
              </div>
            </div>
          </div>
        </div>

        {/* Expected Behavior */}
        <div className="rounded-xl border border-teal-500/30 bg-slate-900/50 p-6">
          <h2 className="text-xl font-semibold text-teal-400 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Expected Behavior
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-teal-400 mt-0.5">✓</span>
              <div>
                <span className="text-slate-100 font-medium">Maintain confidentiality</span>
                <p className="text-sm text-slate-400">Never share client information, assignment details that could identify individuals, or sensitive workplace information. This is fundamental to our profession.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-teal-400 mt-0.5">✓</span>
              <div>
                <span className="text-slate-100 font-medium">Support fellow interpreters</span>
                <p className="text-sm text-slate-400">We all have challenging days. Offer encouragement, share resources, and celebrate each other's successes.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-teal-400 mt-0.5">✓</span>
              <div>
                <span className="text-slate-100 font-medium">Be constructive</span>
                <p className="text-sm text-slate-400">When offering feedback or discussing challenges, focus on solutions and growth rather than criticism or judgment.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-teal-400 mt-0.5">✓</span>
              <div>
                <span className="text-slate-100 font-medium">Use inclusive language</span>
                <p className="text-sm text-slate-400">Be mindful of language that may exclude or marginalize others. Avoid audiocentric, ableist, or culturally insensitive terms.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-teal-400 mt-0.5">✓</span>
              <div>
                <span className="text-slate-100 font-medium">Respect diverse perspectives</span>
                <p className="text-sm text-slate-400">Our community includes Deaf, DeafBlind, hard of hearing, and hearing interpreters from many backgrounds. Value and learn from these different experiences.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-teal-400 mt-0.5">✓</span>
              <div>
                <span className="text-slate-100 font-medium">Report concerns</span>
                <p className="text-sm text-slate-400">If you see behavior that violates these guidelines, please report it. You help maintain our community standards.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Prohibited Behavior */}
        <div className="rounded-xl border border-rose-500/30 bg-slate-900/50 p-6">
          <h2 className="text-xl font-semibold text-rose-400 mb-4 flex items-center gap-2">
            <Ban className="w-5 h-5" />
            Prohibited Behavior
          </h2>
          <p className="text-slate-400 mb-4 text-sm">
            The following behaviors will not be tolerated and may result in immediate removal from the community:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-rose-400 mt-0.5">✕</span>
              <div>
                <span className="text-slate-100 font-medium">Harassment or bullying</span>
                <p className="text-sm text-slate-400">Any form of harassment, intimidation, stalking, or targeting of community members—whether in public posts, comments, or private messages.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-rose-400 mt-0.5">✕</span>
              <div>
                <span className="text-slate-100 font-medium">Discrimination</span>
                <p className="text-sm text-slate-400">Discrimination based on race, ethnicity, national origin, religion, gender, gender identity, sexual orientation, disability, hearing status, age, or any other protected characteristic.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-rose-400 mt-0.5">✕</span>
              <div>
                <span className="text-slate-100 font-medium">Racism, sexism, and hate speech</span>
                <p className="text-sm text-slate-400">Racist, sexist, homophobic, transphobic, ableist, or otherwise hateful content or language has no place in our community.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-rose-400 mt-0.5">✕</span>
              <div>
                <span className="text-slate-100 font-medium">Audism and ableism</span>
                <p className="text-sm text-slate-400">Attitudes, behaviors, or language that demean or discriminate against Deaf, DeafBlind, hard of hearing, or disabled individuals.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-rose-400 mt-0.5">✕</span>
              <div>
                <span className="text-slate-100 font-medium">Confidentiality breaches</span>
                <p className="text-sm text-slate-400">Sharing client information, identifying details about assignments, or any content that could compromise professional confidentiality.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-rose-400 mt-0.5">✕</span>
              <div>
                <span className="text-slate-100 font-medium">Doxxing or privacy violations</span>
                <p className="text-sm text-slate-400">Sharing personal information about other members without their consent, including real names, locations, workplaces, or contact information.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-rose-400 mt-0.5">✕</span>
              <div>
                <span className="text-slate-100 font-medium">Threats or violent content</span>
                <p className="text-sm text-slate-400">Any threats of violence, encouragement of self-harm, or content depicting violence.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-rose-400 mt-0.5">✕</span>
              <div>
                <span className="text-slate-100 font-medium">Spam and self-promotion</span>
                <p className="text-sm text-slate-400">Excessive self-promotion, advertising, or spam. Limited professional announcements are acceptable when relevant and not disruptive.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-rose-400 mt-0.5">✕</span>
              <div>
                <span className="text-slate-100 font-medium">Impersonation</span>
                <p className="text-sm text-slate-400">Pretending to be another person, organization, or falsely claiming credentials or certifications.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Enforcement */}
        <div className="rounded-xl border border-amber-500/30 bg-slate-900/50 p-6">
          <h2 className="text-xl font-semibold text-amber-400 mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Enforcement
          </h2>
          <p className="text-slate-300 mb-4">
            We take violations of these guidelines seriously. Our enforcement approach includes:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-amber-400 font-bold">1.</span>
              <div>
                <span className="text-slate-100 font-medium">Warning</span>
                <p className="text-sm text-slate-400">For minor or first-time violations, we may issue a warning explaining the concern.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-amber-400 font-bold">2.</span>
              <div>
                <span className="text-slate-100 font-medium">Content removal</span>
                <p className="text-sm text-slate-400">Posts or comments that violate guidelines will be removed.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-amber-400 font-bold">3.</span>
              <div>
                <span className="text-slate-100 font-medium">Temporary suspension</span>
                <p className="text-sm text-slate-400">Repeated violations or serious offenses may result in temporary loss of community access.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-amber-400 font-bold">4.</span>
              <div>
                <span className="text-slate-100 font-medium">Permanent ban</span>
                <p className="text-sm text-slate-400">Severe violations, including harassment, discrimination, hate speech, or repeated offenses, will result in permanent removal from the community.</p>
              </div>
            </li>
          </ul>
          <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-200">
              <strong>Note:</strong> InterpretReflect reserves the right to remove any member or content at our discretion
              to maintain the integrity and well-being of our community. Decisions are final.
            </p>
          </div>
        </div>

        {/* Reporting */}
        <div className="rounded-xl border border-blue-500/30 bg-slate-900/50 p-6">
          <h2 className="text-xl font-semibold text-blue-400 mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            How to Report
          </h2>
          <p className="text-slate-300 mb-4">
            If you witness or experience behavior that violates these guidelines:
          </p>
          <ul className="space-y-2 text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Use the <strong className="text-slate-200">Report</strong> button on any post or comment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Email us directly at <strong className="text-slate-200">info@buildingbridgeslearning.com</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>All reports are reviewed confidentially</span>
            </li>
          </ul>
          <p className="text-slate-400 mt-4 text-sm">
            We appreciate members who help maintain our community standards. You will not face retaliation for good-faith reports.
          </p>
        </div>

        {/* Privacy Reminder */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
          <h2 className="text-xl font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Privacy Reminder
          </h2>
          <p className="text-slate-400">
            Remember that posts shared in the community may be visible to other members. Even with privacy settings,
            exercise caution about what personal or professional information you share. When in doubt, keep it private.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 py-4">
          <p>Last updated: December 2025</p>
          <p className="mt-2">
            Questions about these guidelines? Contact us at{" "}
            <a href="mailto:info@buildingbridgeslearning.com" className="text-violet-400 hover:text-violet-300">
              info@buildingbridgeslearning.com
            </a>
          </p>
        </div>

        {/* Back to Community */}
        <div className="text-center pb-8">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </Link>
        </div>
      </div>
    </div>
  );
}
