import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Pipeline from "@/components/landing/Pipeline";
import TradeoffMatrix, {
  type MatrixTab,
} from "@/components/landing/TradeoffMatrix";
import TelemetryTicker from "@/components/landing/TelemetryTicker";
import YieldCounter from "@/components/landing/YieldCounter";
import QuoteCard from "@/components/landing/QuoteCard";
import Reveal from "@/components/landing/Reveal";
import { MATRIX, PROJECTS, SNIPPETS } from "@/lib/landing/content";
import { highlight } from "@/lib/landing/highlight";

export const metadata: Metadata = {
  title: "Phil Bochi — DeFi Engineering Portfolio",
  description:
    "Three live Web3 projects — mainnet portfolio dashboard, Uniswap v3 swap interface, and a verified staking vault — with the engineering decisions documented.",
};

const SECTION_STYLE = {
  cyan: {
    border: "border-neon-cyan/25",
    chip: "border-neon-cyan/40 text-neon-cyan",
    glow: "shadow-[0_0_40px_rgba(6,182,212,0.08)]",
  },
  violet: {
    border: "border-neon-violet/25",
    chip: "border-neon-violet/40 text-neon-violet",
    glow: "shadow-[0_0_40px_rgba(139,92,246,0.08)]",
  },
  ember: {
    border: "border-neon-ember/25",
    chip: "border-neon-ember/40 text-neon-ember",
    glow: "shadow-[0_0_40px_rgba(249,115,22,0.08)]",
  },
} as const;

const STACK_BADGES = [
  { label: "Next.js 16", color: "text-ink" },
  { label: "TypeScript", color: "text-[#3178c6]" },
  { label: "viem", color: "text-[#ffc517]" },
  { label: "wagmi", color: "text-ink" },
  { label: "Solidity 0.8", color: "text-[#7c82ff]" },
  { label: "Foundry", color: "text-[#f6851b]" },
  { label: "Uniswap v3", color: "text-neon-violet" },
  { label: "Tailwind 4", color: "text-neon-cyan" },
] as const;

// Abridged from a real GET /api/portfolio response (Ethereum Foundation
// wallet, 2026-07-12); arrays elided for display.
const P1_RESPONSE = `// GET /api/portfolio — abridged real response
{
  "totalUsd": 17639669.42,       // at lookup time
  "priced":   [ /* 17 holdings */ ],
  "unpriced": [ /* 92 spam/dust */ ],
  "truncated": true              // honesty over a pretty number
}`;

