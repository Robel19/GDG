// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SharedWallet {

    /* =============================================================
                            STEP 1
    ============================================================= */
    struct Deposit {
        address user;
        uint256 amount;
        uint256 time;
    }

    /* =============================================================
                            STEP 2
    ============================================================= */
    address public owner;
    uint256 public totalBalance;

    mapping(address => uint256) public balances;
    Deposit[] public deposits;

    /* =============================================================
                            STEP 3
    ============================================================= */
    constructor() {
        owner = msg.sender;
    }

    /* =============================================================
                            STEP 4
    ============================================================= */
    function deposit() external payable {
        require(msg.value > 0, "Must send ETH");

        balances[msg.sender] += msg.value;
        totalBalance += msg.value;

        deposits.push(Deposit({
            user: msg.sender,
            amount: msg.value,
            time: block.timestamp
        }));
    }

    /* =============================================================
                            STEP 5
    ============================================================= */
    function withdraw(uint256 amount) external {
        require(msg.sender == owner, "Not owner");
        require(address(this).balance >= amount, "Insufficient balance");

        totalBalance -= amount;

        payable(owner).transfer(amount);
    }
}