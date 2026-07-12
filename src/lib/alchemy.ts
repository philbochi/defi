/**
 * Alchemy JSON-RPC client (Ethereum mainnet).
 *
 * Server-side only — the API key must never reach the browser. Metadata
 * lookups are sent as batched JSON-RPC arrays (one HTTP round trip per
 * chunk) and cached for 24h since token metadata is effectively static.
 */

import { cache, TTL } from "./cache";

const METADATA_BATCH_SIZE = 50;
const MAX_BALANCE_PAGES = 3;

export type RawTokenBalance = {
  contractAddress: string;
  /** Hex-encoded balance; "0x" or null means zero/unavailable. */
  tokenBalance: string | null;
};

export type TokenMetadata = {
  symbol: string | null;
  name: string | null;
  decimals: number | null;
  logo: string | null;
};

export class UpstreamError extends Error {
  constructor(
    public readonly provider: "alchemy" | "coingecko",
    message: string,
  ) {
    super(`${provider}: ${message}`);
    this.name = "UpstreamError";
  }
}

function rpcUrl(): string {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) throw new UpstreamError("alchemy", "ALCHEMY_API_KEY is not set");
  return `https://eth-mainnet.g.alchemy.com/v2/${key}`;
}

type RpcResponse = {
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
};

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(rpcUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new UpstreamError("alchemy", `HTTP ${res.status} for ${method}`);
  }
  const json = (await res.json()) as RpcResponse;
  if (json.error) {
    throw new UpstreamError("alchemy", `${method}: ${json.error.message}`);
  }
  return json.result as T;
}

/** One HTTP request carrying many JSON-RPC calls; results in input order. */
async function rpcBatch<T>(
  calls: { method: string; params: unknown[] }[],
): Promise<(T | null)[]> {
  if (calls.length === 0) return [];
  const res = await fetch(rpcUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      calls.map((c, i) => ({ jsonrpc: "2.0", id: i, ...c })),
    ),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new UpstreamError("alchemy", `HTTP ${res.status} for batch`);
  }
  const json = (await res.json()) as RpcResponse[];
  if (!Array.isArray(json)) {
    throw new UpstreamError("alchemy", "malformed batch response");
  }
  const byId = new Map(json.map((r) => [r.id, r]));
  return calls.map((_, i) => {
    const entry = byId.get(i);
    if (!entry || entry.error) return null;
    return entry.result as T;
  });
}

export async function getEthBalance(address: string): Promise<bigint> {
  const hex = await rpc<string>("eth_getBalance", [address, "latest"]);
  return BigInt(hex);
}

/** All non-zero ERC-20 balances for an address (paginated, page cap applied). */
export async function getTokenBalances(
  address: string,
): Promise<RawTokenBalance[]> {
  const balances: RawTokenBalance[] = [];
  let pageKey: string | undefined;

  for (let page = 0; page < MAX_BALANCE_PAGES; page++) {
    const result = await rpc<{
      tokenBalances: RawTokenBalance[];
      pageKey?: string;
    }>("alchemy_getTokenBalances", [
      address,
      "erc20",
      ...(pageKey ? [{ pageKey }] : []),
    ]);
    balances.push(...result.tokenBalances);
    pageKey = result.pageKey;
    if (!pageKey) break;
  }

  return balances.filter((b) => {
    if (!b.tokenBalance || b.tokenBalance === "0x") return false;
    try {
      return BigInt(b.tokenBalance) > 0n;
    } catch {
      return false;
    }
  });
}

/** Metadata for many contracts, 24h-cached per contract, misses batched. */
export async function getTokenMetadataBatch(
  contracts: string[],
): Promise<Map<string, TokenMetadata>> {
  const result = new Map<string, TokenMetadata>();
  const misses: string[] = [];

  for (const contract of contracts) {
    const cached = cache.get<TokenMetadata>(`meta:${contract}`);
    if (cached !== undefined) {
      result.set(contract, cached);
    } else {
      misses.push(contract);
    }
  }

  for (let i = 0; i < misses.length; i += METADATA_BATCH_SIZE) {
    const chunk = misses.slice(i, i + METADATA_BATCH_SIZE);
    const responses = await rpcBatch<TokenMetadata>(
      chunk.map((contract) => ({
        method: "alchemy_getTokenMetadata",
        params: [contract],
      })),
    );
    chunk.forEach((contract, j) => {
      const meta = responses[j];
      if (meta) {
        cache.set(`meta:${contract}`, meta, TTL.TOKEN_METADATA);
        result.set(contract, meta);
      }
    });
  }

  return result;
}
