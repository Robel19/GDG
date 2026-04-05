// ─── ABI ─────────────────────────────────────────────────────────────────────
// Minimal ABI covering all functions used by the frontend.

export const LAND_REGISTRY_ABI = [
  // ── View ──────────────────────────────────────────────────────────────────
  {
    name: "getLand",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "landId", type: "uint256" }],
    outputs: [{
      type: "tuple",
      components: [
        { name: "landId",         type: "uint256" },
        { name: "owner",          type: "address" },
        { name: "location",       type: "string"  },
        { name: "size",           type: "uint256" },
        { name: "metadataURI",    type: "string"  },
        { name: "isVerified",     type: "bool"    },
        { name: "registeredAt",   type: "uint256" },
        { name: "lastTransferAt", type: "uint256" },
      ],
    }],
  },
  {
    name: "getLandsByOwner",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "getTransferHistory",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "landId", type: "uint256" }],
    outputs: [{
      name: "",
      type: "tuple[]",
      components: [
        { name: "from",      type: "address" },
        { name: "to",        type: "address" },
        { name: "timestamp", type: "uint256" },
        { name: "reason",    type: "string"  },
      ],
    }],
  },
  {
    name: "getPendingTransfer",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "landId", type: "uint256" }],
    outputs: [{
      type: "tuple",
      components: [
        { name: "to",            type: "address" },
        { name: "requestedAt",   type: "uint256" },
        { name: "adminApproved", type: "bool"    },
      ],
    }],
  },
  {
    name: "isLocationRegistered",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "location", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "totalLands",
    type: "function",
    stateMutability: "view",
    inputs:  [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "hasRole",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "role", type: "bytes32" }, { name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "ADMIN_ROLE",
    type: "function",
    stateMutability: "view",
    inputs:  [],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "REGISTRAR_ROLE",
    type: "function",
    stateMutability: "view",
    inputs:  [],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "paused",
    type: "function",
    stateMutability: "view",
    inputs:  [],
    outputs: [{ name: "", type: "bool" }],
  },
  // ── Write ─────────────────────────────────────────────────────────────────
  {
    name: "registerLand",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "owner",       type: "address" },
      { name: "location",    type: "string"  },
      { name: "size",        type: "uint256" },
      { name: "metadataURI", type: "string"  },
    ],
    outputs: [{ name: "landId", type: "uint256" }],
  },
  {
    name: "verifyLand",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [{ name: "landId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "requestTransfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "landId", type: "uint256" }, { name: "to", type: "address" }],
    outputs: [],
  },
  {
    name: "approveTransfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [{ name: "landId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "executeTransfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "landId", type: "uint256" }, { name: "reason", type: "string" }],
    outputs: [],
  },
  {
    name: "cancelTransfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [{ name: "landId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "adminTransfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "landId", type: "uint256" },
      { name: "to",     type: "address" },
      { name: "reason", type: "string"  },
    ],
    outputs: [],
  },
  {
    name: "updateMetadata",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "landId", type: "uint256" }, { name: "newMetadataURI", type: "string" }],
    outputs: [],
  },
  {
    name: "grantRegistrarRole",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [{ name: "account", type: "address" }],
    outputs: [],
  },
  {
    name: "revokeRegistrarRole",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [{ name: "account", type: "address" }],
    outputs: [],
  },
  {
    name: "pause",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [],
    outputs: [],
  },
  {
    name: "unpause",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [],
    outputs: [],
  },
  // ── Events ────────────────────────────────────────────────────────────────
  {
    name: "LandRegistered",
    type: "event",
    inputs: [
      { name: "landId",      type: "uint256", indexed: true  },
      { name: "owner",       type: "address", indexed: true  },
      { name: "location",    type: "string",  indexed: false },
      { name: "size",        type: "uint256", indexed: false },
      { name: "metadataURI", type: "string",  indexed: false },
      { name: "timestamp",   type: "uint256", indexed: false },
    ],
  },
  {
    name: "LandVerified",
    type: "event",
    inputs: [
      { name: "landId",     type: "uint256", indexed: true  },
      { name: "verifiedBy", type: "address", indexed: true  },
      { name: "timestamp",  type: "uint256", indexed: false },
    ],
  },
  {
    name: "OwnershipTransferred",
    type: "event",
    inputs: [
      { name: "landId",    type: "uint256", indexed: true  },
      { name: "from",      type: "address", indexed: true  },
      { name: "to",        type: "address", indexed: true  },
      { name: "timestamp", type: "uint256", indexed: false },
      { name: "reason",    type: "string",  indexed: false },
    ],
  },
  {
    name: "OwnershipTransferRequested",
    type: "event",
    inputs: [
      { name: "landId",    type: "uint256", indexed: true  },
      { name: "from",      type: "address", indexed: true  },
      { name: "to",        type: "address", indexed: true  },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    name: "OwnershipTransferApproved",
    type: "event",
    inputs: [
      { name: "landId",     type: "uint256", indexed: true  },
      { name: "approvedBy", type: "address", indexed: true  },
      { name: "timestamp",  type: "uint256", indexed: false },
    ],
  },
  {
    name: "TransferRequestCancelled",
    type: "event",
    inputs: [
      { name: "landId",      type: "uint256", indexed: true  },
      { name: "cancelledBy", type: "address", indexed: true  },
      { name: "timestamp",   type: "uint256", indexed: false },
    ],
  },
  {
    name: "LandMetadataUpdated",
    type: "event",
    inputs: [
      { name: "landId",        type: "uint256", indexed: true  },
      { name: "newMetadataURI", type: "string",  indexed: false },
      { name: "timestamp",     type: "uint256", indexed: false },
    ],
  },
] as const;

// ─── Contract address ─────────────────────────────────────────────────────────

export const LAND_REGISTRY_ADDRESS =
  (process.env.NEXT_PUBLIC_LAND_REGISTRY_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

// ─── Role hashes (keccak256 of role strings) ──────────────────────────────────
// These match the contract constants exactly.
export const ADMIN_ROLE     = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775" as const;
export const REGISTRAR_ROLE = "0x5f58e3a2316349923ce3780f8d587db2d72378aed66a8261c916544fa6846ca5" as const;
