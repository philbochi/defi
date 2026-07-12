import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackdrop from "@/components/AmbientBackdrop";
import StatTiles from "@/components/landing/StatTiles";
import FlowDiagram from "@/components/landing/FlowDiagram";
import Reveal from "@/components/landing/Reveal";
import { highlight } from "@/lib/landing/highlight";

export const metadata: Metadata = {
  title: "Project Deep-Dives | defi.philbochi.com",
  description:
    "The engineering decisions behind the three projects: why read-only mainnet lookup, why server-side keys and contract-address pricing, why integrate Uniswap instead of building an AMM, and how the staking contracts were tested and reviewed.",
};

const REPO = "https://github.com/philbochi/defi";

/* Real code, trimmed for display — each distinct from the landing page's. */
const SNIPPET_P1 = `// src/lib/cache.ts — concurrent lookups share one upstream call
async getOrSet<T>(key: string, ttlMs: number, fn: () => Promise<T>) {
  const cached = this.get<T>(key);
  if (cached !== undefined) return cached;
  const pending = this.inFlight.get(key);
  if (pending) return pending as Promise<T>; // dedup the stampede
  const promise = fn()
    .then((value) => { this.set(key, value, ttlMs); return value; })
    .finally(() => this.inFlight.delete(key));
  this.inFlight.set(key, promise);
  return promise;
}`;

const SNIPPET_P2 = `// src/lib/swap/quoter.ts — QuoterV2 runs server-side; keys stay here
const { result } = await client().simulateContract({
  address: UNISWAP.QUOTER_V2,
  abi: quoterV2Abi,
  functionName: "quoteExactInputSingle",
  args: [{ tokenIn, tokenOut, amountIn,
           fee: POOL_FEE, sqrtPriceLimitX96: 0n }],
});
const [amountOut, , , gasEstimate] = result;`;

const SNIPPET_P3 = `// the test that kills the mutant the review found
function test_ExitClaimsFrozenRewardsAfterFullWithdraw() public {
    vm.prank(alice); vault.stake(100e18);
    vm.warp(block.timestamp + YEAR);
    vm.prank(alice); vault.withdraw(100e18); // rewards frozen, staked 0
    vm.warp(block.timestamp + 30 days);
    vm.prank(alice); vault.exit();           // must still claim
    assertEq(token.balanceOf(alice), 110e18);
}`;

function MetaLinks({
  demo,
  demoLabel,
  code,
  codeLabel,
  extra,
}: {
  demo: string;
  demoLabel: string;
  code: string;
  codeLabel: string;
  extra?: { href: string; label: string; className: string };
}) {
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink-3">
      <a href={demo} className="text-accent transition-colors hover:text-ink">
        {demoLabel} ↗
      </a>
      <a
        href={code}
        target="_blank"
        rel="noopener noreferrer"
        className="text-ink-2 transition-colors hover:text-ink"
      >
        {codeLabel} ↗
      </a>
      {extra && (
        <a
          href={extra.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`transition-colors hover:text-ink ${extra.className}`}
        >
          {extra.label} ↗
        </a>
      )}
    </p>
  );
}

