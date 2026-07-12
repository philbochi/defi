import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackdrop from "@/components/AmbientBackdrop";
import WalletProviders from "@/components/WalletProviders";
import StakeWidget from "@/components/stake/StakeWidget";

export const metadata: Metadata = {
  title: "Staking Vault (Sepolia) | defi.philbochi.com",
  description:
    "Stake Bochi Credits (BWC) and watch 10% APR accrue live. Custom ERC-20 + staking vault built with Foundry, verified on Etherscan, with a public faucet.",
};

export default function StakePage() {
  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{ ["--accent" as string]: "#047857" }}
    >
      <AmbientBackdrop color="emerald" />
      <SiteHeader active="stake" />
      <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto mb-4 w-full max-w-2xl">
          <span className="inline-block rounded-full border border-neon-emerald/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neon-emerald">
            03 · Sepolia testnet · verified contracts
          </span>
        </div>
        <WalletProviders accentColor="#047857">
          <StakeWidget />
        </WalletProviders>
      </main>
      <SiteFooter />
    </div>
  );
}
