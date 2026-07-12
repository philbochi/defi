/**
 * Single source of truth for landing-page copy and code snippets.
 * Rule for this page: every number, event name, and code snippet is real —
 * from this repo or the deployed Sepolia contracts. Illustrative
 * "rejected path" snippets are explicitly labeled as the version we
 * didn't ship.
 */

export type ProjectMeta = {
  id: string;
  index: string;
  title: string;
  chain: string;
  color: "cyan" | "pink" | "emerald";
  tagline: string;
  /** Two-line engineering decision for the pipeline tooltip. */
  decision: string;
  href: string;
  source: string;
};

export const PROJECTS: ProjectMeta[] = [
  {
    id: "p1",
    index: "01",
    title: "Portfolio Dashboard",
    chain: "Ethereum mainnet",
    color: "cyan",
    tagline: "Read-only lookup of any address — balances, USD values, allocation.",
    decision:
      "Read-only mainnet over wallet-connect: mirrors Zapper/DeBank, and forces the hard problem — arbitrary wallets full of unknown tokens.",
    href: "/dashboard",
    source: "https://github.com/philbochi/defi",
  },
  {
    id: "p2",
    index: "02",
    title: "Token Swap",
    chain: "Sepolia testnet",
    color: "pink",
    tagline: "Wallet-connect swaps through Uniswap v3's deployed contracts.",
    decision:
      "Integrate the battle-tested AMM instead of writing a toy one — the job skill is correct integration, not novel mechanism design.",
    href: "/swap",
    source: "https://github.com/philbochi/defi",
  },
  {
    id: "p3",
    index: "03",
    title: "Staking Vault",
    chain: "Sepolia · Foundry",
    color: "emerald",
    tagline: "Custom ERC-20 + vault, verified on Etherscan, public faucet.",
    decision:
      "Rewards minted on claim, never from principal — the demo-honest choice, with the Synthetix-style alternative documented in NatSpec.",
    href: "/stake",
    source: "https://github.com/philbochi/defi/tree/main/contracts",
  },
];

/* ---------- code snippets (verbatim from this repo unless labeled) ---------- */

export const SNIPPETS = {
  /** src/lib/portfolio.ts — the honesty flag. */
  p1Chosen: `// src/lib/portfolio.ts — whale wallets exceed the free-tier scan cap
const truncated =
  tokenScan.truncated || tokenScan.balances.length > MAX_TOKENS;
// ...the API says so instead of presenting a partial total as truth
return { address, totalUsd, priced, unpriced, truncated, updatedAt };`,

  /** Illustrative — the naive version this repo deliberately avoids. */
  p1Rejected: `// the version we didn't ship: symbol-keyed pricing
const price = prices[token.symbol]; // "USDC"… which of the 14 USDCs?
// duplicate tickers collide, unlisted tokens get invented prices,
// and the client-side fetch would hand your API key to every visitor`,

  /** src/components/swap/SwapWidget.tsx — ERC-20 → native ETH in one signature. */
  p2Chosen: `// swap pays WETH to the router itself (sentinel address(2)),
// then unwrapWETH9 forwards native ETH — one signature via multicall
const swapCall = encodeFunctionData({
  abi: swapRouterAbi,
  functionName: "exactInputSingle",
  args: [{ tokenIn, tokenOut, fee: POOL_FEE, recipient: ROUTER_ADDRESS_THIS,
           amountIn, amountOutMinimum: minOut, sqrtPriceLimitX96: 0n }],
});
const unwrapCall = encodeFunctionData({
  abi: swapRouterAbi, functionName: "unwrapWETH9", args: [minOut, address],
});`,

  /** Illustrative — the custom-AMM path this project deliberately skipped. */
  p2Rejected: `// the version we didn't ship: a hand-rolled constant-product pool
uint256 amountOut = (reserveOut * amountIn) / (reserveIn + amountIn);
// no concentrated liquidity, no oracle, no audits, no liquidity —
// a tutorial artifact pretending to be infrastructure`,

  /** contracts/src/StakingVault.sol — rewards minted, never from principal. */
  p3Chosen: `/// @notice Claim all accrued rewards (minted, not paid from principal).
function claim() public nonReentrant {
    _accrue(msg.sender);
    uint256 amount = positions[msg.sender].rewardsAccrued;
    if (amount == 0) revert NothingToClaim();
    positions[msg.sender].rewardsAccrued = 0;
    token.mint(msg.sender, amount);
    emit RewardsClaimed(msg.sender, amount);
}`,

  /** Illustrative — the pre-funded pool this demo deliberately avoids. */
  p3Rejected: `// the version we didn't ship: paying yield from a pre-funded pool
token.transfer(msg.sender, reward); // works until the pool runs dry
// mid-demo, then every claim() reverts for everyone. Production fix is
// Synthetix-style schedule funding — more machinery than a demo needs`,
} as const;

/* ---------- trade-off matrix ---------- */

export type Tradeoff = { title: string; why: string };

