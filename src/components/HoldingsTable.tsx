"use client";

import { useState } from "react";
import type { Portfolio } from "@/lib/types";
import {
  formatUsd,
  formatPrice,
  formatBalance,
  formatPercent,
} from "@/lib/format";
import TokenIcon from "./TokenIcon";

export default function HoldingsTable({ portfolio }: { portfolio: Portfolio }) {
  const [showUnpriced, setShowUnpriced] = useState(false);
  const { priced, unpriced, totalUsd } = portfolio;

  return (
    <section
      className="overflow-hidden rounded-xl border border-edge bg-surface"
      aria-label="Token holdings"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-ink-3">
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="hidden px-4 py-3 text-right font-medium md:table-cell">
                Price
              </th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
              <th className="px-4 py-3 text-right font-medium">Value</th>
              <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {priced.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-3">
                  No priced holdings found for this address.
                </td>
              </tr>
            )}
            {priced.map((h) => (
              <tr
                key={h.contract ?? "eth"}
                className="border-b border-edge/60 last:border-b-0 hover:bg-surface-2/60"
              >
                <td className="px-4 py-3">
                  <span className="flex items-center gap-3">
                    <TokenIcon symbol={h.symbol} logo={h.logo} />
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium text-ink">{h.symbol}</span>
                      {h.contract ? (
                        <a
                          href={`https://etherscan.io/token/${h.contract}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="max-w-45 truncate text-xs text-ink-3 transition-colors hover:text-ink-2"
                        >
                          {h.name}
                        </a>
                      ) : (
                        <span className="max-w-45 truncate text-xs text-ink-3">
                          {h.name}
                        </span>
                      )}
                    </span>
                  </span>
                </td>
                <td className="tnum hidden px-4 py-3 text-right text-ink-2 md:table-cell">
                  {h.priceUsd !== null ? formatPrice(h.priceUsd) : "—"}
                </td>
                <td className="tnum px-4 py-3 text-right text-ink-2">
                  {formatBalance(h.balance)}
                </td>
                <td className="tnum px-4 py-3 text-right font-medium text-ink">
                  {h.usdValue !== null ? formatUsd(h.usdValue) : "—"}
                </td>
                <td className="tnum hidden px-4 py-3 text-right text-ink-2 sm:table-cell">
                  {totalUsd > 0 && h.usdValue !== null
                    ? formatPercent(h.usdValue / totalUsd)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {unpriced.length > 0 && (
        <div className="border-t border-edge">
          <button
            type="button"
            onClick={() => setShowUnpriced((v) => !v)}
            aria-expanded={showUnpriced}
            className="flex w-full items-center justify-between px-4 py-3 text-xs text-ink-3 transition-colors hover:text-ink-2"
          >
            <span>
              {unpriced.length} token{unpriced.length === 1 ? "" : "s"} without
              price data hidden (likely spam or illiquid)
            </span>
            <span aria-hidden>{showUnpriced ? "▴" : "▾"}</span>
          </button>
          {showUnpriced && (
            <ul className="flex flex-col border-t border-edge/60">
              {unpriced.map((h) => (
                <li
                  key={h.contract ?? "eth"}
                  className="flex items-center justify-between gap-3 border-b border-edge/40 px-4 py-2.5 text-sm last:border-b-0"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <TokenIcon symbol={h.symbol} logo={h.logo} size={24} />
                    <span className="truncate text-ink-2">{h.symbol}</span>
                  </span>
                  <span className="tnum shrink-0 text-ink-3">
                    {formatBalance(h.balance)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
