import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WalletProviders from "@/components/WalletProviders";
import StakeWidget from "@/components/stake/StakeWidget";

export const metadata: Metadata = {
  title: "Staking Vault (Sepolia) | defi.philbochi.com",
  description:
    "Stake Bochi Credits (BWC) and watch 10% APR accrue live. Custom ERC-20 + staking vault built with Foundry, verified on Etherscan, with a public faucet.",
};

export default function StakePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader active="stake" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <WalletProviders>
          <StakeWidget />
        </WalletProviders>
      </main>
      <SiteFooter />
    </div>
  );
}
