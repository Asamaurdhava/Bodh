"use client";

import { useState, useEffect } from "react";
import { ChallengeCard } from "@/components/ChallengeCard";
import type { AnalyzeResponse, Challenge } from "@/lib/types";

export default function ChallengePage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [rationale, setRationale] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasResult, setHasResult] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("bodh_result");
    if (stored) {
      setHasResult(true);
    }
  }, []);

  const generateChallenges = async () => {
    const stored = sessionStorage.getItem("bodh_result");
    if (!stored) return;

    const result = JSON.parse(stored) as AnalyzeResponse;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity_map: result.identity_map }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setChallenges(data.challenges);
      setRationale(data.rationale);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate challenges");
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasResult) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">No analysis yet</h2>
          <p className="text-sm text-[var(--color-muted)]">
            Analyze a coding session first, then come back for targeted
            challenges.
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

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Challenges</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Targeted exercises designed around your identity map. Use AI to solve
          them — but demonstrate your understanding first.
        </p>
      </div>

      {challenges.length === 0 && !isLoading && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <p className="mb-4 text-[var(--color-muted)]">
            Ready to generate challenges based on your identity map?
          </p>
          <button
            type="button"
            onClick={generateChallenges}
            className="rounded-lg bg-[var(--color-edge)] px-6 py-2.5 text-sm font-semibold text-black transition-all hover:brightness-110"
          >
            Generate Challenges
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-edge)] border-t-transparent" />
          <span className="text-sm">
            Crafting challenges for your growth areas...
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {challenges.length > 0 && (
        <div className="space-y-6">
          {rationale && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm text-[var(--color-muted)]">{rationale}</p>
            </div>
          )}

          <div className="space-y-4">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
