// ============================================================
// Claude API client + pipeline orchestration
// Each pipeline step is a separate Claude API call
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import {
  classifyCodeSessionTool,
  generateIdentityMapTool,
  generateChallengesTool,
} from "./tools";
import {
  STEP_1_CLASSIFY_PROMPT,
  STEP_2_DEPENDENCY_ANALYSIS_PROMPT,
  STEP_3_IDENTITY_MAP_PROMPT,
  STEP_4_CHALLENGE_PROMPT,
} from "./prompts";
import type {
  ClassifySessionResult,
  DependencyAnalysisResult,
  ConceptAnalysis,
  IdentityMapData,
  SkillNode,
  ChallengeGenerationResult,
  StreamEvent,
} from "./types";

const MODEL = "claude-sonnet-4-6";

function getClient(): Anthropic {
  return new Anthropic();
}

// --- Step 1: Parse & Classify ---

export async function classifySession(
  sessionText: string
): Promise<ClassifySessionResult> {
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: STEP_1_CLASSIFY_PROMPT,
    tools: [classifyCodeSessionTool],
    tool_choice: { type: "tool", name: "classify_code_session" },
    messages: [
      {
        role: "user",
        content: `Here is the coding session to analyze:\n\n${sessionText}`,
      },
    ],
  });

  const toolBlock = response.content.find((block) => block.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Step 1 failed: No tool use response from Claude");
  }

  return toolBlock.input as ClassifySessionResult;
}

// --- Step 2: Dependency Analysis (Extended Thinking) ---

export async function analyzeDependencies(
  classification: ClassifySessionResult
): Promise<DependencyAnalysisResult> {
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: STEP_2_DEPENDENCY_ANALYSIS_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyze this classified coding session:\n\n${JSON.stringify(classification, null, 2)}\n\nFor each concept in concepts_involved, provide a confidence score and evidence. Think step by step before producing the JSON.\n\nFormat your final response as JSON with this structure:\n{\n  "concept_analyses": [\n    {\n      "concept": "string",\n      "confidence": 0.0-1.0,\n      "evidence": "string",\n      "signals_of_understanding": ["string"],\n      "signals_of_delegation": ["string"]\n    }\n  ],\n  "overall_assessment": "string"\n}`,
      },
    ],
  });

  let thinkingTrace = "";
  let textContent = "";

  for (const block of response.content) {
    if (block.type === "text") {
      textContent += block.text;
    }
  }

  // Strip markdown code fences if present
  const cleaned = textContent.replace(/```json\s*/g, "").replace(/```\s*/g, "");
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Step 2 failed: Could not parse dependency analysis JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    concept_analyses: ConceptAnalysis[];
    overall_assessment: string;
  };

  return {
    thinking_trace: thinkingTrace,
    concept_analyses: parsed.concept_analyses,
    overall_assessment: parsed.overall_assessment,
  };
}

// --- Step 3: Identity Map Generation ---

export async function generateIdentityMap(
  analysis: DependencyAnalysisResult
): Promise<IdentityMapData> {
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: STEP_3_IDENTITY_MAP_PROMPT,
    tools: [generateIdentityMapTool],
    tool_choice: { type: "tool", name: "generate_identity_map" },
    messages: [
      {
        role: "user",
        content: `Generate an identity map from this dependency analysis:\n\n${JSON.stringify(analysis, null, 2)}`,
      },
    ],
  });

  const toolBlock = response.content.find((block) => block.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Step 3 failed: No tool use response from Claude");
  }

  const input = toolBlock.input as {
    your_ground: Array<{ skill: string; confidence: number; evidence: string }>;
    growing_edge: Array<{ skill: string; confidence: number; evidence: string }>;
    ai_zone: Array<{ skill: string; confidence: number; evidence: string }>;
    session_summary: string;
  };

  const addZone = (
    items: Array<{ skill: string; confidence: number; evidence: string }>,
    zone: SkillNode["zone"]
  ): SkillNode[] => items.map((item) => ({ ...item, zone }));

  return {
    your_ground: addZone(input.your_ground, "your_ground"),
    growing_edge: addZone(input.growing_edge, "growing_edge"),
    ai_zone: addZone(input.ai_zone, "ai_zone"),
    session_summary: input.session_summary,
  };
}

// --- Step 4: Challenge Generation ---

export async function generateChallenges(
  identityMap: IdentityMapData
): Promise<ChallengeGenerationResult> {
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: STEP_4_CHALLENGE_PROMPT,
    tools: [generateChallengesTool],
    tool_choice: { type: "tool", name: "generate_challenges" },
    messages: [
      {
        role: "user",
        content: `Generate challenges based on this identity map:\n\n${JSON.stringify(identityMap, null, 2)}`,
      },
    ],
  });

  const toolBlock = response.content.find((block) => block.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Step 4 failed: No tool use response from Claude");
  }

  return toolBlock.input as ChallengeGenerationResult;
}

// --- Full Pipeline with Streaming Events ---

export async function runPipeline(
  sessionText: string,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  try {
    // Step 1
    onEvent({ type: "step_start", step: 1, label: "Parsing & classifying your session" });
    const classification = await classifySession(sessionText);
    onEvent({ type: "step_complete", step: 1, data: classification });

    // Step 2
    onEvent({ type: "step_start", step: 2, label: "Analyzing your relationship with the code" });
    const analysis = await analyzeDependencies(classification);
    onEvent({ type: "thinking", content: analysis.thinking_trace });
    onEvent({ type: "step_complete", step: 2, data: analysis });

    // Step 3
    onEvent({ type: "step_start", step: 3, label: "Generating your identity map" });
    const identityMap = await generateIdentityMap(analysis);
    onEvent({ type: "step_complete", step: 3, data: identityMap });

    // Complete
    onEvent({
      type: "complete",
      result: {
        classification,
        dependency_analysis: analysis,
        identity_map: identityMap,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pipeline failed";
    onEvent({ type: "error", message });
  }
}
