// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {BochiCredits} from "./BochiCredits.sol";

/// @title StakingVault
/// @author Phil Bochi
/// @notice Stake BWC, accrue a fixed 10% APR paid in BWC, withdraw any time.
///         Rewards are minted on claim (the vault holds {MINTER_ROLE} on the
///         token), so principal in the vault is never used to pay yield.
/// @dev Fixed-APR accrual is deliberate for this demo: each position accrues
///      independently (`staked × rate × elapsed`), snapshotted on every
///      interaction — simpler to reason about and test than schedule-funded
///      reward distribution (Synthetix-style), which is the production-scale
///      alternative.
contract StakingVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice The staked and reward token.
    BochiCredits public immutable token;

    /// @notice Annual yield in basis points (1000 = 10% APR).
    uint256 public constant APR_BPS = 1_000;

    uint256 private constant BPS_DENOMINATOR = 10_000;
    uint256 private constant SECONDS_PER_YEAR = 365 days;

    struct Position {
        /// @dev Principal currently staked.
        uint256 staked;
        /// @dev Rewards accrued up to `lastUpdate`, not yet claimed.
        uint256 rewardsAccrued;
        /// @dev Timestamp of the last accrual snapshot.
        uint64 lastUpdate;
    }

    /// @notice Per-account staking position.
    mapping(address account => Position) public positions;

    /// @notice Sum of all staked principal.
    uint256 public totalStaked;

    error ZeroAmount();
    error InsufficientStake(uint256 staked, uint256 requested);
    error NothingToClaim();

    event Staked(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event RewardsClaimed(address indexed account, uint256 amount);

    constructor(BochiCredits _token) {
        token = _token;
    }

    /// @notice Rewards `account` could claim right now.
    function pendingRewards(address account) public view returns (uint256) {
        Position storage p = positions[account];
        uint256 sinceUpdate = block.timestamp - p.lastUpdate;
        if (p.staked == 0) return p.rewardsAccrued;
        return p.rewardsAccrued
            + (p.staked * APR_BPS * sinceUpdate) / (BPS_DENOMINATOR * SECONDS_PER_YEAR);
    }

    /// @notice Stake `amount` BWC (requires prior approval).
    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        _accrue(msg.sender);
        positions[msg.sender].staked += amount;
        totalStaked += amount;
        IERC20(address(token)).safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    /// @notice Withdraw `amount` of staked principal.
    function withdraw(uint256 amount) public nonReentrant {
        if (amount == 0) revert ZeroAmount();
        Position storage p = positions[msg.sender];
        if (p.staked < amount) revert InsufficientStake(p.staked, amount);
        _accrue(msg.sender);
        p.staked -= amount;
        totalStaked -= amount;
        IERC20(address(token)).safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Claim all accrued rewards (minted, not paid from principal).
    function claim() public nonReentrant {
        _accrue(msg.sender);
        uint256 amount = positions[msg.sender].rewardsAccrued;
        if (amount == 0) revert NothingToClaim();
        positions[msg.sender].rewardsAccrued = 0;
        token.mint(msg.sender, amount);
        emit RewardsClaimed(msg.sender, amount);
    }

    /// @notice Withdraw the full position and claim rewards in one call.
    function exit() external {
        uint256 staked = positions[msg.sender].staked;
        if (staked > 0) withdraw(staked);
        if (pendingRewards(msg.sender) > 0) claim();
    }

    /// @dev Fold elapsed-time rewards into the stored position.
    function _accrue(address account) internal {
        Position storage p = positions[account];
        p.rewardsAccrued = pendingRewards(account);
        p.lastUpdate = uint64(block.timestamp);
    }
}
