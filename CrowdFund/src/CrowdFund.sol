
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CrowdFund {

    /* =============================================================
                            STEP 1
       Campaign struct
    ============================================================= */
    struct Campaign {
        address owner;
        uint256 goal;
        uint256 pledged;
        uint256 startAt;
        uint256 endAt;
        bool claimed;
    }

    /* =============================================================
                            STEP 2
       State variables
    ============================================================= */
    uint256 public campaignCount;

    mapping(uint256 => Campaign) public campaigns;

    mapping(uint256 => mapping(address => uint256)) public pledgedAmount;

    /* =============================================================
                            STEP 3
       create() — starts a new campaign
    ============================================================= */
    function create(uint256 goal, uint256 duration) external {
        campaignCount++;

        campaigns[campaignCount] = Campaign({
            owner: msg.sender,
            goal: goal,
            pledged: 0,
            startAt: block.timestamp,
            endAt: block.timestamp + duration,
            claimed: false
        });
    }

    /* =============================================================
                            STEP 4
       pledge() — contribute ETH to a campaign
    ============================================================= */
    function pledge(uint256 campaignId) external payable {
        Campaign storage campaign = campaigns[campaignId];

        require(block.timestamp <= campaign.endAt, "Campaign has ended");
        require(msg.value > 0, "Must send ETH");

        campaign.pledged += msg.value;
        pledgedAmount[campaignId][msg.sender] += msg.value;
    }

    /* =============================================================
                            STEP 5
       claim() — owner withdraws funds if goal reached
    ============================================================= */
    function claim(uint256 campaignId) external {
        Campaign storage campaign = campaigns[campaignId];

        require(msg.sender == campaign.owner, "Not campaign owner");
        require(block.timestamp > campaign.endAt, "Campaign not ended yet");
        require(campaign.pledged >= campaign.goal, "Goal not reached");
        require(!campaign.claimed, "Already claimed");

        campaign.claimed = true;

        (bool success, ) = payable(campaign.owner).call{value: campaign.pledged}("");
        require(success, "Transfer failed");
    }

    /* =============================================================
                            STEP 6
       refund() — backers get refund if goal not reached
    ============================================================= */
    function refund(uint256 campaignId) external {
        Campaign storage campaign = campaigns[campaignId];

        require(block.timestamp > campaign.endAt, "Campaign not ended yet");
        require(campaign.pledged < campaign.goal, "Goal was reached, no refund");

        uint256 amount = pledgedAmount[campaignId][msg.sender];
        require(amount > 0, "Nothing to refund");

        pledgedAmount[campaignId][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }
}
