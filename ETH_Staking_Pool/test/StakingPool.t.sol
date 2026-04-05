// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/StakingPool.sol";

contract StakingPoolTest is Test {
    StakingPool pool;

    function setUp() public {
        pool = new StakingPool(1); // 1 wei/sec
    }

    function testStake() public {
        vm.deal(address(this), 1 ether);

        pool.stake{value: 1 ether}();

        (uint256 amount,,) = pool.stakes(address(this));
        assertEq(amount, 1 ether);
    }

    function testRewardCalculation() public {
        vm.deal(address(this), 1 ether);

        pool.stake{value: 1 ether}();

        vm.warp(block.timestamp + 10);

        uint256 reward = pool.calculateReward(address(this));
        assertEq(reward, 10);
    }

    function testUnstake() public {
        vm.deal(address(this), 2 ether);

        pool.stake{value: 1 ether}();

        // fund contract for rewards
        payable(address(pool)).transfer(1 ether);

        vm.warp(block.timestamp + 10);

        pool.unstake();

        (uint256 amount,,bool claimed) = pool.stakes(address(this));

        assertEq(amount, 0);
        assertTrue(claimed);
    }
}