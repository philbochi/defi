"use client";

import { useEffect, useRef, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import { encodeFunctionData } from "viem";
import {
  UNISWAP,
  POOL_FEE,
  SWAP_SYMBOLS,
  erc20For,
  type SwapSymbol,
} from "@/lib/swap/constants";
import {
  swapRouterAbi,
  erc20Abi,
  weth9Abi,
  ROUTER_ADDRESS_THIS,
} from "@/lib/swap/abis";
import { Medallion } from "@/components/landing/glyphs";

const DECIMALS = 18;
const SLIPPAGE_PRESETS_BPS = [10, 50, 100] as const;
const AMOUNT_PATTERN = /^\d*\.?\d{0,18}$/;
/** Left un-swapped on ETH max-fill so the transaction can pay its own gas. */
const GAS_RESERVE = 5_000_000_000_000_000n; // 0.005 ETH

type QuoteResponse = {
  amountOut: string;
  gasEstimate: string;
  poolFee: number;
  error?: string;
};

type Action = "wrap" | "unwrap" | "swap-eth-in" | "swap-erc20" | "swap-to-eth";

function actionFor(from: SwapSymbol, to: SwapSymbol): Action {
  if (from === "ETH" && to === "WETH") return "wrap";
  if (from === "WETH" && to === "ETH") return "unwrap";
  if (from === "ETH") return "swap-eth-in";
  // ERC-20 → native ETH: swap to WETH held by the router, then unwrap —
  // one transaction via the router's multicall.
  if (to === "ETH") return "swap-to-eth";
  return "swap-erc20";
}

function fmt(amount: bigint): string {
  const n = Number(formatUnits(amount, DECIMALS));
  if (n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(n);
}

export default function SwapWidget() {
  const { address, chainId, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();

  const [from, setFrom] = useState<SwapSymbol>("ETH");
  const [to, setTo] = useState<SwapSymbol>("UNI");
  const [amountText, setAmountText] = useState("");
  const [slippageBps, setSlippageBps] = useState<number>(50);
  // Quote results are keyed by their inputs, so a stale result for a
  // previous amount/pair simply stops matching instead of being reset.
  const [quoteState, setQuoteState] = useState<{
    key: string;
    data?: QuoteResponse;
    error?: string;
  } | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const action = actionFor(from, to);
  const wrongChain = isConnected && chainId !== sepolia.id;
  const amountIn: bigint | null = (() => {
    if (!AMOUNT_PATTERN.test(amountText) || amountText === "" || amountText === ".")
      return null;
    try {
      const v = parseUnits(amountText, DECIMALS);
      return v > 0n ? v : null;
    } catch {
      return null;
    }
  })();

  // ----- balances -----
  const nativeBalance = useBalance({
    address,
    chainId: sepolia.id,
    query: { enabled: isConnected },
  });
  const fromErc20 = erc20For(from);
  const erc20Balance = useReadContract({
    address: fromErc20.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: { enabled: isConnected && from !== "ETH" },
  });
  const fromBalance: bigint | null =
    from === "ETH"
      ? (nativeBalance.data?.value ?? null)
      : ((erc20Balance.data as bigint | undefined) ?? null);

  // ----- allowance (ERC-20 inputs only) -----
  const erc20Input = action === "swap-erc20" || action === "swap-to-eth";
  const allowance = useReadContract({
    address: fromErc20.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, UNISWAP.SWAP_ROUTER_02 as `0x${string}`] : undefined,
    chainId: sepolia.id,
    query: { enabled: isConnected && erc20Input },
  });
  const allowanceLoading =
    erc20Input && isConnected && allowance.data === undefined;
  const needsApproval =
    erc20Input &&
    amountIn !== null &&
    allowance.data !== undefined &&
    (allowance.data as bigint) < amountIn;

  // ----- quote (server-side; wrap/unwrap are always 1:1) -----
  const quoteKey = `${from}:${to}:${amountText}`;
  const needsQuote =
    amountIn !== null &&
    (action === "swap-eth-in" ||
      action === "swap-erc20" ||
      action === "swap-to-eth");

  // Testnet prices drift too: re-quote every 15s while idle so a stale
  // number can't sit on screen. (Interval effect lives below, after the
  // pending-transaction state it pauses on.)
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!needsQuote) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/quote?from=${from}&to=${to}&amountIn=${encodeURIComponent(amountText)}`,
          { signal: controller.signal },
        );
        const body = (await res.json().catch(() => null)) as QuoteResponse | null;
        if (!res.ok || !body || body.error) {
          throw new Error(body?.error ?? `Quote failed (HTTP ${res.status}).`);
        }
        setQuoteState({ key: quoteKey, data: body });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setQuoteState({
          key: quoteKey,
          error: err instanceof Error ? err.message : "Quote failed.",
        });
      }
    }, 400);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [quoteKey, needsQuote, from, to, amountText, refreshTick]);

  const activeQuote = quoteState?.key === quoteKey ? quoteState : null;
  const quote = activeQuote?.data ?? null;
  const quoteError = activeQuote?.error ?? null;
  const quoting = needsQuote && activeQuote === null;

  const amountOut =
    action === "wrap" || action === "unwrap"
      ? amountIn
      : quote
        ? BigInt(quote.amountOut)
        : null;
  const minOut =
    amountOut !== null
      ? (amountOut * BigInt(10_000 - slippageBps)) / 10_000n
      : null;

  // ----- transactions -----
  type TxKind = "approve" | "swap" | "wrap" | "unwrap";
  const { writeContractAsync, isPending: writing } = useWriteContract();
  const [pendingTx, setPendingTx] = useState<
    { hash: `0x${string}`; kind: TxKind } | undefined
  >();
  const [confirmedTx, setConfirmedTx] = useState<
    { hash: `0x${string}`; kind: TxKind } | undefined
  >();
  const receipt = useWaitForTransactionReceipt({ hash: pendingTx?.hash });

  // Re-quote on an interval; paused from the moment the wallet prompt
  // opens (writing) through confirmation (pendingTx) so the displayed
  // numbers stay frozen at what the user is signing against.
  useEffect(() => {
    if (!needsQuote || pendingTx !== undefined || writing) return;
    const id = window.setInterval(() => setRefreshTick((t) => t + 1), 15_000);
    return () => window.clearInterval(id);
  }, [needsQuote, pendingTx, writing]);

  useEffect(() => {
    if (!pendingTx || (!receipt.isSuccess && !receipt.isError)) return;
    // Deferred a tick so no state is set synchronously inside the effect.
    const success = receipt.isSuccess;
    const tx = pendingTx;
    const id = window.setTimeout(() => {
      if (success) {
        setConfirmedTx(tx);
        if (tx.kind === "approve") {
          // The approve→swap flow continues: keep the amount and quote,
          // just pick up the new allowance.
          void allowance.refetch();
        } else {
          setAmountText("");
          void nativeBalance.refetch();
          void erc20Balance.refetch();
          void allowance.refetch();
        }
      } else {
        setTxError(
          "Transaction failed or was dropped. Check Etherscan and retry.",
        );
      }
      setPendingTx(undefined);
    }, 0);
    return () => window.clearTimeout(id);
    // refetch functions are stable enough for this effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess, receipt.isError, pendingTx]);

  async function send(kind: TxKind, run: () => Promise<`0x${string}`>) {
    setTxError(null);
    setConfirmedTx(undefined);
    try {
      const hash = await run();
      setPendingTx({ hash, kind });
    } catch (err) {
      const message =
        err && typeof err === "object" && "shortMessage" in err
          ? String((err as { shortMessage: string }).shortMessage)
          : err instanceof Error
            ? err.message
            : "Transaction failed.";
      setTxError(message.slice(0, 200));
    }
  }

  function approve() {
    if (amountIn === null) return;
    void send("approve", () =>
      writeContractAsync({
        address: fromErc20.address as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [UNISWAP.SWAP_ROUTER_02 as `0x${string}`, amountIn],
        chainId: sepolia.id,
      }),
    );
  }

  function execute() {
    if (amountIn === null || address === undefined) return;
    if (action === "wrap") {
      void send("wrap", () =>
        writeContractAsync({
          address: UNISWAP.WETH9 as `0x${string}`,
          abi: weth9Abi,
          functionName: "deposit",
          value: amountIn,
          chainId: sepolia.id,
        }),
      );
      return;
    }
    if (action === "unwrap") {
      void send("unwrap", () =>
        writeContractAsync({
          address: UNISWAP.WETH9 as `0x${string}`,
          abi: weth9Abi,
          functionName: "withdraw",
          args: [amountIn],
          chainId: sepolia.id,
        }),
      );
      return;
    }
    if (minOut === null) return;
    if (action === "swap-to-eth") {
      // Swap leg pays WETH to the router itself (sentinel address(2)),
      // then unwrapWETH9 forwards native ETH to the user — one signature.
      const swapCall = encodeFunctionData({
        abi: swapRouterAbi,
        functionName: "exactInputSingle",
        args: [
          {
            tokenIn: erc20For(from).address as `0x${string}`,
            tokenOut: erc20For(to).address as `0x${string}`,
            fee: POOL_FEE,
            recipient: ROUTER_ADDRESS_THIS,
            amountIn,
            amountOutMinimum: minOut,
            sqrtPriceLimitX96: 0n,
          },
        ],
      });
      const unwrapCall = encodeFunctionData({
        abi: swapRouterAbi,
        functionName: "unwrapWETH9",
        args: [minOut, address],
      });
      void send("swap", () =>
        writeContractAsync({
          address: UNISWAP.SWAP_ROUTER_02 as `0x${string}`,
          abi: swapRouterAbi,
          functionName: "multicall",
          args: [[swapCall, unwrapCall]],
          chainId: sepolia.id,
        }),
      );
      return;
    }
    void send("swap", () =>
      writeContractAsync({
        address: UNISWAP.SWAP_ROUTER_02 as `0x${string}`,
        abi: swapRouterAbi,
        functionName: "exactInputSingle",
        args: [
          {
            tokenIn: erc20For(from).address as `0x${string}`,
            tokenOut: erc20For(to).address as `0x${string}`,
            fee: POOL_FEE,
            recipient: address,
            amountIn,
            amountOutMinimum: minOut,
            sqrtPriceLimitX96: 0n,
          },
        ],
        value: action === "swap-eth-in" ? amountIn : undefined,
        chainId: sepolia.id,
      }),
    );
  }

  // ----- button state -----
  const insufficient =
    amountIn !== null && fromBalance !== null && amountIn > fromBalance;
  const busy = writing || receipt.isLoading;

  let button: { label: string; onClick?: () => void; disabled: boolean };
  if (!isConnected) {
    button = { label: "Connect wallet", onClick: openConnectModal, disabled: false };
  } else if (wrongChain) {
    button = {
      label: "Switch to Sepolia",
      onClick: () => switchChain({ chainId: sepolia.id }),
      disabled: false,
    };
  } else if (amountIn === null) {
    button = { label: "Enter an amount", disabled: true };
  } else if (insufficient) {
    button = { label: `Insufficient ${from} balance`, disabled: true };
  } else if (busy) {
    button = { label: receipt.isLoading ? "Confirming…" : "Confirm in wallet…", disabled: true };
  } else if (allowanceLoading) {
    button = { label: "Checking allowance…", disabled: true };
  } else if (needsApproval) {
    button = { label: `Approve ${from}`, onClick: approve, disabled: false };
  } else if (action !== "wrap" && action !== "unwrap" && amountOut === null) {
    button = { label: quoting ? "Fetching quote…" : "No quote", disabled: true };
  } else {
    const labels: Record<Action, string> = {
      wrap: "Wrap ETH",
      unwrap: "Unwrap WETH",
      "swap-eth-in": "Swap",
      "swap-erc20": "Swap",
      "swap-to-eth": "Swap",
    };
    button = { label: labels[action], onClick: execute, disabled: false };
  }

  function flip() {
    setFrom(to);
    setTo(from);
    setAmountText("");
  }

  function pick(side: "from" | "to", symbol: SwapSymbol) {
    if (side === "from") {
      if (symbol === to) setTo(from);
      setFrom(symbol);
    } else {
      if (symbol === from) setFrom(to);
      setTo(symbol);
    }
    setConfirmedTx(undefined);
  }

  const rate =
    amountIn !== null && amountOut !== null && amountIn > 0n
      ? Number(formatUnits(amountOut, DECIMALS)) /
        Number(formatUnits(amountIn, DECIMALS))
      : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Medallion glyph="p2" color="violet" />
          <h1 className="text-xl font-semibold tracking-tight">Swap</h1>
        </div>
        <ConnectButton
          accountStatus="address"
          chainStatus="icon"
          showBalance={false}
        />
      </div>

      <div className="rounded-xl border border-edge bg-surface p-4">
        {/* You pay */}
        <div className="rounded-lg bg-surface-2 p-3">
          <div className="flex items-center justify-between text-xs text-ink-3">
            <span>You pay</span>
            {isConnected && fromBalance !== null && (
              <button
                type="button"
                className="hover:text-ink-2"
                onClick={() => {
                  // Native ETH max-fill keeps a gas reserve — sending the
                  // full balance as value can never pay for its own gas.
                  const max =
                    from === "ETH"
                      ? fromBalance > GAS_RESERVE
                        ? fromBalance - GAS_RESERVE
                        : 0n
                      : fromBalance;
                  setAmountText(max > 0n ? formatUnits(max, DECIMALS) : "");
                }}
              >
                Balance: {fmt(fromBalance)} {from}
              </button>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <input
              inputMode="decimal"
              placeholder="0.0"
              value={amountText}
              onChange={(e) => {
                if (AMOUNT_PATTERN.test(e.target.value))
                  setAmountText(e.target.value);
              }}
              className="tnum min-w-0 flex-1 bg-transparent text-2xl font-medium text-ink outline-none placeholder:text-ink-3"
              aria-label="Amount to pay"
            />
            <TokenSelect side="from" value={from} onChange={pick} />
          </div>
        </div>

        {/* flip */}
        <div className="relative z-10 -my-2.5 flex justify-center">
          <button
            type="button"
            onClick={flip}
            aria-label="Flip tokens"
            className="rounded-lg border border-edge bg-surface px-2.5 py-1 text-ink-2 transition-colors hover:text-ink"
          >
            ↓↑
          </button>
        </div>

        {/* You receive */}
        <div className="rounded-lg bg-surface-2 p-3">
          <div className="text-xs text-ink-3">You receive (estimated)</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="tnum min-w-0 flex-1 truncate text-2xl font-medium text-ink">
              {amountOut !== null ? fmt(amountOut) : quoting ? "…" : "0.0"}
            </span>
            <TokenSelect side="to" value={to} onChange={pick} />
          </div>
        </div>

        {/* slippage + details */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-ink-3">Slippage</span>
          <div className="flex gap-1">
            {SLIPPAGE_PRESETS_BPS.map((bps) => (
              <button
                key={bps}
                type="button"
                onClick={() => setSlippageBps(bps)}
                className={`rounded-full px-2.5 py-1 ${
                  slippageBps === bps
                    ? "border border-edge bg-surface-2 text-ink"
                    : "text-ink-3 hover:text-ink-2"
                }`}
              >
                {(bps / 100).toFixed(1)}%
              </button>
            ))}
          </div>
        </div>

        {minOut !== null && action !== "wrap" && action !== "unwrap" && (
          <dl className="mt-3 flex flex-col gap-1 border-t border-edge pt-3 text-xs text-ink-2">
            <div className="flex justify-between">
              <dt>Rate</dt>
              <dd className="tnum">
                {rate !== null
                  ? `1 ${from} ≈ ${rate.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${to}`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Minimum received</dt>
              <dd className="tnum">
                {fmt(minOut)} {to}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Pool fee</dt>
              <dd className="tnum">{POOL_FEE / 10_000}%</dd>
            </div>
          </dl>
        )}

        <button
          type="button"
          onClick={button.onClick}
          disabled={button.disabled}
          className="mt-4 w-full rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {button.label}
        </button>
      </div>

      {(quoteError || txError) && (
        <div
          role="alert"
          className="rounded-xl border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-ink"
        >
          {quoteError ?? txError}
        </div>
      )}

      {pendingTx && (
        <div className="rounded-xl border border-edge bg-surface px-4 py-3 text-sm text-ink-2">
          Waiting for confirmation…{" "}
          <TxLink hash={pendingTx.hash}>View on Etherscan</TxLink>
        </div>
      )}

      {confirmedTx && (
        <div className="rounded-xl border border-positive/40 bg-positive/10 px-4 py-3 text-sm text-ink">
          {confirmedTx.kind === "approve"
            ? "Approval confirmed — you can now swap. "
            : confirmedTx.kind === "wrap"
              ? "Wrapped. "
              : confirmedTx.kind === "unwrap"
                ? "Unwrapped. "
                : "Swap confirmed. "}
          <TxLink hash={confirmedTx.hash}>View on Etherscan</TxLink>
        </div>
      )}

      <p className="text-center text-xs text-ink-3">
        Sepolia testnet — tokens here have no real value. Need test ETH? Use a{" "}
        <a
          href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-2 hover:text-ink"
        >
          Sepolia faucet
        </a>
        .
      </p>
    </div>
  );
}

function TokenSelect({
  side,
  value,
  onChange,
}: {
  side: "from" | "to";
  value: SwapSymbol;
  onChange: (side: "from" | "to", symbol: SwapSymbol) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(side, e.target.value as SwapSymbol)}
      aria-label={side === "from" ? "Token to pay" : "Token to receive"}
      className="rounded-lg border border-edge bg-surface px-2 py-1.5 text-sm font-medium text-ink outline-none"
    >
      {SWAP_SYMBOLS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

function TxLink({
  hash,
  children,
}: {
  hash: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`https://sepolia.etherscan.io/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-edge underline-offset-2 hover:text-ink"
    >
      {children}
    </a>
  );
}
