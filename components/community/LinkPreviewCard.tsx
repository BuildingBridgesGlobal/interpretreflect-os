"use client";

import { useState, useEffect } from "react";

interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  favicon_url: string | null;
  site_name: string | null;
  video_url: string | null;
  video_type: string | null;
}

interface LinkPreviewCardProps {
  url: string;
  compact?: boolean;
}

export default function LinkPreviewCard({ url, compact = false }: LinkPreviewCardProps) {
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    async function fetchPreview() {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/community/link-preview?url=${encodeURIComponent(url)}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error("Failed to fetch preview");

        const data = await res.json();
        if (data.preview) {
          setPreview(data.preview);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching link preview:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchPreview();
  }, [url]);

  if (loading) {
    return (
      <div className="mt-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3 animate-pulse">
        <div className="flex gap-3">
          <div className="w-20 h-20 bg-slate-700 rounded flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-700 rounded w-3/4" />
            <div className="h-3 bg-slate-700 rounded w-full" />
            <div className="h-3 bg-slate-700 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !preview) {
    return null;
  }

  // Video embed
  if (preview.video_url && showVideo) {
    return (
      <div className="mt-3 rounded-lg border border-slate-700 overflow-hidden">
        <div className="relative aspect-video">
          <iframe
            src={preview.video_url}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <button
          onClick={() => setShowVideo(false)}
          className="w-full py-2 text-xs text-slate-400 hover:text-slate-300 bg-slate-800 transition-colors"
        >
          Hide video
        </button>
      </div>
    );
  }

  // Video thumbnail
  if (preview.video_url && preview.video_type) {
    return (
      <div className="mt-3 rounded-lg border border-slate-700 overflow-hidden bg-slate-800/50">
        <button
          onClick={() => setShowVideo(true)}
          className="relative w-full aspect-video group"
        >
          {preview.image_url ? (
            <img
              src={preview.image_url}
              alt={preview.title || "Video thumbnail"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-700 flex items-center justify-center">
              <span className="text-slate-400">Video</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
        <div className="p-3">
          <div className="flex items-center gap-2 mb-1">
            {preview.favicon_url && (
              <img src={preview.favicon_url} alt="" className="w-4 h-4" />
            )}
            <span className="text-xs text-slate-400">
              {preview.site_name || new URL(url).hostname}
            </span>
          </div>
          {preview.title && (
            <h4 className="text-sm font-medium text-white line-clamp-2">{preview.title}</h4>
          )}
        </div>
      </div>
    );
  }

  // Regular link preview
  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-2 text-xs text-cyan-400 hover:underline"
      >
        {preview.favicon_url && (
          <img src={preview.favicon_url} alt="" className="w-4 h-4" />
        )}
        {preview.title || new URL(url).hostname}
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 block rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden hover:border-slate-600 transition-colors group"
    >
      <div className="flex">
        {preview.image_url && (
          <div className="w-32 h-24 flex-shrink-0">
            <img
              src={preview.image_url}
              alt=""
              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
            />
          </div>
        )}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {preview.favicon_url && (
              <img src={preview.favicon_url} alt="" className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-xs text-slate-400 truncate">
              {preview.site_name || new URL(url).hostname}
            </span>
          </div>
          {preview.title && (
            <h4 className="text-sm font-medium text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">
              {preview.title}
            </h4>
          )}
          {preview.description && (
            <p className="text-xs text-slate-400 line-clamp-2 mt-1">
              {preview.description}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

// Helper to extract URLs from content
export function extractUrls(content: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  const matches = content.match(urlRegex);
  return matches ? [...new Set(matches)] : [];
}
