"use client";

import { useState } from "react";
import type { Tradeoff } from "@/lib/landing/content";

export type MatrixTab = {
  id: string;
  label: string;
  color: "cyan" | "violet" | "ember";
  chosen: Tradeoff[];
  rejected: Tradeoff[];
  /** Pre-highlighted shiki HTML (build-time, trusted repo content). */
  chosenHtml: string;
  rejectedHtml: string;
};

const ACCENT = {
  cyan: "text-neon-cyan",
  violet: "text-neon-violet",
  ember: "text-neon-ember",
} as const;

const TAB_ACTIVE = {
  cyan: "border-neon-cyan/60 text-neon-cyan",
  violet: "border-neon-violet/60 text-neon-violet",
  ember: "border-neon-ember/60 text-neon-ember",
} as const;

export default function TradeoffMatrix({ tabs }: { tabs: MatrixTab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  // Full ARIA tabs contract: roving tabindex + arrow-key navigation.
  function onTablistKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const idx = tabs.findIndex((t) => t.id === active.id);
    let next = -1;
    if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next === -1) return;
    e.preventDefault();
    setActiveId(tabs[next].id);
    (
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]
    )?.focus();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-surface">
      {/* terminal chrome */}
      <div className="flex flex-wrap items-center gap-3 border-b border-edge bg-surface-2/60 px-4 py-2.5">
        <span aria-hidden className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-negative/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#c98500]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-positive/70" />
        </span>
        <span className="hidden font-mono text-[11px] text-ink-2 md:inline">
          tradeoffs — why this, not that
        </span>
        <div
          role="tablist"
          aria-label="Project trade-offs"
          className="ml-auto flex gap-1"
          onKeyDown={onTablistKeyDown}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              id={`matrix-tab-${t.id}`}
              role="tab"
              aria-selected={t.id === active.id}
              aria-controls={`matrix-panel-${t.id}`}
              tabIndex={t.id === active.id ? 0 : -1}
              onClick={() => setActiveId(t.id)}
              className={`rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                t.id === active.id
                  ? `bg-surface ${TAB_ACTIVE[t.color]}`
                  : "border-transparent text-ink-3 hover:text-ink-2"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* split panes */}
      <div
        id={`matrix-panel-${active.id}`}
        role="tabpanel"
        aria-labelledby={`matrix-tab-${active.id}`}
        className="grid grid-cols-1 md:grid-cols-2"
      >
        <section className="flex min-w-0 flex-col gap-4 border-b border-edge p-5 md:border-b-0 md:border-r">
          <h3 className={`font-mono text-xs uppercase tracking-wider ${ACCENT[active.color]}`}>
            ▸ shipped
          </h3>
          <ul className="flex flex-col gap-3">
            {active.chosen.map((item) => (
              <li key={item.title} className="flex gap-2.5 text-sm">
                <span className={`mt-0.5 ${ACCENT[active.color]}`} aria-hidden>
                  +
                </span>
                <span className="text-ink-2">
                  <strong className="font-medium text-ink">{item.title}.</strong>{" "}
                  {item.why}
                </span>
              </li>
            ))}
          </ul>
          <div
            className="landing-code mt-auto overflow-x-auto rounded-lg border border-edge text-[12px] leading-relaxed"
            // Build-time shiki output of code from this repo — not user input.
            dangerouslySetInnerHTML={{ __html: active.chosenHtml }}
          />
        </section>

        <section className="flex min-w-0 flex-col gap-4 p-5">
          <h3 className="font-mono text-xs uppercase tracking-wider text-negative/80">
            ▸ deliberately not
          </h3>
          <ul className="flex flex-col gap-3">
            {active.rejected.map((item) => (
              <li key={item.title} className="flex gap-2.5 text-sm">
                <span className="mt-0.5 text-negative/80" aria-hidden>
                  −
                </span>
                <span className="text-ink-3">
                  <strong className="font-medium text-ink-2">{item.title}.</strong>{" "}
                  {item.why}
                </span>
              </li>
            ))}
          </ul>
          <div
            className="landing-code mt-auto overflow-x-auto rounded-lg border border-edge text-[12px] leading-relaxed opacity-80"
            dangerouslySetInnerHTML={{ __html: active.rejectedHtml }}
          />
        </section>
      </div>
    </div>
  );
}
