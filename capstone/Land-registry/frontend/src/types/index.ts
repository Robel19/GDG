// ─── On-chain structs ─────────────────────────────────────────────────────────

export interface Land {
  landId:         bigint;
  owner:          `0x${string}`;
  location:       string;
  size:           bigint;
  metadataURI:    string;
  isVerified:     boolean;
  registeredAt:   bigint;
  lastTransferAt: bigint;
}

export interface TransferRecord {
  from:      `0x${string}`;
  to:        `0x${string}`;
  timestamp: bigint;
  reason:    string;
}

export interface PendingTransfer {
  to:            `0x${string}`;
  requestedAt:   bigint;
  adminApproved: boolean;
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

export type TxStatus = "idle" | "pending" | "confirming" | "success" | "error";

export interface TxState {
  status:  TxStatus;
  hash?:   `0x${string}`;
  message?: string;
}

export interface LandWithPending extends Land {
  pending?: PendingTransfer;
}
