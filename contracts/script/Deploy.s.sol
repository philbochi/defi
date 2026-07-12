// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {BochiCredits} from "../src/BochiCredits.sol";
import {StakingVault} from "../src/StakingVault.sol";

/// @notice Deploys BochiCredits + StakingVault and wires the vault's
///         MINTER_ROLE. Sepolia usage:
///
///   forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL \
///     --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
///
/// Requires DEPLOYER_PRIVATE_KEY in the environment (throwaway key,
/// faucet-funded — never a real-value wallet).
contract Deploy is Script {
    function run() external returns (BochiCredits token, StakingVault vault) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);
        token = new BochiCredits(deployer);
        vault = new StakingVault(token);
        token.grantRole(token.MINTER_ROLE(), address(vault));
        vm.stopBroadcast();

        console.log("BochiCredits:", address(token));
        console.log("StakingVault:", address(vault));
    }
}
