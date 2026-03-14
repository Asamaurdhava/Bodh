import { NextRequest } from "next/server";
import {
  classifySession,
  analyzeDependencies,
  generateIdentityMap,
} from "@/lib/claude";
import { saveSession } from "@/lib/db";
import type { AnalyzeRequest, StreamEvent } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AnalyzeRequest;

  if (!body.session_text || body.session_text.trim().length === 0) {
    return Response.json(
      { error: "Session text is required" },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

      try {
        // Step 1: Parse & Classify
        send({ type: "step_start", step: 1, label: "Parsing & classifying your session" });
        const classification = await classifySession(body.session_text);
        send({ type: "step_complete", step: 1, data: classification });

        // Step 2: Dependency Analysis (Extended Thinking)
        send({ type: "step_start", step: 2, label: "Analyzing your relationship with the code" });
        const analysis = await analyzeDependencies(classification);
        send({ type: "thinking", content: analysis.thinking_trace });
        send({ type: "step_complete", step: 2, data: analysis });

        // Step 3: Identity Map Generation
        send({ type: "step_start", step: 3, label: "Generating your identity map" });
        const identityMap = await generateIdentityMap(analysis);
        send({ type: "step_complete", step: 3, data: identityMap });

        // Save to DB
        const sessionId = crypto.randomUUID();
        const userId = body.user_id || "default";
        try {
          saveSession(sessionId, userId, identityMap);
        } catch {
          // DB save failure shouldn't break the response
        }

        // Send complete result
        send({
          type: "complete",
          result: {
            classification,
            dependency_analysis: analysis,
            identity_map: identityMap,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Analysis failed";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
