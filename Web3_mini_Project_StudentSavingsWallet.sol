// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title StudentSavingsWallet
 * @dev A decentralized savings wallet allowing users to deposit, withdraw, and track their ETH
 * @notice This contract demonstrates core Web3 principles: decentralization, transparency, and trustless execution
 */
contract StudentSavingsWallet {
    
    // ============================================
    // STATE VARIABLES
    // ============================================
    
    /// @dev Mapping to store each user's balance
    mapping(address => uint256) private userBalances;
    
    /// @dev Mapping to store each user's transaction history
    mapping(address => Transaction[]) private userTransactions;
    
    /// @dev Contract owner address
    address public owner;
    
    /// @dev Minimum deposit amount (0.001 ETH = 1000000000000000 wei)
    uint256 public constant MINIMUM_DEPOSIT = 0.001 ether;
    
    /// @dev Time-lock duration for withdrawals (24 hours in seconds)
    uint256 public constant WITHDRAWAL_TIMELOCK = 24 hours;
    
    /// @dev Mapping to track last deposit time for time-lock feature
    mapping(address => uint256) private lastDepositTime;
    
    /// @dev Total contract balance
    uint256 public totalContractBalance;
    
    // ============================================
    // STRUCTS & ENUMS
    // ============================================
    
    /// @dev Transaction type enumeration
    enum TransactionType { DEPOSIT, WITHDRAWAL }
    
    /// @dev Struct to store transaction details
    struct Transaction {
        TransactionType txType;
        uint256 amount;
        uint256 timestamp;
        uint256 balanceAfter;
    }
    
    // ============================================
    // EVENTS
    // ============================================
    
    /// @dev Emitted when a user deposits ETH
    event Deposit(address indexed user, uint256 amount, uint256 newBalance, uint256 timestamp);
    
    /// @dev Emitted when a user withdraws ETH
    event Withdrawal(address indexed user, uint256 amount, uint256 newBalance, uint256 timestamp);
    
    /// @dev Emitted when ownership is transferred
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    /// @dev Restricts function access to contract owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /// @dev Checks if minimum deposit requirement is met
    modifier meetsMinimumDeposit() {
        require(msg.value >= MINIMUM_DEPOSIT, "Deposit amount is below minimum requirement");
        _;
    }
    
    /// @dev Checks if withdrawal time-lock has passed
    modifier timeLockPassed() {
        require(
            block.timestamp >= lastDepositTime[msg.sender] + WITHDRAWAL_TIMELOCK,
            "Withdrawal time-lock period has not passed yet"
        );
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    /// @dev Sets the contract deployer as the owner
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), owner);
    }
    
    // ============================================
    // CORE FUNCTIONS
    // ============================================
    
    /**
     * @dev Allows users to deposit ETH into their savings wallet
     * @notice Minimum deposit of 0.001 ETH required
     * @notice Updates time-lock for withdrawals
     */
    function deposit() public payable meetsMinimumDeposit {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        
        // Update user balance
        userBalances[msg.sender] += msg.value;
        totalContractBalance += msg.value;
        
        // Update last deposit time for time-lock
        lastDepositTime[msg.sender] = block.timestamp;
        
        // Record transaction
        userTransactions[msg.sender].push(Transaction({
            txType: TransactionType.DEPOSIT,
            amount: msg.value,
            timestamp: block.timestamp,
            balanceAfter: userBalances[msg.sender]
        }));
        
        // Emit deposit event
        emit Deposit(msg.sender, msg.value, userBalances[msg.sender], block.timestamp);
    }
    
    /**
     * @dev Allows users to withdraw ETH from their savings wallet
     * @param _amount The amount of ETH to withdraw (in wei)
     * @notice Withdrawal must wait 24 hours after last deposit (time-lock)
     * @notice User must have sufficient balance
     */
    function withdraw(uint256 _amount) public timeLockPassed {
        require(_amount > 0, "Withdrawal amount must be greater than zero");
        require(userBalances[msg.sender] >= _amount, "Insufficient balance");
        
        // Update user balance before transfer (Checks-Effects-Interactions pattern)
        userBalances[msg.sender] -= _amount;
        totalContractBalance -= _amount;
        
        // Record transaction
        userTransactions[msg.sender].push(Transaction({
            txType: TransactionType.WITHDRAWAL,
            amount: _amount,
            timestamp: block.timestamp,
            balanceAfter: userBalances[msg.sender]
        }));
        
        // Emit withdrawal event
        emit Withdrawal(msg.sender, _amount, userBalances[msg.sender], block.timestamp);
        
        // Transfer ETH to user
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @dev Emergency withdrawal function (bypasses time-lock)
     * @param _amount The amount of ETH to withdraw
     * @notice Can only be called by contract owner
     */
    function emergencyWithdraw(uint256 _amount) public onlyOwner {
        require(_amount > 0, "Withdrawal amount must be greater than zero");
        require(userBalances[msg.sender] >= _amount, "Insufficient balance");
        
        userBalances[msg.sender] -= _amount;
        totalContractBalance -= _amount;
        
        userTransactions[msg.sender].push(Transaction({
            txType: TransactionType.WITHDRAWAL,
            amount: _amount,
            timestamp: block.timestamp,
            balanceAfter: userBalances[msg.sender]
        }));
        
        emit Withdrawal(msg.sender, _amount, userBalances[msg.sender], block.timestamp);
        
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Emergency transfer failed");
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /**
     * @dev Returns the balance of the caller
     * @return uint256 The user's balance in wei
     */
    function getMyBalance() public view returns (uint256) {
        return userBalances[msg.sender];
    }
    
    /**
     * @dev Returns the balance of a specific user (owner only)
     * @param _user The address of the user
     * @return uint256 The user's balance in wei
     */
    function getUserBalance(address _user) public view onlyOwner returns (uint256) {
        return userBalances[_user];
    }
    
    /**
     * @dev Returns the complete transaction history of the caller
     * @return Transaction[] Array of all user transactions
     */
    function getMyTransactionHistory() public view returns (Transaction[] memory) {
        return userTransactions[msg.sender];
    }
    
    /**
     * @dev Returns transaction history for a specific user (owner only)
     * @param _user The address of the user
     * @return Transaction[] Array of all user transactions
     */
    function getUserTransactionHistory(address _user) public view onlyOwner returns (Transaction[] memory) {
        return userTransactions[_user];
    }
    
    /**
     * @dev Returns the total number of transactions for the caller
     * @return uint256 Total transaction count
     */
    function getTransactionCount() public view returns (uint256) {
        return userTransactions[msg.sender].length;
    }
    
    /**
     * @dev Returns time remaining until withdrawal time-lock expires
     * @return uint256 Seconds remaining (0 if time-lock has passed)
     */
    function getTimeLockRemaining() public view returns (uint256) {
        uint256 unlockTime = lastDepositTime[msg.sender] + WITHDRAWAL_TIMELOCK;
        if (block.timestamp >= unlockTime) {
            return 0;
        }
        return unlockTime - block.timestamp;
    }
    
    /**
     * @dev Returns when withdrawals will be available
     * @return uint256 Unix timestamp when withdrawals unlock
     */
    function getWithdrawalUnlockTime() public view returns (uint256) {
        return lastDepositTime[msg.sender] + WITHDRAWAL_TIMELOCK;
    }
    
    /**
     * @dev Returns the contract's total ETH balance
     * @return uint256 Total contract balance in wei
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    /**
     * @dev Transfers ownership of the contract to a new address
     * @param _newOwner Address of the new owner
     * @notice Only current owner can transfer ownership
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        address previousOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(previousOwner, _newOwner);
    }
    
    // ============================================
    // FALLBACK & RECEIVE
    // ============================================
    
    /**
     * @dev Fallback function to handle direct ETH transfers
     * @notice Automatically deposits ETH sent directly to contract
     */
    receive() external payable {
        require(msg.value >= MINIMUM_DEPOSIT, "Direct transfers must meet minimum deposit");
        
        userBalances[msg.sender] += msg.value;
        totalContractBalance += msg.value;
        lastDepositTime[msg.sender] = block.timestamp;
        
        userTransactions[msg.sender].push(Transaction({
            txType: TransactionType.DEPOSIT,
            amount: msg.value,
            timestamp: block.timestamp,
            balanceAfter: userBalances[msg.sender]
        }));
        
        emit Deposit(msg.sender, msg.value, userBalances[msg.sender], block.timestamp);
    }
    
    /**
     * @dev Fallback function for non-existent function calls
     */
    fallback() external payable {
        revert("Function does not exist");
    }
}
