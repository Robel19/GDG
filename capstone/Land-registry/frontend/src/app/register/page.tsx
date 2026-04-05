"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRoles, useContractWrite } from "@/hooks/useContract";
import TxToast from "@/components/TxToast";
import { AlertTriangle, FileText, MapPin, Ruler, Upload, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const { isConnected } = useAccount();
  const { canRegister, isAdmin }  = useRoles();
  const { execute, txState, isConfirming, reset } = useContractWrite();

  const [form, setForm] = useState({
    fullName:    "",
    owner:       "",
    location:    "",
    size:        "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registeredId, setRegisteredId] = useState<string | null>(null);

  const busy = isUploading || txState.status === "pending" || txState.status === "confirming" || isConfirming;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.owner || !form.location || !form.size) return;

    try {
      let finalMetadataUri = "";

      if (file) {
        setIsUploading(true);
        const fileData = new FormData();
        fileData.append("file", file);
        fileData.append("fullName", form.fullName);
        fileData.append("location", form.location);
        fileData.append("size", form.size);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: fileData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to upload file to IPFS");
        }

        const data = await res.json();
        finalMetadataUri = data.metadataURI;
      }

      await execute(
        "registerLand",
        [
          form.owner as `0x${string}`,
          form.location,
          BigInt(form.size),
          finalMetadataUri,
        ],
        () => setSubmitted(true)
      );
      setRegisteredId("pending");
    } catch (err: any) {
      console.error(err);
      if (err instanceof Error) {
        alert(err.message);
      }
    } finally {
      setIsUploading(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <AlertTriangle size={40} className="text-amber-600 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-amber-200 mb-2">Wallet Required</h2>
        <p className="text-stone-400">Connect your wallet to register land parcels.</p>
      </div>
    );
  }

  if (!canRegister) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <AlertTriangle size={40} className="text-red-500 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-amber-200 mb-2">Access Denied</h2>
        <p className="text-stone-400">Only Admins and Registrars can register land parcels.</p>
      </div>
    );
  }

  if (submitted && txState.status === "confirming") {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-amber-600 border-t-transparent animate-spin mx-auto mb-6" />
        <h2 className="font-display text-2xl text-amber-200 mb-2">Registering Parcel…</h2>
        <p className="text-stone-400 text-sm">Transaction is being confirmed on Base Chain.</p>
        <TxToast txState={txState} onClose={reset} />
      </div>
    );
  }

  if (submitted && txState.status === "success") {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-amber-200 mb-2">Parcel Registered!</h2>
        <p className="text-stone-400 mb-6">The land parcel has been minted on-chain.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setForm({ fullName:"",owner:"",location:"",size:"" }); setFile(null); setSubmitted(false); reset(); }}
            className="btn-primary px-6 py-2 rounded-lg text-sm"
          >
            Register Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-xs text-amber-700 mb-1">REGISTRAR PORTAL</p>
        <h1 className="font-display text-4xl font-bold text-amber-100 mb-2">Register Land Parcel</h1>
        <p className="text-stone-400">Mint a new land NFT and assign it to an owner address.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-amber-200 mb-1.5 flex items-center gap-1.5">
            <FileText size={14} className="text-amber-600" /> Owner Full Name
          </label>
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="e.g. John Doe / Acme Corp"
            className="registry-input w-full px-4 py-2.5 rounded-lg text-sm"
          />
          <p className="text-xs text-stone-500 mt-1">This name will be permanently stored in the off-chain metadata</p>
        </div>

        {/* Owner Address */}
        <div>
          <label className="block text-sm font-medium text-amber-200 mb-1.5">
            Owner Wallet Address <span className="text-red-500">*</span>
          </label>
          <input
            name="owner"
            value={form.owner}
            onChange={handleChange}
            placeholder="0x..."
            required
            pattern="^0x[0-9a-fA-F]{40}$"
            className="registry-input w-full px-4 py-2.5 rounded-lg font-mono text-sm"
          />
          <p className="text-xs text-stone-500 mt-1">Ethereum address of the initial land owner</p>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-amber-200 mb-1.5 flex items-center gap-1.5">
            <MapPin size={14} className="text-amber-600" /> Location <span className="text-red-500">*</span>
          </label>
          <textarea
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="e.g. Lot 12, Block 4, Downtown Base City, BC 10001"
            required
            rows={2}
            className="registry-input w-full px-4 py-2.5 rounded-lg text-sm resize-none"
          />
          <p className="text-xs text-stone-500 mt-1">Must be unique — duplicates are rejected on-chain</p>
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-medium text-amber-200 mb-1.5 flex items-center gap-1.5">
            <Ruler size={14} className="text-amber-600" /> Area (m²) <span className="text-red-500">*</span>
          </label>
          <input
            name="size"
            type="number"
            min="1"
            value={form.size}
            onChange={handleChange}
            placeholder="e.g. 2500"
            required
            className="registry-input w-full px-4 py-2.5 rounded-lg text-sm"
          />
        </div>

        {/* Land Document / Photo */}
        <div>
          <label className="block text-sm font-medium text-amber-200 mb-1.5 flex items-center gap-1.5">
            <Upload size={14} className="text-amber-600" /> Land Photo / Document
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="registry-input w-full px-4 py-2.5 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-900/30 file:text-amber-300 hover:file:bg-amber-900/50"
          />
          <p className="text-xs text-stone-500 mt-1">Optional. Upload a photo or PDF to store securely on IPFS.</p>
        </div>

        {/* Info box */}
        <div className="rounded-lg bg-amber-950/30 border border-amber-900/40 p-4 text-xs text-stone-400 flex gap-2">
          <FileText size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            Registration mints an ERC-721 token to the owner. The land will be <strong className="text-amber-300">unverified</strong> until
            an admin calls <code className="text-amber-500">verifyLand()</code>. Only verified parcels can be transferred.
          </span>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="btn-primary w-full py-3 rounded-lg text-sm font-semibold"
        >
          {isUploading ? "Uploading to IPFS..." : busy ? "Submitting…" : "Register Land Parcel"}
        </button>
      </form>

      <TxToast txState={txState} onClose={reset} />
    </div>
  );
}
