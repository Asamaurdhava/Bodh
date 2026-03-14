"use client";

import type { GrowthData, GrowthDelta } from "@/lib/types";

const DIRECTION_CONFIG = {
  improved: { label: "Improved", color: "var(--color-ground)", arrow: "\u2191" },
  stable: { label: "Stable", color: "var(--color-muted)", arrow: "\u2192" },
  regressed: { label: "Needs attention", color: "var(--color-edge)", arrow: "\u2193" },
} as const;

const ZONE_LABELS = {
  your_ground: "Your Ground",
  growing_edge: "Growing Edge",
  ai_zone: "AI Zone",
} as const;

interface GrowthTimelineProps {
  data: GrowthData;
}

export function GrowthTimeline({ data }: GrowthTimelineProps) {
  if (data.sessions.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <p className="text-[var(--color-muted)]">
          No sessions yet. Analyze a coding session to start tracking your
          growth.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session count */}
      <div className="flex items-center gap-4">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <p className="text-2xl font-bold">{data.sessions.length}</p>
          <p className="text-xs text-[var(--color-muted)]">Sessions analyzed</p>
        </div>
        {data.deltas.length > 0 && (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
            <p className="text-2xl font-bold text-[var(--color-ground)]">
              {data.deltas.filter((d) => d.direction === "improved").length}
            </p>
            <p className="text-xs text-[var(--color-muted)]">Skills improved</p>
          </div>
        )}
      </div>

      {/* Deltas */}
      {data.deltas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--color-muted)]">
            Recent changes
          </h3>
          {data.deltas.map((delta) => (
            <DeltaRow key={delta.skill} delta={delta} />
          ))}
        </div>
      )}

      {/* Session timeline */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[var(--color-muted)]">
          Session history
        </h3>
        {data.sessions
          .slice()
          .reverse()
          .map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[var(--color-ground)]" />
                <span className="text-sm">
                  {new Date(session.timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-[var(--color-muted)]">
                <span>{session.identity_map.your_ground.length} ground</span>
                <span>{session.identity_map.growing_edge.length} edge</span>
                <span>{session.identity_map.ai_zone.length} zone</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function DeltaRow({ delta }: { delta: GrowthDelta }) {
  const config = DIRECTION_CONFIG[delta.direction];
  const prevPercent = Math.round(delta.previous_confidence * 100);
  const currPercent = Math.round(delta.current_confidence * 100);

  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <div className="flex items-center gap-3">
        <span style={{ color: config.color }} className="text-lg font-bold">
          {config.arrow}
        </span>
        <div>
          <span className="text-sm font-medium">{delta.skill}</span>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <span>{ZONE_LABELS[delta.previous_zone]}</span>
            <span>→</span>
            <span>{ZONE_LABELS[delta.current_zone]}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <span className="text-sm font-medium" style={{ color: config.color }}>
          {prevPercent}% → {currPercent}%
        </span>
        <p className="text-xs" style={{ color: config.color }}>
          {config.label}
        </p>
      </div>
    </div>
  );
}
