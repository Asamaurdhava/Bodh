// ============================================================
// SQLite database setup for session persistence and growth tracking
// ============================================================

import Database from "better-sqlite3";
import path from "path";
import type {
  IdentityMapData,
  SessionRecord,
  GrowthData,
  GrowthDelta,
  SkillZone,
  AnalyzeResponse,
  ChallengeGenerationResult,
} from "./types";

const DB_PATH = path.join(process.cwd(), "bodh.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      timestamp TEXT NOT NULL,
      identity_map TEXT NOT NULL,
      full_result TEXT,
      challenges TEXT,
      challenges_completed TEXT NOT NULL DEFAULT '[]'
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON sessions(timestamp);
  `);
}

export function saveSession(
  id: string,
  userId: string,
  identityMap: IdentityMapData
): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO sessions (id, user_id, timestamp, identity_map)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, userId, new Date().toISOString(), JSON.stringify(identityMap));
}

export function saveFullSession(
  id: string,
  userId: string,
  result: AnalyzeResponse,
  challenges?: ChallengeGenerationResult
): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO sessions (id, user_id, timestamp, identity_map, full_result, challenges)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    userId,
    new Date().toISOString(),
    JSON.stringify(result.identity_map),
    JSON.stringify(result),
    challenges ? JSON.stringify(challenges) : null
  );
}

export interface SavedSession {
  id: string;
  timestamp: string;
  identity_map: IdentityMapData;
  full_result: AnalyzeResponse | null;
  challenges: ChallengeGenerationResult | null;
}

export function getSavedSessions(userId: string): SavedSession[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, timestamp, identity_map, full_result, challenges
    FROM sessions
    WHERE user_id = ?
    ORDER BY timestamp DESC
  `);
  const rows = stmt.all(userId) as Array<{
    id: string;
    timestamp: string;
    identity_map: string;
    full_result: string | null;
    challenges: string | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    identity_map: JSON.parse(row.identity_map) as IdentityMapData,
    full_result: row.full_result
      ? (JSON.parse(row.full_result) as AnalyzeResponse)
      : null,
    challenges: row.challenges
      ? (JSON.parse(row.challenges) as ChallengeGenerationResult)
      : null,
  }));
}

export function getSessions(userId: string): SessionRecord[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, timestamp, identity_map, challenges_completed
    FROM sessions
    WHERE user_id = ?
    ORDER BY timestamp ASC
  `);
  const rows = stmt.all(userId) as Array<{
    id: string;
    timestamp: string;
    identity_map: string;
    challenges_completed: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    identity_map: JSON.parse(row.identity_map) as IdentityMapData,
    challenges_completed: JSON.parse(row.challenges_completed) as string[],
  }));
}

export function getGrowthData(userId: string): GrowthData {
  const sessions = getSessions(userId);

  if (sessions.length < 2) {
    return { sessions, deltas: [] };
  }

  const latest = sessions[sessions.length - 1];
  const previous = sessions[sessions.length - 2];

  const deltas = computeDeltas(previous.identity_map, latest.identity_map);

  return { sessions, deltas };
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
  const database = getDb();
  const row = database
    .prepare("SELECT challenges_completed FROM sessions WHERE id = ?")
    .get(sessionId) as { challenges_completed: string } | undefined;

  if (!row) return;

  const completed = JSON.parse(row.challenges_completed) as string[];
  if (!completed.includes(challengeId)) {
    completed.push(challengeId);
    database
      .prepare("UPDATE sessions SET challenges_completed = ? WHERE id = ?")
      .run(JSON.stringify(completed), sessionId);
  }
}
