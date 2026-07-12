# Bochi Credits + StakingVault

Solidity contracts for Project 3 of the [defi.philbochi.com](https://defi.philbochi.com)
portfolio: a demo ERC-20 and a staking vault, built with Foundry.

> **Testnet only.** Bochi Credits (BWC) is a demo token with a public
> faucet. It carries no real-world value and no redemption rights.

## Contracts

- **`BochiCredits.sol`** — ERC-20 (`BWC`, 18 decimals) with:
  - `faucet()` — anyone can mint themselves 100 BWC once per day, so
    reviewers can try staking without asking for tokens
  - `MINTER_ROLE` (OpenZeppelin AccessControl) — granted to the vault so
    staking rewards are minted on claim
- **`StakingVault.sol`** — stake BWC, accrue a fixed **10% APR** (paid in
  BWC), withdraw any time:
  - Per-position accrual (`staked × rate × elapsed`), snapshotted on
    every interaction; floor rounding always favors the protocol
  - Rewards are **minted on claim** — principal in the vault is never
    used to pay yield
  - `exit()` withdraws the full position and claims in one call
  - Fixed-APR accounting is a deliberate demo simplification; the
    production-scale alternative (schedule-funded Synthetix-style reward
    distribution) is discussed in the NatSpec

## Deployed addresses (Sepolia)

Both contracts are verified — source is readable on Etherscan:

| Contract | Address |
|---|---|
| BochiCredits (BWC) | [`0x4b572ddcb6a0aa626bd36c78cf2fb827feab4aa8`](https://sepolia.etherscan.io/address/0x4b572ddcb6a0aa626bd36c78cf2fb827feab4aa8#code) |
| StakingVault | [`0x7d76cfbd9355d4ecc1842bca4d163a02c518ce9d`](https://sepolia.etherscan.io/address/0x7d76cfbd9355d4ecc1842bca4d163a02c518ce9d#code) |

Live UI: [defi.philbochi.com/stake](https://defi.philbochi.com/stake)

## Develop

```bash
forge build          # compile (solc 0.8.30, optimizer on)
forge test           # 35 tests: unit + fuzz (512 runs) + event assertions
forge test -vvv      # verbose traces
```

## Deploy (Sepolia)

Uses a throwaway, faucet-funded deployer key — never a real-value wallet.

```bash
export DEPLOYER_PRIVATE_KEY=0x...
forge script script/Deploy.s.sol --rpc-url "$SEPOLIA_RPC_URL" \
  --broadcast --verify --etherscan-api-key "$ETHERSCAN_API_KEY"
```

The script deploys both contracts and grants the vault `MINTER_ROLE` in
the same broadcast.
