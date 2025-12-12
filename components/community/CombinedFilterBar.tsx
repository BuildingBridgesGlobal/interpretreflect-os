"use client";

import { useCallback } from "react";

export type SortOption = 'recent' | 'top' | 'following' | 'trending';
export type PostTypeFilter = 'all' | 'question' | 'win' | 'insight' | 'reflection' | 'general';

interface CombinedFilterBarProps {
  sort: SortOption;
  postType: PostTypeFilter;
  onSortChange: (sort: SortOption) => void;
  onPostTypeChange: (type: PostTypeFilter) => void;
  showFollowing?: boolean;
}

const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: 'recent', label: 'Recent', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { value: 'top', label: 'Top', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { value: 'trending', label: 'Trending', icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' },
  { value: 'following', label: 'Following', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
];

const POST_TYPE_OPTIONS: { value: PostTypeFilter; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'slate' },
  { value: 'question', label: 'Questions', color: 'violet' },
  { value: 'win', label: 'Wins', color: 'amber' },
  { value: 'insight', label: 'Insights', color: 'emerald' },
  { value: 'reflection', label: 'Reflections', color: 'sky' },
  { value: 'general', label: 'General', color: 'slate' },
];

export default function CombinedFilterBar({
  sort,
  postType,
  onSortChange,
  onPostTypeChange,
  showFollowing = true,
}: CombinedFilterBarProps) {
  const filteredSortOptions = showFollowing
    ? SORT_OPTIONS
    : SORT_OPTIONS.filter(opt => opt.value !== 'following');

  return (
    <div className="space-y-3">
      {/* Sort Options */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mr-1">Sort:</span>
        {filteredSortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              sort === option.value
                ? 'bg-teal-500/20 text-teal-400 ring-1 ring-teal-500/50'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
            }`}
            aria-pressed={sort === option.value}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={option.icon} />
            </svg>
            {option.label}
          </button>
        ))}
      </div>

      {/* Post Type Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mr-1">Type:</span>
        {POST_TYPE_OPTIONS.map((option) => {
          const isActive = postType === option.value;
          const colorClasses = isActive
            ? option.value === 'all' || option.value === 'general'
              ? 'bg-slate-600/50 text-slate-200 ring-1 ring-slate-500/50'
              : option.value === 'question'
              ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/50'
              : option.value === 'win'
              ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50'
              : option.value === 'insight'
              ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50'
              : 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/50'
            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300';

          return (
            <button
              key={option.value}
              onClick={() => onPostTypeChange(option.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${colorClasses}`}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
