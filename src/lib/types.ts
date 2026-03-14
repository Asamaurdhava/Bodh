// ============================================================
// Bodh — Developer Skill Identity Engine
// All TypeScript interfaces for the 5-step agentic pipeline
// ============================================================

// --- Step 1: Parse & Classify ---

export interface CodeBlock {
  code: string;
  language: string;
  line_start: number;
  line_end: number;
}

export interface UserModification {
  original: string;
  modified: string;
  description: string;
}

export type ModificationDepth = "none" | "cosmetic" | "structural" | "rewrite";

export interface ClassifySessionResult {
  prompt_intent: string;
  concepts_involved: string[];
  ai_generated_blocks: CodeBlock[];
  user_modifications: UserModification[];
  modification_depth: ModificationDepth;
}

// --- Step 2: Dependency Analysis ---

export interface ConceptAnalysis {
  concept: string;
  confidence: number; // 0.0 - 1.0
  evidence: string;
  signals_of_understanding: string[];
  signals_of_delegation: string[];
}

export interface DependencyAnalysisResult {
  thinking_trace: string;
  concept_analyses: ConceptAnalysis[];
  overall_assessment: string;
}

// --- Step 3: Identity Map ---

export type SkillZone = "your_ground" | "growing_edge" | "ai_zone";

export interface SkillNode {
  skill: string;
  confidence: number;
  evidence: string;
  zone: SkillZone;
}

export interface IdentityMapData {
  your_ground: SkillNode[];
  growing_edge: SkillNode[];
  ai_zone: SkillNode[];
  session_summary: string;
}

// --- Step 4: Challenge Generation ---

export interface Challenge {
  id: string;
  title: string;
  description: string;
  code_snippet: string;
  language: string;
  instructions: string[];
  skill_target: string;
  target_zone: SkillZone;
  difficulty: "approachable" | "moderate" | "stretch";
}

export interface ChallengeGenerationResult {
  challenges: Challenge[];
  rationale: string;
}

// --- Step 5: Growth Tracking ---

export interface SessionRecord {
  id: string;
  timestamp: string;
  identity_map: IdentityMapData;
  challenges_completed: string[];
}

export interface GrowthDelta {
  skill: string;
  previous_zone: SkillZone;
  current_zone: SkillZone;
  previous_confidence: number;
  current_confidence: number;
  direction: "improved" | "stable" | "regressed";
}

export interface GrowthData {
  sessions: SessionRecord[];
  deltas: GrowthDelta[];
}

// --- Pipeline State ---

export interface PipelineState {
  step: 1 | 2 | 3 | 4 | 5;
  status: "idle" | "running" | "complete" | "error";
  classification?: ClassifySessionResult;
  dependency_analysis?: DependencyAnalysisResult;
  identity_map?: IdentityMapData;
  challenges?: ChallengeGenerationResult;
  growth?: GrowthData;
  error?: string;
}

// --- API Request/Response Types ---

export interface AnalyzeRequest {
  session_text: string;
  user_id?: string;
}

export interface AnalyzeResponse {
  classification: ClassifySessionResult;
  dependency_analysis: DependencyAnalysisResult;
  identity_map: IdentityMapData;
}

export interface ChallengeRequest {
  identity_map: IdentityMapData;
}

export interface ChallengeResponse {
  challenges: Challenge[];
  rationale: string;
}

export interface GrowthRequest {
  user_id: string;
}

export interface GrowthResponse {
  growth: GrowthData;
}

// --- Streaming Events ---

export type StreamEvent =
  | { type: "step_start"; step: number; label: string }
  | { type: "step_complete"; step: number; data: unknown }
  | { type: "thinking"; content: string }
  | { type: "error"; message: string }
  | { type: "complete"; result: AnalyzeResponse };
