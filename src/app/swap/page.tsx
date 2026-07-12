import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackdrop from "@/components/AmbientBackdrop";
import WalletProviders from "@/components/WalletProviders";
import SwapWidget from "@/components/swap/SwapWidget";
import StatTiles from "@/components/landing/StatTiles";
import FlowDiagram from "@/components/landing/FlowDiagram";
import Reveal from "@/components/landing/Reveal";

export const metadata: Metadata = {
  title: "Token Swap (Sepolia) | defi.philbochi.com",
  description:
    "Connect a wallet and swap tokens through Uniswap v3 on the Sepolia testnet. Wagmi, viem, RainbowKit, and server-side quoting.",
};

const CONTRACTS = [
  { name: "SwapRouter02", addr: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E" },
  { name: "QuoterV2", addr: "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3" },
  { name: "WETH9", addr: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14" },
  { name: "UNI", addr: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984" },
];

const ROUTES = [
  { pair: "ETH → WETH", how: "WETH9 deposit — a 1:1 wrap, no pool involved" },
  { pair: "WETH → ETH", how: "WETH9 withdraw — the mirror unwrap" },
  { pair: "ETH → UNI", how: "payable swap; the router wraps in-flight, no approval needed" },
  { pair: "WETH ⇄ UNI", how: "classic approve → exactInputSingle through the 0.3% pool" },
  { pair: "UNI → ETH", how: "multicall: swap to the router, unwrapWETH9 to you — one signature" },
];

export default function SwapPage() {
  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{ ["--accent" as string]: "#6d28d9" }}
    >
      <AmbientBackdrop color="violet" />
      <SiteHeader active="swap" />
      <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto mb-4 flex w-full max-w-md items-center gap-3">
          <span className="rounded-full border border-neon-violet/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neon-violet">
            02 · Sepolia testnet · Uniswap v3
          </span>
        </div>
        <WalletProviders accentColor="#6d28d9">
          <SwapWidget />
        </WalletProviders>

        {/* ---- how it works / proof / detail ---- */}
        <div className="mx-auto mt-14 flex w-full max-w-3xl flex-col gap-6">
          <Reveal>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">
              What happens when you swap
            </h2>
            <FlowDiagram
              color="violet"
              steps={[
                { label: "swap UI" },
                { label: "wallet signs", note: "quote frozen" },
                { label: "SwapRouter02", note: "multicall" },
                { label: "swap → unwrap", dim: true },
                { label: "tokens out" },
              ]}
              caption="quotes are fetched server-side; your wallet only ever signs and submits"
            />
          </Reveal>

          <Reveal>
            <StatTiles
              color="violet"
              stats={[
                { value: "1 signature", label: "ERC-20 → native ETH, swap + unwrap bundled in a multicall" },
                { value: "15s", label: "quote auto-refresh — frozen the moment your wallet prompt opens" },
                { value: "0.3%", label: "fee tier of the live WETH/UNI pool this UI routes through" },
              ]}
            />
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2.5 rounded-xl border border-edge bg-surface p-5">
                <h3 className="font-mono text-xs uppercase tracking-wider text-neon-violet">
                  supported routes
                </h3>
                <ul className="flex flex-col gap-2 text-sm">
                  {ROUTES.map((r) => (
                    <li key={r.pair} className="flex flex-col">
                      <span className="tnum font-mono text-[13px] font-medium text-ink">
                        {r.pair}
                      </span>
                      <span className="text-xs leading-snug text-ink-2">
                        {r.how}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2.5 rounded-xl border border-edge bg-surface p-5">
                <h3 className="font-mono text-xs uppercase tracking-wider text-neon-violet">
                  the contracts this talks to
                </h3>
                <ul className="flex flex-col gap-2 text-sm">
                  {CONTRACTS.map((c) => (
                    <li key={c.name} className="flex min-w-0 flex-col">
                      <span className="font-medium text-ink">{c.name}</span>
                      <a
                        href={`https://sepolia.etherscan.io/address/${c.addr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate font-mono text-xs text-ink-2 transition-colors hover:text-ink"
                      >
                        {c.addr}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-ink-2">
                  Every address was verified on-chain (bytecode + a live quote)
                  before being committed.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <p className="text-center text-sm text-ink-2">
              Why integrate Uniswap instead of building an AMM →{" "}
              <Link
                href="/case-studies#p2"
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
