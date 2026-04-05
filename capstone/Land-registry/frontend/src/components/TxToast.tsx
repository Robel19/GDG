"use client";

import { TxState } from "@/types";
import { explorerTxUrl } from "@/lib/utils";
import { useChainId } from "wagmi";
import { CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";

interface Props {
  txState: TxState;
  onClose: () => void;
}

export default function TxToast({ txState, onClose }: Props) {
  const chainId = useChainId();
  if (txState.status === "idle") return null;

  const icons = {
    pending:    <Loader2 size={16} className="animate-spin text-amber-400" />,
    confirming: <Loader2 size={16} className="animate-spin text-amber-400" />,
    success:    <CheckCircle size={16} className="text-emerald-400" />,
    error:      <XCircle size={16} className="text-red-400" />,
  };

  const colors = {
    pending:    "border-amber-800/60 bg-amber-950/80",
    confirming: "border-amber-800/60 bg-amber-950/80",
    success:    "border-emerald-800/60 bg-emerald-950/80",
    error:      "border-red-800/60 bg-red-950/80",
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-start gap-3 p-4 rounded-lg border backdrop-blur-md shadow-xl min-w-64 max-w-sm ${colors[txState.status]}`}>
      <div className="mt-0.5">{icons[txState.status]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-200 capitalize">{txState.status}</p>
        {txState.message && (
          <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">{txState.message}</p>
        )}
        {txState.hash && (
          <a
            href={explorerTxUrl(txState.hash, chainId)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-300 mt-1"
          >
            View on Explorer <ExternalLink size={10} />
          </a>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-stone-500 hover:text-stone-300 text-lg leading-none"
      >×</button>
    </div>
  );
}
