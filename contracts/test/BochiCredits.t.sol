// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {BochiCredits} from "../src/BochiCredits.sol";

contract BochiCreditsTest is Test {
    BochiCredits internal token;

    address internal admin = makeAddr("admin");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    function setUp() public {
        token = new BochiCredits(admin);
        // Faucet math assumes a sane non-zero start time.
        vm.warp(1_700_000_000);
    }

    function test_Metadata() public view {
        assertEq(token.name(), "Bochi Credits");
        assertEq(token.symbol(), "BWC");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), 0);
    }

    function test_FaucetMintsDrip() public {
        vm.prank(alice);
        token.faucet();
        assertEq(token.balanceOf(alice), token.FAUCET_DRIP());
        assertEq(token.lastFaucetClaim(alice), block.timestamp);
    }

    function test_FaucetEmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit BochiCredits.FaucetClaimed(alice, 100e18);
        vm.prank(alice);
        token.faucet();
    }

    function test_FaucetRevertsDuringCooldown() public {
        vm.startPrank(alice);
        token.faucet();
        uint256 nextClaimAt = block.timestamp + token.FAUCET_COOLDOWN();

        vm.expectRevert(
            abi.encodeWithSelector(BochiCredits.FaucetCooldownActive.selector, nextClaimAt)
        );
        token.faucet();

        // Still reverts one second before the cooldown ends.
        vm.warp(nextClaimAt - 1);
        vm.expectRevert(
            abi.encodeWithSelector(BochiCredits.FaucetCooldownActive.selector, nextClaimAt)
        );
        token.faucet();
        vm.stopPrank();
    }

    function test_FaucetWorksAgainAfterCooldown() public {
        vm.startPrank(alice);
        token.faucet();
        vm.warp(block.timestamp + token.FAUCET_COOLDOWN());
        token.faucet();
        vm.stopPrank();
        assertEq(token.balanceOf(alice), 2 * token.FAUCET_DRIP());
    }

    function test_FaucetCooldownsAreIndependentPerAccount() public {
        vm.prank(alice);
        token.faucet();
        vm.prank(bob);
        token.faucet();
        assertEq(token.balanceOf(alice), token.FAUCET_DRIP());
        assertEq(token.balanceOf(bob), token.FAUCET_DRIP());
    }

    function test_MintRequiresMinterRole() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                alice,
                token.MINTER_ROLE()
            )
        );
        vm.prank(alice);
        token.mint(alice, 1e18);
    }

    function test_MintWorksWithMinterRole() public {
        // Cache the role first — vm.prank would be consumed by the
        // MINTER_ROLE() view call instead of grantRole.
        bytes32 minterRole = token.MINTER_ROLE();
        vm.prank(admin);
        token.grantRole(minterRole, alice);
        vm.prank(alice);
        token.mint(bob, 42e18);
        assertEq(token.balanceOf(bob), 42e18);
    }

    function test_AdminCanRevokeMinter() public {
        vm.startPrank(admin);
        token.grantRole(token.MINTER_ROLE(), alice);
        token.revokeRole(token.MINTER_ROLE(), alice);
        vm.stopPrank();
        vm.expectRevert();
        vm.prank(alice);
        token.mint(alice, 1e18);
    }

    /// @dev The faucet is claimable exactly once per cooldown window,
    ///      regardless of when within the window it is retried.
    function testFuzz_FaucetCooldown(uint256 delay) public {
        delay = bound(delay, 0, 30 days);
        vm.startPrank(alice);
        token.faucet();
        vm.warp(block.timestamp + delay);
        if (delay < token.FAUCET_COOLDOWN()) {
            vm.expectRevert();
            token.faucet();
            assertEq(token.balanceOf(alice), token.FAUCET_DRIP());
        } else {
            token.faucet();
            assertEq(token.balanceOf(alice), 2 * token.FAUCET_DRIP());
        }
        vm.stopPrank();
    }
}
