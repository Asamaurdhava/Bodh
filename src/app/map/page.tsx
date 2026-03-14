"use client";

import { useState, useEffect } from "react";
import { IdentityMap } from "@/components/IdentityMap";
import { SkillCardGroup } from "@/components/SkillCard";
import type { AnalyzeResponse } from "@/lib/types";

export default function MapPage() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("bodh_result");
    if (stored) {
      setResult(JSON.parse(stored) as AnalyzeResponse);
    }
  }, []);

  if (!result) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">No map yet</h2>
          <p className="text-sm text-[var(--color-muted)]">
            Analyze a coding session first to generate your identity map.
          </p>
          <a
            href="/analyze"
            className="mt-4 inline-block rounded-lg bg-[var(--color-ground)] px-5 py-2 text-sm font-semibold text-black"
          >
            Analyze a Session
          </a>
        </div>
      </div>
    );
  }

  const { identity_map } = result;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Your Identity Map
        </h1>
        <p className="mt-2 text-[var(--color-muted)]">
          {identity_map.session_summary}
        </p>
      </div>

      {/* Visual map */}
      <div className="mb-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <IdentityMap data={identity_map} />
      </div>

      {/* Skill breakdown */}
      <div className="space-y-8">
        <SkillCardGroup
          title="Your Ground"
          skills={identity_map.your_ground}
          zone="your_ground"
        />
        <SkillCardGroup
          title="Growing Edge"
          skills={identity_map.growing_edge}
          zone="growing_edge"
        />
        <SkillCardGroup
          title="AI Zone"
          skills={identity_map.ai_zone}
          zone="ai_zone"
        />
      </div>
    </div>
  );
}
