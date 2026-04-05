"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRoles, useTotalLands, useIsPaused, useContractWrite } from "@/hooks/useContract";
import TxToast from "@/components/TxToast";
import { Shield, AlertTriangle, UserPlus, UserMinus, Pause, Play, Loader2 } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function AdminPage() {
  const { isConnected } = useAccount();
  const { isAdmin } = useRoles();
  const { data: totalLands } = useTotalLands();
  const { data: isPaused, refetch: refetchPaused } = useIsPaused();
  const { execute, txState, isConfirming, reset } = useContractWrite();

  const [grantAddr, setGrantAddr] = useState("");
  const [revokeAddr, setRevokeAddr] = useState("");
  const busy = txState.status === "pending" || txState.status === "confirming" || isConfirming;

  async function doGrant() {
    if (!grantAddr) return;
    try { await execute("grantRegistrarRole", [grantAddr as `0x${string}`]); setGrantAddr(""); } catch { }
  }

  async function doRevoke() {
    if (!revokeAddr) return;
    try { await execute("revokeRegistrarRole", [revokeAddr as `0x${string}`]); setRevokeAddr(""); } catch { }
  }

  async function togglePause() {
    try {
      await execute(isPaused ? "unpause" : "pause", []);
      await refetchPaused();
    } catch { }
  }

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <Shield size={40} className="text-amber-600 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-amber-200 mb-2">Admin Panel</h2>
        <p className="text-stone-400 mb-6">Connect your wallet to access admin controls.</p>
        <div className="flex justify-center"><ConnectButton /></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <AlertTriangle size={40} className="text-red-500 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-amber-200 mb-2">Access Denied</h2>
        <p className="text-stone-400">You do not have the ADMIN_ROLE for this contract.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="font-mono text-xs text-amber-700 mb-1">ADMIN PORTAL</p>
        <h1 className="font-display text-4xl font-bold text-amber-100 mb-2">Admin Panel</h1>
        <p className="text-stone-400 text-sm">Manage roles, contract state, and registry settings.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Parcels", value: totalLands?.toString() ?? "…" },
          {
            label: "Contract State", value: isPaused ? "PAUSED" : "ACTIVE",
            color: isPaused ? "text-red-400" : "text-emerald-400"
          },
          { label: "Your Role", value: "ADMIN" },
        ].map(({ label, value, color }) => (
          <div key={label} className="registry-card rounded-xl p-4 text-center">
            <div className={`font-display text-xl font-bold mb-1 ${color ?? "text-amber-300"}`}>{value}</div>
            <div className="text-xs text-stone-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {/* Contract pause */}
        <div className="registry-card rounded-xl p-5">
          <h2 className="font-semibold text-amber-200 mb-1 flex items-center gap-2">
            {isPaused ? <Play size={16} className="text-emerald-500" /> : <Pause size={16} className="text-red-500" />}
            Contract {isPaused ? "Unpause" : "Pause"}
          </h2>
          <p className="text-xs text-stone-500 mb-4">
            {isPaused
              ? "Contract is paused. All write operations are disabled. Click to resume."
              : "Pausing disables all registration, verification, and transfer operations."}
          </p>
          <button
            onClick={togglePause}
            disabled={busy}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-opacity ${isPaused ? "btn-primary" : "bg-red-900/50 border border-red-700/50 text-red-300 hover:bg-red-900/70"
              } ${busy ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? "Unpause Contract" : "Pause Contract"}
          </button>
        </div>

        {/* Grant registrar */}
        <div className="registry-card rounded-xl p-5">
          <h2 className="font-semibold text-amber-200 mb-1 flex items-center gap-2">
            <UserPlus size={16} className="text-emerald-500" /> Grant Registrar Role
          </h2>
          <p className="text-xs text-stone-500 mb-4">
            Registrars can register new land parcels and update metadata, but cannot verify or approve transfers.
          </p>
          <div className="flex gap-2">
            <input
              value={grantAddr}
              onChange={e => setGrantAddr(e.target.value)}
              placeholder="0x address..."
              className="registry-input flex-1 px-4 py-2.5 rounded-lg font-mono text-sm"
            />
            <button
              onClick={doGrant}
              disabled={busy || !grantAddr}
              className="btn-primary px-6 py-2.5 rounded-lg text-sm"
            >
              {busy ? "…" : "Grant"}
            </button>
          </div>
        </div>

        {/* Revoke registrar */}
        <div className="registry-card rounded-xl p-5">
          <h2 className="font-semibold text-amber-200 mb-1 flex items-center gap-2">
            <UserMinus size={16} className="text-red-400" /> Revoke Registrar Role
          </h2>
          <p className="text-xs text-stone-500 mb-4">
            Remove registrar access from an address. This does not affect any lands they have already registered.
          </p>
          <div className="flex gap-2">
            <input
              value={revokeAddr}
              onChange={e => setRevokeAddr(e.target.value)}
              placeholder="0x address..."
              className="registry-input flex-1 px-4 py-2.5 rounded-lg font-mono text-sm"
            />
            <button
              onClick={doRevoke}
              disabled={busy || !revokeAddr}
              className="bg-red-900/40 border border-red-800/50 text-red-300 hover:bg-red-900/60 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
            >
              {busy ? "…" : "Revoke"}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-lg bg-stone-900/50 border border-stone-800 p-4 text-xs text-stone-500">
          <p className="font-semibold text-stone-400 mb-2">Role Hierarchy</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><span className="text-amber-400">DEFAULT_ADMIN_ROLE</span> — Can grant/revoke any role</li>
            <li><span className="text-amber-400">ADMIN_ROLE</span> — Can verify land, approve/force transfers, pause contract</li>
            <li><span className="text-amber-400">REGISTRAR_ROLE</span> — Can register land and update metadata</li>
          </ul>
        </div>
      </div>

      <TxToast txState={txState} onClose={reset} />
    </div>
  );
}
