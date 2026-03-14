// ============================================================
// Supabase-backed session persistence
// ============================================================

import { supabase } from "./supabase";
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

export async function saveSession(
  id: string,
  userId: string,
  identityMap: IdentityMapData
): Promise<void> {
  await supabase.from("sessions").upsert({
    id,
    user_id: userId,
    timestamp: new Date().toISOString(),
    identity_map: identityMap,
    full_result: null,
    challenges: null,
    challenges_completed: [],
  });
}

export async function saveFullSession(
  id: string,
  userId: string,
  result: AnalyzeResponse,
  challenges?: ChallengeGenerationResult
): Promise<void> {
  await supabase.from("sessions").upsert({
    id,
    user_id: userId,
    timestamp: new Date().toISOString(),
    identity_map: result.identity_map,
    full_result: result,
    challenges: challenges ?? null,
    challenges_completed: [],
  });
}

export async function getSavedSessions(userId: string): Promise<SavedSession[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("id, timestamp, identity_map, full_result, challenges, challenges_completed")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    identity_map: row.identity_map as IdentityMapData,
    full_result: row.full_result as AnalyzeResponse | null,
    challenges: row.challenges as ChallengeGenerationResult | null,
    challenges_completed: (row.challenges_completed as string[]) ?? [],
  }));
}

export async function getSessions(userId: string): Promise<SessionRecord[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("id, timestamp, identity_map, challenges_completed")
    .eq("user_id", userId)
    .order("timestamp", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    identity_map: row.identity_map as IdentityMapData,
    challenges_completed: (row.challenges_completed as string[]) ?? [],
  }));
}

export async function getGrowthData(userId: string): Promise<GrowthData> {
  const allSessions = await getSessions(userId);

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

export async function markChallengeCompleted(
  sessionId: string,
  challengeId: string
): Promise<void> {
  const { data } = await supabase
    .from("sessions")
    .select("challenges_completed")
    .eq("id", sessionId)
    .single();

  if (!data) return;

  const completed = (data.challenges_completed as string[]) ?? [];
  if (!completed.includes(challengeId)) {
    completed.push(challengeId);
    await supabase
      .from("sessions")
      .update({ challenges_completed: completed })
      .eq("id", sessionId);
  }
}
