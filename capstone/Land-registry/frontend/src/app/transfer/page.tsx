"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useLand, useOwnerLands, usePendingTransfer, useContractWrite, useRoles } from "@/hooks/useContract";
import TxToast from "@/components/TxToast";
import { shortenAddress, formatTimestamp } from "@/lib/utils";
import { AlertTriangle, ArrowRight, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

type Step = "lookup" | "request" | "execute" | "cancel";

export default function TransferPage() {
  const { address, isConnected } = useAccount();
  const { isAdmin } = useRoles();
  const { execute, txState, isConfirming, reset } = useContractWrite();

  const [landIdInput, setLandIdInput] = useState("");
  const [toAddress,   setToAddress]   = useState("");
  const [reason,      setReason]      = useState("");
  const [activeLandId, setActiveLandId] = useState<bigint | undefined>();

  const { data: ownerLandIds, isLoading: loadingOwnerLands } = useOwnerLands(address);
  const { data: land,    isLoading: loadingLand    } = useLand(activeLandId);
  const { data: pending, isLoading: loadingPending, refetch: refetchPending } = usePendingTransfer(activeLandId);

  // Auto-select first land if none selected
  useEffect(() => {
    if (ownerLandIds && ownerLandIds.length > 0 && activeLandId === undefined) {
      setActiveLandId(ownerLandIds[0]);
    }
  }, [ownerLandIds, activeLandId]);

  const busy = txState.status === "pending" || txState.status === "confirming" || isConfirming;

  const isOwner = land && address && land.owner.toLowerCase() === address.toLowerCase();
  const hasPending = pending && pending.to !== "0x0000000000000000000000000000000000000000";



  async function doRequest() {
    if (!activeLandId || !toAddress) return;
    try {
      await execute("requestTransfer", [activeLandId, toAddress as `0x${string}`]);
      await refetchPending();
    } catch {}
  }

  async function doApprove() {
    if (!activeLandId) return;
    try {
      await execute("approveTransfer", [activeLandId]);
      await refetchPending();
    } catch {}
  }

  async function doExecute() {
    if (!activeLandId) return;
    try {
      await execute("executeTransfer", [activeLandId, reason]);
      await refetchPending();
    } catch {}
  }

  async function doCancel() {
    if (!activeLandId) return;
    try {
      await execute("cancelTransfer", [activeLandId]);
      await refetchPending();
    } catch {}
  }

  async function doAdminTransfer() {
    if (!activeLandId || !toAddress) return;
    try {
      await execute("adminTransfer", [activeLandId, toAddress as `0x${string}`, reason]);
      await refetchPending();
    } catch {}
  }

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <AlertTriangle size={40} className="text-amber-600 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-amber-200 mb-2">Wallet Required</h2>
        <p className="text-stone-400 mb-6">Connect your wallet to transfer land ownership.</p>
        <div className="flex justify-center"><ConnectButton /></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="font-mono text-xs text-amber-700 mb-1">OWNERSHIP TRANSFER</p>
        <h1 className="font-display text-4xl font-bold text-amber-100 mb-2">Transfer Land</h1>
        <p className="text-stone-400 text-sm">
          Transfers use a two-step flow: owner requests → admin approves → owner executes.
        </p>
      </div>

      {/* Land lookup / dropdown */}
      <div className="registry-card rounded-xl p-5 mb-5">
        <label className="block text-sm font-medium text-amber-200 mb-2">Select Your Land Parcel</label>
        {loadingOwnerLands ? (
          <div className="flex items-center gap-2 text-sm text-stone-400">
            <Loader2 size={16} className="animate-spin text-amber-600" /> Scanning your portfolio...
          </div>
        ) : !ownerLandIds || ownerLandIds.length === 0 ? (
          <div className="text-sm text-stone-500 italic p-3 rounded bg-stone-900 overflow-hidden">
            No land parcels found in your wallet.
          </div>
        ) : (
          <select
            value={activeLandId?.toString() || ""}
            onChange={e => setActiveLandId(BigInt(e.target.value))}
            className="registry-input w-full px-4 py-2.5 rounded-lg text-sm font-mono appearance-none"
          >
            {ownerLandIds.map(id => (
              <option key={id.toString()} value={id.toString()}>
                Parcel #{id.toString()}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Land info */}
      {loadingLand && (
        <div className="registry-card rounded-xl p-8 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-amber-600" />
        </div>
      )}

      {land && (
        <div className="registry-card rounded-xl p-5 mb-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="font-mono text-xs text-amber-700">PARCEL #{land.landId.toString()}</span>
              <p className="text-amber-100 font-semibold mt-0.5">{land.location}</p>
            </div>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${land.isVerified ? "badge-verified" : "badge-unverified"}`}>
              {land.isVerified ? <><CheckCircle size={10} /> Verified</> : <><XCircle size={10} /> Unverified</>}
            </span>
          </div>
          <p className="text-xs text-stone-500 font-mono">
            Owner: {shortenAddress(land.owner)}
            {isOwner && <span className="ml-2 text-amber-600">(you)</span>}
          </p>

          {!land.isVerified && (
            <div className="mt-3 p-3 rounded-lg bg-red-950/30 border border-red-900/40 text-xs text-red-400 flex gap-1.5">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              Land must be verified by an admin before it can be transferred.
            </div>
          )}

          {/* Pending transfer status */}
          {hasPending && (
            <div className="mt-4 p-4 rounded-lg bg-amber-950/30 border border-amber-800/40">
              <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                <Clock size={12} /> Pending Transfer Request
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-stone-400">
                <span>To:</span>
                <span className="font-mono">{shortenAddress(pending.to)}</span>
                <span>Requested:</span>
                <span>{formatTimestamp(pending.requestedAt)}</span>
                <span>Admin approved:</span>
                <span className={pending.adminApproved ? "text-emerald-400" : "text-red-400"}>
                  {pending.adminApproved ? "Yes ✓" : "No — awaiting admin"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action panels */}
      {land && land.isVerified && (
        <div className="space-y-4">

          {/* 1: Request transfer (owner) */}
          {isOwner && !hasPending && (
            <div className="registry-card rounded-xl p-5">
              <h3 className="font-semibold text-amber-200 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-900 text-amber-400 text-xs flex items-center justify-center font-mono">1</span>
                Request Transfer
              </h3>
              <input
                value={toAddress}
                onChange={e => setToAddress(e.target.value)}
                placeholder="Recipient address (0x...)"
                className="registry-input w-full px-4 py-2.5 rounded-lg font-mono text-sm mb-3"
              />
              <button onClick={doRequest} disabled={busy || !toAddress} className="btn-primary w-full py-2.5 rounded-lg text-sm">
                {busy ? "Submitting…" : "Submit Transfer Request"}
              </button>
            </div>
          )}

          {/* 2: Admin approve */}
          {isAdmin && hasPending && !pending.adminApproved && (
            <div className="registry-card rounded-xl p-5">
              <h3 className="font-semibold text-amber-200 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-900 text-amber-400 text-xs flex items-center justify-center font-mono">2</span>
                Admin Approval
              </h3>
              <p className="text-sm text-stone-400 mb-3">
                Transfer requested to <span className="font-mono text-amber-400">{shortenAddress(pending.to)}</span>.
                Approve to allow the owner to execute.
              </p>
              <div className="flex gap-2">
                <button onClick={doApprove} disabled={busy} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">
                  {busy ? "Submitting…" : "Approve Transfer"}
                </button>
                <button onClick={doCancel} disabled={busy} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* 3: Execute transfer (owner) */}
          {isOwner && hasPending && pending.adminApproved && (
            <div className="registry-card rounded-xl p-5">
              <h3 className="font-semibold text-amber-200 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-900 text-emerald-400 text-xs flex items-center justify-center font-mono">3</span>
                Execute Transfer
                <span className="badge-verified px-2 py-0.5 rounded text-xs ml-auto">Admin Approved</span>
              </h3>
              <div className="flex items-center gap-3 mb-3 p-3 rounded-lg bg-stone-900">
                <span className="font-mono text-xs text-stone-400">{shortenAddress(land.owner)}</span>
                <ArrowRight size={14} className="text-amber-600 shrink-0" />
                <span className="font-mono text-xs text-amber-300">{shortenAddress(pending.to)}</span>
              </div>
              <input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Reason (e.g. 'Sale', 'Gift', 'Court order') — stored on-chain"
                className="registry-input w-full px-4 py-2.5 rounded-lg text-sm mb-3"
              />
              <div className="flex gap-2">
                <button onClick={doExecute} disabled={busy} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">
                  {busy ? "Submitting…" : "Execute Transfer"}
                </button>
                <button onClick={doCancel} disabled={busy} className="btn-ghost py-2.5 px-4 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Admin direct transfer */}
          {isAdmin && (
            <details className="registry-card rounded-xl p-5">
              <summary className="text-sm font-medium text-amber-600 cursor-pointer">
                Admin Direct Transfer (emergency / legal order)
              </summary>
              <div className="mt-4 space-y-3">
                <input
                  value={toAddress}
                  onChange={e => setToAddress(e.target.value)}
                  placeholder="New owner address (0x...)"
                  className="registry-input w-full px-4 py-2.5 rounded-lg font-mono text-sm"
                />
                <input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Legal reason (required)"
                  className="registry-input w-full px-4 py-2.5 rounded-lg text-sm"
                />
                <button onClick={doAdminTransfer} disabled={busy || !toAddress} className="btn-primary w-full py-2.5 rounded-lg text-sm">
                  {busy ? "Submitting…" : "Force Transfer"}
                </button>
              </div>
            </details>
          )}
        </div>
      )}

      <TxToast txState={txState} onClose={reset} />
    </div>
  );
}
