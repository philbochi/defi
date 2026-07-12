// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title Bochi Credits (BWC)
/// @author Phil Bochi
/// @notice Demo/testnet ERC-20 for the defi.philbochi.com staking vault.
///         Anyone can mint themselves a fixed drip via {faucet} so reviewers
///         can try staking without asking for tokens. Testnet only — this
///         token carries no real-world value or redemption rights.
contract BochiCredits is ERC20, AccessControl {
    /// @notice Role allowed to mint arbitrary amounts (granted to the vault
    ///         so staking rewards can be minted on claim).
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Amount minted per faucet call.
    uint256 public constant FAUCET_DRIP = 100e18;

    /// @notice Minimum time between faucet calls per address.
    uint256 public constant FAUCET_COOLDOWN = 1 days;

    /// @notice Timestamp of each address's last faucet claim.
    mapping(address account => uint256 timestamp) public lastFaucetClaim;

    /// @notice The faucet was already used within {FAUCET_COOLDOWN}.
    /// @param nextClaimAt Earliest timestamp the caller may claim again.
    error FaucetCooldownActive(uint256 nextClaimAt);

    event FaucetClaimed(address indexed account, uint256 amount);

    constructor(address admin) ERC20("Bochi Credits", "BWC") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// @notice Mint yourself {FAUCET_DRIP} BWC, once per {FAUCET_COOLDOWN}.
    function faucet() external {
        uint256 nextClaimAt = lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN;
        if (block.timestamp < nextClaimAt) {
            revert FaucetCooldownActive(nextClaimAt);
        }
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_DRIP);
        emit FaucetClaimed(msg.sender, FAUCET_DRIP);
    }

    /// @notice Mint `amount` to `to`. Restricted to {MINTER_ROLE}.
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
