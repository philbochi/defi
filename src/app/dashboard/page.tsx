import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackdrop from "@/components/AmbientBackdrop";

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
        <span className="mb-4 inline-block rounded-full border border-neon-cyan/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neon-cyan">
          01 · Ethereum mainnet · read-only
        </span>
        <Dashboard />
      </main>
      <SiteFooter />
    </div>
  );
}
