"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SessionInput } from "@/components/SessionInput";
import { ThinkingTrace } from "@/components/ThinkingTrace";
import type {
  AnalyzeResponse,
  StreamEvent,
  ClassifySessionResult,
  DependencyAnalysisResult,
} from "@/lib/types";

const STEPS = [
  { num: 1, title: "Parse & Classify", desc: "Extracting concepts and modifications" },
  { num: 2, title: "Dependency Analysis", desc: "Reasoning through your understanding" },
  { num: 3, title: "Identity Map", desc: "Mapping skills to zones" },
];

const DEPTH_LABELS: Record<string, { label: string; color: string }> = {
  none: { label: "No changes", color: "var(--color-zone)" },
  cosmetic: { label: "Surface edits", color: "var(--color-zone)" },
  structural: { label: "Structural changes", color: "var(--color-edge)" },
  rewrite: { label: "Full rewrite", color: "var(--color-ground)" },
};

export default function AnalyzePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [thinkingContent, setThinkingContent] = useState("");
  const [classification, setClassification] =
    useState<ClassifySessionResult | null>(null);
  const [analysis, setAnalysis] = useState<DependencyAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = useCallback(async (sessionText: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentStep(0);
    setThinkingContent("");
    setClassification(null);
    setAnalysis(null);
    setResult(null);
    setSaved(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_text: sessionText }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6)) as StreamEvent;

          switch (event.type) {
            case "step_start":
              setCurrentStep(event.step);
              break;
            case "step_complete":
              if (event.step === 1) setClassification(event.data as ClassifySessionResult);
              else if (event.step === 2) setAnalysis(event.data as DependencyAnalysisResult);
              break;
            case "thinking":
              setThinkingContent(event.content);
              break;
            case "error":
              setError(event.message);
              break;
            case "complete":
              setResult(event.result);
              sessionStorage.setItem("bodh_result", JSON.stringify(event.result));
              break;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      if (res.ok) setSaved(true);
    } catch {
      // silent fail
    } finally {
      setIsSaving(false);
    }
  };

  const completedSteps = result ? 3 : classification && analysis ? 2 : classification ? 1 : 0;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Analyze a Session</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Paste your AI-assisted coding session below. Include your prompt, the
          AI response, and any modifications you made.
        </p>
      </div>

      <SessionInput onSubmit={handleSubmit} isLoading={isLoading} />

      {/* Pipeline Timeline */}
      {(isLoading || result) && (
        <div className="mt-12 space-y-0">
          {STEPS.map((step, i) => {
            const isDone = completedSteps >= step.num;
            const isActive = isLoading && currentStep === step.num;
            const isLast = i === STEPS.length - 1;

            return (
              <div key={step.num} className="flex gap-4">
                {/* Left: dot + connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      isDone
                        ? "border-[var(--color-ground)] bg-[var(--color-ground)]"
                        : isActive
                          ? "border-[var(--color-edge)] bg-[var(--color-edge)]/10"
                          : "border-[var(--color-border)] bg-transparent"
                    }`}
                  >
                    {isDone ? (
                      <svg className="h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isActive ? (
                      <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--color-edge)]" />
                    ) : (
                      <span className="text-xs font-medium text-[var(--color-muted)]">{step.num}</span>
                    )}
                  </div>
                  {!isLast && (
                    <div className={`w-px flex-1 min-h-6 ${isDone ? "bg-[var(--color-ground)]/30" : "bg-[var(--color-border)]"}`} />
                  )}
                </div>

                {/* Right: content */}
                <div className={`pb-8 ${isLast ? "pb-0" : ""} flex-1 pt-1`}>
                  <h3 className={`text-sm font-semibold ${isDone ? "text-[var(--color-foreground)]" : isActive ? "text-[var(--color-edge)]" : "text-[var(--color-muted)]"}`}>
                    {step.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    {step.desc}
                  </p>

                  {/* Step 1 result */}
                  {step.num === 1 && classification && (
                    <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
                      <p className="text-sm leading-relaxed text-[var(--color-foreground)]">
                        {classification.prompt_intent}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {classification.concepts_involved.map((concept) => (
                          <span
                            key={concept}
                            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-muted)]"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[var(--color-muted)]">Modification depth:</span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            color: DEPTH_LABELS[classification.modification_depth]?.color,
                            border: `1px solid ${DEPTH_LABELS[classification.modification_depth]?.color}`,
                          }}
                        >
                          {DEPTH_LABELS[classification.modification_depth]?.label}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Step 2 result */}
                  {step.num === 2 && analysis && (
                    <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
                      {analysis.concept_analyses.map((ca) => (
                        <div key={ca.concept}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-[var(--color-foreground)]">
                              {ca.concept}
                            </span>
                            <span
                              className="font-mono text-[11px] font-semibold"
                              style={{
                                color:
                                  ca.confidence >= 0.7
                                    ? "var(--color-ground)"
                                    : ca.confidence >= 0.4
                                      ? "var(--color-edge)"
                                      : "var(--color-zone)",
                              }}
                            >
                              {Math.round(ca.confidence * 100)}%
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${ca.confidence * 100}%`,
                                backgroundColor:
                                  ca.confidence >= 0.7
                                    ? "var(--color-ground)"
                                    : ca.confidence >= 0.4
                                      ? "var(--color-edge)"
                                      : "var(--color-zone)",
                              }}
                            />
                          </div>
                          <p className="mt-1 text-[11px] leading-snug text-[var(--color-muted)]">
                            {ca.evidence}
                          </p>
                        </div>
                      ))}
                      <p className="pt-2 text-xs italic leading-relaxed text-[var(--color-muted)] border-t border-[var(--color-border)]">
                        {analysis.overall_assessment}
                      </p>
                    </div>
                  )}

                  {/* Step 3 result */}
                  {step.num === 3 && result && (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {[
                        { zone: "your_ground", label: "Your Ground", color: "var(--color-ground)", skills: result.identity_map.your_ground },
                        { zone: "growing_edge", label: "Growing Edge", color: "var(--color-edge)", skills: result.identity_map.growing_edge },
                        { zone: "ai_zone", label: "AI Zone", color: "var(--color-zone)", skills: result.identity_map.ai_zone },
                      ].map((z) => (
                        <div key={z.zone} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: z.color }}>
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: z.color }} />
                            {z.label}
                          </div>
                          <p className="mt-1.5 text-2xl font-bold">{z.skills.length}</p>
                          <div className="mt-2 space-y-1">
                            {z.skills.map((s) => (
                              <p key={s.skill} className="truncate text-[11px] text-[var(--color-muted)]">
                                {s.skill}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Thinking trace */}
      {thinkingContent && (
        <div className="mt-8">
          <ThinkingTrace content={thinkingContent} />
        </div>
      )}

      {/* Result actions */}
      {result && (
        <div className="mt-8">
          <p className="mb-4 text-sm text-[var(--color-muted)]">
            {result.identity_map.session_summary}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/map")}
              className="rounded-lg bg-[var(--color-ground)] px-5 py-2 text-sm font-semibold text-black transition-all hover:brightness-110"
            >
              View Identity Map
            </button>
            <button
              type="button"
              onClick={() => router.push("/challenge")}
              className="rounded-lg border border-[var(--color-border)] px-5 py-2 text-sm font-medium transition-colors hover:border-[var(--color-muted)]"
            >
              Get Challenges
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || saved}
              className={`rounded-lg border px-5 py-2 text-sm font-medium transition-colors ${
                saved
                  ? "border-[var(--color-ground)]/30 text-[var(--color-ground)]"
                  : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-muted)]"
              }`}
            >
              {saved ? "Saved" : isSaving ? "Saving..." : "Save Session"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
