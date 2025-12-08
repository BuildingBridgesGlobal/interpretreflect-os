"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

type VideoPlayerProps = {
  videoUrl: string;
  title: string;
  duration?: number; // in minutes
  onComplete?: () => void;
  onProgress?: (percent: number) => void;
  requireFullCompletion?: boolean; // For CEU compliance - must watch 100%
  onAttestation?: () => void; // Callback when user attests they watched embedded video
  initiallyCompleted?: boolean; // If already marked as completed
};

export default function VideoPlayer({
  videoUrl,
  title,
  duration,
  onComplete,
  onProgress,
  requireFullCompletion = false,
  onAttestation,
  initiallyCompleted = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(initiallyCompleted);
  const [showAttestationModal, setShowAttestationModal] = useState(false);
  const [attestationChecked, setAttestationChecked] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect if the URL is a YouTube or Vimeo embed
  const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
  const isVimeo = videoUrl.includes("vimeo.com");
  const isEmbed = isYouTube || isVimeo;

  // Convert YouTube URLs to embed format
  const getEmbedUrl = (url: string): string => {
    if (isYouTube) {
      // Handle various YouTube URL formats
      let videoId = "";
      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
      } else if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
      } else if (url.includes("embed/")) {
        return url; // Already embed format
      }
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
    }
    if (isVimeo) {
      const vimeoId = url.split("/").pop()?.split("?")[0];
      return `https://player.vimeo.com/video/${vimeoId}?autoplay=0`;
    }
    return url;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    const percent = (current / duration) * 100;
    setCurrentTime(current);
    setProgress(percent);
    onProgress?.(percent);

    // Mark as completed based on requirement
    // For CEU compliance: 100% required
    // For regular viewing: 90% is sufficient
    const completionThreshold = requireFullCompletion ? 99.5 : 90;
    if (percent >= completionThreshold && !hasCompleted) {
      setHasCompleted(true);
      onComplete?.();
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setTotalDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = percent * videoRef.current.duration;
  };

  const toggleFullscreen = () => {
    const container = document.getElementById("video-container");
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Handle attestation submission for embedded videos
  const handleAttestation = () => {
    if (attestationChecked) {
      setHasCompleted(true);
      setShowAttestationModal(false);
      onAttestation?.();
      onComplete?.();
    }
  };

  // For embedded videos (YouTube, Vimeo), use iframe with attestation
  if (isEmbed) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700"
        >
          {/* Video Header */}
          <div className="p-4 border-b border-slate-700 bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-slate-100 font-medium">{title}</h3>
                {duration && (
                  <p className="text-slate-400 text-sm">{duration} min video</p>
                )}
              </div>
              {hasCompleted && (
                <div className="ml-auto px-2 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Watched
                </div>
              )}
            </div>
          </div>

          {/* Iframe Embed */}
          <div className="aspect-video w-full">
            <iframe
              src={getEmbedUrl(videoUrl)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          </div>

          {/* Completion/Attestation section */}
          <div className="p-4 border-t border-slate-700 bg-slate-800/30">
            {hasCompleted ? (
              <div className="flex items-center justify-center gap-2 text-teal-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">Video completion confirmed</span>
              </div>
            ) : requireFullCompletion ? (
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-3">
                  Watch 100% of this video, then confirm completion for CEU credit
                </p>
                <button
                  onClick={() => setShowAttestationModal(true)}
                  className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-sm"
                >
                  I have watched the full video
                </button>
              </div>
            ) : (
              <p className="text-slate-500 text-xs text-center">
                Watch the video to continue to the next section
              </p>
            )}
          </div>
        </motion.div>

        {/* Attestation Modal */}
        {showAttestationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAttestationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Confirm Video Completion</h3>
                <p className="text-sm text-slate-400">
                  For CEU credit, you must watch the entire video. Please confirm your completion.
                </p>
              </div>

              <div className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-sm text-slate-300 font-medium mb-1">{title}</p>
                {duration && (
                  <p className="text-xs text-slate-500">{duration} minutes</p>
                )}
              </div>

              <label className="flex items-start gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attestationChecked}
                  onChange={(e) => setAttestationChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-300">
                  I confirm that I have watched the entire video from start to finish. I understand that false attestation may result in revocation of CEU credit.
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAttestationModal(false);
                    setAttestationChecked(false);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAttestation}
                  disabled={!attestationChecked}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Confirm Completion
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-4 text-center">
                Your attestation will be recorded for RID compliance
              </p>
            </motion.div>
          </motion.div>
        )}
      </>
    );
  }

  // For direct video files, use custom player
  return (
    <motion.div
      id="video-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-slate-100 font-medium">{title}</h3>
            {(duration || totalDuration > 0) && (
              <p className="text-slate-400 text-sm">
                {duration ? `${duration} min` : formatTime(totalDuration)} video
              </p>
            )}
          </div>
          {hasCompleted && (
            <div className="ml-auto px-2 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Watched
            </div>
          )}
        </div>
      </div>

      {/* Video Element */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            if (!hasCompleted) {
              setHasCompleted(true);
              onComplete?.();
            }
          }}
          onClick={togglePlay}
        />

        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30"
            onClick={togglePlay}
          >
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition-colors">
              <svg className="w-8 h-8 text-slate-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </motion.button>
        )}

        {/* Controls */}
        <motion.div
          initial={false}
          animate={{ opacity: showControls ? 1 : 0 }}
          className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
        >
          {/* Progress Bar */}
          <div
            className="h-1 bg-slate-600 rounded-full mb-3 cursor-pointer group"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-teal-400 rounded-full relative group-hover:bg-teal-300 transition-colors"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play/Pause Button */}
              <button onClick={togglePlay} className="text-white hover:text-teal-400 transition-colors">
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Time Display */}
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </span>
            </div>

            {/* Fullscreen Button */}
            <button onClick={toggleFullscreen} className="text-white hover:text-teal-400 transition-colors">
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15H4.5M9 15v4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
