// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol" as std;
import {SavingsBank} from "../src/SavingBank.sol";

contract SavingsBankScript is Script {
    function run() external {
        vm.startBroadcast();
        new SavingsBank();
        vm.stopBroadcast();
    }
}