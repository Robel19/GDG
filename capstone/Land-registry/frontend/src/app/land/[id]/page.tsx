"use client";


import { useLand, useTransferHistory, usePendingTransfer, useRoles } from "@/hooks/useContract";
import { useIPFS } from "@/hooks/useIPFS";
import TxToast from "@/components/TxToast";
import QRCode from "@/components/QRCode";
import { useContractWrite } from "@/hooks/useContract";
import { shortenAddress, formatSize, formatTimestamp, timeAgo, explorerAddressUrl } from "@/lib/utils";
import { useChainId } from "wagmi";
import {
  CheckCircle, XCircle, MapPin, Ruler, Calendar, User,
  ArrowRight, Clock, Link2, Loader2, Shield, AlertTriangle, ExternalLink
} from "lucide-react";

interface Props { params: { id: string } }

export default function LandDetailPage({ params }: Props) {
  const { id } = params;
  const landId = BigInt(id);
  const chainId = useChainId();
  const { isAdmin } = useRoles();
  const { execute, txState, isConfirming, reset } = useContractWrite();

  const { data: land,    isLoading: loadingLand,    error }   = useLand(landId);
  const { data: history, isLoading: loadingHistory, refetch: refetchHistory } = useTransferHistory(landId);
  const { data: pending, isLoading: loadingPending, refetch: refetchPending } = usePendingTransfer(landId);
  const { data: ipfsData } = useIPFS(land?.metadataURI);

  const busy = txState.status === "pending" || txState.status === "confirming" || isConfirming;
  const hasPending = pending && pending.to !== "0x0000000000000000000000000000000000000000";

  const verifyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/land/${id}`
    : `/land/${id}`;

  async function handleVerify() {
    try {
      await execute("verifyLand", [landId]);
      window.location.reload();
    } catch {}
  }

  if (loadingLand) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 flex justify-center">
        <Loader2 size={32} className="animate-spin text-amber-600" />
      </div>
    );
  }

  if (error || !land) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <AlertTriangle size={40} className="text-red-500 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-amber-200 mb-2">Parcel Not Found</h2>
        <p className="text-stone-400">No land parcel exists with ID #{id}.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="font-mono text-xs text-amber-700 mb-1">LAND RECORD</p>
          <h1 className="font-display text-4xl font-bold text-amber-100">
            Parcel #{land.landId.toString()}
          </h1>
          <p className="text-stone-400 mt-1">{land.location}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
            land.isVerified ? "badge-verified" : "badge-unverified"
          }`}>
            {land.isVerified
              ? <><CheckCircle size={14} /> Government Verified</>
              : <><XCircle size={14} /> Not Verified</>
            }
          </span>
          {isAdmin && !land.isVerified && (
            <button
              onClick={handleVerify}
              disabled={busy}
              className="btn-primary px-4 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
            >
              <Shield size={14} /> Verify
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-5">

          {/* Details card */}
          <div className="registry-card rounded-xl p-6">
            <h2 className="font-semibold text-amber-200 mb-4 text-sm uppercase tracking-wider">
              Parcel Details
            </h2>

            {ipfsData?.image && (
              <div className="mb-6 rounded-lg overflow-hidden border border-stone-800 bg-black/40 flex justify-center items-center h-64 md:h-80">
                <object
                  data={ipfsData.image.replace("ipfs://", "https://ipfs.io/ipfs/")}
                  className="w-full h-full object-contain"
                >
                  <div className="text-center p-4">
                    <p className="text-sm text-stone-500 mb-2">Attached Document/Image</p>
                    <a href={ipfsData.image.replace("ipfs://", "https://ipfs.io/ipfs/")} target="_blank" rel="noopener noreferrer" className="btn-primary px-4 py-2 rounded text-xs">
                      Open Document in New Tab
                    </a>
                  </div>
                </object>
              </div>
            )}

            <dl className="space-y-3">
              {[
                { icon: MapPin,   label: "Location",     value: land.location },
                { icon: Ruler,    label: "Size",         value: formatSize(land.size) },
                ...(ipfsData?.attributes?.find(a => a.trait_type === "Owner Name") ? [{
                  icon: User, label: "Owner Full Name", value: ipfsData.attributes.find(a => a.trait_type === "Owner Name")!.value as string
                }] : []),
                { icon: User,     label: "Current Owner",
                  value: (
                    <a href={explorerAddressUrl(land.owner, chainId)} target="_blank" rel="noopener noreferrer"
                      className="font-mono text-amber-400 hover:text-amber-200 flex items-center gap-1">
                      {shortenAddress(land.owner)} <ExternalLink size={10} />
                    </a>
                  )
                },
                { icon: Calendar, label: "Registered",   value: `${formatTimestamp(land.registeredAt)} (${timeAgo(land.registeredAt)})` },
                { icon: Calendar, label: "Last Transfer", value: formatTimestamp(land.lastTransferAt) },
                ...(land.metadataURI ? [{
                  icon: Link2, label: "Documents",
                  value: (
                    <a href={land.metadataURI.replace("ipfs://","https://ipfs.io/ipfs/")}
                      target="_blank" rel="noopener noreferrer"
                      className="text-amber-400 hover:text-amber-200 flex items-center gap-1 text-sm break-all">
                      {land.metadataURI} <ExternalLink size={10} />
                    </a>
                  )
                }] : []),
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
                  <Icon size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <dt className="text-xs text-stone-500 mb-0.5">{label}</dt>
                    <dd className="text-sm text-stone-300">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* Pending transfer */}
          {hasPending && (
            <div className="registry-card rounded-xl p-5 border-amber-700/30">
              <h2 className="font-semibold text-amber-400 mb-3 text-sm flex items-center gap-1.5">
                <Clock size={14} /> Pending Transfer
              </h2>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-900 mb-2">
                <span className="font-mono text-xs text-stone-400">{shortenAddress(land.owner)}</span>
                <ArrowRight size={14} className="text-amber-600" />
                <span className="font-mono text-xs text-amber-300">{shortenAddress(pending.to)}</span>
              </div>
              <div className="flex gap-4 text-xs text-stone-500">
                <span>Requested {timeAgo(pending.requestedAt)}</span>
                <span className={pending.adminApproved ? "text-emerald-400" : "text-amber-500"}>
                  {pending.adminApproved ? "✓ Admin approved" : "Awaiting admin approval"}
                </span>
              </div>
            </div>
          )}

          {/* Transfer history */}
          <div className="registry-card rounded-xl p-6">
            <h2 className="font-semibold text-amber-200 mb-4 text-sm uppercase tracking-wider">
              Transfer History
            </h2>
            {loadingHistory ? (
              <div className="flex justify-center py-4">
                <Loader2 size={20} className="animate-spin text-amber-700" />
              </div>
            ) : !history || history.length === 0 ? (
              <p className="text-stone-500 text-sm text-center py-4">No transfers recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {[...history].reverse().map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-stone-900/50">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-amber-900/40 flex items-center justify-center mt-0.5">
                      <span className="text-xs text-amber-600">{history.length - i}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-stone-400">{shortenAddress(rec.from)}</span>
                        <ArrowRight size={10} className="text-amber-700 shrink-0" />
                        <span className="font-mono text-xs text-amber-300">{shortenAddress(rec.to)}</span>
                      </div>
                      {rec.reason && (
                        <p className="text-xs text-stone-500 italic">"{rec.reason}"</p>
                      )}
                      <p className="text-xs text-stone-600 mt-0.5">{formatTimestamp(rec.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* QR code */}
          <div className="registry-card rounded-xl p-5 flex flex-col items-center">
            <h3 className="font-semibold text-amber-200 mb-4 text-sm">Verification QR</h3>
            <QRCode value={verifyUrl} size={140} label="Scan to verify ownership" />
          </div>

          {/* On-chain proof */}
          <div className="registry-card rounded-xl p-5">
            <h3 className="font-semibold text-amber-200 mb-3 text-sm">On-Chain Proof</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Token ID</span>
                <span className="font-mono text-amber-400">#{land.landId.toString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Standard</span>
                <span className="font-mono text-stone-300">ERC-721</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Network</span>
                <span className="font-mono text-stone-300">Base</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Verified</span>
                <span className={land.isVerified ? "text-emerald-400" : "text-red-400"}>
                  {land.isVerified ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="registry-card rounded-xl p-5">
              <h3 className="font-semibold text-amber-200 mb-3 text-sm flex items-center gap-1.5">
                <Shield size={14} /> Admin Actions
              </h3>
              <div className="space-y-2">
                {!land.isVerified && (
                  <button
                    onClick={handleVerify}
                    disabled={busy}
                    className="btn-primary w-full py-2 rounded-lg text-xs"
                  >
                    Verify Parcel
                  </button>
                )}
                {hasPending && !pending.adminApproved && (
                  <button
                    onClick={async () => { await execute("approveTransfer", [landId]); await refetchPending(); }}
                    disabled={busy}
                    className="btn-ghost w-full py-2 rounded-lg text-xs"
                  >
                    Approve Pending Transfer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <TxToast txState={txState} onClose={reset} />
    </div>
  );
}
