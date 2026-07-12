"use client";

import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import {
  STAKE_ADDRESSES,
  APR_BPS,
  BPS_DENOMINATOR,
  SECONDS_PER_YEAR,
  FAUCET_COOLDOWN_SECONDS,
  bochiCreditsAbi,
  stakingVaultAbi,
  stakeDeployed,
} from "@/lib/stake/constants";
import { Medallion } from "@/components/landing/glyphs";

const DECIMALS = 18;
const AMOUNT_PATTERN = /^\d*\.?\d{0,18}$/;

const TOKEN = STAKE_ADDRESSES.BOCHI_CREDITS as `0x${string}`;
const VAULT = STAKE_ADDRESSES.STAKING_VAULT as `0x${string}`;

type TxKind = "faucet" | "approve" | "stake" | "withdraw" | "claim" | "exit";

function fmt(amount: bigint, maxFraction = 4): string {
  const n = Number(formatUnits(amount, DECIMALS));
  if (n === 0) return "0";
  if (n > 0 && n < 0.0001) return "<0.0001";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: maxFraction,
  }).format(n);
}

/** Pending rewards ticking forward locally between chain reads. */
function tickingRewards(
  staked: bigint,
  rewardsAccrued: bigint,
  lastUpdate: bigint,
  nowMs: number,
): bigint {
  const elapsed = BigInt(Math.max(0, Math.floor(nowMs / 1000) - Number(lastUpdate)));
  return (
    rewardsAccrued + (staked * APR_BPS * elapsed) / (BPS_DENOMINATOR * SECONDS_PER_YEAR)
  );
}

