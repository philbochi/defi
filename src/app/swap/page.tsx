import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SwapProviders from "@/components/swap/SwapProviders";
import SwapWidget from "@/components/swap/SwapWidget";

export const metadata: Metadata = {
  title: "Token Swap (Sepolia) | defi.philbochi.com",
  description:
    "Connect a wallet and swap tokens through Uniswap v3 on the Sepolia testnet. Wagmi, viem, RainbowKit, and server-side quoting.",
};

export default function SwapPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader active="swap" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <SwapProviders>
          <SwapWidget />
        </SwapProviders>
      </main>
      <SiteFooter />
    </div>
  );
}
