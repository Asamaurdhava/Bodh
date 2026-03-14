"use client";

import { useState } from "react";

interface ThinkingTraceProps {
  content: string;
}

export function ThinkingTrace({ content }: ThinkingTraceProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  const preview = content.slice(0, 300);
  const hasMore = content.length > 300;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-edge)]/20 text-[var(--color-edge)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <span className="text-sm font-medium">How I analyzed this</span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`text-[var(--color-muted)] transition-transform ${isExpanded ? "rotate-180" : ""}`}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-[var(--color-border)] p-4">
          <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--color-muted)]">
            {content}
          </p>
        </div>
      )}

      {!isExpanded && (
        <div className="border-t border-[var(--color-border)] px-4 pb-4 pt-3">
          <p className="font-mono text-xs leading-relaxed text-[var(--color-muted)]">
            {preview}
            {hasMore && "..."}
          </p>
        </div>
      )}
    </div>
  );
}