export default function StakeWidget() {
  const { address, chainId, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();

  const [stakeText, setStakeText] = useState("");
  const [withdrawText, setWithdrawText] = useState("");
  const [txError, setTxError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const wrongChain = isConnected && chainId !== sepolia.id;
  const enabled = isConnected && !wrongChain && stakeDeployed();

  // ----- chain reads -----
  const balance = useReadContract({
    address: TOKEN,
    abi: bochiCreditsAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: { enabled },
  });
  const allowance = useReadContract({
    address: TOKEN,
    abi: bochiCreditsAbi,
    functionName: "allowance",
    args: address ? [address, VAULT] : undefined,
    chainId: sepolia.id,
    query: { enabled },
  });
  const lastFaucetClaim = useReadContract({
    address: TOKEN,
    abi: bochiCreditsAbi,
    functionName: "lastFaucetClaim",
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: { enabled },
  });
  const position = useReadContract({
    address: VAULT,
    abi: stakingVaultAbi,
    functionName: "positions",
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: { enabled },
  });
  const totalStaked = useReadContract({
    address: VAULT,
    abi: stakingVaultAbi,
    functionName: "totalStaked",
    chainId: sepolia.id,
    query: { enabled: stakeDeployed() },
  });

  const [staked, rewardsAccrued, lastUpdate] = (position.data as
    | readonly [bigint, bigint, bigint]
    | undefined) ?? [0n, 0n, 0n];
  const walletBalance = (balance.data as bigint | undefined) ?? 0n;

  // ----- live accrual tick (1s local clock; chain reads stay authoritative) -----
  useEffect(() => {
    if (!enabled || staked === 0n) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, [enabled, staked]);

  const pending = tickingRewards(staked, rewardsAccrued, lastUpdate, nowMs);

  // ----- faucet cooldown -----
  const lastClaim = Number((lastFaucetClaim.data as bigint | undefined) ?? 0n);
  const faucetReadyAt = (lastClaim + FAUCET_COOLDOWN_SECONDS) * 1000;
  const faucetReady = nowMs >= faucetReadyAt;
  const faucetWaitMin = Math.max(0, Math.ceil((faucetReadyAt - nowMs) / 60000));

  // ----- amounts -----
  const parseAmount = (text: string): bigint | null => {
    if (!AMOUNT_PATTERN.test(text) || text === "" || text === ".") return null;
    try {
      const v = parseUnits(text, DECIMALS);
      return v > 0n ? v : null;
    } catch {
      return null;
    }
  };
  const stakeAmount = parseAmount(stakeText);
  const withdrawAmount = parseAmount(withdrawText);
  const needsApproval =
    stakeAmount !== null &&
    ((allowance.data as bigint | undefined) ?? 0n) < stakeAmount;

  // ----- transactions -----
  const { writeContractAsync, isPending: writing } = useWriteContract();
  const [pendingTx, setPendingTx] = useState<
    { hash: `0x${string}`; kind: TxKind } | undefined
  >();
  const [confirmedTx, setConfirmedTx] = useState<
    { hash: `0x${string}`; kind: TxKind } | undefined
  >();
  const receipt = useWaitForTransactionReceipt({ hash: pendingTx?.hash });

  useEffect(() => {
    if (!pendingTx || (!receipt.isSuccess && !receipt.isError)) return;
    const success = receipt.isSuccess;
    const tx = pendingTx;
    const id = window.setTimeout(() => {
      if (success) {
        setConfirmedTx(tx);
        if (tx.kind === "stake" || tx.kind === "exit") setStakeText("");
        if (tx.kind === "withdraw" || tx.kind === "exit") setWithdrawText("");
        void balance.refetch();
        void allowance.refetch();
        void position.refetch();
        void totalStaked.refetch();
        void lastFaucetClaim.refetch();
      } else {
        setTxError("Transaction failed or was dropped. Check Etherscan and retry.");
      }
      setPendingTx(undefined);
    }, 0);
    return () => window.clearTimeout(id);
    // refetch functions are stable enough for this effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess, receipt.isError, pendingTx]);

  const busy = writing || receipt.isLoading;

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

  const faucet = () =>
    send("faucet", () =>
      writeContractAsync({
        address: TOKEN,
        abi: bochiCreditsAbi,
        functionName: "faucet",
        chainId: sepolia.id,
      }),
    );
  const approve = () =>
    stakeAmount !== null &&
    send("approve", () =>
      writeContractAsync({
        address: TOKEN,
        abi: bochiCreditsAbi,
        functionName: "approve",
        args: [VAULT, stakeAmount],
        chainId: sepolia.id,
      }),
    );
  const stake = () =>
    stakeAmount !== null &&
    send("stake", () =>
      writeContractAsync({
        address: VAULT,
        abi: stakingVaultAbi,
        functionName: "stake",
        args: [stakeAmount],
        chainId: sepolia.id,
      }),
    );
  const withdraw = () =>
    withdrawAmount !== null &&
    send("withdraw", () =>
      writeContractAsync({
        address: VAULT,
        abi: stakingVaultAbi,
        functionName: "withdraw",
        args: [withdrawAmount],
        chainId: sepolia.id,
      }),
    );
  const claim = () =>
    send("claim", () =>
      writeContractAsync({
        address: VAULT,
        abi: stakingVaultAbi,
        functionName: "claim",
        chainId: sepolia.id,
      }),
    );
  const exitAll = () =>
    send("exit", () =>
      writeContractAsync({
        address: VAULT,
        abi: stakingVaultAbi,
        functionName: "exit",
        chainId: sepolia.id,
      }),
    );

  if (!stakeDeployed()) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-dashed border-edge px-6 py-12 text-center text-sm text-ink-3">
        Staking contracts are being deployed to Sepolia — check back shortly.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Medallion glyph="p3" color="ember" />
          <h1 className="text-xl font-semibold tracking-tight">Stake</h1>
        </div>
        <ConnectButton
          accountStatus="address"
          chainStatus="icon"
          showBalance={false}
        />
      </div>

      {/* stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Your staked" value={`${fmt(staked)} BWC`} />
        <Stat
          label="Pending rewards"
          value={`${fmt(pending, 8)} BWC`}
          highlight={pending > 0n}
        />
        <Stat label="Wallet balance" value={`${fmt(walletBalance)} BWC`} />
        <Stat
          label="Vault total · APR"
          value={`${fmt((totalStaked.data as bigint | undefined) ?? 0n, 0)} · 10%`}
        />
      </div>

      {!isConnected ? (
        <button
          type="button"
          onClick={openConnectModal}
          className="w-full rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Connect wallet
        </button>
      ) : wrongChain ? (
        <button
          type="button"
          onClick={() => switchChain({ chainId: sepolia.id })}
          className="w-full rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Switch to Sepolia
        </button>
      ) : (
        <>
          {/* faucet */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-edge bg-surface p-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Need tokens?</span>
              <span className="text-xs text-ink-3">
                The faucet mints you 100 BWC once a day — demo tokens, no value.
              </span>
            </div>
            <button
              type="button"
              onClick={faucet}
              disabled={busy || !faucetReady}
              className="rounded-xl border border-accent/50 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {faucetReady ? "Get 100 BWC" : `Faucet in ~${faucetWaitMin}m`}
            </button>
          </div>

          {/* stake / withdraw */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-xl border border-edge bg-surface p-4">
              <div className="flex items-center justify-between text-xs text-ink-3">
                <span className="text-sm font-medium text-ink">Stake</span>
                <button
                  type="button"
                  className="hover:text-ink-2"
                  onClick={() =>
                    setStakeText(formatUnits(walletBalance, DECIMALS))
                  }
                >
                  Max: {fmt(walletBalance)}
                </button>
              </div>
              <input
                inputMode="decimal"
                placeholder="0.0"
                value={stakeText}
                onChange={(e) => {
                  if (AMOUNT_PATTERN.test(e.target.value))
                    setStakeText(e.target.value);
                }}
                className="tnum w-full rounded-lg bg-surface-2 px-3 py-2 text-lg font-medium text-ink outline-none placeholder:text-ink-3"
                aria-label="Amount to stake"
              />
              <button
                type="button"
                onClick={needsApproval ? approve : stake}
                disabled={
                  busy ||
                  stakeAmount === null ||
                  stakeAmount > walletBalance
                }
                className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy
                  ? "Confirming…"
                  : stakeAmount !== null && stakeAmount > walletBalance
                    ? "Insufficient BWC"
                    : needsApproval
                      ? "Approve BWC"
                      : "Stake"}
              </button>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-edge bg-surface p-4">
              <div className="flex items-center justify-between text-xs text-ink-3">
                <span className="text-sm font-medium text-ink">Withdraw</span>
                <button
                  type="button"
                  className="hover:text-ink-2"
                  onClick={() => setWithdrawText(formatUnits(staked, DECIMALS))}
                >
                  Max: {fmt(staked)}
                </button>
              </div>
              <input
                inputMode="decimal"
                placeholder="0.0"
                value={withdrawText}
                onChange={(e) => {
                  if (AMOUNT_PATTERN.test(e.target.value))
                    setWithdrawText(e.target.value);
                }}
                className="tnum w-full rounded-lg bg-surface-2 px-3 py-2 text-lg font-medium text-ink outline-none placeholder:text-ink-3"
                aria-label="Amount to withdraw"
              />
              <button
                type="button"
                onClick={withdraw}
                disabled={
                  busy || withdrawAmount === null || withdrawAmount > staked
                }
                className="w-full rounded-xl border border-edge bg-surface-2 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy
                  ? "Confirming…"
                  : withdrawAmount !== null && withdrawAmount > staked
                    ? "More than staked"
                    : "Withdraw"}
              </button>
            </div>
          </div>

          {/* claim / exit */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-edge bg-surface p-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                Rewards:{" "}
                <span className="tnum text-neon-ember">{fmt(pending, 8)} BWC</span>
              </span>
              <span className="text-xs text-ink-3">
                Accruing live at 10% APR — minted on claim, never taken from
                your principal.
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={claim}
                disabled={busy || pending === 0n}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Claim
              </button>
              <button
                type="button"
                onClick={exitAll}
                disabled={busy || (staked === 0n && pending === 0n)}
                className="rounded-xl border border-edge px-4 py-2 text-sm font-semibold text-ink-2 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                title="Withdraw everything and claim rewards in one transaction"
              >
                Exit all
              </button>
            </div>
          </div>
        </>
      )}

      {txError && (
        <div
          role="alert"
          className="rounded-xl border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-ink"
        >
          {txError}
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
          {
            {
              faucet: "100 BWC minted to your wallet. ",
              approve: "Approval confirmed — you can now stake. ",
              stake: "Staked. Rewards start accruing immediately. ",
              withdraw: "Withdrawn. ",
              claim: "Rewards claimed. ",
              exit: "Exited — principal withdrawn and rewards claimed. ",
            }[confirmedTx.kind]
          }
          <TxLink hash={confirmedTx.hash}>View on Etherscan</TxLink>
        </div>
      )}

      <p className="text-center text-xs text-ink-3">
        Sepolia testnet — BWC is a demo token with no value. Contracts verified
        on Etherscan:{" "}
        <a
          href={`https://sepolia.etherscan.io/address/${STAKE_ADDRESSES.BOCHI_CREDITS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-2 hover:text-ink"
        >
          token
        </a>{" "}
        ·{" "}
        <a
          href={`https://sepolia.etherscan.io/address/${STAKE_ADDRESSES.STAKING_VAULT}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-2 hover:text-ink"
        >
          vault
        </a>
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-edge bg-surface px-3 py-2.5">
      <span className="text-[11px] uppercase tracking-wide text-ink-3">
        {label}
      </span>
      <span
        className={`tnum truncate text-sm font-semibold ${highlight ? "text-neon-ember" : "text-ink"}`}
      >
        {value}
      </span>
    </div>
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
