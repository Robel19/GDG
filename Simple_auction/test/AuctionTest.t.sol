// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SimpleAuction.sol";

contract AuctionTest is Test {

    SimpleAuction auction;

    function setUp() public {
        auction = new SimpleAuction();
    }

    function testCreateAuction() public {
        auction.createAuction(100);
        assertEq(auction.auctionCount(), 1);
    }

    function testBid() public {
        auction.createAuction(100);

        vm.deal(address(this), 1 ether);
        auction.bid{value: 1 ether}(1);

        (, address highestBidder,,,) = auction.auctions(1);
        assertEq(highestBidder, address(this));
    }

    function testOutbid() public {
        auction.createAuction(100);

        address user1 = address(1);
        address user2 = address(2);

        vm.deal(user1, 1 ether);
        vm.deal(user2, 2 ether);

        vm.prank(user1);
        auction.bid{value: 1 ether}(1);

        vm.prank(user2);
        auction.bid{value: 2 ether}(1);

        uint256 pending = auction.pendingReturns(user1);
        assertEq(pending, 1 ether);
    }
}