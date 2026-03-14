"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IdentityMap } from "@/components/IdentityMap";
import { SkillCardGroup } from "@/components/SkillCard";
import type { AnalyzeResponse } from "@/lib/types";

export default function MapPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("bodh_result");
    if (stored) {
      setResult(JSON.parse(stored) as AnalyzeResponse);
    }
  }, []);

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      if (res.ok) setSaved(true);
    } catch {
      // silent fail
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = () => {
    sessionStorage.removeItem("bodh_result");
    setResult(null);
  };

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
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Your Identity Map
          </h1>
          <p className="mt-2 text-[var(--color-muted)]">
            {identity_map.session_summary}
          </p>
        </div>
        <div className="flex shrink-0 gap-2 ml-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || saved}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              saved
                ? "border-[var(--color-ground)]/30 text-[var(--color-ground)]"
                : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
          >
            {saved ? "Saved" : isSaving ? "Saving..." : "Save Session"}
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:border-red-500/50 hover:text-red-400"
          >
            Remove
          </button>
        </div>
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
