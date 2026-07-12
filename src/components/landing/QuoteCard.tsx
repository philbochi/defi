"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Mock of the swap page's auto-refreshing quote (labeled as such).
 * The 0.001 WETH → UNI figure is a real QuoterV2 result from the
 * Sepolia pool; the cycling variance is display-only. Static under
 * prefers-reduced-motion (WCAG 2.2.2).
 */
const BASE_OUT = 0.000045398537201612;
const QUOTES = [1, 0.9987, 1.0021, 0.9964, 1.0008];

export default function QuoteCard() {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (reduced) return;
    let flashTimer: number | undefined;
    const id = window.setInterval(() => {
      setI((v) => (v + 1) % QUOTES.length);
      setFlash(true);
      window.clearTimeout(flashTimer);
      flashTimer = window.setTimeout(() => setFlash(false), 400);
    }, 4_000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(flashTimer);
    };
  }, [reduced]);

  const out = BASE_OUT * QUOTES[i];

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-edge bg-surface-2/60 p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-2">
          QuoterV2 · simulated refresh
        </span>
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${flash ? "bg-neon-violet" : "bg-ink-3/60"} transition-colors`}
          />
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="tnum font-mono text-lg font-semibold text-ink">
          0.001 WETH
        </span>
        <span className="text-neon-violet" aria-hidden>
          →
        </span>
        <span
          className={`tnum font-mono text-lg font-semibold transition-colors duration-300 ${flash ? "text-neon-violet" : "text-ink"}`}
        >
          {out.toFixed(9)} UNI
        </span>
      </div>
      <span className="text-xs text-ink-2">
        live quotes re-fetch every 15s — and freeze while your wallet prompt
        is open
      </span>
    </div>
  );
}
