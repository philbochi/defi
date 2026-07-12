/**
 * Portfolio assembly: Alchemy balances + metadata joined with CoinGecko
 * prices into one snapshot. Whole snapshots are cached per address for
 * 60s so repeat lookups (page refreshes, shared links) cost zero
 * upstream calls.
 */

import { formatUnits } from "viem";
import {
  getEthBalance,
  getTokenBalances,
  getTokenMetadataBatch,
} from "./alchemy";
import { getEthPriceUsd, getTokenPricesUsd } from "./coingecko";
import { cache, TTL } from "./cache";
import type { Portfolio, TokenHolding } from "./types";

/** Upper bound on tokens priced per lookup; keeps whale wallets inside free-tier quotas. */
const MAX_TOKENS = 200;

/**
 * Obvious wallet-spam: "claim your reward at scam.site" tokens. Anything
 * that slips through simply ends up unpriced (CoinGecko doesn't track it)
 * and is hidden behind the UI's spam toggle.
 */
const SPAM_PATTERN = /https?:\/\/|www\.|\bclaim\b|\bairdrop\b|\bvoucher\b|\bvisit\b|\breward\b/i;

function isSpam(symbol: string, name: string): boolean {
  return (
    SPAM_PATTERN.test(symbol) || SPAM_PATTERN.test(name) || symbol.length > 20
  );
}

export async function getPortfolio(address: string): Promise<Portfolio> {
  return cache.getOrSet(
    `portfolio:${address.toLowerCase()}`,
    TTL.PORTFOLIO,
    () => buildPortfolio(address),
  );
}

async function buildPortfolio(address: string): Promise<Portfolio> {
  const [ethBalance, tokenScan] = await Promise.all([
    getEthBalance(address),
    getTokenBalances(address),
  ]);

  const truncated =
    tokenScan.truncated || tokenScan.balances.length > MAX_TOKENS;
  const balances = tokenScan.balances.slice(0, MAX_TOKENS).map((b) => ({
    contract: b.contractAddress.toLowerCase(),
    raw: BigInt(b.tokenBalance as string),
  }));

  const metadata = await getTokenMetadataBatch(balances.map((b) => b.contract));

  const candidates = balances.flatMap((b) => {
    const meta = metadata.get(b.contract);
    if (!meta || meta.decimals === null || !meta.symbol) return [];
    if (isSpam(meta.symbol, meta.name ?? "")) return [];
    return [
      {
        contract: b.contract,
        raw: b.raw,
        symbol: meta.symbol,
        name: meta.name ?? meta.symbol,
        decimals: meta.decimals,
        logo: meta.logo,
      },
    ];
  });

  const [tokenPrices, ethPrice] = await Promise.all([
    getTokenPricesUsd(candidates.map((c) => c.contract)),
    getEthPriceUsd(),
  ]);

  const holdings: TokenHolding[] = candidates.map((c) => {
    const balance = formatUnits(c.raw, c.decimals);
    const priceUsd = tokenPrices.get(c.contract) ?? null;
    return {
      contract: c.contract,
      symbol: c.symbol,
      name: c.name,
      logo: c.logo,
      decimals: c.decimals,
      balance,
      balanceRaw: c.raw.toString(),
      priceUsd,
      usdValue: priceUsd === null ? null : Number(balance) * priceUsd,
    };
  });

  if (ethBalance > 0n) {
    const balance = formatUnits(ethBalance, 18);
    holdings.unshift({
      contract: null,
      symbol: "ETH",
      name: "Ethereum",
      logo: null,
      decimals: 18,
      balance,
      balanceRaw: ethBalance.toString(),
      priceUsd: ethPrice,
      usdValue: ethPrice === null ? null : Number(balance) * ethPrice,
    });
  }

  const priced = holdings
    .filter((h) => h.usdValue !== null)
    .sort((a, b) => (b.usdValue as number) - (a.usdValue as number));
  const unpriced = holdings
    .filter((h) => h.usdValue === null)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  return {
    address,
    totalUsd: priced.reduce((sum, h) => sum + (h.usdValue as number), 0),
    priced,
    unpriced,
    truncated,
    updatedAt: new Date().toISOString(),
  };
}
