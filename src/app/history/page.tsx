"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AnalyzeResponse, ChallengeGenerationResult } from "@/lib/types";

interface SavedSession {
  id: string;
  timestamp: string;
  full_result: AnalyzeResponse | null;
  challenges: ChallengeGenerationResult | null;
}

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        setSessions(data.sessions || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const loadSession = (session: SavedSession) => {
    if (session.full_result) {
      sessionStorage.setItem("bodh_result", JSON.stringify(session.full_result));
      router.push("/map");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-ground)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Saved Sessions</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Your previously analyzed coding sessions.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <p className="mb-2 text-[var(--color-muted)]">No saved sessions yet.</p>
          <p className="text-sm text-[var(--color-muted)]">
            Analyze a session and save it to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const map = session.full_result?.identity_map;
            const groundCount = map?.your_ground.length ?? 0;
            const edgeCount = map?.growing_edge.length ?? 0;
            const zoneCount = map?.ai_zone.length ?? 0;
            const date = new Date(session.timestamp);

            return (
              <button
                key={session.id}
                type="button"
                onClick={() => loadSession(session)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left transition-colors hover:border-[var(--color-ground)]/40 hover:bg-[var(--color-surface-hover)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {session.full_result?.identity_map.session_summary?.slice(0, 80) ?? "Session"}
                      {(session.full_result?.identity_map.session_summary?.length ?? 0) > 80 ? "..." : ""}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-[var(--color-ground)]" />
                      {groundCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-[var(--color-edge)]" />
                      {edgeCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-[var(--color-zone)]" />
                      {zoneCount}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
