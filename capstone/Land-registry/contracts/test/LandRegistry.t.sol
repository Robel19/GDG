// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC4906} from "@openzeppelin/contracts/interfaces/IERC4906.sol";
import "../src/LandRegistry.sol";

contract LandRegistryTest is Test {

    LandRegistry public registry;

    address public admin     = makeAddr("admin");
    address public registrar = makeAddr("registrar");
    address public alice     = makeAddr("alice");
    address public bob       = makeAddr("bob");
    address public charlie   = makeAddr("charlie");
    address public stranger  = makeAddr("stranger");

    string constant LOCATION_1   = "123 Main St, Springfield, IL 62701";
    string constant LOCATION_2   = "456 Oak Ave, Chicago, IL 60601";
    string constant METADATA_URI  = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
    string constant METADATA_URI2 = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
    uint256 constant SIZE_1 = 1000;
    uint256 constant SIZE_2 = 2500;

    function setUp() public {
        vm.prank(admin);
        registry = new LandRegistry(admin);
        vm.prank(admin);
        registry.grantRegistrarRole(registrar);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    function _registerLand(address owner, string memory location, uint256 size, string memory uri)
        internal returns (uint256)
    {
        vm.prank(registrar);
        return registry.registerLand(owner, location, size, uri);
    }

    function _registerAndVerify(address owner) internal returns (uint256 landId) {
        landId = _registerLand(owner, LOCATION_1, SIZE_1, METADATA_URI);
        vm.prank(admin);
        registry.verifyLand(landId);
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    function test_Constructor_SetsRoles() public view {
        assertTrue(registry.hasRole(registry.ADMIN_ROLE(), admin));
        assertTrue(registry.hasRole(registry.REGISTRAR_ROLE(), admin));
        assertTrue(registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), admin));
    }

    function test_Constructor_RevertsOnZeroAddress() public {
        vm.expectRevert(LandRegistry.InvalidAddress.selector);
        new LandRegistry(address(0));
    }

    // ── Registration ─────────────────────────────────────────────────────────

    function test_RegisterLand_Success() public {
        // OZ ERC721 emits Transfer before our LandRegistered; ERC721URIStorage emits MetadataUpdate after mint.
        vm.expectEmit(true, true, true, true);
        emit IERC721.Transfer(address(0), alice, 1);
        vm.expectEmit(false, false, false, true);
        emit IERC4906.MetadataUpdate(1);
        vm.expectEmit(true, true, false, true);
        emit LandRegistry.LandRegistered(1, alice, LOCATION_1, SIZE_1, METADATA_URI, block.timestamp);

        uint256 landId = _registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI);

        assertEq(landId, 1);
        assertEq(registry.ownerOf(landId), alice);
        assertEq(registry.totalLands(), 1);

        LandRegistry.Land memory land = registry.getLand(landId);
        assertEq(land.owner, alice);
        assertEq(land.location, LOCATION_1);
        assertEq(land.size, SIZE_1);
        assertEq(land.metadataURI, METADATA_URI);
        assertFalse(land.isVerified);
    }

    function test_RegisterLand_IncrementsId() public {
        assertEq(_registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI), 1);
        assertEq(_registerLand(alice, LOCATION_2, SIZE_2, METADATA_URI2), 2);
        assertEq(registry.totalLands(), 2);
    }

    function test_RegisterLand_RevertsOnDuplicateLocation() public {
        _registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI);
        vm.prank(registrar);
        vm.expectRevert(
            abi.encodeWithSelector(LandRegistry.LocationAlreadyRegistered.selector, LOCATION_1)
        );
        registry.registerLand(bob, LOCATION_1, SIZE_2, METADATA_URI2);
    }

    function test_RegisterLand_RevertsOnZeroSize() public {
        vm.prank(registrar);
        vm.expectRevert(LandRegistry.InvalidSize.selector);
        registry.registerLand(alice, LOCATION_1, 0, METADATA_URI);
    }

    function test_RegisterLand_RevertsOnZeroOwner() public {
        vm.prank(registrar);
        vm.expectRevert(LandRegistry.InvalidAddress.selector);
        registry.registerLand(address(0), LOCATION_1, SIZE_1, METADATA_URI);
    }

    function test_RegisterLand_RevertsOnEmptyLocation() public {
        vm.prank(registrar);
        vm.expectRevert(LandRegistry.EmptyLocation.selector);
        registry.registerLand(alice, "", SIZE_1, METADATA_URI);
    }

    function test_RegisterLand_RevertsIfNotRegistrar() public {
        vm.prank(stranger);
        vm.expectRevert();
        registry.registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI);
    }

    function test_RegisterLand_LocationMarkedAsRegistered() public {
        assertFalse(registry.isLocationRegistered(LOCATION_1));
        _registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI);
        assertTrue(registry.isLocationRegistered(LOCATION_1));
    }

    function test_RegisterLand_AddedToOwnerList() public {
        uint256 id1 = _registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI);
        uint256 id2 = _registerLand(alice, LOCATION_2, SIZE_2, METADATA_URI2);
        uint256[] memory lands = registry.getLandsByOwner(alice);
        assertEq(lands.length, 2);
        assertEq(lands[0], id1);
        assertEq(lands[1], id2);
    }

    // ── Verification ─────────────────────────────────────────────────────────

    function test_VerifyLand_Success() public {
        uint256 landId = _registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI);
        vm.expectEmit(true, true, false, true);
        emit LandRegistry.LandVerified(landId, admin, block.timestamp);
        vm.prank(admin);
        registry.verifyLand(landId);
        assertTrue(registry.getLand(landId).isVerified);
    }

    function test_VerifyLand_RevertsIfNotAdmin() public {
        uint256 landId = _registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI);
        vm.prank(stranger);
        vm.expectRevert();
        registry.verifyLand(landId);
    }

    function test_VerifyLand_RevertsIfLandNotFound() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(LandRegistry.LandNotFound.selector, 999));
        registry.verifyLand(999);
    }

    // ── Transfer Request ─────────────────────────────────────────────────────

    function test_RequestTransfer_Success() public {
        uint256 landId = _registerAndVerify(alice);
        vm.expectEmit(true, true, true, true);
        emit LandRegistry.OwnershipTransferRequested(landId, alice, bob, block.timestamp);
        vm.prank(alice);
        registry.requestTransfer(landId, bob);
        LandRegistry.PendingTransfer memory pt = registry.getPendingTransfer(landId);
        assertEq(pt.to, bob);
        assertFalse(pt.adminApproved);
    }

    function test_RequestTransfer_RevertsIfNotVerified() public {
        uint256 landId = _registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(LandRegistry.LandNotVerified.selector, landId));
        registry.requestTransfer(landId, bob);
    }

    function test_RequestTransfer_RevertsIfNotOwner() public {
        uint256 landId = _registerAndVerify(alice);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(LandRegistry.NotLandOwner.selector, landId, bob));
        registry.requestTransfer(landId, charlie);
    }

    function test_RequestTransfer_RevertsOnSelfTransfer() public {
        uint256 landId = _registerAndVerify(alice);
        vm.prank(alice);
        vm.expectRevert(LandRegistry.SelfTransfer.selector);
        registry.requestTransfer(landId, alice);
    }

    function test_RequestTransfer_RevertsIfPendingExists() public {
        uint256 landId = _registerAndVerify(alice);
        vm.prank(alice);
        registry.requestTransfer(landId, bob);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(LandRegistry.PendingTransferExists.selector, landId));
        registry.requestTransfer(landId, charlie);
    }

    // ── Approve Transfer ─────────────────────────────────────────────────────

    function test_ApproveTransfer_Success() public {
        uint256 landId = _registerAndVerify(alice);
        vm.prank(alice); registry.requestTransfer(landId, bob);
        vm.expectEmit(true, true, false, true);
        emit LandRegistry.OwnershipTransferApproved(landId, admin, block.timestamp);
        vm.prank(admin);
        registry.approveTransfer(landId);
        assertTrue(registry.getPendingTransfer(landId).adminApproved);
    }

    function test_ApproveTransfer_RevertsIfNoPending() public {
        uint256 landId = _registerAndVerify(alice);
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(LandRegistry.NoPendingTransfer.selector, landId));
        registry.approveTransfer(landId);
    }

    function test_ApproveTransfer_RevertsIfNotAdmin() public {
        uint256 landId = _registerAndVerify(alice);
        vm.prank(alice); registry.requestTransfer(landId, bob);
        vm.prank(stranger);
        vm.expectRevert();
        registry.approveTransfer(landId);
    }

    // ── Execute Transfer ─────────────────────────────────────────────────────

    function test_ExecuteTransfer_Success() public {
        uint256 landId = _registerAndVerify(alice);
        vm.prank(alice); registry.requestTransfer(landId, bob);
        vm.prank(admin);  registry.approveTransfer(landId);
        vm.expectEmit(true, true, true, true);
        emit LandRegistry.OwnershipTransferred(landId, alice, bob, block.timestamp, "Sale");
        vm.prank(alice);
        registry.executeTransfer(landId, "Sale");

        assertEq(registry.ownerOf(landId), bob);
        assertEq(registry.getLand(landId).owner, bob);
        assertEq(registry.getLandsByOwner(alice).length, 0);
        assertEq(registry.getLandsByOwner(bob).length, 1);
    }

    function test_ExecuteTransfer_RecordsHistory() public {
        uint256 landId = _registerAndVerify(alice);
        vm.prank(alice); registry.requestTransfer(landId, bob);
        vm.prank(admin);  registry.approveTransfer(landId);
        vm.prank(alice); registry.executeTransfer(landId, "Inheritance");
        LandRegistry.TransferRecord[] memory history = registry.getTransferHistory(landId);
        assertEq(history.length, 1);
        assertEq(history[0].from, alice);
        assertEq(history[0].to, bob);
        assertEq(history[0].reason, "Inheritance");
    }

    function test_ExecuteTransfer_ClearsPending() public {
        uint256 landId = _registerAndVerify(alice);
        vm.prank(alice); registry.requestTransfer(landId, bob);
        vm.prank(admin);  registry.approveTransfer(landId);
        vm.prank(alice); registry.executeTransfer(landId, "Sale");
        assertEq(registry.getPendingTransfer(landId).to, address(0));
    }

    function test_ExecuteTransfer_RevertsIfNotApproved() public {
        uint256 landId = _registerAndVerify(alice);
        vm.prank(alice); registry.requestTransfer(landId, bob);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(LandRegistry.TransferNotApproved.selector, landId));
        registry.executeTransfer(landId, "Sale");
    }

    function test_ExecuteTransfer_RevertsIfNoPending() public {
        uint256 landId = _registerAndVerify(alice);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(LandRegistry.NoPendingTransfer.selector, landId));
        registry.executeTransfer(landId, "Sale");
    }

    // ── Cancel Transfer ──────────────────────────────────────────────────────

    function test_CancelTransfer_ByOwner() public {
        uint256 landId = _registerAndVerify(alice);
        vm.prank(alice); registry.requestTransfer(landId, bob);
        vm.prank(alice); registry.cancelTransfer(landId);
        assertEq(registry.getPendingTransfer(landId).to, address(0));
    }

    function test_CancelTransfer_ByAdmin() public {
        uint256 landId = _registerAndVerify(alice);
        vm.prank(alice); registry.requestTransfer(landId, bob);
        vm.prank(admin); registry.cancelTransfer(landId);
        assertEq(registry.getPendingTransfer(landId).to, address(0));
    }

    function test_CancelTransfer_RevertsIfStranger() public {
        uint256 landId = _registerAndVerify(alice);
        vm.prank(alice); registry.requestTransfer(landId, bob);
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(LandRegistry.NotLandOwner.selector, landId, stranger)
        );
        registry.cancelTransfer(landId);
    }

    // ── Admin Transfer ───────────────────────────────────────────────────────

    function test_AdminTransfer_Success() public {
        uint256 landId = _registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI);
        vm.prank(admin);
        registry.adminTransfer(landId, bob, "Court order #12345");
        assertEq(registry.ownerOf(landId), bob);
        assertEq(registry.getTransferHistory(landId)[0].reason, "Court order #12345");
    }

    function test_AdminTransfer_ClearsPending() public {
        uint256 landId = _registerAndVerify(alice);
        vm.prank(alice); registry.requestTransfer(landId, bob);
        vm.prank(admin);  registry.adminTransfer(landId, charlie, "Legal seizure");
        assertEq(registry.ownerOf(landId), charlie);
        assertEq(registry.getPendingTransfer(landId).to, address(0));
    }

    function test_AdminTransfer_RevertsIfNotAdmin() public {
        uint256 landId = _registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI);
        vm.prank(stranger);
        vm.expectRevert();
        registry.adminTransfer(landId, bob, "Illegal");
    }

    // ── Multi-Transfer Scenario ───────────────────────────────────────────────

    function test_MultipleTransfers_AccumulateHistory() public {
        uint256 landId = _registerAndVerify(alice);
        vm.prank(alice); registry.requestTransfer(landId, bob);
        vm.prank(admin);  registry.approveTransfer(landId);
        vm.prank(alice); registry.executeTransfer(landId, "Sale to Bob");
        vm.prank(bob);   registry.requestTransfer(landId, charlie);
        vm.prank(admin);  registry.approveTransfer(landId);
        vm.prank(bob);   registry.executeTransfer(landId, "Sale to Charlie");

        assertEq(registry.ownerOf(landId), charlie);
        LandRegistry.TransferRecord[] memory history = registry.getTransferHistory(landId);
        assertEq(history.length, 2);
        assertEq(history[0].to, bob);
        assertEq(history[1].to, charlie);
    }

    function test_OwnerList_UpdatesAfterTransfer() public {
        uint256 id1 = _registerAndVerify(alice);
        uint256 id2 = _registerLand(alice, LOCATION_2, SIZE_2, METADATA_URI2);
        vm.prank(admin); registry.verifyLand(id2);
        vm.prank(alice); registry.requestTransfer(id1, bob);
        vm.prank(admin);  registry.approveTransfer(id1);
        vm.prank(alice); registry.executeTransfer(id1, "Sold");

        assertEq(registry.getLandsByOwner(alice).length, 1);
        assertEq(registry.getLandsByOwner(alice)[0], id2);
        assertEq(registry.getLandsByOwner(bob).length, 1);
        assertEq(registry.getLandsByOwner(bob)[0], id1);
    }

    // ── Metadata ─────────────────────────────────────────────────────────────

    function test_UpdateMetadata_Success() public {
        uint256 landId = _registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI);
        vm.prank(registrar);
        registry.updateMetadata(landId, METADATA_URI2);
        assertEq(registry.getLand(landId).metadataURI, METADATA_URI2);
        assertEq(registry.tokenURI(landId), METADATA_URI2);
    }

    function test_UpdateMetadata_RevertsIfNotRegistrar() public {
        uint256 landId = _registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI);
        vm.prank(stranger);
        vm.expectRevert();
        registry.updateMetadata(landId, METADATA_URI2);
    }

    // ── Pause ────────────────────────────────────────────────────────────────

    function test_Pause_BlocksRegistration() public {
        vm.prank(admin); registry.pause();
        vm.prank(registrar);
        vm.expectRevert();
        registry.registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI);
    }

    function test_Unpause_AllowsRegistration() public {
        vm.prank(admin); registry.pause();
        vm.prank(admin); registry.unpause();
        assertEq(_registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI), 1);
    }

    // ── Role Management ──────────────────────────────────────────────────────

    function test_GrantRegistrarRole() public {
        vm.prank(admin);
        registry.grantRegistrarRole(charlie);
        assertTrue(registry.hasRole(registry.REGISTRAR_ROLE(), charlie));
    }

    function test_RevokeRegistrarRole() public {
        vm.prank(admin); registry.revokeRegistrarRole(registrar);
        vm.prank(registrar);
        vm.expectRevert();
        registry.registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI);
    }

    // ── NFT / ERC721 ─────────────────────────────────────────────────────────

    function test_TokenURI_MatchesMetadataURI() public {
        uint256 landId = _registerLand(alice, LOCATION_1, SIZE_1, METADATA_URI);
        assertEq(registry.tokenURI(landId), METADATA_URI);
    }

    function test_SupportsInterface_ERC721() public view {
        assertTrue(registry.supportsInterface(0x80ac58cd));
    }

    function test_SupportsInterface_AccessControl() public view {
        assertTrue(registry.supportsInterface(0x7965db0b));
    }

    // ── Fuzz Tests ───────────────────────────────────────────────────────────

    function testFuzz_RegisterLand_DifferentSizes(uint256 size) public {
        vm.assume(size > 0);
        vm.prank(registrar);
        uint256 landId = registry.registerLand(alice, LOCATION_1, size, METADATA_URI);
        assertEq(registry.getLand(landId).size, size);
    }

    function testFuzz_TotalLandsIncrement(uint8 count) public {
        vm.assume(count > 0 && count <= 20);
        for (uint256 i = 0; i < count; i++) {
            string memory loc = string(abi.encodePacked("Location ", vm.toString(i)));
            vm.prank(registrar);
            registry.registerLand(alice, loc, SIZE_1, METADATA_URI);
        }
        assertEq(registry.totalLands(), count);
    }
}
