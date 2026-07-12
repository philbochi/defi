/**
 * Server-side Uniswap QuoterV2 client (Sepolia via Alchemy).
 *
 * Same rule as the portfolio data layer: the Alchemy key never reaches
 * the browser, so quotes are fetched here and served through
 * /api/quote. Quotes cache for a few seconds — enough to absorb typing
 * bursts without serving stale testnet prices.
 */

import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { quoterV2Abi } from "./abis";
import { UNISWAP, POOL_FEE, erc20For, type SwapSymbol } from "./constants";
import { cache } from "../cache";
import { UpstreamError, UPSTREAM_TIMEOUT_MS } from "../alchemy";

const QUOTE_TTL_MS = 5_000;

function client() {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) throw new UpstreamError("alchemy", "ALCHEMY_API_KEY is not set");
  return createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${key}`, {
      timeout: UPSTREAM_TIMEOUT_MS,
    }),
  });
}

export type Quote = {
  amountOut: string;
  gasEstimate: string;
  poolFee: number;
  quotedAt: string;
};

/**
 * Quote an exact-input single-hop swap. ETH quotes as WETH (the router
 * wraps on the fly); WETH⇄ETH is 1:1 and never reaches the quoter.
 */
export async function getQuote(
  from: SwapSymbol,
  to: SwapSymbol,
  amountIn: bigint,
): Promise<Quote> {
  const tokenIn = erc20For(from);
  const tokenOut = erc20For(to);
  if (tokenIn.address === tokenOut.address) {
    return {
      amountOut: amountIn.toString(),
      gasEstimate: "0",
      poolFee: 0,
      quotedAt: new Date().toISOString(),
    };
  }

  const key = `quote:${tokenIn.address}:${tokenOut.address}:${amountIn}`;
  return cache.getOrSet(key, QUOTE_TTL_MS, async () => {
    let result: readonly [bigint, bigint, number, bigint];
    try {
      ({ result } = await client().simulateContract({
        address: UNISWAP.QUOTER_V2 as `0x${string}`,
        abi: quoterV2Abi,
        functionName: "quoteExactInputSingle",
        args: [
          {
            tokenIn: tokenIn.address as `0x${string}`,
            tokenOut: tokenOut.address as `0x${string}`,
            amountIn,
            fee: POOL_FEE,
            sqrtPriceLimitX96: 0n,
          },
        ],
      }));
    } catch (err) {
      // viem errors embed the RPC URL (which carries the API key) — never
      // let that reach logs or callers.
      const raw = err instanceof Error ? err.message : String(err);
      const apiKey = process.env.ALCHEMY_API_KEY;
      const sanitized = apiKey ? raw.replaceAll(apiKey, "[redacted]") : raw;
      throw new UpstreamError("alchemy", sanitized.slice(0, 300));
    }
    const [amountOut, , , gasEstimate] = result;
    return {
      amountOut: amountOut.toString(),
      gasEstimate: gasEstimate.toString(),
      poolFee: POOL_FEE,
      quotedAt: new Date().toISOString(),
    };
  });
}
