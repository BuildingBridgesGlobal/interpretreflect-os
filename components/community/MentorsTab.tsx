"use client";

import { useState, useEffect } from "react";
import MentorCard from "./MentorCard";

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

interface MentorsTabProps {
  onClose?: () => void;
}

const EXPERIENCE_OPTIONS = [
  { value: "", label: "All Experience" },
  { value: "0-2", label: "0-2 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "6-10", label: "6-10 years" },
  { value: "10+", label: "10+ years" }
];

const SPECIALTIES = [
  "Medical",
  "Legal",
  "Educational",
  "Conference",
  "Business",
  "Mental Health",
  "Community",
  "Government"
];

export default function MentorsTab({ onClose }: MentorsTabProps) {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);

  const fetchMentors = async (offset = 0, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const params = new URLSearchParams({
        limit: "12",
        offset: String(offset)
      });

      if (searchQuery) params.set("search", searchQuery);
      if (selectedExperience) params.set("experience", selectedExperience);
      if (selectedSpecialty) params.set("specialty", selectedSpecialty);
      if (showAvailableOnly) params.set("availability", "available");

      const res = await fetch(`/api/community/mentors?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to fetch mentors");

      const data = await res.json();

      if (append) {
        setMentors((prev) => [...prev, ...data.mentors]);
      } else {
        setMentors(data.mentors);
      }
      setHasMore(data.has_more);
    } catch (err) {
      setError("Failed to load mentors");
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, [searchQuery, selectedExperience, selectedSpecialty, showAvailableOnly]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchMentors(mentors.length, true);
    }
  };

  const handleRequestMentorship = async (mentorId: string, message?: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const res = await fetch("/api/community/mentorship", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mentor_id: mentorId,
        message
      })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to send request");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMentors();
  };

  return (
    <div className="bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Find a Mentor
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Connect with experienced interpreters who can guide your growth
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mentors..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </form>

          {/* Experience Filter */}
          <select
            value={selectedExperience}
            onChange={(e) => setSelectedExperience(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {EXPERIENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Specialty Filter */}
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Specialties</option>
            {SPECIALTIES.map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>

          {/* Available Only Toggle */}
          <button
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showAvailableOnly
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showAvailableOnly ? "bg-emerald-400" : "bg-slate-500"}`}></span>
            Available
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-slate-700 rounded w-3/4" />
                    <div className="h-4 bg-slate-700 rounded w-1/2" />
                    <div className="flex gap-1 mt-3">
                      <div className="h-5 w-16 bg-slate-700 rounded-full" />
                      <div className="h-5 w-20 bg-slate-700 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-slate-400">{error}</p>
            <button
              onClick={() => fetchMentors()}
              className="mt-4 px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : mentors.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No mentors found</h3>
            <p className="text-sm text-slate-500">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mentors.map((mentor) => (
                <MentorCard
                  key={mentor.user_id}
                  mentor={mentor}
                  onRequestMentorship={handleRequestMentorship}
                />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  {loadingMore ? "Loading..." : "Load More Mentors"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
