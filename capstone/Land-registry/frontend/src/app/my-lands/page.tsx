"use client";

import { useAccount } from "wagmi";
import { useOwnerLands, useLand } from "@/hooks/useContract";
import LandCard from "@/components/LandCard";
import { Land } from "@/types";
import { Map, AlertTriangle, Loader2 } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// Render one card by fetching its data
function LandCardFetcher({ landId }: { landId: bigint }) {
  const { data, isLoading } = useLand(landId);
  if (isLoading) {
    return (
      <div className="registry-card rounded-lg p-5 flex items-center justify-center h-44">
        <Loader2 size={20} className="animate-spin text-amber-700" />
      </div>
    );
  }
  if (!data) return null;

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

  return <LandCard land={land} showOwner={false} />;
}

export default function MyLandsPage() {
  const { address, isConnected } = useAccount();
  const { data: landIds, isLoading, error } = useOwnerLands(address);

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <Map size={48} className="text-amber-700 mx-auto mb-4" />
        <h2 className="font-display text-3xl text-amber-200 mb-3">My Lands</h2>
        <p className="text-stone-400 mb-8">Connect your wallet to view your land portfolio.</p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <p className="font-mono text-xs text-amber-700 mb-1">YOUR PORTFOLIO</p>
          <h1 className="font-display text-4xl font-bold text-amber-100">My Lands</h1>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="registry-card rounded-lg h-44 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <AlertTriangle size={40} className="text-red-500 mx-auto mb-4" />
        <p className="text-stone-400">Failed to load your lands. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-mono text-xs text-amber-700 mb-1">YOUR PORTFOLIO</p>
          <h1 className="font-display text-4xl font-bold text-amber-100">My Lands</h1>
        </div>
        <span className="font-mono text-sm text-stone-500">
          {landIds?.length ?? 0} parcel{(landIds?.length ?? 0) !== 1 ? "s" : ""}
        </span>
      </div>

      {!landIds || landIds.length === 0 ? (
        <div className="registry-card rounded-xl p-12 text-center">
          <Map size={36} className="text-amber-800 mx-auto mb-3" />
          <p className="text-stone-400 mb-1">No land parcels found for this address.</p>
          <p className="text-xs text-stone-600">Lands assigned to your wallet will appear here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {landIds.map((id) => (
            <LandCardFetcher key={id.toString()} landId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
