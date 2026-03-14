import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col items-center justify-center px-6 overflow-hidden -mt-4">
      <div className="mx-auto max-w-2xl text-center">
        {/* Tagline */}
        <p className="mb-6 text-sm font-medium uppercase tracking-widest text-[var(--color-ground)]">
          Developer Skill Identity Engine
        </p>

        {/* Heading */}
        <h2 className="mb-4 text-3xl font-bold leading-[1.15] tracking-tight sm:text-5xl">
          Know what you{" "}
          <span className="text-[var(--color-ground)]">truly understand</span>
          {" "}vs.&nbsp;what you delegate to AI
        </h2>

        {/* Sub */}
        <p className="mx-auto mb-10 max-w-md text-base leading-relaxed text-[var(--color-muted)]">
          Paste a coding session. See your genuine skills, growing edges, and
          AI-dependent zones. Then grow — with AI, not despite it.
        </p>

        {/* CTA row */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/analyze"
            className="rounded-lg bg-[var(--color-ground)] px-6 py-2.5 text-sm font-semibold text-[var(--color-background)] transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Analyze a session
          </Link>
          <Link
            href="/map"
            className="rounded-lg border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            View demo map
          </Link>
        </div>

        {/* Zone legend */}
        <div className="mt-16 flex items-center justify-center gap-6 text-xs text-[var(--color-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--color-ground)]" />
            Your Ground
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--color-edge)]" />
            Growing Edge
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--color-zone)]" />
            AI Zone
          </span>
        </div>
      </div>
    </div>
  );
}