export const MATRIX: {
  id: string;
  label: string;
  color: "cyan" | "pink" | "emerald";
  chosen: Tradeoff[];
  rejected: Tradeoff[];
  chosenSnippet: keyof typeof SNIPPETS;
  rejectedSnippet: keyof typeof SNIPPETS;
}[] = [
  {
    id: "p1",
    label: "01 · dashboard",
    color: "cyan",
    chosen: [
      {
        title: "Read-only mainnet lookup",
        why: "Anyone can inspect any address in seconds — no wallet, no faucet friction, real data.",
      },
      {
        title: "Pricing by contract address",
        why: "ERC-20 symbols aren't unique; contract addresses make token identity unambiguous.",
      },
      {
        title: "Server-side keys + TTL cache",
        why: "Keys never reach the browser; 60s/24h caching with request dedup keeps free tiers happy — repeat lookups in ~20ms.",
      },
    ],
    rejected: [
      {
        title: "Testnet wallet-connect demo",
        why: "Shows reviewers their own empty wallet and asks them to fight a faucet before seeing anything.",
      },
      {
        title: "Symbol-keyed price mapping",
        why: "Duplicate tickers collide silently; unlisted tokens get invented prices.",
      },
      {
        title: "Client-side API calls",
        why: "Every visitor's network tab becomes a free API key.",
      },
    ],
    chosenSnippet: "p1Chosen",
    rejectedSnippet: "p1Rejected",
  },
  {
    id: "p2",
    label: "02 · swap",
    color: "pink",
    chosen: [
      {
        title: "Uniswap v3's deployed contracts",
        why: "Integration is the job skill: SwapRouter02's quirks, QuoterV2 simulation, verified addresses.",
      },
      {
        title: "Native ETH both directions",
        why: "Payable wrap-in-flight going in; multicall + unwrapWETH9 coming out — one signature each way.",
      },
      {
        title: "Server-side quoting",
        why: "Same keys-stay-on-the-server rule as the dashboard; the wallet only signs and submits.",
      },
    ],
    rejected: [
      {
        title: "A custom AMM",
        why: "A toy constant-product pool demonstrates a tutorial, not a production integration.",
      },
      {
        title: "WETH-only UX",
        why: "Punting on native ETH is easier and every real user notices immediately.",
      },
      {
        title: "Quotes that drift while signing",
        why: "Displayed numbers freeze the moment the wallet prompt opens — they always match the calldata.",
      },
    ],
    chosenSnippet: "p2Chosen",
    rejectedSnippet: "p2Rejected",
  },
  {
    id: "p3",
    label: "03 · vault",
    color: "emerald",
    chosen: [
      {
        title: "Rewards minted on claim",
        why: "Principal is never touched for yield and the vault can't run dry mid-demo.",
      },
      {
        title: "Public faucet on the token",
        why: "100 BWC per address per day — a staking demo a reviewer can't try is a screenshot.",
      },
      {
        title: "Mutation-tested suite",
        why: "35 tests incl. 512-run fuzz; reviewers broke the contract on purpose and the two gaps that survived got targeted tests.",
      },
    ],
    rejected: [
      {
        title: "Pre-funded reward pool",
        why: "Runs dry, then every claim reverts. Right for production budgets, wrong for a faucet-fed demo.",
      },
      {
        title: "Synthetix-style schedules",
        why: "Global accumulator machinery a fixed-APR demo doesn't need — the trade-off is documented in NatSpec.",
      },
      {
        title: "“Zero bugs found” claims",
        why: "The honest story — two real test gaps found and fixed — is the stronger one.",
      },
    ],
    chosenSnippet: "p3Chosen",
    rejectedSnippet: "p3Rejected",
  },
];

/* ---------- telemetry ticker ---------- */

/**
 * Simulated feed: event shapes, addresses, and gas numbers are from the
 * real deployed contracts and measured behavior; the stream itself is
 * generated client-side.
 */
export const TELEMETRY_POOL = [
  "[EVENT] BochiCredits FaucetClaimed(0x056f…febE, 100 BWC)",
  "[EVENT] StakingVault Staked(0x056f…febE, 10 BWC)",
  "[QUOTE] QuoterV2 0.001 WETH → UNI · gasEstimate 79,739",
  "[CACHE] portfolio snapshot hit · 21ms",
  "[EVENT] StakingVault RewardsClaimed · minted on claim",
  "[RPC ] alchemy_getTokenBalances · 3 pages · truncated=true",
  "[SWAP ] multicall(exactInputSingle, unwrapWETH9) · 1 signature",
  "[PRICE] coingecko /token_price · keyed by contract address",
  "[VAULT] pendingRewards accruing · 10% APR · floor rounding",
  "[GUARD] amountOutMinimum enforced on-chain · slippage 0.5%",
  "[CACHE] token metadata warm · TTL 24h",
  "[LIMIT] per-IP window ok · upstream quota protected",
] as const;
