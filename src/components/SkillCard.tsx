"use client";

import type { SkillNode } from "@/lib/types";

const ZONE_CONFIG = {
  your_ground: {
    label: "Your Ground",
    color: "var(--color-ground)",
    bgGlow: "var(--color-ground-glow)",
    description: "You demonstrated genuine understanding",
  },
  growing_edge: {
    label: "Growing Edge",
    color: "var(--color-edge)",
    bgGlow: "var(--color-edge-glow)",
    description: "Partial understanding — room to grow",
  },
  ai_zone: {
    label: "AI Zone",
    color: "var(--color-zone)",
    bgGlow: "var(--color-zone-glow)",
    description: "Consistently delegated to AI",
  },
} as const;

interface SkillCardProps {
  skill: SkillNode;
}

export function SkillCard({ skill }: SkillCardProps) {
  const config = ZONE_CONFIG[skill.zone];
  const percentage = Math.round(skill.confidence * 100);

  return (
    <div
      className="rounded-xl border border-[var(--color-border)] p-4 transition-colors hover:border-[var(--color-muted)]/30"
      style={{ backgroundColor: config.bgGlow }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{skill.skill}</h3>
          <span
            className="mt-0.5 inline-block text-xs font-medium"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
        </div>
        <div className="text-right">
          <span
            className="text-lg font-bold"
            style={{ color: config.color }}
          >
            {percentage}%
          </span>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: config.color,
          }}
        />
      </div>

      <p className="text-xs leading-relaxed text-[var(--color-muted)]">
        {skill.evidence}
      </p>
    </div>
  );
}

interface SkillCardGroupProps {
  title: string;
  skills: SkillNode[];
  zone: SkillNode["zone"];
}

export function SkillCardGroup({ title, skills, zone }: SkillCardGroupProps) {
  const config = ZONE_CONFIG[zone];

  if (skills.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-[var(--color-muted)]">
          ({skills.length})
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {skills.map((skill) => (
          <SkillCard key={skill.skill} skill={skill} />
        ))}
      </div>
    </div>
  );
}
