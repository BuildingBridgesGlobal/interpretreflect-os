"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ECCIScore = {
  domain: string;
  modules_completed: number;
  engagement_level: number;
  trend: string;
};

const ECCI_DOMAINS = [
  "Self-Awareness",
  "Self-Management",
  "Social Awareness",
  "Relationship Management",
  "Decision Making",
  "Language Processing"
];

export const CompetencyRadar: React.FC = () => {
  const [scores, setScores] = useState<ECCIScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: scoresData } = await (supabase as any)
      .from("ecci_competency_scores")
      .select("*")
      .eq("user_id", session.user.id);

    if (scoresData) {
      setScores(scoresData as any);
    }
    setLoading(false);
  };

  const getScoreForDomain = (domain: string): number => {
    const score = scores.find(s => s.domain === domain);
    return score ? score.engagement_level : 0;
  };

  const getDomainColor = (domain: string, index: number) => {
    const colors = [
      { fill: "rgba(20, 184, 166, 0.2)", stroke: "rgb(20, 184, 166)" }, // teal - Self-Awareness
      { fill: "rgba(59, 130, 246, 0.2)", stroke: "rgb(59, 130, 246)" }, // blue - Self-Management
      { fill: "rgba(168, 85, 247, 0.2)", stroke: "rgb(168, 85, 247)" }, // purple - Social Awareness
      { fill: "rgba(139, 92, 246, 0.2)", stroke: "rgb(139, 92, 246)" }, // violet - Relationship Management
      { fill: "rgba(251, 191, 36, 0.2)", stroke: "rgb(251, 191, 36)" }, // amber - Decision Making
      { fill: "rgba(16, 185, 129, 0.2)", stroke: "rgb(16, 185, 129)" }  // emerald - Language Processing
    ];
    return colors[index % colors.length];
  };

  // Calculate points for radar chart
  const centerX = 120;
  const centerY = 120;
  const radius = 100;
  const angleStep = (Math.PI * 2) / ECCI_DOMAINS.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2; // Start from top
    const r = (value / 100) * radius;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    };
  };

  // Create polygon path for user's scores
  const userPath = ECCI_DOMAINS.map((domain, index) => {
    const score = getScoreForDomain(domain);
    const point = getPoint(index, score);
    return index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`;
  }).join(" ") + " Z";

  // Create background circles
  const circles = [20, 40, 60, 80, 100].map(percent => {
    const points = ECCI_DOMAINS.map((_, index) => {
      const point = getPoint(index, percent);
      return index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`;
    }).join(" ") + " Z";
    return points;
  });

  // Create axis lines
  const axes = ECCI_DOMAINS.map((domain, index) => {
    const endPoint = getPoint(index, 100);
    return {
      domain,
      x1: centerX,
      y1: centerY,
      x2: endPoint.x,
      y2: endPoint.y
    };
  });

  // Labels
  const labels = ECCI_DOMAINS.map((domain, index) => {
    const labelPoint = getPoint(index, 115); // Beyond the radius for labels
    return {
      domain,
      x: labelPoint.x,
      y: labelPoint.y
    };
  });

  if (loading) {
    return (
      <div className="h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">Competency Radar</p>
        <p className="mt-1 text-sm text-slate-300">Loading your ECCI competency profile...</p>
        <div className="mt-4 flex h-48 items-center justify-center rounded-xl bg-slate-950/80">
          <div className="text-slate-500">Loading...</div>
        </div>
      </div>
    );
  }

  const hasAnyScores = scores.length > 0;

  return (
    <div className="h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">Competency Radar</p>
      <p className="mt-1 text-sm text-slate-300">
        {hasAnyScores
          ? "Your growth across ECCI domains based on module completion"
          : "Complete skill modules to build your competency profile"}
      </p>

      <div className="mt-4 flex items-center justify-center rounded-xl bg-slate-950/80 p-4">
        <svg width="300" height="300" viewBox="0 0 240 240" className="overflow-visible">
          {/* Background circles */}
          {circles.map((path, index) => (
            <path
              key={`circle-${index}`}
              d={path}
              fill="none"
              stroke="rgb(51, 65, 85)"
              strokeWidth="0.5"
              opacity={0.3}
            />
          ))}

          {/* Axis lines */}
          {axes.map((axis, index) => (
            <line
              key={`axis-${index}`}
              x1={axis.x1}
              y1={axis.y1}
              x2={axis.x2}
              y2={axis.y2}
              stroke="rgb(51, 65, 85)"
              strokeWidth="1"
              opacity={0.5}
            />
          ))}

          {/* User's score polygon */}
          {hasAnyScores && (
            <path
              d={userPath}
              fill="rgba(20, 184, 166, 0.2)"
              stroke="rgb(20, 184, 166)"
              strokeWidth="2"
              className="transition-all duration-500"
            />
          )}

          {/* Data points */}
          {hasAnyScores && ECCI_DOMAINS.map((domain, index) => {
            const score = getScoreForDomain(domain);
            const point = getPoint(index, score);
            const color = getDomainColor(domain, index);

            return score > 0 ? (
              <g key={`point-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={color.stroke}
                  className="transition-all duration-500"
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill="none"
                  stroke={color.stroke}
                  strokeWidth="1.5"
                  opacity="0.5"
                  className="animate-pulse"
                />
              </g>
            ) : null;
          })}

          {/* Domain labels */}
          {labels.map((label, index) => {
            const modulesCompleted = scores.find(s => s.domain === label.domain)?.modules_completed || 0;

            return (
              <g key={`label-${index}`}>
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-300 font-medium"
                >
                  {label.domain}
                </text>
                {modulesCompleted > 0 && (
                  <text
                    x={label.x}
                    y={label.y + 10}
                    textAnchor="middle"
                    className="text-[7px] fill-teal-400"
                  >
                    {modulesCompleted} {modulesCompleted === 1 ? 'module' : 'modules'}
                  </text>
                )}
              </g>
            );
          })}

          {/* Center point */}
          <circle cx={centerX} cy={centerY} r="2" fill="rgb(148, 163, 184)" />
        </svg>
      </div>

      {!hasAnyScores && (
        <div className="mt-3 text-center">
          <p className="text-xs text-slate-500">
            Start completing modules to see your competency profile grow
          </p>
        </div>
      )}

      {hasAnyScores && (
        <div className="mt-3 space-y-1">
          {ECCI_DOMAINS.map((domain, index) => {
            const score = scores.find(s => s.domain === domain);
            const color = getDomainColor(domain, index);

            return (
              <div key={domain} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color.stroke }}
                  />
                  <span className="text-slate-400">{domain}</span>
                </div>
                <span className="text-slate-500">
                  {score?.modules_completed || 0} modules
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