export default async function Home() {
  const [p1Chosen, p1Rejected, p2Chosen, p2Rejected, p3Chosen, p3Rejected, p1Resp] =
    await Promise.all([
      highlight(SNIPPETS.p1Chosen, "typescript"),
      highlight(SNIPPETS.p1Rejected, "typescript"),
      highlight(SNIPPETS.p2Chosen, "typescript"),
      highlight(SNIPPETS.p2Rejected, "solidity"),
      highlight(SNIPPETS.p3Chosen, "solidity"),
      highlight(SNIPPETS.p3Rejected, "solidity"),
      highlight(P1_RESPONSE, "typescript"),
    ]);

  const highlighted: Record<string, string> = {
    p1Chosen,
    p1Rejected,
    p2Chosen,
    p2Rejected,
    p3Chosen,
    p3Rejected,
  };

  const tabs: MatrixTab[] = MATRIX.map((t) => ({
    id: t.id,
    label: t.label,
    color: t.color,
    chosen: t.chosen,
    rejected: t.rejected,
    chosenHtml: highlighted[t.chosenSnippet],
    rejectedHtml: highlighted[t.rejectedSnippet],
  }));

  const sectionVisual: Record<string, React.ReactNode> = {
    p1: (
      <div
        className="landing-code overflow-x-auto rounded-lg border border-edge text-[12px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: p1Resp }}
      />
    ),
    p2: <QuoteCard />,
    p3: <YieldCounter />,
  };

  const sectionPoints: Record<string, string[]> = {
    p1: [
      "Server-side Alchemy + CoinGecko — keys never reach the browser",
      "Priced by contract address, never by symbol",
      "TTL cache + request dedup: repeat lookups in ~20ms",
    ],
    p2: [
      "SwapRouter02 + QuoterV2, addresses verified on-chain first",
      "Native ETH both ways: payable wrap in, multicall unwrap out",
      "Slippage becomes on-chain amountOutMinimum, not a display number",
    ],
    p3: [
      "Verified on Etherscan — source publicly provable, not claimed",
      "35 Foundry tests, 512-run fuzz, mutation-tested",
      "10% APR accrual, floor rounding in the protocol's favor",
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader active="home" />

      <main className="flex-1">
        {/* ---- hero ---- */}
        <section className="relative overflow-hidden border-b border-edge">
          {/* blueprint grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage:
                "radial-gradient(ellipse 80% 70% at 50% 30%, black, transparent)",
            }}
          />
          <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-14 px-4 pb-16 pt-16 sm:px-6 sm:pt-20">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="rounded-full border border-edge bg-surface px-3 py-1 font-mono text-[11px] text-ink-3">
                mainnet → testnet → custom ERC-20 · all live
              </span>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Three projects.{" "}
                <span className="bg-linear-to-r from-neon-cyan via-neon-violet to-neon-ember bg-clip-text text-transparent">
                  One on-chain pipeline.
                </span>
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-ink-2 sm:text-base">
                From reading raw mainnet state to swapping through Uniswap v3
                to a staking vault with its own verified ERC-20 — built in
                sequence, documented decision by decision. Hover a node for
                the reasoning; click it to jump to that project&apos;s story.
              </p>
            </div>

            <Pipeline />

            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Try the dashboard
                </Link>
                <Link
                  href="/case-studies"
                  className="rounded-xl border border-edge px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent/50"
                >
                  Read the deep-dives
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {STACK_BADGES.map((b) => (
                  <span
                    key={b.label}
                    className={`rounded-full border border-edge bg-surface px-3 py-1 font-mono text-[11px] ${b.color}`}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---- project sections ---- */}
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-14 sm:px-6">
          {PROJECTS.map((p, i) => {
            const s = SECTION_STYLE[p.color];
            return (
              <Reveal key={p.id} delay={i * 0.05}>
                <article
                  id={p.id}
                  className={`grid scroll-mt-24 grid-cols-1 gap-6 rounded-xl border bg-surface p-6 md:grid-cols-2 ${s.border} ${s.glow}`}
                >
                  <div className="flex min-w-0 flex-col gap-3">
                    <span
                      className={`w-fit rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${s.chip}`}
                    >
                      {p.index} · {p.chain}
                    </span>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {p.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-ink-2">
                      {p.tagline} {p.decision}
                    </p>
                    <ul className="mt-1 flex flex-col gap-2">
                      {sectionPoints[p.id].map((point) => (
                        <li key={point} className="flex gap-2.5 text-sm text-ink-2">
                          <span className={SECTION_STYLE[p.color].chip.split(" ")[1]} aria-hidden>
                            ▸
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto flex flex-wrap gap-4 pt-3 font-mono text-xs">
                      <Link
                        href={p.href}
                        className="text-accent transition-colors hover:text-ink"
                      >
                        open the app ↗
                      </Link>
                      <a
                        href={p.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink-2 transition-colors hover:text-ink"
                      >
                        source ↗
                      </a>
                      {p.id === "p3" && (
                        <a
                          href="https://sepolia.etherscan.io/address/0x7d76cfbd9355d4ecc1842bca4d163a02c518ce9d#code"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neon-ember transition-colors hover:text-ink"
                        >
                          verified contract ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col justify-center">
                    {sectionVisual[p.id]}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </section>

        {/* ---- trade-off matrix ---- */}
        <section
          id="tradeoffs"
          className="mx-auto w-full max-w-5xl scroll-mt-24 px-4 pb-14 sm:px-6"
        >
          <Reveal>
            <div className="mb-5 flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Why this, not that
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-ink-2">
                Every project is a set of trade-offs. The left column shipped;
                the right column was considered and deliberately rejected —
                with the reasons. Full write-ups in the{" "}
                <Link
                  href="/case-studies"
                  className="text-accent transition-colors hover:text-ink"
                >
                  deep-dives
                </Link>
                .
              </p>
            </div>
            <TradeoffMatrix tabs={tabs} />
          </Reveal>
        </section>

        {/* ---- telemetry + CTA ---- */}
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-16 sm:px-6">
          <Reveal>
            <TelemetryTicker />
          </Reveal>
          <Reveal>
            <div className="flex flex-col items-center gap-4 rounded-xl border border-edge bg-surface px-6 py-10 text-center">
              <h2 className="text-xl font-semibold tracking-tight">
                Everything above is running right now
              </h2>
              <p className="max-w-xl text-sm text-ink-2">
                Look up a whale wallet, swap testnet tokens, mint BWC from the
                faucet and stake it — or read the code and the reasoning.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Try the dashboard
                </Link>
                <Link
                  href="/case-studies"
                  className="rounded-xl border border-edge px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent/50"
                >
                  Read the deep-dives
                </Link>
                <a
                  href="https://github.com/philbochi/defi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-edge px-5 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:text-ink"
                >
                  GitHub
                </a>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
