// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LandRegistry
 * @notice Decentralized Land Registry System on Base Chain
 * @dev ERC721-based land ownership with role-based access control.
 *      Each land parcel is an NFT. Ownership transfers are a 2-step process
 *      (owner requests → admin approves → owner executes) to mirror real-world
 *      government-verified property conveyances.
 */
contract LandRegistry is ERC721, ERC721URIStorage, AccessControl, ReentrancyGuard, Pausable {

    // =========================================================================
    // Roles
    // =========================================================================

    bytes32 public constant ADMIN_ROLE     = keccak256("ADMIN_ROLE");
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    // =========================================================================
    // Structs
    // =========================================================================

    struct Land {
        uint256 landId;
        address owner;
        string  location;       // Human-readable address or GPS coordinates
        uint256 size;           // Area in square meters
        string  metadataURI;    // IPFS URI for documents / extended metadata
        bool    isVerified;
        uint256 registeredAt;
        uint256 lastTransferAt;
    }

    struct TransferRecord {
        address from;
        address to;
        uint256 timestamp;
        string  reason;
    }

    struct PendingTransfer {
        address to;
        uint256 requestedAt;
        bool    adminApproved;
    }

    // =========================================================================
    // State Variables
    // =========================================================================

    uint256 private _nextLandId;

    mapping(uint256 => Land)             private _lands;
    mapping(string  => bool)             private _locationRegistered;
    mapping(address => uint256[])        private _ownerLands;
    mapping(uint256 => uint256)          private _ownerLandsIndex;
    mapping(uint256 => TransferRecord[]) private _transferHistory;
    mapping(uint256 => PendingTransfer)  private _pendingTransfers;

    // =========================================================================
    // Events
    // =========================================================================

    event LandRegistered(
        uint256 indexed landId,
        address indexed owner,
        string  location,
        uint256 size,
        string  metadataURI,
        uint256 timestamp
    );

    event LandVerified(
        uint256 indexed landId,
        address indexed verifiedBy,
        uint256 timestamp
    );

    event OwnershipTransferRequested(
        uint256 indexed landId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    event OwnershipTransferApproved(
        uint256 indexed landId,
        address indexed approvedBy,
        uint256 timestamp
    );

    event OwnershipTransferred(
        uint256 indexed landId,
        address indexed from,
        address indexed to,
        uint256 timestamp,
        string  reason
    );

    event TransferRequestCancelled(
        uint256 indexed landId,
        address indexed cancelledBy,
        uint256 timestamp
    );

    event LandMetadataUpdated(
        uint256 indexed landId,
        string  newMetadataURI,
        uint256 timestamp
    );

    // =========================================================================
    // Custom Errors
    // =========================================================================

    error LandNotFound(uint256 landId);
    error LocationAlreadyRegistered(string location);
    error NotLandOwner(uint256 landId, address caller);
    error LandNotVerified(uint256 landId);
    error PendingTransferExists(uint256 landId);
    error NoPendingTransfer(uint256 landId);
    error TransferNotApproved(uint256 landId);
    error InvalidAddress();
    error InvalidSize();
    error EmptyLocation();
    error SelfTransfer();

    // =========================================================================
    // Modifiers
    // =========================================================================

    modifier landExists(uint256 landId) {
        if (_ownerOf(landId) == address(0)) revert LandNotFound(landId);
        _;
    }

    modifier onlyLandOwner(uint256 landId) {
        if (ownerOf(landId) != msg.sender) revert NotLandOwner(landId, msg.sender);
        _;
    }

    // =========================================================================
    // Constructor
    // =========================================================================

    constructor(address adminAddress) ERC721("LandRegistry", "LAND") {
        if (adminAddress == address(0)) revert InvalidAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, adminAddress);
        _grantRole(ADMIN_ROLE,         adminAddress);
        _grantRole(REGISTRAR_ROLE,     adminAddress);
        _nextLandId = 1;
    }

    // =========================================================================
    // Registration
    // =========================================================================

    /**
     * @notice Register a new land parcel and mint an NFT to the owner.
     * @param owner        Initial owner address
     * @param location     Physical location string (address or GPS coords)
     * @param size         Area in square meters (must be > 0)
     * @param metadataURI  IPFS URI with documents and extended metadata
     * @return landId      The newly assigned land token ID
     * @dev Uses {_mint} (not {_safeMint}): registrar-controlled issuance; receiver hooks are optional for this flow.
     */
    function registerLand(
        address         owner,
        string calldata location,
        uint256         size,
        string calldata metadataURI
    )
        external
        onlyRole(REGISTRAR_ROLE)
        whenNotPaused
        nonReentrant
        returns (uint256 landId)
    {
        if (owner == address(0))           revert InvalidAddress();
        if (size == 0)                     revert InvalidSize();
        if (bytes(location).length == 0)   revert EmptyLocation();
        if (_locationRegistered[location]) revert LocationAlreadyRegistered(location);

        landId = _nextLandId++;

        _lands[landId] = Land({
            landId:         landId,
            owner:          owner,
            location:       location,
            size:           size,
            metadataURI:    metadataURI,
            isVerified:     false,
            registeredAt:   block.timestamp,
            lastTransferAt: block.timestamp
        });

        _locationRegistered[location] = true;
        _addLandToOwner(owner, landId);

        _mint(owner, landId);
        _setTokenURI(landId, metadataURI);

        emit LandRegistered(landId, owner, location, size, metadataURI, block.timestamp);
    }

    // =========================================================================
    // Verification
    // =========================================================================

    /**
     * @notice Government / admin verifies a land parcel as legitimate.
     * @param landId Land token ID to verify
     */
    function verifyLand(uint256 landId)
        external
        onlyRole(ADMIN_ROLE)
        landExists(landId)
        whenNotPaused
    {
        _lands[landId].isVerified = true;
        emit LandVerified(landId, msg.sender, block.timestamp);
    }

    // =========================================================================
    // Ownership Transfer  —  2-Step: Request → Admin Approve → Execute
    // =========================================================================

    /**
     * @notice Step 1: Land owner initiates a transfer request.
     * @dev    Land must be verified before a transfer can be requested.
     * @param landId  Land token ID
     * @param to      Prospective new owner address
     */
    function requestTransfer(uint256 landId, address to)
        external
        onlyLandOwner(landId)
        landExists(landId)
        whenNotPaused
    {
        if (to == address(0))                           revert InvalidAddress();
        if (to == msg.sender)                           revert SelfTransfer();
        if (!_lands[landId].isVerified)                 revert LandNotVerified(landId);
        if (_pendingTransfers[landId].to != address(0)) revert PendingTransferExists(landId);

        _pendingTransfers[landId] = PendingTransfer({
            to:            to,
            requestedAt:   block.timestamp,
            adminApproved: false
        });

        emit OwnershipTransferRequested(landId, msg.sender, to, block.timestamp);
    }

    /**
     * @notice Step 2: Admin approves the pending transfer.
     * @param landId Land token ID
     */
    function approveTransfer(uint256 landId)
        external
        onlyRole(ADMIN_ROLE)
        landExists(landId)
        whenNotPaused
    {
        if (_pendingTransfers[landId].to == address(0)) revert NoPendingTransfer(landId);
        _pendingTransfers[landId].adminApproved = true;
        emit OwnershipTransferApproved(landId, msg.sender, block.timestamp);
    }

    /**
     * @notice Step 3: Current owner executes the admin-approved transfer.
     * @param landId  Land token ID
     * @param reason  Optional human-readable reason (sale, inheritance, etc.)
     */
    function executeTransfer(uint256 landId, string calldata reason)
        external
        onlyLandOwner(landId)
        landExists(landId)
        whenNotPaused
        nonReentrant
    {
        PendingTransfer storage pt = _pendingTransfers[landId];
        if (pt.to == address(0)) revert NoPendingTransfer(landId);
        if (!pt.adminApproved)   revert TransferNotApproved(landId);

        address from = msg.sender;
        address to   = pt.to;

        _transferHistory[landId].push(TransferRecord({
            from:      from,
            to:        to,
            timestamp: block.timestamp,
            reason:    reason
        }));

        Land storage land   = _lands[landId];
        land.owner          = to;
        land.lastTransferAt = block.timestamp;

        _removeLandFromOwner(from, landId);
        _addLandToOwner(to, landId);

        delete _pendingTransfers[landId];

        _transfer(from, to, landId);

        emit OwnershipTransferred(landId, from, to, block.timestamp, reason);
    }

    /**
     * @notice Cancel a pending transfer. Callable by the land owner or an admin.
     * @param landId Land token ID
     */
    function cancelTransfer(uint256 landId)
        external
        landExists(landId)
        whenNotPaused
    {
        bool isOwner = (ownerOf(landId) == msg.sender);
        bool isAdmin = hasRole(ADMIN_ROLE, msg.sender);
        if (!isOwner && !isAdmin) revert NotLandOwner(landId, msg.sender);
        if (_pendingTransfers[landId].to == address(0)) revert NoPendingTransfer(landId);

        delete _pendingTransfers[landId];
        emit TransferRequestCancelled(landId, msg.sender, block.timestamp);
    }

    /**
     * @notice Emergency admin-forced transfer (court order / legal seizure).
     * @param landId  Land token ID
     * @param to      New owner address
     * @param reason  Mandatory reason for the audit trail
     */
    function adminTransfer(uint256 landId, address to, string calldata reason)
        external
        onlyRole(ADMIN_ROLE)
        landExists(landId)
        whenNotPaused
        nonReentrant
    {
        if (to == address(0)) revert InvalidAddress();
        address from = ownerOf(landId);
        if (from == to) revert SelfTransfer();

        if (_pendingTransfers[landId].to != address(0)) {
            delete _pendingTransfers[landId];
        }

        _transferHistory[landId].push(TransferRecord({
            from:      from,
            to:        to,
            timestamp: block.timestamp,
            reason:    reason
        }));

        Land storage land   = _lands[landId];
        land.owner          = to;
        land.lastTransferAt = block.timestamp;

        _removeLandFromOwner(from, landId);
        _addLandToOwner(to, landId);

        _transfer(from, to, landId);

        emit OwnershipTransferred(landId, from, to, block.timestamp, reason);
    }

    // =========================================================================
    // Metadata
    // =========================================================================

    /**
     * @notice Update the IPFS metadata URI for a land parcel.
     * @param landId        Land token ID
     * @param newMetadataURI New IPFS URI
     */
    function updateMetadata(uint256 landId, string calldata newMetadataURI)
        external
        onlyRole(REGISTRAR_ROLE)
        landExists(landId)
        whenNotPaused
    {
        _lands[landId].metadataURI = newMetadataURI;
        _setTokenURI(landId, newMetadataURI);
        emit LandMetadataUpdated(landId, newMetadataURI, block.timestamp);
    }

    // =========================================================================
    // Admin Controls
    // =========================================================================

    /// @notice Pause all state-changing operations.
    function pause() external onlyRole(ADMIN_ROLE) { _pause(); }

    /// @notice Unpause all state-changing operations.
    function unpause() external onlyRole(ADMIN_ROLE) { _unpause(); }

    /// @notice Grant REGISTRAR_ROLE to an account.
    function grantRegistrarRole(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(REGISTRAR_ROLE, account);
    }

    /// @notice Revoke REGISTRAR_ROLE from an account.
    function revokeRegistrarRole(address account) external onlyRole(ADMIN_ROLE) {
        _revokeRole(REGISTRAR_ROLE, account);
    }

    // =========================================================================
    // View / Query Functions
    // =========================================================================

    /**
     * @notice Fetch full details for a land parcel.
     */
    function getLand(uint256 landId)
        external
        view
        landExists(landId)
        returns (Land memory)
    {
        return _lands[landId];
    }

    /**
     * @notice Get all land IDs owned by a given address.
     */
    function getLandsByOwner(address owner)
        external
        view
        returns (uint256[] memory)
    {
        return _ownerLands[owner];
    }

    /**
     * @notice Get full ownership transfer history for a land parcel.
     */
    function getTransferHistory(uint256 landId)
        external
        view
        landExists(landId)
        returns (TransferRecord[] memory)
    {
        return _transferHistory[landId];
    }

    /**
     * @notice Get the pending transfer request for a land parcel (if any).
     */
    function getPendingTransfer(uint256 landId)
        external
        view
        landExists(landId)
        returns (PendingTransfer memory)
    {
        return _pendingTransfers[landId];
    }

    /**
     * @notice Check if a location string has already been registered.
     */
    function isLocationRegistered(string calldata location)
        external
        view
        returns (bool)
    {
        return _locationRegistered[location];
    }

    /**
     * @notice Total number of land parcels ever registered.
     */
    function totalLands() external view returns (uint256) {
        return _nextLandId - 1;
    }

    // =========================================================================
    // Internal Helpers
    // =========================================================================

    function _addLandToOwner(address owner, uint256 landId) internal {
        _ownerLandsIndex[landId] = _ownerLands[owner].length;
        _ownerLands[owner].push(landId);
    }

    function _removeLandFromOwner(address owner, uint256 landId) internal {
        uint256 lastIndex = _ownerLands[owner].length - 1;
        uint256 landIndex = _ownerLandsIndex[landId];

        if (landIndex != lastIndex) {
            uint256 lastLandId = _ownerLands[owner][lastIndex];
            _ownerLands[owner][landIndex] = lastLandId;
            _ownerLandsIndex[lastLandId]  = landIndex;
        }

        _ownerLands[owner].pop();
        delete _ownerLandsIndex[landId];
    }

    // =========================================================================
    // Required Overrides
    // =========================================================================

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
