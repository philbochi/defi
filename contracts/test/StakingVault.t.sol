// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BochiCredits} from "../src/BochiCredits.sol";
import {StakingVault} from "../src/StakingVault.sol";

contract StakingVaultTest is Test {
    BochiCredits internal token;
    StakingVault internal vault;

    address internal admin = makeAddr("admin");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    uint256 internal constant APR_BPS = 1_000;
    uint256 internal constant BPS = 10_000;
    uint256 internal constant YEAR = 365 days;

    function setUp() public {
        token = new BochiCredits(admin);
        vault = new StakingVault(token);

        vm.startPrank(admin);
        token.grantRole(token.MINTER_ROLE(), address(vault));
        // Test harness mints seed balances directly.
        token.grantRole(token.MINTER_ROLE(), address(this));
        vm.stopPrank();

        vm.warp(1_700_000_000);
    }

    function _fund(address who, uint256 amount) internal {
        token.mint(who, amount);
        vm.prank(who);
        token.approve(address(vault), type(uint256).max);
    }

    function _expectedReward(uint256 staked, uint256 elapsed)
        internal
        pure
        returns (uint256)
    {
        return (staked * APR_BPS * elapsed) / (BPS * YEAR);
    }

    // ----- stake -----

    function test_StakeTransfersAndRecords() public {
        _fund(alice, 100e18);
        vm.prank(alice);
        vault.stake(60e18);

        (uint256 staked,,) = vault.positions(alice);
        assertEq(staked, 60e18);
        assertEq(vault.totalStaked(), 60e18);
        assertEq(token.balanceOf(address(vault)), 60e18);
        assertEq(token.balanceOf(alice), 40e18);
    }

    function test_StakeEmitsEvent() public {
        _fund(alice, 10e18);
        vm.expectEmit(true, false, false, true);
        emit StakingVault.Staked(alice, 10e18);
        vm.prank(alice);
        vault.stake(10e18);
    }

    function test_WithdrawEmitsEvent() public {
        _fund(alice, 10e18);
        vm.startPrank(alice);
        vault.stake(10e18);
        vm.expectEmit(true, false, false, true);
        emit StakingVault.Withdrawn(alice, 4e18);
        vault.withdraw(4e18);
        vm.stopPrank();
    }

    function test_ClaimEmitsEvent() public {
        _fund(alice, 100e18);
        vm.prank(alice);
        vault.stake(100e18);
        vm.warp(block.timestamp + YEAR);
        vm.expectEmit(true, false, false, true);
        emit StakingVault.RewardsClaimed(alice, 10e18);
        vm.prank(alice);
        vault.claim();
    }

    function test_StakeZeroReverts() public {
        vm.expectRevert(StakingVault.ZeroAmount.selector);
        vm.prank(alice);
        vault.stake(0);
    }

    function test_StakeWithoutApprovalReverts() public {
        token.mint(alice, 10e18);
        vm.expectRevert();
        vm.prank(alice);
        vault.stake(10e18);
    }

    // ----- rewards accrual -----

    function test_AccruesTenPercentOverOneYear() public {
        _fund(alice, 100e18);
        vm.prank(alice);
        vault.stake(100e18);

        vm.warp(block.timestamp + YEAR);
        assertEq(vault.pendingRewards(alice), 10e18);
    }

    function test_AccruesProportionallyOverPartialPeriod() public {
        _fund(alice, 100e18);
        vm.prank(alice);
        vault.stake(100e18);

        vm.warp(block.timestamp + 30 days);
        assertEq(
            vault.pendingRewards(alice), _expectedReward(100e18, 30 days)
        );
    }

    function test_NoAccrualWithoutStake() public {
        assertEq(vault.pendingRewards(alice), 0);
        vm.warp(block.timestamp + YEAR);
        assertEq(vault.pendingRewards(alice), 0);
    }

    function test_AccrualSnapshotsAcrossRestakes() public {
        _fund(alice, 200e18);

        vm.prank(alice);
        vault.stake(100e18);
        vm.warp(block.timestamp + 100 days);

        // Second stake snapshots rewards earned on the first 100e18.
        vm.prank(alice);
        vault.stake(100e18);
        uint256 firstLeg = _expectedReward(100e18, 100 days);
        assertEq(vault.pendingRewards(alice), firstLeg);

        vm.warp(block.timestamp + 100 days);
        assertEq(
            vault.pendingRewards(alice),
            firstLeg + _expectedReward(200e18, 100 days)
        );
    }

    function test_AccrualStopsAfterFullWithdraw() public {
        _fund(alice, 100e18);
        vm.prank(alice);
        vault.stake(100e18);
        vm.warp(block.timestamp + 10 days);

        vm.prank(alice);
        vault.withdraw(100e18);
        uint256 frozen = vault.pendingRewards(alice);
        assertEq(frozen, _expectedReward(100e18, 10 days));

        vm.warp(block.timestamp + YEAR);
        assertEq(vault.pendingRewards(alice), frozen);
    }

    function test_PositionsAreIndependent() public {
        _fund(alice, 100e18);
        _fund(bob, 300e18);

        vm.prank(alice);
        vault.stake(100e18);
        vm.warp(block.timestamp + 50 days);
        vm.prank(bob);
        vault.stake(300e18);
        vm.warp(block.timestamp + 50 days);

        assertEq(vault.pendingRewards(alice), _expectedReward(100e18, 100 days));
        assertEq(vault.pendingRewards(bob), _expectedReward(300e18, 50 days));
    }

    // ----- withdraw -----

    function test_WithdrawPartialAndFull() public {
        _fund(alice, 100e18);
        vm.startPrank(alice);
        vault.stake(100e18);
        vault.withdraw(30e18);
        (uint256 staked,,) = vault.positions(alice);
        assertEq(staked, 70e18);
        vault.withdraw(70e18);
        vm.stopPrank();

        assertEq(token.balanceOf(alice), 100e18);
        assertEq(vault.totalStaked(), 0);
    }

    function test_WithdrawMoreThanStakedReverts() public {
        _fund(alice, 10e18);
        vm.startPrank(alice);
        vault.stake(10e18);
        vm.expectRevert(
            abi.encodeWithSelector(
                StakingVault.InsufficientStake.selector, 10e18, 11e18
            )
        );
        vault.withdraw(11e18);
        vm.stopPrank();
    }

    function test_WithdrawZeroReverts() public {
        vm.expectRevert(StakingVault.ZeroAmount.selector);
        vm.prank(alice);
        vault.withdraw(0);
    }

    // ----- claim -----

    function test_ClaimMintsRewards() public {
        _fund(alice, 100e18);
        vm.prank(alice);
        vault.stake(100e18);
        vm.warp(block.timestamp + YEAR);

        uint256 supplyBefore = token.totalSupply();
        vm.prank(alice);
        vault.claim();

        assertEq(token.balanceOf(alice), 10e18);
        // Rewards are minted, not paid from vault principal.
        assertEq(token.balanceOf(address(vault)), 100e18);
        assertEq(token.totalSupply(), supplyBefore + 10e18);
        assertEq(vault.pendingRewards(alice), 0);
    }

    function test_ClaimWithNothingAccruedReverts() public {
        vm.expectRevert(StakingVault.NothingToClaim.selector);
        vm.prank(alice);
        vault.claim();
    }

    function test_ClaimTwiceDoesNotDoublePay() public {
        _fund(alice, 100e18);
        vm.prank(alice);
        vault.stake(100e18);
        vm.warp(block.timestamp + YEAR);

        vm.startPrank(alice);
        vault.claim();
        vm.expectRevert(StakingVault.NothingToClaim.selector);
        vault.claim();
        vm.stopPrank();
    }

    // ----- exit -----

    function test_ExitWithdrawsAndClaims() public {
        _fund(alice, 100e18);
        vm.prank(alice);
        vault.stake(100e18);
        vm.warp(block.timestamp + YEAR);

        vm.prank(alice);
        vault.exit();

        assertEq(token.balanceOf(alice), 110e18);
        (uint256 staked, uint256 accrued,) = vault.positions(alice);
        assertEq(staked, 0);
        assertEq(accrued, 0);
        assertEq(vault.totalStaked(), 0);
    }

    function test_ExitClaimsFrozenRewardsAfterFullWithdraw() public {
        _fund(alice, 100e18);
        vm.prank(alice);
        vault.stake(100e18);
        vm.warp(block.timestamp + YEAR);

        // Full withdraw freezes 10e18 of accrued rewards with staked == 0.
        vm.prank(alice);
        vault.withdraw(100e18);
        vm.warp(block.timestamp + 30 days);

        // exit() must still claim the frozen rewards.
        vm.prank(alice);
        vault.exit();
        assertEq(token.balanceOf(alice), 110e18);
        (, uint256 accrued,) = vault.positions(alice);
        assertEq(accrued, 0);
    }

    function test_ExitWithNothingStakedIsNoop() public {
        vm.prank(alice);
        vault.exit();
        assertEq(vault.totalStaked(), 0);
    }

    /// @dev Accruing across many snapshots may floor-lose at most 1 wei per
    ///      snapshot versus a single lump accrual over the same period.
    function test_SnapshottedAccrualMatchesLumpWithinRounding() public {
        _fund(alice, 100e18 + 1);
        _fund(bob, 100e18);
        vm.prank(alice);
        vault.stake(100e18);
        vm.prank(bob);
        vault.stake(100e18);

        uint256 windows = 12;
        for (uint256 i = 0; i < windows; i++) {
            vm.warp(block.timestamp + 30 days);
            // Zero-net interaction forces an accrual snapshot for alice.
            vm.startPrank(alice);
            vault.withdraw(1);
            vault.stake(1);
            vm.stopPrank();
        }

        uint256 lump = vault.pendingRewards(bob);
        uint256 snapshotted = vault.pendingRewards(alice);
        assertLe(snapshotted, lump);
        assertApproxEqAbs(snapshotted, lump, windows);
    }

    // ----- fuzz -----

    function testFuzz_StakeWithdrawRoundTrip(uint256 amount) public {
        amount = bound(amount, 1, 1e27);
        _fund(alice, amount);
        vm.startPrank(alice);
        vault.stake(amount);
        vault.withdraw(amount);
        vm.stopPrank();
        assertEq(token.balanceOf(alice), amount);
        assertEq(vault.totalStaked(), 0);
    }

    function testFuzz_AccrualMatchesFormula(uint256 amount, uint256 elapsed)
        public
    {
        amount = bound(amount, 1, 1e27);
        elapsed = bound(elapsed, 0, 20 * YEAR);
        _fund(alice, amount);
        vm.prank(alice);
        vault.stake(amount);
        vm.warp(block.timestamp + elapsed);
        assertEq(vault.pendingRewards(alice), _expectedReward(amount, elapsed));
    }

    function testFuzz_TotalStakedTracksSumOfPositions(
        uint256 a,
        uint256 b,
        uint256 withdrawA
    ) public {
        a = bound(a, 1, 1e27);
        b = bound(b, 1, 1e27);
        withdrawA = bound(withdrawA, 1, a);

        _fund(alice, a);
        _fund(bob, b);
        vm.prank(alice);
        vault.stake(a);
        vm.prank(bob);
        vault.stake(b);
        vm.prank(alice);
        vault.withdraw(withdrawA);

        (uint256 stakedA,,) = vault.positions(alice);
        (uint256 stakedB,,) = vault.positions(bob);
        assertEq(vault.totalStaked(), stakedA + stakedB);
        assertEq(token.balanceOf(address(vault)), vault.totalStaked());
    }
}
