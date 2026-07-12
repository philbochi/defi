# DeFi Portfolio — Dashboard & Token Swap

A three-part DeFi portfolio (dashboard → token swap → staking vault) built
by [Phil Bochi](https://philbochi.com).

**Live demo:** [defi.philbochi.com](https://defi.philbochi.com)

- **Project 1 — On-Chain Portfolio Dashboard** (mainnet, complete): paste
  any Ethereum address and see its token balances, USD values, and
  allocation — live from mainnet.
- **Project 2 — Token Swap** (Sepolia testnet, in progress): connect a
  wallet and swap through Uniswap v3's deployed contracts at
  [/swap](https://defi.philbochi.com/swap).
- **Project 3 — Staking Vault** (Sepolia testnet, live): stake the custom
  Bochi Credits ERC-20 and watch 10% APR accrue live at
  [/stake](https://defi.philbochi.com/stake). Built with Foundry, both
  contracts [verified on Etherscan](https://sepolia.etherscan.io/address/0x7d76cfbd9355d4ecc1842bca4d163a02c518ce9d#code),
  with a public faucet so anyone can try it — see
  [contracts/](contracts/README.md).

## Project 1 — what it does

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
| Wallet layer | Wagmi + viem + RainbowKit (Sepolia, swap page) |
| DEX integration | Uniswap v3 deployed contracts (SwapRouter02, QuoterV2) + `@uniswap/sdk-core` |
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

## Project 2 — token swap (in progress)

Wallet connect via RainbowKit/Wagmi on **Sepolia testnet**, swapping
through Uniswap v3's deployed contracts — integrating the battle-tested
protocol instead of reinventing an AMM. Every contract address in
`src/lib/swap/constants.ts` was verified on-chain before being committed,
and the WETH/UNI 0.3% pool quote path was tested against QuoterV2
directly.

Key decisions so far:

- **Quotes are fetched server-side** (`/api/quote` → QuoterV2 via
  Alchemy), keeping the same no-keys-in-the-browser rule as the
  dashboard. The wallet talks to the chain only to sign and submit.
- **Native ETH is handled in both directions, not just WETH.** ETH→token
  swaps use SwapRouter02's payable path (the router wraps in-flight);
  token→ETH exits bundle the swap and `unwrapWETH9` into one transaction
  via the router's `multicall`; ETH⇄WETH wrap/unwrap are direct WETH9
  `deposit`/`withdraw` calls shown as 1:1 "swaps" in the UI.
- **Slippage is explicit**: presets set `amountOutMinimum` on-chain, and
  the UI shows the minimum received before you sign.
- ERC-20 inputs get the standard allowance check → approve → swap flow.

## Running locally

```bash
npm install
cp .env.example .env.local   # add Alchemy + CoinGecko keys and a Reown project ID
npm run dev
```

## Roadmap

- Mobile wallet deep-link testing across the swap and stake flows
- Possible dashboard follow-ups: ENS resolution, historical value chart,
  multi-chain support
