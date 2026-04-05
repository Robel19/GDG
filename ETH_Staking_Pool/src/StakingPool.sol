// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StakingPool {

    /* =============================================================
                            STEP 1
    ============================================================= */
    struct Stake {
        uint256 amount;
        uint256 startTime;
        bool claimed;
    }

    /* =============================================================
                            STEP 2
    ============================================================= */
    address public owner;
    uint256 public rewardRate; // reward per second

    mapping(address => Stake) public stakes;

    /* =============================================================
                            STEP 3
    ============================================================= */
    constructor(uint256 _rewardRate) {
        owner = msg.sender;
        rewardRate = _rewardRate;
    }

    /* =============================================================
                            STEP 4
    ============================================================= */
    function stake() external payable {
        require(msg.value > 0, "Must stake ETH");

        Stake storage userStake = stakes[msg.sender];

        require(userStake.amount == 0, "Already staking");

        userStake.amount = msg.value;
        userStake.startTime = block.timestamp;
        userStake.claimed = false;
    }

    /* =============================================================
                            STEP 5
    ============================================================= */
    function calculateReward(address user) public view returns (uint256) {
        Stake memory userStake = stakes[user];

        if (userStake.amount == 0 || userStake.claimed) {
            return 0;
        }

        uint256 duration = block.timestamp - userStake.startTime;

        uint256 reward = duration * rewardRate;

        return reward;
    }

    /* =============================================================
                            STEP 6
    ============================================================= */
    function unstake() external {
        Stake storage userStake = stakes[msg.sender];

        require(userStake.amount > 0, "No stake");
        require(!userStake.claimed, "Already claimed");

        uint256 reward = calculateReward(msg.sender);
        uint256 total = userStake.amount + reward;

        userStake.claimed = true;
        userStake.amount = 0;

        payable(msg.sender).transfer(total);
    }

    /* Optional: fund contract so it can pay rewards */
    receive() external payable {}
}