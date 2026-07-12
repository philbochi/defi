import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackdrop from "@/components/AmbientBackdrop";
import WalletProviders from "@/components/WalletProviders";
import StakeWidget from "@/components/stake/StakeWidget";
import StatTiles from "@/components/landing/StatTiles";
import FlowDiagram from "@/components/landing/FlowDiagram";
import Reveal from "@/components/landing/Reveal";

export const metadata: Metadata = {
  title: "Staking Vault (Sepolia) | defi.philbochi.com",
  description:
    "Stake Bochi Credits (BWC) and watch 10% APR accrue live. Custom ERC-20 + staking vault built with Foundry, verified on Etherscan, with a public faucet.",
};

const CONTRACTS = [
  {
    name: "BochiCredits (BWC) — the token",
    addr: "0x4b572ddcb6a0aa626bd36c78cf2fb827feab4aa8",
  },
  {
    name: "StakingVault — the vault",
    addr: "0x7d76cfbd9355d4ecc1842bca4d163a02c518ce9d",
  },
];

export default function StakePage() {
  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{ ["--accent" as string]: "#047857" }}
    >
      <AmbientBackdrop color="emerald" />
      <SiteHeader active="stake" />
      <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto mb-4 flex w-full max-w-2xl items-center gap-3">
          <span className="rounded-full border border-neon-emerald/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neon-emerald">
            03 · Sepolia testnet · verified contracts
          </span>
        </div>
        <WalletProviders accentColor="#047857">
          <StakeWidget />
        </WalletProviders>

        {/* ---- how it works / proof / detail ---- */}
        <div className="mx-auto mt-14 flex w-full max-w-3xl flex-col gap-6">
          <Reveal>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">
              The whole lifecycle
            </h2>
            <FlowDiagram
              color="emerald"
              steps={[
                { label: "faucet()", note: "100 BWC / day, free" },
                { label: "stake()", note: "approve, then deposit" },
                { label: "accrue", note: "10% APR · per second", dim: true },
                { label: "claim()", note: "rewards minted, never from principal" },
              ]}
              caption="withdraw any time; exit() bundles withdraw-all + claim into one transaction"
            />
          </Reveal>

          <Reveal>
            <StatTiles
              color="emerald"
              stats={[
                { value: "10%", label: "fixed APR, computed per second by the contract formula" },
                { value: "35", label: "Foundry tests — fuzz at 512 runs, mutation-tested" },
                { value: "100", label: "BWC per day from the public faucet — nothing to ask for" },
              ]}
            />
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2.5 rounded-xl border border-edge bg-surface p-5">
                <h3 className="font-mono text-xs uppercase tracking-wider text-neon-emerald">
                  try it in three steps
                </h3>
                <ol className="flex list-inside list-decimal flex-col gap-2 text-sm text-ink-2">
                  <li>
                    <strong className="font-medium text-ink">Get tokens</strong> —
                    hit the faucet button above; 100 BWC arrive in one
                    transaction. (You&apos;ll need a little Sepolia ETH for gas.)
                  </li>
                  <li>
                    <strong className="font-medium text-ink">Stake</strong> —
                    approve, then stake any amount. Rewards start accruing the
                    same second.
                  </li>
                  <li>
                    <strong className="font-medium text-ink">Watch, claim, exit</strong>{" "}
                    — the pending counter ticks live; claim mints your rewards,
                    exit returns everything at once.
                  </li>
                </ol>
              </div>
              <div className="flex flex-col gap-2.5 rounded-xl border border-edge bg-surface p-5">
                <h3 className="font-mono text-xs uppercase tracking-wider text-neon-emerald">
                  the contracts — verified source
                </h3>
                <ul className="flex flex-col gap-2 text-sm">
                  {CONTRACTS.map((c) => (
                    <li key={c.name} className="flex min-w-0 flex-col">
                      <span className="font-medium text-ink">{c.name}</span>
                      <a
                        href={`https://sepolia.etherscan.io/address/${c.addr}#code`}
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
                  Both verified on Etherscan — the source is publicly readable,
                  not just claimed. Rewards are minted on claim via the
                  vault&apos;s minter role; staked principal is never used to pay
                  yield.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <p className="text-center text-sm text-ink-2">
              The mint-on-claim trade-off and the mutation-testing story →{" "}
              <Link
                href="/case-studies#p3"
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
