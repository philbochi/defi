/**
 * Sepolia swap constants. Every address below was verified on-chain
 * (bytecode present via eth_getCode, and the WETH/UNI 0.3% pool returns
 * live QuoterV2 quotes) before being committed.
 */

import { Token } from "@uniswap/sdk-core";

export const SEPOLIA_CHAIN_ID = 11155111;

export const UNISWAP = {
  /** Canonical Sepolia WETH9 used by the Uniswap deployment. */
  WETH9: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  SWAP_ROUTER_02: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
  QUOTER_V2: "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3",
  V3_FACTORY: "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
} as const;

/** The one fee tier with a live WETH/UNI pool on Sepolia. */
export const POOL_FEE = 3000;

export const WETH_TOKEN = new Token(
  SEPOLIA_CHAIN_ID,
  UNISWAP.WETH9,
  18,
  "WETH",
  "Wrapped Ether",
);

export const UNI_TOKEN = new Token(
  SEPOLIA_CHAIN_ID,
  UNISWAP.UNI,
  18,
  "UNI",
  "Uniswap",
);

/**
 * Symbols the UI can trade. Native ETH is quoted/routed as WETH; wrap and
 * unwrap are direct WETH9 deposit/withdraw calls, not swaps.
 */
export const SWAP_SYMBOLS = ["ETH", "WETH", "UNI"] as const;
export type SwapSymbol = (typeof SWAP_SYMBOLS)[number];

export function isSwapSymbol(value: string): value is SwapSymbol {
  return (SWAP_SYMBOLS as readonly string[]).includes(value);
}

/** The ERC-20 the symbol resolves to for quoting/routing. */
export function erc20For(symbol: SwapSymbol): Token {
  return symbol === "UNI" ? UNI_TOKEN : WETH_TOKEN;
}
