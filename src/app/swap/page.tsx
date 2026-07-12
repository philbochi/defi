import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackdrop from "@/components/AmbientBackdrop";
import WalletProviders from "@/components/WalletProviders";
import SwapWidget from "@/components/swap/SwapWidget";

export const metadata: Metadata = {
  title: "Token Swap (Sepolia) | defi.philbochi.com",
  description:
    "Connect a wallet and swap tokens through Uniswap v3 on the Sepolia testnet. Wagmi, viem, RainbowKit, and server-side quoting.",
};

export default function SwapPage() {
  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{ ["--accent" as string]: "#be185d" }}
    >
      <AmbientBackdrop color="pink" />
      <SiteHeader active="swap" />
      <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto mb-4 w-full max-w-md">
          <span className="inline-block rounded-full border border-neon-pink/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neon-pink">
            02 · Sepolia testnet · Uniswap v3
          </span>
        </div>
        <WalletProviders accentColor="#be185d">
          <SwapWidget />
        </WalletProviders>
      </main>
      <SiteFooter />
    </div>
  );
}
