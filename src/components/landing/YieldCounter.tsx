"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Live accrual demo: what 100 BWC staked in the deployed vault earns,
 * computed with the contract's exact formula (10% APR, per-second) —
 * the same math the /stake page runs against the chain. Static under
 * prefers-reduced-motion (WCAG 2.2.2).
 */
const PRINCIPAL = 100;
const APR = 0.1;
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
const PER_MS = (PRINCIPAL * APR) / (SECONDS_PER_YEAR * 1000);

export default function YieldCounter() {
  const reduced = useReducedMotion();
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setNow(Date.now()), 120);
    return () => window.clearInterval(id);
  }, [reduced]);

  const accrued = (now - start) * PER_MS;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-edge bg-surface-2/60 p-4">
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-2">
        100 BWC staked right now would be accruing
      </span>
      <span className="tnum font-mono text-2xl font-semibold text-neon-emerald">
        {reduced ? (
          <>
            +0.000000317
            <span className="ml-2 text-sm text-ink-2">BWC / second</span>
          </>
        ) : (
          <>
            +{accrued.toFixed(9)}
            <span className="ml-2 text-sm text-ink-2">BWC</span>
          </>
        )}
      </span>
      <span className="text-xs text-ink-2">
        contract formula: staked × 1000 bps × elapsed ÷ (10,000 × 365 days)
      </span>
    </div>
  );
}
