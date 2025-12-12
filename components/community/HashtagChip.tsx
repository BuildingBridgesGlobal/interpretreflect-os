"use client";

interface HashtagChipProps {
  name: string;
  onClick?: (hashtag: string) => void;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "trending" | "selected";
  count?: number;
  removable?: boolean;
  onRemove?: () => void;
}

export default function HashtagChip({
  name,
  onClick,
  size = "md",
  variant = "default",
  count,
  removable = false,
  onRemove
}: HashtagChipProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-sm px-3 py-1.5"
  };

  const variantClasses = {
    default: "bg-slate-700/50 text-cyan-400 hover:bg-slate-600/50",
    trending: "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30 hover:bg-amber-500/30",
    selected: "bg-teal-500/20 text-teal-400 ring-1 ring-teal-500/50"
  };

  const handleClick = () => {
    if (onClick) {
      onClick(name);
    }
  };

  return (
    <span
      onClick={onClick ? handleClick : undefined}
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${onClick ? "cursor-pointer" : ""}
      `}
    >
      {variant === "trending" && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
      )}
      <span>#{name}</span>
      {count !== undefined && (
        <span className="text-xs opacity-70">{count}</span>
      )}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 p-0.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label={`Remove #${name}`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

// Helper to extract and render hashtags from content
export function extractHashtags(content: string): string[] {
  const regex = /#([a-zA-Z][a-zA-Z0-9_]{1,29})/g;
  const matches = content.match(regex);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1)))].slice(0, 5);
}

// Component to render content with clickable hashtags
interface HashtagContentProps {
  content: string;
  onHashtagClick?: (hashtag: string) => void;
}

export function HashtagContent({ content, onHashtagClick }: HashtagContentProps) {
  const parts = content.split(/(#[a-zA-Z][a-zA-Z0-9_]{1,29})/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("#") && part.length > 1) {
          const hashtag = part.slice(1);
          return (
            <span
              key={index}
              onClick={() => onHashtagClick?.(hashtag)}
              className={`text-cyan-400 ${onHashtagClick ? "cursor-pointer hover:underline" : ""}`}
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </>
  );
}
