# DeFi Web3 Portfolio — Project Plan

## Purpose

A three-project portfolio built to demonstrate real dApp development skills
(not just Web3 marketing sites) for fintech-flavored Web3 developer roles —
specifically at the interface layer of financial products. Targets fintech
over generic Web3, leveraging existing front-end/agency strengths while
filling the blockchain/dApp development gap.

Positioning: front-end-leaning full-stack Web3 developer who makes DeFi
protocols usable — the person who takes a protocol's raw contracts and
makes them feel like a real product (Zapper/DeBank/Coinbase-level polish),
not a raw block explorer.

## Infrastructure (already set up)

- **GitHub:** dedicated personal account (separate from Bochi Web's
  accounts/repos/keys), repo `philbochi/defi`
- **Vercel:** separate personal Hobby account, project `defi`, deployed
  from the `philbochi/defi` repo
- **Domain:** `defi.philbochi.com` (subdomain of the existing
  philbochi.com site, DNS via Cloudflare, CNAME → Vercel). Kept as a
  standalone project — no shared code with the main philbochi.com site
  (which is BWCC-managed). Linked only via a project card/link from the
  main site.
- **Alchemy account:** app named `defi-dashboard`, Ethereum enabled
  (covers both mainnet and Sepolia testnet)
- **CoinGecko:** Demo API key (free tier — 10k credits/mo, 100 calls/min)

Reminder: all API calls to Alchemy and CoinGecko must be made server-side
(Next.js API routes or server components) — never client-side — to avoid
exposing API keys.

## Design direction

Not a marketing/hype site (no token mascots, "buy now" CTAs, animated
gradients). Think clean fintech data product — dark-mode-friendly,
minimal chrome, numbers and charts front and center. Reference points:
Zapper, DeBank, a stripped-down Robinhood screen.

---

## Project 1 — On-Chain Portfolio Dashboard (current focus)

**What it does:** mainnet, read-only address lookup — paste any Ethereum
address, see token balances and USD values. Deliberately NOT wallet-connect
for v1 (wallet-connect is an optional future addition) — mainnet
read-only lookup is a stronger portfolio signal because it mirrors how
real tools like Zapper/DeBank actually work.

**Stack:**
- Framework: Next.js (chosen over Astro — need client-side reactivity)
- Wallet layer: Wagmi / viem / RainbowKit (present in the stack for
  future wallet-connect addition, not required for v1's read-only flow)
- On-chain data: Alchemy (`alchemy_getTokenBalances` etc.)
- Pricing: CoinGecko (token price by contract address)
- Caching layer: needed to stay within Alchemy/CoinGecko free-tier rate
  limits under real traffic (recruiters poking at the demo)
- Visualization: Recharts
- Deployment: Vercel, at `defi.philbochi.com` (or a path under it, e.g.
  `defi.philbochi.com/dashboard` if multiple projects end up sharing the
  subdomain)

**Core UI:**
- Header / nav
- Address input (mainnet address, simple validation)
- Summary card (total portfolio value)
- Token holdings table (token, balance, USD value)
- Allocation chart (Recharts — pie or bar breakdown by token/value)

**Mobile:** no wallet-connect dependency for v1, so mobile is mostly about
responsive layout — charts readable at small width, tap targets sized
correctly, no horizontal scroll. Test on an actual phone once deployed.

**Portfolio narrative to be ready to explain in interviews:**
- Why mainnet read-only instead of wallet-connect (realism vs. toy demo)
- Why Alchemy/CoinGecko calls are server-side only (key security)
- The caching layer and why it's there (rate-limit awareness)

---

## Project 2 — Token Swap Interface (queued)

**What it does:** lets a user connect a wallet (testnet) and swap tokens.

**Stack additions:**
- Wagmi / viem / RainbowKit — now actually wired up for wallet-connect
- Uniswap SDK — integrate existing Uniswap contracts rather than writing
  a custom AMM (the point is demonstrating integration with battle-tested
  DeFi protocols, not reinventing one)
- WalletConnect / Reown Cloud project ID — required for RainbowKit
- Network: Sepolia testnet

**Mobile:** this is where mobile gets genuinely tricky — the browser has
to hand off to a wallet app (MetaMask, Rainbow, etc.) via deep link, sign,
then bounce back. Test this specific flow on an actual phone; be ready to
talk about what broke and how it was handled — it's a real differentiating
interview question ("how did you handle mobile wallet connections?").

**Portfolio narrative:**
- Why integrating Uniswap's SDK instead of building a custom AMM
- Gas/slippage handling and UX around it
- Mobile wallet hand-off behavior

---

## Project 3 — Staking Vault (queued)

**What it does:** deposit a custom token, accrue yield, withdraw.

**Concrete narrative device — Bochi Credits:**
- Deploy an ERC-20 testnet token called **Bochi Credits** (ticker e.g.
  `$BOCHI` or `$BWC`) on Sepolia — this is the token that gets staked.
  Demo-only / testnet — not a real-world-value token (see note below).
- Staking vault contract: deposit, accrue yield, withdraw
- Built with Foundry
- Deployed to Sepolia, **verified on Etherscan** (verification matters —
  it makes the contract source publicly readable/provable, not just
  claimed)
- Simple faucet function so reviewers/recruiters can actually get some
  Bochi Credits to try staking themselves

**Portfolio narrative:**
- "I designed and deployed my own ERC-20 token and a staking vault
  contract for it" — end-to-end token design → contract → interface
- Why Etherscan verification specifically matters

**Note:** Bochi Credits is a demo/testnet-only concept tied to this
portfolio project. A real token redeemable for actual Bochi Web services
is a separate, much bigger idea (securities/money-transmission
implications) that was deliberately set aside — not part of this plan.

---

## What "done" looks like for hiring purposes

For each project, ready to show:
1. A live, deployed URL (not screenshots) — mainnet-realistic for
   Project 1, testnet-functional for Projects 2 and 3
2. A clean public GitHub repo (personal account) with real incremental
   commit history and a proper README (what it does, stack, link to live
   demo, why key technical decisions were made)
3. Specific technical decisions the person can explain out loud in an
   interview (see "Portfolio narrative" notes above for each project)
4. For Project 3 specifically: a verified Etherscan contract page
5. Optional but strong: a short 60–90 second walkthrough video per
   project, and a 2–3 paragraph case-study write-up on philbochi.com
   linking out to each live project

## Timeline note

Target pace: 1–2 weeks per project (faster than the conventional
2–3 week estimate for this kind of build), given significant available
bandwidth and heavy use of Claude Code / Cursor for implementation speed.

## Explicitly out of scope for this plan

- Multi-chain support beyond Ethereum mainnet + Sepolia (tempting, adds
  complexity without matching the current spec — a reasonable v2 addition
  later, not now)
- Any blog/affiliate-content monetization layer bolted onto this
  portfolio (considered separately — conclusion was: keep it as a
  possible later side-bet, not mixed into the job-search-focused
  portfolio, and definitely not hosted on the same domain if pursued)
