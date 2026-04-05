// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CrowdFund} from "../src/CrowdFund.sol";

/**
 * @title DeployCrowdFund
 * @notice Deployment script for CrowdFund contract
 *
 * Usage:
 *   # 1. Start local blockchain in another terminal:
 *   anvil
 *
 *   # 2. Deploy locally:
 *   forge script script/DeployCrowdFund.s.sol \
 *     --rpc-url http://127.0.0.1:8545 \
 *     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
 *     --broadcast \
 *     -vvvv
 */
contract DeployCrowdFund is Script {
    function run() external returns (CrowdFund crowdFund) {
        vm.startBroadcast();

        crowdFund = new CrowdFund();

        vm.stopBroadcast();

        console.log("===========================================");
        console.log("  CrowdFund deployed successfully!");
        console.log("===========================================");
        console.log("  Contract address :", address(crowdFund));
        console.log("  Campaign count   :", crowdFund.campaignCount());
        console.log("===========================================");
    }
}