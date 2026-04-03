// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/StakingPool.sol";

contract DeployStaking is Script {
    function run() external {
        vm.startBroadcast();

        // rewardRate = 1 wei per second (you can change this)
        new StakingPool(1);

        vm.stopBroadcast();
    }
}