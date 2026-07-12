import type { Metadata } from "next";
import Link from "next/link";
import Dashboard from "@/components/Dashboard";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackdrop from "@/components/AmbientBackdrop";
import StatTiles from "@/components/landing/StatTiles";
import FlowDiagram from "@/components/landing/FlowDiagram";
import Reveal from "@/components/landing/Reveal";

export const metadata: Metadata = {
  title: "On-Chain Portfolio Dashboard | defi.philbochi.com",
  description:
    "Paste any Ethereum address and see its token balances, USD values, and allocation. Read-only mainnet lookup — no wallet connection required.",
};

export default function DashboardPage() {
  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{ ["--accent" as string]: "#0e7490" }}
    >
      <AmbientBackdrop color="cyan" />
      <SiteHeader active="dashboard" />
      <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-full border border-neon-cyan/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neon-cyan">
            01 · Ethereum mainnet · read-only
          </span>
        </div>
        <Dashboard />

        {/* ---- how it works / proof / detail ---- */}
        <div className="mx-auto mt-14 flex w-full max-w-3xl flex-col gap-6">
          <Reveal>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">
              How a lookup travels
            </h2>
            <FlowDiagram
              color="cyan"
              steps={[
                { label: "browser" },
                { label: "/api/portfolio", note: "one internal endpoint" },
                { label: "TTL cache", note: "60s · request dedup", dim: true },
                { label: "Alchemy · CoinGecko", note: "keys live here" },
              ]}
              caption="the API key never crosses the first arrow — nothing sensitive ships to the client"
            />
          </Reveal>

          <Reveal>
            <StatTiles
              color="cyan"
              stats={[
                { value: "~20ms", label: "repeat lookup, served from the TTL cache" },
                { value: "200", label: "token scan cap — big wallets get a truncated flag, not a fake total" },
                { value: "0", label: "API keys in the browser — every upstream call is server-side" },
              ]}
            />
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2.5 rounded-xl border border-edge bg-surface p-5">
                <h3 className="font-mono text-xs uppercase tracking-wider text-neon-cyan">
                  worth trying
                </h3>
                <ul className="flex flex-col gap-2 text-sm text-ink-2">
                  <li>
                    <strong className="font-medium text-ink">vitalik.eth</strong>{" "}
                    — thousands of airdropped tokens; watch the spam filter and
                    the truncation disclosure earn their keep.
                  </li>
                  <li>
                    <strong className="font-medium text-ink">Ethereum Foundation</strong>{" "}
                    — a whale wallet (~$17M at last look) that renders in one
                    request.
                  </li>
                  <li>
                    Any address from Etherscan — paste it in. Lookups are
                    shareable: the URL updates with{" "}
                    <code className="rounded bg-surface-2 px-1 font-mono text-[13px]">?address=</code>.
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-2.5 rounded-xl border border-edge bg-surface p-5">
                <h3 className="font-mono text-xs uppercase tracking-wider text-neon-cyan">
                  under the hood
                </h3>
                <ul className="flex flex-col gap-2 text-sm text-ink-2">
                  <li>
                    Token metadata fetched in batched JSON-RPC (50 per round
                    trip), cached 24h — it&apos;s effectively static.
                  </li>
                  <li>
                    Prices keyed by <strong className="font-medium text-ink">contract
                    address</strong>, never symbol — duplicate tickers can&apos;t
                    collide.
                  </li>
                  <li>
                    Per-IP rate limiting and a timeout on every upstream fetch,
                    so one hung socket can&apos;t stall the instance.
                  </li>
                </ul>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <p className="text-center text-sm text-ink-2">
              Why read-only beats wallet-connect for this demo →{" "}
              <Link
                href="/case-studies#p1"
                className="text-accent transition-colors hover:text-ink"
              >
                read the full engineering deep-dive
              </Link>
            </p>
          </Reveal>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
