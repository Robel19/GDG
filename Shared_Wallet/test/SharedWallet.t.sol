// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SharedWallet.sol";

contract SharedWalletTest is Test {
    SharedWallet wallet;

    function setUp() public {
        wallet = new SharedWallet();
    }

    function testDeposit() public {
        vm.deal(address(this), 1 ether);

        wallet.deposit{value: 1 ether}();

        assertEq(wallet.totalBalance(), 1 ether);
        assertEq(wallet.balances(address(this)), 1 ether);
    }

    function testOnlyOwnerWithdraw() public {
        vm.expectRevert();
        vm.prank(address(1));
        wallet.withdraw(1 ether);
    }
}