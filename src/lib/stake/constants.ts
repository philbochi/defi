/**
 * Bochi Credits + StakingVault (Sepolia). Addresses are filled in by the
 * deploy step (contracts/script/Deploy.s.sol) — both contracts are
 * verified on Etherscan.
 */

import { parseAbi } from "viem";

/** Deployed 2026-07-12, verified on sepolia.etherscan.io. */
export const STAKE_ADDRESSES: {
  BOCHI_CREDITS: `0x${string}`;
  STAKING_VAULT: `0x${string}`;
} = {
  BOCHI_CREDITS: "0x4b572ddcb6a0aa626bd36c78cf2fb827feab4aa8",
  STAKING_VAULT: "0x7d76cfbd9355d4ecc1842bca4d163a02c518ce9d",
};

export const APR_BPS = 1_000n;
export const BPS_DENOMINATOR = 10_000n;
export const SECONDS_PER_YEAR = 365n * 24n * 60n * 60n;
export const FAUCET_DRIP = 100n * 10n ** 18n;
export const FAUCET_COOLDOWN_SECONDS = 24 * 60 * 60;

export const bochiCreditsAbi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function faucet()",
  "function lastFaucetClaim(address account) view returns (uint256)",
  "error FaucetCooldownActive(uint256 nextClaimAt)",
]);

export const stakingVaultAbi = parseAbi([
  "function stake(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function claim()",
  "function exit()",
  "function positions(address account) view returns (uint256 staked, uint256 rewardsAccrued, uint64 lastUpdate)",
  "function pendingRewards(address account) view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "error ZeroAmount()",
  "error InsufficientStake(uint256 staked, uint256 requested)",
  "error NothingToClaim()",
]);

export function stakeDeployed(): boolean {
  return (
    STAKE_ADDRESSES.BOCHI_CREDITS !==
    "0x0000000000000000000000000000000000000000"
  );
}
