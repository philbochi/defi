"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { TokenHolding } from "@/lib/types";
import { formatUsd, formatPercent } from "@/lib/format";

/**
 * Categorical slots in fixed order, CVD-validated against the card surface
 * (worst adjacent ΔE sits in the 8–12 floor band, so the chart also carries
 * secondary encoding: segment gaps, an ordered legend with percent labels,
 * and the holdings table as the full data view).
 */
const SERIES = [
  "#3987e5",
  "#199e70",
  "#c98500",
  "#008300",
  "#9085e9",
  "#e66767",
  "#d55181",
  "#d95926",
] as const;

const OTHER_COLOR = "#6e7480";
const MAX_SLICES = 8;

type Slice = { name: string; value: number; color: string };

function toSlices(holdings: TokenHolding[]): Slice[] {
  const priced = holdings.filter((h) => (h.usdValue ?? 0) > 0);
  const top = priced.slice(0, MAX_SLICES);
  const rest = priced.slice(MAX_SLICES);

  const slices: Slice[] = top.map((h, i) => ({
    name: h.symbol,
    value: h.usdValue as number,
    color: SERIES[i],
  }));

  const otherTotal = rest.reduce((sum, h) => sum + (h.usdValue as number), 0);
  if (otherTotal > 0) {
    slices.push({
      name: `Other (${rest.length})`,
      value: otherTotal,
      color: OTHER_COLOR,
    });
  }
  return slices;
}

export default function AllocationChart({
  holdings,
}: {
  holdings: TokenHolding[];
}) {
  const slices = toSlices(holdings);
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <section className="flex items-center justify-center rounded-xl border border-edge bg-surface p-5 text-sm text-ink-3">
        No priced holdings to chart.
      </section>
    );
  }

  return (
    <section
      className="flex flex-col gap-4 rounded-xl border border-edge bg-surface p-5 sm:flex-row sm:items-center"
      aria-label="Allocation by token"
    >
      <div className="relative mx-auto h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="var(--surface)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const slice = payload[0].payload as Slice;
                return (
                  <div className="rounded-lg border border-edge bg-surface-2 px-3 py-2 text-xs shadow-lg">
                    <div className="font-medium text-ink">{slice.name}</div>
                    <div className="tnum text-ink-2">
                      {formatUsd(slice.value)} ·{" "}
                      {formatPercent(slice.value / total)}
                    </div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-wide text-ink-3">
            Allocation
          </span>
          <span className="tnum text-lg font-semibold text-ink">
            {formatUsd(total)}
          </span>
        </div>
      </div>

      <ul className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
        {slices.map((slice) => (
          <li
            key={slice.name}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate text-ink-2">{slice.name}</span>
            </span>
            <span className="tnum shrink-0 text-ink">
              {formatPercent(slice.value / total)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
