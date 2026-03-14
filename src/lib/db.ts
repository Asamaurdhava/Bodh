// ============================================================
// In-memory session store (Vercel-compatible, no native deps)
// Sessions persist within a single serverless instance lifetime.
// For permanent persistence, swap with a hosted DB (e.g. Turso, PlanetScale).
// ============================================================

import type {
  IdentityMapData,
  SessionRecord,
  GrowthData,
  GrowthDelta,
  SkillZone,
  AnalyzeResponse,
  ChallengeGenerationResult,
} from "./types";

export interface SavedSession {
  id: string;
  timestamp: string;
  identity_map: IdentityMapData;
  full_result: AnalyzeResponse | null;
  challenges: ChallengeGenerationResult | null;
  challenges_completed: string[];
}

const sessions = new Map<string, SavedSession>();

export function saveSession(
  id: string,
  _userId: string,
  identityMap: IdentityMapData
): void {
  sessions.set(id, {
    id,
    timestamp: new Date().toISOString(),
    identity_map: identityMap,
    full_result: null,
    challenges: null,
    challenges_completed: [],
  });
}

export function saveFullSession(
  id: string,
  _userId: string,
  result: AnalyzeResponse,
  challenges?: ChallengeGenerationResult
): void {
  sessions.set(id, {
    id,
    timestamp: new Date().toISOString(),
    identity_map: result.identity_map,
    full_result: result,
    challenges: challenges ?? null,
    challenges_completed: [],
  });
}

export function getSavedSessions(_userId: string): SavedSession[] {
  return Array.from(sessions.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function getSessions(_userId: string): SessionRecord[] {
  return Array.from(sessions.values())
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((s) => ({
      id: s.id,
      timestamp: s.timestamp,
      identity_map: s.identity_map,
      challenges_completed: s.challenges_completed,
    }));
}

export function getGrowthData(userId: string): GrowthData {
  const allSessions = getSessions(userId);

  if (allSessions.length < 2) {
    return { sessions: allSessions, deltas: [] };
  }

  const latest = allSessions[allSessions.length - 1];
  const previous = allSessions[allSessions.length - 2];
  const deltas = computeDeltas(previous.identity_map, latest.identity_map);

  return { sessions: allSessions, deltas };
}

function computeDeltas(
  prev: IdentityMapData,
  curr: IdentityMapData
): GrowthDelta[] {
  const prevSkills = new Map<string, { zone: SkillZone; confidence: number }>();
  const currSkills = new Map<string, { zone: SkillZone; confidence: number }>();

  for (const zone of ["your_ground", "growing_edge", "ai_zone"] as const) {
    for (const skill of prev[zone]) {
      prevSkills.set(skill.skill, { zone, confidence: skill.confidence });
    }
    for (const skill of curr[zone]) {
      currSkills.set(skill.skill, { zone, confidence: skill.confidence });
    }
  }

  const deltas: GrowthDelta[] = [];

  for (const [skill, currData] of currSkills) {
    const prevData = prevSkills.get(skill);
    if (prevData) {
      const direction =
        currData.confidence > prevData.confidence + 0.05
          ? "improved"
          : currData.confidence < prevData.confidence - 0.05
            ? "regressed"
            : "stable";

      deltas.push({
        skill,
        previous_zone: prevData.zone,
        current_zone: currData.zone,
        previous_confidence: prevData.confidence,
        current_confidence: currData.confidence,
        direction,
      });
    }
  }

  return deltas;
}

export function markChallengeCompleted(
  sessionId: string,
  challengeId: string
): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  if (!session.challenges_completed.includes(challengeId)) {
    session.challenges_completed.push(challengeId);
  }
}
