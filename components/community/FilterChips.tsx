"use client";

import { SortOption, PostTypeFilter } from "./CombinedFilterBar";

interface FilterChipsProps {
  sort: SortOption;
  postType: PostTypeFilter;
  hashtag?: string | null;
  onClearSort?: () => void;
  onClearPostType?: () => void;
  onClearHashtag?: () => void;
  onClearAll?: () => void;
}

const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Recent',
  top: 'Top',
  trending: 'Trending',
  following: 'Following',
};

const POST_TYPE_LABELS: Record<PostTypeFilter, string> = {
  all: 'All Posts',
  question: 'Questions',
  win: 'Wins',
  insight: 'Insights',
  reflection: 'Reflections',
  general: 'General',
};

export default function FilterChips({
  sort,
  postType,
  hashtag,
  onClearSort,
  onClearPostType,
  onClearHashtag,
  onClearAll,
}: FilterChipsProps) {
  const hasNonDefaultFilters = sort !== 'recent' || postType !== 'all' || hashtag;

  if (!hasNonDefaultFilters) {
    return null;
  }

  const chips: { label: string; onClear?: () => void; color: string }[] = [];

  // Add sort chip if not default
  if (sort !== 'recent' && onClearSort) {
    chips.push({
      label: `Sort: ${SORT_LABELS[sort]}`,
      onClear: onClearSort,
      color: 'teal',
    });
  }

  // Add post type chip if not default
  if (postType !== 'all' && onClearPostType) {
    const colorMap: Record<PostTypeFilter, string> = {
      all: 'slate',
      question: 'violet',
      win: 'amber',
      insight: 'emerald',
      reflection: 'sky',
      general: 'slate',
    };
    chips.push({
      label: `Type: ${POST_TYPE_LABELS[postType]}`,
      onClear: onClearPostType,
      color: colorMap[postType],
    });
  }

  // Add hashtag chip
  if (hashtag && onClearHashtag) {
    chips.push({
      label: `#${hashtag}`,
      onClear: onClearHashtag,
      color: 'cyan',
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-slate-500">Active filters:</span>
      {chips.map((chip, index) => (
        <span
          key={index}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200
            bg-${chip.color}-500/20 text-${chip.color}-400 ring-1 ring-${chip.color}-500/30`}
        >
          {chip.label}
          {chip.onClear && (
            <button
              onClick={chip.onClear}
              className={`p-0.5 rounded-full hover:bg-${chip.color}-500/30 transition-colors`}
              aria-label={`Remove ${chip.label} filter`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </span>
      ))}
      {chips.length > 1 && onClearAll && (
        <button
          onClick={onClearAll}
          className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
