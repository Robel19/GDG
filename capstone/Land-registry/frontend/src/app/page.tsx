"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useTotalLands, useRoles } from "@/hooks/useContract";
import { Map, Plus, Shield, ArrowLeftRight, Search, Landmark, Lock, Globe } from "lucide-react";

export default function HomePage() {
  const { isConnected } = useAccount();
  const { data: totalLands } = useTotalLands();
  const { isAdmin, isRegistrar } = useRoles();

  const stats = [
    { label: "Registered Parcels", value: totalLands?.toString() ?? "—", icon: Map },
    { label: "Network", value: "Base Sepolia", icon: Globe },
    { label: "Contract Standard", value: "ERC-721", icon: Landmark },
    { label: "Transfer Model", value: "2-Step Approval", icon: Lock },
  ];

  const features = [
    {
      title: "On-Chain Ownership",
      body: "Every land parcel is minted as an NFT. Ownership is immutable, publicly verifiable, and cannot be altered without cryptographic proof.",
      icon: Landmark,
    },
    {
      title: "Government Verification",
      body: "Authorised registrars assign official verification status to parcels, bridging traditional legal systems and blockchain records.",
      icon: Shield,
    },
    {
      title: "Two-Step Transfers",
      body: "Ownership transfers require both a owner request and admin approval, preventing fraudulent transfers and ensuring regulatory compliance.",
      icon: Lock,
    },
    {
      title: "Full Audit Trail",
      body: "Every action — registration, verification, and transfer — is permanently recorded on Base Chain with timestamps and reasons.",
      icon: Search,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">

      {/* Hero */}
      <div className="text-center mb-20 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-800/40 text-amber-600 text-xs font-mono mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Live on Base Sepolia Testnet
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold gold-text mb-6 leading-tight">
          Land Registry<br />on the Blockchain
        </h1>

        <p className="text-stone-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          A decentralised, tamper-proof land ownership system built on Base Chain.
          Register parcels, verify ownership, and transfer titles — all on-chain.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isConnected ? (
            <>
              <Link href="/my-lands" className="btn-primary px-8 py-3 rounded-lg text-sm font-semibold">
                My Lands Dashboard →
              </Link>
              {(isAdmin || isRegistrar) && (
                <Link href="/register" className="btn-ghost px-8 py-3 rounded-lg text-sm font-semibold">
                  Register Parcel
                </Link>
              )}
            </>
          ) : (
            <>
              {isAdmin && (
                <Link href="/land" className="btn-primary px-8 py-3 rounded-lg text-sm font-semibold">
                  Search Land Records →
                </Link>
              )}
              <Link href="/my-lands" className="btn-ghost px-8 py-3 rounded-lg text-sm font-semibold">
                Connect Wallet
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="registry-card rounded-xl p-5 text-center">
            <Icon size={20} className="text-amber-600 mx-auto mb-2" />
            <div className="font-display text-2xl font-bold text-amber-300 mb-1">{value}</div>
            <div className="text-xs text-stone-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="mb-20">
        <h2 className="font-display text-3xl text-amber-200 text-center mb-10">
          Built for Permanence
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map(({ title, body, icon: Icon }) => (
            <div key={title} className="registry-card rounded-xl p-6 flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-900/30 flex items-center justify-center">
                <Icon size={18} className="text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-200 mb-1">{title}</h3>
                <p className="text-sm text-stone-400 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ...(isAdmin ? [{ href: "/land", label: "Search a Parcel", icon: Search, desc: "Look up any land ID" }] : []),
          { href: "/transfer", label: "Transfer Ownership", icon: ArrowLeftRight, desc: "Initiate a title transfer" },
          ...(isAdmin || isRegistrar
            ? [{ href: "/register", label: "Register Land", icon: Plus, desc: "Add a new parcel on-chain" }]
            : [{ href: "/my-lands", label: "My Portfolio", icon: Map, desc: "View lands you own" }]
          ),
        ].map(({ href, label, icon: Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="registry-card rounded-xl p-6 flex flex-col items-center text-center gap-3 hover:border-amber-600/40 transition-all"
          >
            <Icon size={24} className="text-amber-500" />
            <div>
              <div className="font-semibold text-amber-200 text-sm">{label}</div>
              <div className="text-xs text-stone-500 mt-0.5">{desc}</div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
