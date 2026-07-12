/** Display formatting for USD values, prices, and token balances. */

const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUsd(value: number): string {
  if (value >= 10_000) return usdWhole.format(value);
  return usdCents.format(value);
}

/** Token unit prices span many magnitudes; keep 4 significant digits below $1. */
export function formatPrice(value: number): string {
  if (value >= 1) return usdCents.format(value);
  if (value < 0.000001) return "<$0.000001";
  return `$${value.toPrecision(4).replace(/\.?0+$/, "")}`;
}

export function formatBalance(balance: string): string {
  const n = Number(balance);
  if (!Number.isFinite(n)) return balance;
  if (n >= 1_000_000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(n);
  }
  if (n >= 1) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 4,
    }).format(n);
  }
  if (n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  return n.toPrecision(4).replace(/\.?0+$/, "");
}

export function formatPercent(share: number): string {
  if (share < 0.001 && share > 0) return "<0.1%";
  return `${(share * 100).toFixed(1)}%`;
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
