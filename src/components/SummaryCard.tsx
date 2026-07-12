"use client";

import type { Portfolio } from "@/lib/types";
import { formatUsd, shortenAddress } from "@/lib/format";

export default function SummaryCard({ portfolio }: { portfolio: Portfolio }) {
  // The ETH balance is price-independent, so look in both buckets.
  const eth = [...portfolio.priced, ...portfolio.unpriced].find(
    (h) => h.contract === null,
  );
  const updated = new Date(portfolio.updatedAt);

  return (
    <section
      className="flex flex-col justify-between gap-6 rounded-xl border border-edge bg-surface p-5"
      aria-label="Portfolio summary"
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-ink-3">
          Total portfolio value
        </span>
        <span className="text-4xl font-semibold tracking-tight">
          {formatUsd(portfolio.totalUsd)}
        </span>
        <span
          className="mt-1 font-mono text-xs text-ink-3"
          title={portfolio.address}
        >
          {shortenAddress(portfolio.address)}
        </span>
        {portfolio.truncated && (
          <span className="mt-2 text-xs text-ink-2">
            Large wallet — only the first tokens found on-chain were scanned,
            so the total may be incomplete.
          </span>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-ink-3">Priced assets</dt>
          <dd className="tnum font-medium">{portfolio.priced.length}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-ink-3">ETH balance</dt>
          <dd className="tnum font-medium">
            {eth ? `${Number(eth.balance).toFixed(4)} ETH` : "0 ETH"}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-ink-3">As of</dt>
          <dd className="tnum font-medium">
            {updated.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </dd>
        </div>
      </dl>
    </section>
  );
}
