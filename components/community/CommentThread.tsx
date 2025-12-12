"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface CommentAuthor {
  display_name: string;
  avatar_url?: string | null;
  years_experience?: string | number | null;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  liked_by_user: boolean;
  is_deleted?: boolean;
  author: CommentAuthor;
  parent_comment_id?: string | null;
  replies?: Comment[];
}

interface CommentThreadProps {
  comment: Comment;
  currentUserId: string | null;
  depth?: number;
  maxDepth?: number;
  parentAuthorName?: string;
  onReply: (comment: Comment) => void;
  onLike: (comment: Comment, parentId?: string) => void;
  onDelete: (comment: Comment) => void;
  formatTimeAgo: (date: string) => string;
  renderContent: (content: string) => React.ReactNode;
  getInitials: (name: string) => string;
}

const MAX_VISIBLE_REPLIES = 3;

export default function CommentThread({
  comment,
  currentUserId,
  depth = 0,
  maxDepth = 3,
  parentAuthorName,
  onReply,
  onLike,
  onDelete,
  formatTimeAgo,
  renderContent,
  getInitials,
}: CommentThreadProps) {
  const [showAllReplies, setShowAllReplies] = useState(false);

  const replies = comment.replies || [];
  const visibleReplies = showAllReplies ? replies : replies.slice(0, MAX_VISIBLE_REPLIES);
  const hiddenReplyCount = replies.length - MAX_VISIBLE_REPLIES;
  const hasMoreReplies = replies.length > MAX_VISIBLE_REPLIES && !showAllReplies;

  // Calculate indentation and styling based on depth
  const isNested = depth > 0;
  const isFlatten = depth >= maxDepth;

  // Avatar sizes decrease with depth
  const avatarSize = depth === 0 ? "w-8 h-8" : depth === 1 ? "w-7 h-7" : "w-6 h-6";
  const avatarRing = depth === 0 ? "ring-2" : "ring-1";
  const textSize = depth === 0 ? "text-sm" : "text-sm";

  // Background gets lighter with depth
  const bgColor = depth === 0
    ? "bg-slate-800/50"
    : depth === 1
    ? "bg-slate-800/30"
    : "bg-slate-800/20";

  // Thread line colors based on depth
  const threadColors = [
    "border-teal-500/40",
    "border-violet-500/40",
    "border-blue-500/40",
    "border-amber-500/40",
  ];
  const threadColor = threadColors[depth % threadColors.length];

  return (
    <div className={`${isNested ? '' : ''}`}>
      {/* Comment */}
      <div className="flex gap-3 group relative">
        {/* Thread connector line for nested comments */}
        {isNested && (
          <div className={`absolute left-0 top-0 bottom-0 w-0.5 -ml-4 ${threadColor.replace('border-', 'bg-')}`} />
        )}

        {/* Avatar */}
        <Link href={`/community/profile/${comment.user_id}`} className="flex-shrink-0">
          {comment.author?.avatar_url ? (
            <img
              src={comment.author.avatar_url}
              alt={comment.author.display_name || "User"}
              className={`${avatarSize} rounded-full object-cover ${avatarRing} ring-slate-700 hover:ring-teal-500/50 transition-all`}
            />
          ) : (
            <div className={`${avatarSize} rounded-full bg-gradient-to-br ${depth === 0 ? 'from-blue-500 to-violet-500' : 'from-teal-500 to-blue-500'} flex items-center justify-center text-xs font-bold text-white hover:scale-105 transition-all`}>
              {getInitials(comment.author?.display_name || "?")}
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={`${bgColor} rounded-2xl rounded-tl-sm px-4 py-2`}>
            {/* Author info */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/community/profile/${comment.user_id}`}
                className={`font-semibold text-slate-200 ${textSize} hover:text-teal-400 transition-colors`}
              >
                {comment.author?.display_name}
              </Link>
              {comment.author?.years_experience && depth === 0 && (
                <span className="text-slate-500 text-xs">{comment.author.years_experience}</span>
              )}
              {/* Show who they're replying to for deeply nested comments */}
              {isFlatten && parentAuthorName && (
                <span className="text-slate-500 text-xs">
                  <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  replying to <span className="text-slate-400">{parentAuthorName}</span>
                </span>
              )}
            </div>

            {/* Content */}
            <div className={`text-slate-300 ${textSize} mt-1`}>
              {renderContent(comment.content)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-1 ml-2">
            <span className="text-slate-500 text-xs">{formatTimeAgo(comment.created_at)}</span>

            {/* Like button */}
            <button
              onClick={() => onLike(comment, comment.parent_comment_id || undefined)}
              className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                comment.liked_by_user
                  ? "text-red-400"
                  : "text-slate-500 hover:text-red-400"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill={comment.liked_by_user ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
            </button>

            {/* Reply button */}
            <button
              onClick={() => onReply(depth === 0 ? comment : (comment as any)._parentComment || comment)}
              className="text-slate-500 text-xs font-medium hover:text-blue-400 transition-colors"
            >
              Reply
            </button>

            {/* Delete button */}
            {comment.user_id === currentUserId && (
              <button
                onClick={() => onDelete(comment)}
                className="text-slate-500 text-xs font-medium hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className={`mt-3 ml-6 pl-4 border-l-2 ${threadColor} space-y-3`}>
          {visibleReplies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={{ ...reply, _parentComment: comment } as any}
              currentUserId={currentUserId}
              depth={depth + 1}
              maxDepth={maxDepth}
              parentAuthorName={comment.author?.display_name}
              onReply={onReply}
              onLike={onLike}
              onDelete={onDelete}
              formatTimeAgo={formatTimeAgo}
              renderContent={renderContent}
              getInitials={getInitials}
            />
          ))}

          {/* Show more replies button */}
          {hasMoreReplies && (
            <button
              onClick={() => setShowAllReplies(true)}
              className="flex items-center gap-2 text-xs text-teal-400 hover:text-teal-300 transition-colors ml-2 py-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              View {hiddenReplyCount} more {hiddenReplyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}

          {/* Collapse replies button */}
          {showAllReplies && replies.length > MAX_VISIBLE_REPLIES && (
            <button
              onClick={() => setShowAllReplies(false)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-400 transition-colors ml-2 py-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}
