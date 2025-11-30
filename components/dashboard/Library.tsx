"use client";

import { useState } from "react";

type LibraryProps = {
  userData: any;
};

type LibraryItem = {
  id: string;
  title: string;
  date: string;
  tags: string[];
  intensity?: "low" | "medium" | "high";
};

export default function Library({ userData }: LibraryProps) {
  const [activeView, setActiveView] = useState<"domain" | "workflow" | "skill">("domain");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  // Mock library items - will be populated from database
  const libraryItems: LibraryItem[] = [
    {
      id: "1",
      title: "Cardiology Consultation Debrief",
      date: "2025-01-15",
      tags: ["Medical", "Post-assignment debrief", "Vocabulary building"],
      intensity: "high"
    },
    {
      id: "2",
      title: "IEP Meeting Preparation",
      date: "2025-01-14",
      tags: ["Education", "Pre-assignment prep", "Team coordination"],
      intensity: "medium"
    },
    {
      id: "3",
      title: "Legal Deposition Prep",
      date: "2025-01-13",
      tags: ["Legal", "Pre-assignment prep", "Boundary-setting"],
      intensity: "high"
    }
  ];

  // Filter options
  const filters = {
    domain: ["Medical", "Legal", "Education", "Mental Health", "VRI"],
    workflow: ["Pre-assignment prep", "Post-assignment debrief", "Weekly review"],
    skill: ["Vocabulary building", "Boundary-setting", "Team coordination"]
  };

  const currentFilters = filters[activeView];

  // Filter items based on selection
  const filteredItems = selectedFilter
    ? libraryItems.filter(item => item.tags.includes(selectedFilter))
    : libraryItems;

  const getIntensityColor = (intensity?: string) => {
    switch (intensity) {
      case "high":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "medium":
        return "bg-violet-500/20 text-violet-300 border-violet-500/30";
      case "low":
        return "bg-teal-500/20 text-teal-300 border-teal-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-50">Library</h2>
        <p className="text-sm text-slate-400">{filteredItems.length} entries</p>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => {
            setActiveView("domain");
            setSelectedFilter(null);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeView === "domain"
              ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
              : "bg-slate-800 text-slate-400 hover:text-slate-300"
          }`}
        >
          By Domain
        </button>
        <button
          onClick={() => {
            setActiveView("workflow");
            setSelectedFilter(null);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeView === "workflow"
              ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
              : "bg-slate-800 text-slate-400 hover:text-slate-300"
          }`}
        >
          By Workflow
        </button>
        <button
          onClick={() => {
            setActiveView("skill");
            setSelectedFilter(null);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeView === "skill"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "bg-slate-800 text-slate-400 hover:text-slate-300"
          }`}
        >
          By Skill
        </button>
      </div>

      {/* Filter Chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        {currentFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(selectedFilter === filter ? null : filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedFilter === filter
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                : "bg-slate-800/50 text-slate-400 hover:text-slate-300 border border-slate-700"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Library Items */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 hover:border-teal-500/30 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-base font-medium text-slate-200">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{new Date(item.date).toLocaleDateString()}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-800/50 text-slate-400 border border-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {item.intensity && (
                <span className={`px-2 py-1 rounded text-xs font-medium border ${getIntensityColor(item.intensity)}`}>
                  {item.intensity} intensity
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p>No entries found for this filter</p>
        </div>
      )}
    </div>
  );
}
