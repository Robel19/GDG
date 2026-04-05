// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/LandRegistry.sol";

/**
 * @title DeployLandRegistry
 * @notice Foundry deployment script for Base Sepolia testnet.
 *
 * Default RPC is `eth_rpc_url` in foundry.toml (https://sepolia.base.org). Override with `--rpc-url`.
 *
 * Usage:
 *   forge script script/Deploy.s.sol:DeployLandRegistry \
 *     --private-key $DEPLOYER_PRIVATE_KEY \
 *     --broadcast \
 *     --verify \
 *     --etherscan-api-key $BASESCAN_API_KEY \
 *     -vvvv
 */
contract DeployLandRegistry is Script {

    function run() external returns (LandRegistry registry) {
        address admin = vm.envOr("ADMIN_ADDRESS", msg.sender);

        console.log("=== Land Registry Deployment ===");
        console.log("Chain ID     :", block.chainid);
        console.log("Deployer     :", msg.sender);
        console.log("Admin        :", admin);

        vm.startBroadcast();
        registry = new LandRegistry(admin);
        vm.stopBroadcast();

        console.log("Deployed to  :", address(registry));
        console.log("NEXT_PUBLIC_LAND_REGISTRY_ADDRESS=", address(registry));
    }
}