function Code({ html }: { html: string }) {
  return (
    <div
      className="landing-code overflow-x-auto rounded-xl border border-edge text-[12px] leading-relaxed"
      // Build-time shiki output of code from this repo — not user input.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default async function CaseStudiesPage() {
  const [p1Html, p2Html, p3Html] = await Promise.all([
    highlight(SNIPPET_P1, "typescript"),
    highlight(SNIPPET_P2, "typescript"),
    highlight(SNIPPET_P3, "solidity"),
  ]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <AmbientBackdrop color="slate" />
      <SiteHeader active="deep-dives" />
      <main className="relative mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <header className="mb-10 flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Project Deep-Dives
          </h1>
          <p className="text-sm leading-relaxed text-ink-2">
            Three projects, built in sequence: a mainnet portfolio dashboard, a
            testnet swap interface, and a staking vault with its own ERC-20.
            This page covers the engineering decisions — what was chosen, what
            was deliberately not chosen, and why. Everything is live and the
            code is public.
          </p>
        </header>

        <div className="flex flex-col gap-14">
          {/* ---- Project 1 ---- */}
          <section className="flex flex-col gap-5">
            <Reveal className="flex flex-col gap-2">
              <span className="w-fit rounded-full border border-neon-cyan/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neon-cyan">
                01 · Ethereum mainnet
              </span>
              <h2 className="text-xl font-semibold tracking-tight">
                On-Chain Portfolio Dashboard
              </h2>
              <MetaLinks
                demo="/dashboard"
                demoLabel="live demo"
                code={REPO}
                codeLabel="source"
              />
            </Reveal>
            <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-ink-2">
              <p>
                The first decision was the one most demo dApps get wrong:
                this is a <strong className="font-medium text-ink">read-only mainnet
                lookup, not a wallet-connect app</strong>. Real portfolio tools —
                Zapper, DeBank — work exactly this way: you inspect any address
                without connecting anything. That choice avoids the
                empty-wallet demo problem (a testnet wallet-connect demo shows
                a reviewer their own empty wallet and asks them to fight a
                faucet first), and it forces the harder engineering problem:
                handling arbitrary addresses holding hundreds of unknown
                tokens, including the spam and dust every real wallet
                accumulates. Spam is filtered server-side; anything without a
                real price feed is segregated from the portfolio math instead
                of quietly inflating it, and when a whale wallet exceeds the
                scan cap, the API returns a <code className="rounded bg-surface-2 px-1 font-mono text-[13px]">truncated</code> flag
                and the UI says the total may be incomplete rather than
                presenting a partial number as truth.
              </p>
              <Reveal>
                <StatTiles
                  color="cyan"
                  stats={[
                    { value: "~20ms", label: "repeat lookup from the TTL cache" },
                    { value: "60s / 24h", label: "price and metadata cache windows" },
                    { value: "$17.6M", label: "one Ethereum Foundation lookup returned (July 2026) — run it yourself on the dashboard" },
                  ]}
                />
              </Reveal>
              <p>
                Every call to Alchemy (balances, token metadata) and CoinGecko
                (pricing) runs <strong className="font-medium text-ink">server-side
                only</strong> — the browser talks to one internal endpoint and
                the API keys never appear in a client bundle or network tab.
                Pricing is queried <strong className="font-medium text-ink">by
                contract address, not by symbol</strong>: ERC-20 symbols aren&apos;t
                unique, so symbol mapping silently mixes up duplicate tickers
                and invents prices for unlisted tokens. Contract-address
                lookups make identity unambiguous — a token CoinGecko doesn&apos;t
                track comes back empty and is treated as unpriced, never
                guessed.
              </p>
              <Reveal>
                <FlowDiagram
                  color="cyan"
                  steps={[
                    { label: "browser" },
                    { label: "/api/portfolio", note: "one internal endpoint" },
                    { label: "TTL cache", note: "60s · dedup", dim: true },
                    { label: "Alchemy · CoinGecko", note: "keys live here" },
                  ]}
                  caption="the API key never crosses the first arrow"
                />
              </Reveal>
              <p>
                Both providers run on free tiers, so a{" "}
                <strong className="font-medium text-ink">caching layer</strong>
                {" "}sits in front of them: an in-memory TTL cache with in-flight
                request deduplication, batched lookups so a 50-token wallet
                costs a handful of upstream calls rather than a hundred, a
                per-IP rate limiter, and a timeout on every upstream fetch so
                one hung socket can&apos;t stall a serverless instance. The same
                interface would take Redis for production scale — the point is
                that rate-limit awareness was designed in, not bolted on.
              </p>
              <Reveal>
                <Code html={p1Html} />
              </Reveal>
            </div>
          </section>

          {/* ---- Project 2 ---- */}
          <section className="flex flex-col gap-5">
            <Reveal className="flex flex-col gap-2">
              <span className="w-fit rounded-full border border-neon-pink/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neon-pink">
                02 · Sepolia testnet
              </span>
              <h2 className="text-xl font-semibold tracking-tight">
                Token Swap Interface
              </h2>
              <MetaLinks
                demo="/swap"
                demoLabel="live demo"
                code={REPO}
                codeLabel="source"
              />
            </Reveal>
            <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-ink-2">
              <p>
                The swap integrates{" "}
                <strong className="font-medium text-ink">Uniswap v3&apos;s deployed
                contracts instead of a custom AMM</strong>, and that&apos;s the
                point. Writing a toy constant-product pool is a tutorial
                exercise; most real front-end and full-stack Web3 roles need
                the other skill — integrating battle-tested protocols
                correctly. That means the unglamorous specifics: SwapRouter02&apos;s
                parameter struct differs from the original router (no deadline
                field), quotes come from QuoterV2&apos;s revert-based simulation
                path, native ETH needs the router&apos;s payable wrap-in-flight
                path going in and a <code className="rounded bg-surface-2 px-1 font-mono text-[13px]">multicall</code> that
                bundles the swap with <code className="rounded bg-surface-2 px-1 font-mono text-[13px]">unwrapWETH9</code> coming
                out, and slippage tolerance has to become an on-chain{" "}
                <code className="rounded bg-surface-2 px-1 font-mono text-[13px]">amountOutMinimum</code>,
                not just a display number. Every contract address was verified
                on-chain before being committed, and the exact multicall
                calldata the UI produces was simulated against the live router
                before a user ever signed it.
              </p>
              <Reveal>
                <FlowDiagram
                  color="pink"
                  steps={[
                    { label: "swap UI" },
                    { label: "wallet signs", note: "quote frozen" },
                    { label: "SwapRouter02", note: "multicall" },
                    { label: "swap → unwrap", dim: true },
                    { label: "native ETH out" },
                  ]}
                  caption="ERC-20 → native ETH in one signature"
                />
              </Reveal>
              <p>
                The wallet layer is{" "}
                <strong className="font-medium text-ink">RainbowKit, Wagmi, and
                viem</strong>
                {" "}— and it was deliberately scoped as the second
                project, not the first. Wallet-connect is where a signature is
                actually required; leading with it would have made the flagship
                demo worse (see project one). Two implementation details
                carried over from the dashboard&apos;s discipline: price quotes are
                fetched server-side through the same keys-stay-on-the-server
                rule — the wallet only signs and submits — and displayed quotes
                auto-refresh every 15 seconds but freeze the moment the wallet
                prompt opens, so the numbers on screen always match the
                calldata being signed.
              </p>
              <Reveal>
                <Code html={p2Html} />
              </Reveal>
            </div>
          </section>

          {/* ---- Project 3 ---- */}
          <section className="flex flex-col gap-5">
            <Reveal className="flex flex-col gap-2">
              <span className="w-fit rounded-full border border-neon-emerald/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neon-emerald">
                03 · Sepolia testnet · Foundry
              </span>
              <h2 className="text-xl font-semibold tracking-tight">
                Staking Vault &amp; Bochi Credits
              </h2>
              <MetaLinks
                demo="/stake"
                demoLabel="live demo"
                code={`${REPO}/tree/main/contracts`}
                codeLabel="contracts source"
                extra={{
                  href: "https://sepolia.etherscan.io/address/0x7d76cfbd9355d4ecc1842bca4d163a02c518ce9d#code",
                  label: "verified contract",
                  className: "text-neon-emerald",
                }}
              />
            </Reveal>
            <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-ink-2">
              <p>
                This is the end-to-end piece: a custom ERC-20 (Bochi Credits,
                BWC) and a staking vault, written in Solidity with Foundry,
                deployed to Sepolia, and{" "}
                <a
                  href="https://sepolia.etherscan.io/address/0x7d76cfbd9355d4ecc1842bca4d163a02c518ce9d#code"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-emerald transition-colors hover:text-ink"
                >
                  verified on Etherscan
                </a>{" "}
                so the source is publicly provable, not just claimed. The token
                ships with a <strong className="font-medium text-ink">public
                faucet</strong>
                {" "}— 100 BWC per address per day — because a staking
                demo a reviewer can&apos;t actually try is a screenshot. Anyone can
                mint tokens, stake, and watch 10% APR accrue per second in the
                UI, with nothing to ask for and nothing at stake: BWC is
                explicitly a valueless testnet token.
              </p>
              <Reveal>
                <FlowDiagram
                  color="emerald"
                  steps={[
                    { label: "faucet()", note: "100 BWC / day" },
                    { label: "stake()" },
                    { label: "accrue", note: "10% APR · per second", dim: true },
                    { label: "claim()", note: "minted, not from principal" },
                  ]}
                  caption="rewards are minted on claim — principal is never touched"
                />
              </Reveal>
              <p>
                The core design trade-off is documented in the contract&apos;s own
                NatSpec: rewards are{" "}
                <strong className="font-medium text-ink">minted on claim</strong>{" "}
                (the vault holds a minter role on the token) rather than paid
                from a pre-funded reward pool. For a faucet-fed demo token this
                is the honest choice — staked principal is never touched to pay
                yield, and the vault can&apos;t run dry mid-demo. The
                production-scale alternative is schedule-funded distribution in
                the Synthetix style, where a finite reward budget is streamed
                over a period with global accumulator accounting; that&apos;s more
                machinery than a fixed-APR demo needs, and knowing which
                pattern fits which situation is the actual skill. Accrual here
                is per-position (<code className="rounded bg-surface-2 px-1 font-mono text-[13px]">staked × rate × elapsed</code>),
                snapshotted on every interaction, with floor rounding always in
                the protocol&apos;s favor.
              </p>
              <Reveal>
                <StatTiles
                  color="emerald"
                  stats={[
                    { value: "22", label: "adversarial review agents, every claim independently verified" },
                    { value: "2", label: "real test gaps found by mutation testing — both fixed" },
                    { value: "35", label: "passing tests, fuzz suites at 512 runs" },
                  ]}
                />
              </Reveal>
              <p>
                The review process is a better story told accurately than
                inflated: the contracts went through an adversarial review in
                which <strong className="font-medium text-ink">22 independent
                agents</strong> attacked them — reentrancy, access-control
                chains, donation attacks, overflow at extreme values — and
                every claimed vulnerability was independently verified rather
                than taken at face value. No security defects survived that
                verification. What did survive were two real gaps in the test
                suite, found by <strong className="font-medium text-ink">mutation
                testing</strong>: reviewers deliberately broke the contract to
                see whether the tests noticed. A mutant that emitted wrong
                event amounts passed everything (there were no event
                assertions), and a mutant that broke <code className="rounded bg-surface-2 px-1 font-mono text-[13px]">exit()</code>&apos;s
                claim-after-full-withdraw branch also passed (that path was
                untested). Both gaps got targeted tests that now kill those
                exact mutants.
              </p>
              <Reveal>
                <Code html={p3Html} />
              </Reveal>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
