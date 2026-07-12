"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { TELEMETRY_POOL } from "@/lib/landing/content";

const MAX_LINES = 6;

const TAG_COLOR: Record<string, string> = {
  EVENT: "text-neon-ember",
  QUOTE: "text-neon-violet",
  SWAP: "text-neon-violet",
  CACHE: "text-neon-cyan",
  RPC: "text-neon-cyan",
  PRICE: "text-neon-cyan",
  VAULT: "text-neon-ember",
  GUARD: "text-neon-violet",
  LIMIT: "text-neon-cyan",
};

type Line = { id: number; time: string; text: string };

function tagOf(text: string): string {
  return text.slice(1, text.indexOf("]")).trim();
}

/**
 * Simulated telemetry stream. The event shapes, addresses, and gas
 * numbers come from the real deployed contracts and measured behavior;
 * only the stream timing is synthetic — and the label says so.
 *
 * WCAG 2.2.2: the stream is pausable, and it starts paused for users
 * with prefers-reduced-motion (showing a static sample instead).
 */
export default function TelemetryTicker() {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  // Starts as a static sample (also what SSR and paused/reduced users see).
  const [lines, setLines] = useState<Line[]>(() =>
    TELEMETRY_POOL.slice(0, MAX_LINES).map((text, i) => ({
      id: i,
      time: "--:--:--",
      text,
    })),
  );
  const cursor = useRef(0);
  const counter = useRef(MAX_LINES);

  const streaming = !paused && !reduced;

  useEffect(() => {
    if (!streaming) return;
    const push = () => {
      const text = TELEMETRY_POOL[cursor.current % TELEMETRY_POOL.length];
      cursor.current += 1;
      const time = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setLines((prev) =>
        [...prev, { id: counter.current++, time, text }].slice(-MAX_LINES),
      );
    };
    push();
    push();
    const id = window.setInterval(push, 2_800);
    return () => window.clearInterval(id);
  }, [streaming]);

  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge bg-surface-2/60 px-4 py-2">
        <span className="flex items-center gap-2 font-mono text-[11px] text-ink-2">
          <span className="relative flex h-2 w-2">
            {streaming && (
              <span className="absolute h-full w-full animate-ping rounded-full bg-neon-ember/60" />
            )}
            <span
              className={`relative h-2 w-2 rounded-full ${streaming ? "bg-neon-ember" : "bg-ink-3"}`}
            />
          </span>
          ecosystem telemetry
        </span>
        <span className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-ink-2">
            simulated feed · shapes from the deployed contracts
          </span>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            className="rounded-md border border-edge px-2 py-0.5 font-mono text-[10px] text-ink-2 transition-colors hover:text-ink"
          >
            {streaming ? "pause" : "play"}
          </button>
        </span>
      </div>
      <div
        aria-live="off"
        className="flex h-40 flex-col justify-end gap-1 px-4 py-3 font-mono text-[11px] leading-relaxed"
      >
        {lines.map((line, i) => (
          <p
            key={line.id}
            className={`truncate transition-opacity duration-500 ${
              i === lines.length - 1 ? "text-ink-2" : "text-ink-3"
            }`}
            style={{ opacity: 0.45 + (0.55 * (i + 1)) / lines.length }}
          >
            <span className="text-ink-3">{line.time}</span>{" "}
            <span className={TAG_COLOR[tagOf(line.text)] ?? "text-ink-2"}>
              {line.text}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}
