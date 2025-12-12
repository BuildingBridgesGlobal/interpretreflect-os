"use client";

import { useState, useEffect } from "react";

interface TrendingHashtag {
  id: string;
  name: string;
  post_count: number;
}

interface TrendingTopicsProps {
  onHashtagClick: (hashtag: string) => void;
  selectedHashtag?: string | null;
}

export default function TrendingTopics({
  onHashtagClick,
  selectedHashtag
}: TrendingTopicsProps) {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const res = await fetch("/api/community/hashtags?trending=true&limit=5", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error("Failed to fetch trending");

        const data = await res.json();
        setHashtags(data.hashtags || []);
      } catch (err) {
        setError("Failed to load trending topics");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrending();
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-amber-400 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
          <span className="text-sm font-semibold text-slate-200">Trending</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 bg-slate-700/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || hashtags.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
        <span className="text-sm font-semibold text-slate-200">Trending This Week</span>
      </div>

      <div className="space-y-1">
        {hashtags.map((hashtag) => (
          <button
            key={hashtag.id}
            onClick={() => onHashtagClick(hashtag.name)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all duration-200 group ${
              selectedHashtag === hashtag.name
                ? "bg-teal-500/20 text-teal-400"
                : "hover:bg-slate-700/50 text-slate-300 hover:text-white"
            }`}
          >
            <span className="text-sm font-medium">#{hashtag.name}</span>
            <span className={`text-xs transition-colors ${
              selectedHashtag === hashtag.name
                ? "text-teal-400/70"
                : "text-slate-500 group-hover:text-slate-400"
            }`}>
              {hashtag.post_count} {hashtag.post_count === 1 ? 'post' : 'posts'}
            </span>
          </button>
        ))}
      </div>

      {selectedHashtag && (
        <button
          onClick={() => onHashtagClick("")}
          className="mt-3 w-full text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}
