"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

type Invitation = {
  id: string;
  status: string;
  invited_at: string;
  role: string;
  organizations: {
    id: string;
    name: string;
  } | null;
};

export default function PendingInvitationBanner() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/interpreter/invitations", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (membershipId: string, accept: boolean) => {
    setResponding(membershipId);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/interpreter/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          membership_id: membershipId,
          accept,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });
        // Remove the invitation from the list
        setInvitations((prev) => prev.filter((inv) => inv.id !== membershipId));
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to respond to invitation" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setResponding(null);
    }
  };

  // Don't render if loading or no invitations
  if (loading || invitations.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {invitations.map((invitation) => (
        <motion.div
          key={invitation.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="sticky top-0 z-20 bg-gradient-to-r from-violet-500/15 via-purple-500/15 to-violet-500/15 border-b border-violet-500/30 backdrop-blur-lg"
        >
          <div className="container mx-auto max-w-7xl px-4 md:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Invitation Info */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-violet-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    Agency Invitation
                  </p>
                  <p className="text-xs text-slate-400">
                    <span className="text-violet-400 font-medium">
                      {invitation.organizations?.name || "An organization"}
                    </span>{" "}
                    has invited you to join as an interpreter
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-13 sm:ml-0">
                <button
                  onClick={() => handleResponse(invitation.id, false)}
                  disabled={responding === invitation.id}
                  className="px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {responding === invitation.id ? "..." : "Decline"}
                </button>
                <button
                  onClick={() => handleResponse(invitation.id, true)}
                  disabled={responding === invitation.id}
                  className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {responding === invitation.id ? "Joining..." : "Accept & Join"}
                </button>
              </div>
            </div>

            {/* Success/Error Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-3 p-2 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {message.text}
              </motion.div>
            )}
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
