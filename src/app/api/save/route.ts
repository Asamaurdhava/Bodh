import { NextRequest } from "next/server";
import { saveFullSession } from "@/lib/db";
import type { AnalyzeResponse, ChallengeGenerationResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    result: AnalyzeResponse;
    challenges?: ChallengeGenerationResult;
  };

  if (!body.result) {
    return Response.json({ error: "Result is required" }, { status: 400 });
  }

  const sessionId = crypto.randomUUID();

  try {
    await saveFullSession(sessionId, "default", body.result, body.challenges);
    return Response.json({ success: true, id: sessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
