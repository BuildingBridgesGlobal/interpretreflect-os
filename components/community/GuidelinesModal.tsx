"use client";

import { useState } from "react";

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
}

export default function GuidelinesModal({
  isOpen,
  onClose,
  onAcknowledge,
}: GuidelinesModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  const handleAcknowledge = () => {
    if (acknowledged) {
      onAcknowledge();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden animate-fadeInScale">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Community Guidelines</h2>
              <p className="text-sm text-slate-400">Creating a safe space for interpreters</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <p className="text-slate-300">
            Welcome to our interpreter community! Before you post, please review our guidelines to help maintain a supportive and professional environment.
          </p>

          <div className="space-y-3">
            <GuidelineItem
              icon="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              title="Be Respectful"
              description="Treat all community members with respect. We're all here to grow together as interpreters."
            />
            <GuidelineItem
              icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              title="Protect Confidentiality"
              description="Never share identifying information about clients, assignments, or interpreting situations."
            />
            <GuidelineItem
              icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              title="Constructive Feedback"
              description="When discussing techniques or scenarios, offer constructive feedback that helps others improve."
            />
            <GuidelineItem
              icon="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
              title="No Harmful Content"
              description="Do not post spam, harassment, or content that could harm the interpreting profession."
            />
          </div>

          <div className="mt-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500 focus:ring-offset-0"
              />
              <span className="text-sm text-slate-300">
                I have read and agree to follow the community guidelines. I understand that violations may result in content removal or account restrictions.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
          <a
            href="/community-guidelines"
            target="_blank"
            className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            View full guidelines
          </a>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAcknowledge}
              disabled={!acknowledged}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                acknowledged
                  ? 'bg-teal-600 text-white hover:bg-teal-500 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Continue to Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GuidelineItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <div>
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
}
