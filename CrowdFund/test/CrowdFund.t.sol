// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CrowdFund} from "../src/CrowdFund.sol";

contract CrowdFundTest is Test {

    CrowdFund public crowdFund;

    // ── Test Actors ──
    address public alice = makeAddr("alice"); // campaign creator
    address public bob   = makeAddr("bob");   // backer 1
    address public carol = makeAddr("carol"); // backer 2

    // ── Common values ──
    uint256 constant GOAL     = 10 ether;
    uint256 constant DURATION = 7 days;

    // ─────────────────────────────────────────────────────────────
    //  Setup
    // ─────────────────────────────────────────────────────────────

    function setUp() public {
        crowdFund = new CrowdFund();

        vm.deal(alice, 20 ether);
        vm.deal(bob,   20 ether);
        vm.deal(carol, 20 ether);
    }

    // ─────────────────────────────────────────────────────────────
    //  1. create() Tests
    // ─────────────────────────────────────────────────────────────

    /// @notice A campaign can be created successfully
    function test_CreateCampaign() public {
        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        (address owner, uint256 goal, uint256 pledged, , uint256 endAt, bool claimed) =
            crowdFund.campaigns(1);

        assertEq(crowdFund.campaignCount(), 1);
        assertEq(owner, alice);
        assertEq(goal, GOAL);
        assertEq(pledged, 0);
        assertEq(endAt, block.timestamp + DURATION);
        assertEq(claimed, false);
    }

    /// @notice Campaign count increments with each new campaign
    function test_CampaignCountIncrements() public {
        vm.startPrank(alice);
        crowdFund.create(GOAL, DURATION);
        crowdFund.create(GOAL, DURATION);
        crowdFund.create(GOAL, DURATION);
        vm.stopPrank();

        assertEq(crowdFund.campaignCount(), 3);
    }

    /// @notice Multiple users can create campaigns
    function test_MultipleUsersCanCreateCampaigns() public {
        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        vm.prank(bob);
        crowdFund.create(5 ether, 3 days);

        (address owner1, , , , , ) = crowdFund.campaigns(1);
        (address owner2, , , , , ) = crowdFund.campaigns(2);

        assertEq(owner1, alice);
        assertEq(owner2, bob);
    }

    // ─────────────────────────────────────────────────────────────
    //  2. pledge() Tests
    // ─────────────────────────────────────────────────────────────

    /// @notice A backer can pledge ETH to a campaign
    function test_PledgeSucceeds() public {
        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        vm.prank(bob);
        crowdFund.pledge{value: 3 ether}(1);

        (, , uint256 pledged, , , ) = crowdFund.campaigns(1);
        assertEq(pledged, 3 ether);
        assertEq(crowdFund.pledgedAmount(1, bob), 3 ether);
    }

    /// @notice Multiple backers can pledge to the same campaign
    function test_MultiplePledges() public {
        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        vm.prank(bob);
        crowdFund.pledge{value: 6 ether}(1);

        vm.prank(carol);
        crowdFund.pledge{value: 4 ether}(1);

        (, , uint256 pledged, , , ) = crowdFund.campaigns(1);
        assertEq(pledged, 10 ether);
        assertEq(crowdFund.pledgedAmount(1, bob), 6 ether);
        assertEq(crowdFund.pledgedAmount(1, carol), 4 ether);
    }

    /// @notice Pledging after campaign ends should revert
    function test_PledgeAfterEndReverts() public {
        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        // Fast forward past end
        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(bob);
        vm.expectRevert("Campaign has ended");
        crowdFund.pledge{value: 1 ether}(1);
    }

    /// @notice Pledging zero ETH should revert
    function test_PledgeZeroReverts() public {
        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        vm.prank(bob);
        vm.expectRevert("Must send ETH");
        crowdFund.pledge{value: 0}(1);
    }

    // ─────────────────────────────────────────────────────────────
    //  3. claim() Tests
    // ─────────────────────────────────────────────────────────────

    /// @notice Owner can claim funds after goal is reached
    function test_ClaimSucceeds() public {
        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        vm.prank(bob);
        crowdFund.pledge{value: 10 ether}(1);

        // Fast forward past end
        vm.warp(block.timestamp + DURATION + 1);

        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        crowdFund.claim(1);

        assertEq(alice.balance - aliceBefore, 10 ether);

        (, , , , , bool claimed) = crowdFund.campaigns(1);
        assertEq(claimed, true);
    }

    /// @notice Non-owner cannot claim
    function test_ClaimByNonOwnerReverts() public {
        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        vm.prank(bob);
        crowdFund.pledge{value: 10 ether}(1);

        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(bob);
        vm.expectRevert("Not campaign owner");
        crowdFund.claim(1);
    }

    /// @notice Cannot claim before campaign ends
    function test_ClaimBeforeEndReverts() public {
        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        vm.prank(bob);
        crowdFund.pledge{value: 10 ether}(1);

        vm.prank(alice);
        vm.expectRevert("Campaign not ended yet");
        crowdFund.claim(1);
    }

    /// @notice Cannot claim if goal not reached
    function test_ClaimGoalNotReachedReverts() public {
        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        vm.prank(bob);
        crowdFund.pledge{value: 3 ether}(1); // only 3 of 10 ETH

        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(alice);
        vm.expectRevert("Goal not reached");
        crowdFund.claim(1);
    }

    /// @notice Cannot claim twice
    function test_ClaimTwiceReverts() public {
        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        vm.prank(bob);
        crowdFund.pledge{value: 10 ether}(1);

        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(alice);
        crowdFund.claim(1);

        vm.prank(alice);
        vm.expectRevert("Already claimed");
        crowdFund.claim(1);
    }

    // ─────────────────────────────────────────────────────────────
    //  4. refund() Tests
    // ─────────────────────────────────────────────────────────────

    /// @notice Backer gets refund if goal not reached
    function test_RefundSucceeds() public {
        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        vm.prank(bob);
        crowdFund.pledge{value: 3 ether}(1); // goal not reached

        vm.warp(block.timestamp + DURATION + 1);

        uint256 bobBefore = bob.balance;
        vm.prank(bob);
        crowdFund.refund(1);

        assertEq(bob.balance - bobBefore, 3 ether);
        assertEq(crowdFund.pledgedAmount(1, bob), 0);
    }

    /// @notice Cannot refund before campaign ends
    function test_RefundBeforeEndReverts() public {
        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        vm.prank(bob);
        crowdFund.pledge{value: 3 ether}(1);

        vm.prank(bob);
        vm.expectRevert("Campaign not ended yet");
        crowdFund.refund(1);
    }

    /// @notice Cannot refund if goal was reached
    function test_RefundGoalReachedReverts() public {
        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        vm.prank(bob);
        crowdFund.pledge{value: 10 ether}(1);

        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(bob);
        vm.expectRevert("Goal was reached, no refund");
        crowdFund.refund(1);
    }

    /// @notice Cannot refund if nothing was pledged
    function test_RefundNothingPledgedReverts() public {
        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(bob);
        vm.expectRevert("Nothing to refund");
        crowdFund.refund(1);
    }

    /// @notice Multiple backers can each get their own refund
    function test_MultipleRefunds() public {
        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        vm.prank(bob);
        crowdFund.pledge{value: 3 ether}(1);

        vm.prank(carol);
        crowdFund.pledge{value: 4 ether}(1);

        vm.warp(block.timestamp + DURATION + 1);

        uint256 bobBefore   = bob.balance;
        uint256 carolBefore = carol.balance;

        vm.prank(bob);
        crowdFund.refund(1);

        vm.prank(carol);
        crowdFund.refund(1);

        assertEq(bob.balance - bobBefore, 3 ether);
        assertEq(carol.balance - carolBefore, 4 ether);
    }

    // ─────────────────────────────────────────────────────────────
    //  5. Fuzz Tests
    // ─────────────────────────────────────────────────────────────

    /// @notice Fuzz: any valid pledge updates balances correctly
    function testFuzz_PledgeUpdatesCorrectly(uint256 amount) public {
        amount = bound(amount, 0.001 ether, 10 ether);

        vm.prank(alice);
        crowdFund.create(GOAL, DURATION);

        vm.deal(bob, amount);
        vm.prank(bob);
        crowdFund.pledge{value: amount}(1);

        assertEq(crowdFund.pledgedAmount(1, bob), amount);
    }
}