/**
 * CoinGecko pricing client (Demo API tier).
 *
 * Server-side only. Prices are cached per contract for 60s and fetched in
 * batched contract-address lookups, so a 50-token wallet costs one or two
 * CoinGecko calls instead of fifty.
 */

import { cache, TTL } from "./cache";
import { UpstreamError } from "./alchemy";

const BASE_URL = "https://api.coingecko.com/api/v3";
const PRICE_BATCH_SIZE = 100;

function headers(): HeadersInit {
  const key = process.env.COINGECKO_API_KEY;
  if (!key) throw new UpstreamError("coingecko", "COINGECKO_API_KEY is not set");
  return { accept: "application/json", "x-cg-demo-api-key": key };
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new UpstreamError("coingecko", `HTTP ${res.status} for ${path}`);
  }
  return (await res.json()) as T;
}

export async function getEthPriceUsd(): Promise<number | null> {
  return cache.getOrSet("price:eth", TTL.PRICES, async () => {
    const data = await fetchJson<{ ethereum?: { usd?: number } }>(
      "/simple/price?ids=ethereum&vs_currencies=usd",
    );
    return data.ethereum?.usd ?? null;
  });
}

/**
 * USD prices for ERC-20 contracts (lowercase keys). Contracts CoinGecko
 * doesn't track are absent from the result — callers treat those holdings
 * as unpriced. Known misses are cached too, so spam tokens don't trigger
 * a fresh lookup on every request.
 */
export async function getTokenPricesUsd(
  contracts: string[],
): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  const misses: string[] = [];

  for (const contract of contracts) {
    const cached = cache.get<number | "untracked">(`price:${contract}`);
    if (cached === undefined) {
      misses.push(contract);
    } else if (cached !== "untracked") {
      prices.set(contract, cached);
    }
  }

  for (let i = 0; i < misses.length; i += PRICE_BATCH_SIZE) {
    const chunk = misses.slice(i, i + PRICE_BATCH_SIZE);
    const data = await fetchJson<Record<string, { usd?: number }>>(
      `/simple/token_price/ethereum?contract_addresses=${chunk.join(",")}&vs_currencies=usd`,
    );
    for (const contract of chunk) {
      const usd = data[contract]?.usd;
      if (typeof usd === "number") {
        cache.set(`price:${contract}`, usd, TTL.PRICES);
        prices.set(contract, usd);
      } else {
        cache.set(`price:${contract}`, "untracked", TTL.PRICES);
      }
    }
  }

  return prices;
}
