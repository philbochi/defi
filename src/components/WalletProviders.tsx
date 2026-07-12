"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { useState } from "react";
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Wallet stack for wallet-bearing pages only — the dashboard route stays free of
 * wallet JS. The Reown project ID is a publishable client identifier.
 *
 * getDefaultConfig throws synchronously on an empty projectId, which would
 * take down the whole route — a misconfigured build should degrade to
 * "wallet connect fails when used", not a 500.
 */
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;
if (!projectId) {
  console.warn(
    "NEXT_PUBLIC_REOWN_PROJECT_ID is not set — wallet connect will not work.",
  );
}

const config = getDefaultConfig({
  appName: "defi.philbochi.com",
  projectId: projectId || "missing-reown-project-id",
  chains: [sepolia],
  ssr: true,
});

export default function WalletProviders({
  children,
  accentColor = "#3987e5",
}: {
  children: React.ReactNode;
  /** Per-page ecosystem accent (swap: violet, stake: emerald). */
  accentColor?: string;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          theme={darkTheme({
            accentColor,
            borderRadius: "medium",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
