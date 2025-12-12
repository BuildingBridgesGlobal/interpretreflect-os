"use client";

import { useState } from "react";
import Link from "next/link";

interface Mentor {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  years_experience: string | null;
  specialties: string[];
  bio: string | null;
  mentor_availability: string;
  mentor_statement: string | null;
  connection_status: "none" | "pending" | "connected" | "mentoring";
}

interface MentorCardProps {
  mentor: Mentor;
  onRequestMentorship: (mentorId: string, message?: string) => Promise<void>;
}

export default function MentorCard({ mentor, onRequestMentorship }: MentorCardProps) {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(mentor.connection_status);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRequestMentorship = async () => {
    setIsRequesting(true);
    try {
      await onRequestMentorship(mentor.user_id, requestMessage);
      setConnectionStatus("pending");
      setShowRequestModal(false);
      setRequestMessage("");
    } catch (error) {
      console.error("Error requesting mentorship:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  const availabilityBadge = () => {
    switch (mentor.mentor_availability) {
      case "available":
        return (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Available
          </span>
        );
      case "limited":
        return (
          <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Limited
          </span>
        );
      default:
        return null;
    }
  };

  const connectionButton = () => {
    switch (connectionStatus) {
      case "mentoring":
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Mentoring
          </span>
        );
      case "connected":
        return (
          <button
            onClick={() => setShowRequestModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Request Mentorship
          </button>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-400">
            <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Request Pending
          </span>
        );
      default:
        return (
          <button
            onClick={() => setShowRequestModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-500 transition-colors"
          >
            Request Mentorship
          </button>
        );
    }
  };

  return (
    <>
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
        <div className="flex gap-4">
          {/* Avatar */}
          <Link href={`/community/profile/${mentor.user_id}`} className="flex-shrink-0">
            {mentor.avatar_url ? (
              <img
                src={mentor.avatar_url}
                alt={mentor.display_name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-700 hover:ring-teal-500/50 transition-all"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center text-lg font-bold text-white">
                {getInitials(mentor.display_name)}
              </div>
            )}
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  href={`/community/profile/${mentor.user_id}`}
                  className="text-lg font-semibold text-white hover:text-teal-400 transition-colors"
                >
                  {mentor.display_name}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  {mentor.years_experience && (
                    <span className="text-sm text-slate-400">{mentor.years_experience}</span>
                  )}
                  {availabilityBadge()}
                </div>
              </div>
            </div>

            {/* Specialties */}
            {mentor.specialties && mentor.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {mentor.specialties.slice(0, 4).map((specialty, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300"
                  >
                    {specialty}
                  </span>
                ))}
                {mentor.specialties.length > 4 && (
                  <span className="text-xs text-slate-500">+{mentor.specialties.length - 4}</span>
                )}
              </div>
            )}

            {/* Mentor Statement */}
            {mentor.mentor_statement && (
              <p className="mt-3 text-sm text-slate-400 line-clamp-2">
                {mentor.mentor_statement}
              </p>
            )}

            {/* Action */}
            <div className="mt-4">
              {connectionButton()}
            </div>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowRequestModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Request Mentorship
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Send a mentorship request to {mentor.display_name}. Include a brief message about what you're hoping to learn.
              </p>

              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Hi! I'm interested in learning more about..."
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                rows={4}
                maxLength={500}
              />
              <div className="text-xs text-slate-500 text-right mt-1">
                {requestMessage.length}/500
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestMentorship}
                  disabled={isRequesting}
                  className="flex-1 px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRequesting ? "Sending..." : "Send Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
