"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/analyze", label: "Analyze" },
  { href: "/map", label: "Map" },
  { href: "/challenge", label: "Challenges" },
  { href: "/history", label: "History" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [showMeaning, setShowMeaning] = useState(false);

  return (
    <>
      {/* Title — top center with meaning tooltip */}
      <div className="flex h-20 items-center justify-center">
        <div className="relative">
          <Link
            href="/"
            className="text-4xl font-bold tracking-tight text-[var(--color-ground)]"
            onMouseEnter={() => setShowMeaning(true)}
            onMouseLeave={() => setShowMeaning(false)}
          >
            bodh
          </Link>

          {/* Meaning card */}
          <div
            className={`absolute left-1/2 top-full mt-3 -translate-x-1/2 transition-all duration-200 ${
              showMeaning
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
          >
            <div className="w-80 rounded-xl border border-[var(--color-ground)]/20 bg-[var(--color-surface)] p-5 shadow-lg shadow-black/30">
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-[var(--color-ground)]">
                /bodh/ &mdash; Sanskrit
              </p>
              <p className="mt-2 text-center text-[15px] font-medium leading-relaxed text-[var(--color-foreground)]">
                &ldquo;To know. To awaken.&rdquo;
              </p>
              <p className="mt-1 text-center text-sm leading-relaxed text-[var(--color-muted)]">
                The root of &ldquo;Buddha&rdquo; &mdash; one who has awakened to understanding.
              </p>
              <div className="mt-4 h-px bg-[var(--color-border)]" />
              <div className="mt-4 space-y-2.5 text-[11px]">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-ground)]" />
                  <p><span className="font-semibold text-[var(--color-ground)]">Your Ground</span> <span className="text-[var(--color-muted)]">&ndash; skills you truly own</span></p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-edge)]" />
                  <p><span className="font-semibold text-[var(--color-edge)]">Growing Edge</span> <span className="text-[var(--color-muted)]">&ndash; where learning is happening</span></p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-zone)]" />
                  <p><span className="font-semibold text-[var(--color-zone)]">AI Zone</span> <span className="text-[var(--color-muted)]">&ndash; what you delegate to AI</span></p>
                </div>
              </div>
              <div className="mt-4 h-px bg-[var(--color-border)]" />
              <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--color-muted)]">
                Paste a coding session. See what&apos;s yours vs. what&apos;s borrowed. Grow intentionally.
              </p>
            </div>
            {/* Arrow */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-l border-t border-[var(--color-ground)]/20 bg-[var(--color-surface)]" />
          </div>
        </div>
      </div>

      {/* Navigation — right side, vertically centered card */}
      <nav className="fixed right-6 top-1/2 z-40 -translate-y-1/2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-col gap-0.5 p-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--color-surface-hover)] text-[var(--color-foreground)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
