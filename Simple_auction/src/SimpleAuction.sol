// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleAuction {

    struct Auction {
        address seller;
        address highestBidder;
        uint256 highestBid;
        uint256 endTime;
        bool ended;
    }

    uint256 public auctionCount;
    mapping(uint256 => Auction) public auctions;
    mapping(address => uint256) public pendingReturns;

    function createAuction(uint256 duration) public {
        auctionCount++;

        auctions[auctionCount] = Auction({
            seller: msg.sender,
            highestBidder: address(0),
            highestBid: 0,
            endTime: block.timestamp + duration,
            ended: false
        });
    }

    function bid(uint256 auctionId) public payable {
        Auction storage auction = auctions[auctionId];

        require(block.timestamp < auction.endTime, "Ended");
        require(msg.value > auction.highestBid, "Low bid");

        if (auction.highestBidder != address(0)) {
            pendingReturns[auction.highestBidder] += auction.highestBid;
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
    }

    function withdraw() public {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "No funds");

        pendingReturns[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Failed");
    }

    function endAuction(uint256 auctionId) public {
        Auction storage auction = auctions[auctionId];

        require(block.timestamp >= auction.endTime, "Not ended");
        require(!auction.ended, "Already ended");

        auction.ended = true;

        (bool success, ) = auction.seller.call{value: auction.highestBid}("");
        require(success, "Transfer failed");
    }
}