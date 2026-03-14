import { NextRequest } from "next/server";
import { generateChallenges } from "@/lib/claude";
import type { ChallengeRequest } from "@/lib/types";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ChallengeRequest;

  if (!body.identity_map) {
    return Response.json(
      { error: "Identity map is required" },
      { status: 400 }
    );
  }

  try {
    const result = await generateChallenges(body.identity_map);
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Challenge generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
