export type TokenHolding = {
  /** ERC-20 contract address (lowercase), or null for native ETH. */
  contract: string | null;
  symbol: string;
  name: string;
  logo: string | null;
  decimals: number;
  /** Human-readable balance, e.g. "1.2345". */
  balance: string;
  /** Raw integer balance as a decimal string. */
  balanceRaw: string;
  priceUsd: number | null;
  usdValue: number | null;
};

export type Portfolio = {
  /** Checksummed address the lookup ran against. */
  address: string;
  /** Sum of all priced holdings in USD. */
  totalUsd: number;
  /** Holdings with a known USD price, sorted by value descending. */
  priced: TokenHolding[];
  /** Holdings with metadata but no price feed (often spam/dust). */
  unpriced: TokenHolding[];
  /** ISO timestamp of when this snapshot was assembled. */
  updatedAt: string;
};
