# On-Chain Portfolio Dashboard

Paste any Ethereum address and see its token balances, USD values, and
allocation — live from mainnet.

**Live demo:** [defi.philbochi.com](https://defi.philbochi.com)

This is Project 1 of a three-part DeFi portfolio (dashboard → token swap →
staking vault) built by [Phil Bochi](https://philbochi.com).

## What it does

- Read-only lookup of any mainnet address: ETH + ERC-20 balances with USD
  values, a total-value summary, an allocation donut, and a sortable
  holdings table with Etherscan links
- One-click example addresses (vitalik.eth, Ethereum Foundation) so
  reviewers can see real data instantly
- Shareable lookup URLs — `/?address=0x…` auto-loads that portfolio
- Tokens without a price feed (usually spam or illiquid dust) are bucketed
  separately and hidden behind a toggle instead of polluting the numbers

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript) |
| On-chain data | Alchemy JSON-RPC (`eth_getBalance`, `alchemy_getTokenBalances`, `alchemy_getTokenMetadata`) |
| Pricing | CoinGecko (token price by contract address) |
| Address handling | viem (`isAddress`, `getAddress`, `formatUnits`) |
| Charts | Recharts |
| Styling | Tailwind CSS 4 |
| Hosting | Vercel |

## Key technical decisions

**Read-only mainnet lookup instead of wallet-connect.** Real portfolio
tools (Zapper, DeBank) work exactly this way — you can inspect any address
without connecting anything. It demos better (no wallet required to try
it), and it forces the harder engineering problem: handling arbitrary
addresses with hundreds of unknown tokens, not just a friendly test
wallet. Wallet-connect (Wagmi/RainbowKit) arrives with Project 2, where
it's actually needed to sign transactions.

**All upstream calls are server-side.** Alchemy and CoinGecko are called
only from Next.js route handlers, so the API keys live in server env vars
and never reach the browser. The client talks to one internal endpoint:
`GET /api/portfolio?address=0x…`.

**A caching layer sits in front of both providers.** Both APIs run on
free tiers, so the server keeps an in-memory TTL cache with in-flight
request deduplication: portfolio snapshots cache for 60s per address,
prices for 60s per contract, and token metadata for 24h (it's effectively
static). Metadata lookups are sent as batched JSON-RPC arrays and price
lookups as batched contract-address queries, so a 50-token wallet costs a
handful of upstream calls, not a hundred. A per-IP sliding-window rate
limiter backstops the cache. Per-instance memory is the right size for a
demo; the cache module is interface-shaped to swap in Redis/KV for
production scale.

**Spam tokens are filtered, not trusted.** Token metadata comes from
arbitrary ERC-20 contracts, so it's treated as untrusted input: obvious
"visit site to claim" tokens are dropped server-side, and anything
CoinGecko doesn't price is segregated from the portfolio math.

## Running locally

```bash
npm install
cp .env.example .env.local   # add your Alchemy + CoinGecko keys
npm run dev
```

## Roadmap

- **Project 2 — Token Swap:** wallet-connect (Wagmi/viem/RainbowKit) +
  Uniswap SDK on Sepolia
- **Project 3 — Staking Vault:** custom ERC-20 + staking contract built
  with Foundry, verified on Etherscan
- Possible dashboard follow-ups: ENS resolution, historical value chart,
  multi-chain support
