"use client";

import { useState } from "react";
import type { Challenge } from "@/lib/types";

const ZONE_STYLES = {
  growing_edge: {
    color: "var(--color-edge)",
    label: "Growing Edge",
  },
  ai_zone: {
    color: "var(--color-zone)",
    label: "AI Zone",
  },
  your_ground: {
    color: "var(--color-ground)",
    label: "Your Ground",
  },
} as const;

const DIFFICULTY_STYLES = {
  approachable: { label: "Approachable", color: "var(--color-ground)" },
  moderate: { label: "Moderate", color: "var(--color-edge)" },
  stretch: { label: "Stretch", color: "var(--color-zone)" },
} as const;

interface ChallengeCardProps {
  challenge: Challenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const zoneStyle = ZONE_STYLES[challenge.target_zone];
  const difficultyStyle = DIFFICULTY_STYLES[challenge.difficulty];

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-muted)]/30">
      {/* Header */}
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="rounded-md px-2 py-0.5 text-xs font-medium"
            style={{
              color: zoneStyle.color,
              backgroundColor: `color-mix(in srgb, ${zoneStyle.color} 15%, transparent)`,
            }}
          >
            {challenge.skill_target}
          </span>
          <span
            className="rounded-md px-2 py-0.5 text-xs font-medium"
            style={{
              color: difficultyStyle.color,
              backgroundColor: `color-mix(in srgb, ${difficultyStyle.color} 15%, transparent)`,
            }}
          >
            {difficultyStyle.label}
          </span>
        </div>

        <h3 className="mb-2 text-lg font-semibold">{challenge.title}</h3>
        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          {challenge.description}
        </p>
      </div>

      {/* Code snippet */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-background)] px-5 py-4">
        <pre className="overflow-x-auto font-mono text-xs leading-relaxed">
          <code>{challenge.code_snippet}</code>
        </pre>
      </div>

      {/* Instructions (expandable) */}
      <div className="border-t border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between px-5 py-3 text-left"
        >
          <span className="text-sm font-medium">
            {isExpanded ? "Hide instructions" : "Show instructions"}
          </span>
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
          <div className="border-t border-[var(--color-border)] px-5 pb-5 pt-3">
            <ol className="space-y-2">
              {challenge.instructions.map((instruction, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${zoneStyle.color} 20%, transparent)`,
                      color: zoneStyle.color,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-[var(--color-muted)]">
                    {instruction}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
