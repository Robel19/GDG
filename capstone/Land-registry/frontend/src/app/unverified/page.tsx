"use client";

import { useAccount } from "wagmi";
import { useLand, useTotalLands, useRoles } from "@/hooks/useContract";
import LandCard from "@/components/LandCard";
import { Land } from "@/types";
import { AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMemo } from "react";

// Render one card by fetching its data
function UnverifiedLandCardFetcher({ landId }: { landId: bigint }) {
  const { data, isLoading } = useLand(landId);

  if (isLoading) {
    return (
      <div className="registry-card rounded-lg p-5 flex items-center justify-center h-44">
        <Loader2 size={20} className="animate-spin text-amber-700" />
      </div>
    );
  }
  
  if (!data || data.isVerified) return null;

  const land: Land = {
    landId:         data.landId,
    owner:          data.owner,
    location:       data.location,
    size:           data.size,
    metadataURI:    data.metadataURI,
    isVerified:     data.isVerified,
    registeredAt:   data.registeredAt,
    lastTransferAt: data.lastTransferAt,
  };

  return <LandCard land={land} showOwner={true} />;
}

export default function UnverifiedLandsPage() {
  const { isConnected } = useAccount();
  const { isAdmin } = useRoles();
  const { data: totalLands, isLoading } = useTotalLands();

  const landIds = useMemo(() => {
    if (!totalLands) return [];
    // Create array from totalLands down to 1 (newest first)
    return Array.from({ length: Number(totalLands) }, (_, i) => BigInt(Number(totalLands) - i));
  }, [totalLands]);

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <ShieldAlert size={48} className="text-amber-700 mx-auto mb-4" />
        <h2 className="font-display text-3xl text-amber-200 mb-3">Pending Verification</h2>
        <p className="text-stone-400 mb-8">Connect your admin wallet to view pending lands.</p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <AlertTriangle size={40} className="text-red-500 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-amber-200 mb-2">Access Denied</h2>
        <p className="text-stone-400">Only Admins can view the global unverified lands queue.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-mono text-xs text-amber-700 mb-1">ADMIN DASHBOARD</p>
          <h1 className="font-display text-4xl font-bold text-amber-100">Pending Verification</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="registry-card rounded-lg h-44 animate-pulse" />
          ))}
        </div>
      ) : landIds.length === 0 ? (
        <div className="registry-card rounded-xl p-12 text-center">
          <ShieldAlert size={36} className="text-amber-800 mx-auto mb-3" />
          <p className="text-stone-400 mb-1">No pending lands found.</p>
          <p className="text-xs text-stone-600">The registry is empty.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {landIds.map((id) => (
            <UnverifiedLandCardFetcher key={id.toString()} landId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
