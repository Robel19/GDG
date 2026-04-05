"use client";

import Link from "next/link";
import { Land } from "@/types";
import { shortenAddress, formatSize, formatTimestamp } from "@/lib/utils";
import { MapPin, User, Ruler, Calendar, CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface Props {
  land: Land;
  showOwner?: boolean;
}

export default function LandCard({ land, showOwner = true }: Props) {
  return (
    <div className="registry-card rounded-lg p-5 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="font-mono text-xs text-amber-600">PARCEL #{land.landId.toString()}</span>
          <h3 className="font-display text-lg text-amber-100 mt-0.5 line-clamp-1">
            {land.location}
          </h3>
        </div>
        <span className={`shrink-0 ml-2 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
          land.isVerified ? "badge-verified" : "badge-unverified"
        }`}>
          {land.isVerified
            ? <><CheckCircle size={11} /> Verified</>
            : <><XCircle size={11} /> Unverified</>
          }
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div className="flex items-center gap-2 text-stone-400">
          <Ruler size={14} className="text-amber-700" />
          <span>{formatSize(land.size)}</span>
        </div>
        <div className="flex items-center gap-2 text-stone-400">
          <Calendar size={14} className="text-amber-700" />
          <span>{formatTimestamp(land.registeredAt)}</span>
        </div>
        {showOwner && (
          <div className="flex items-center gap-2 text-stone-400 col-span-2">
            <User size={14} className="text-amber-700" />
            <span className="font-mono text-xs">{shortenAddress(land.owner)}</span>
          </div>
        )}
        {land.metadataURI && (
          <div className="flex items-center gap-2 text-stone-400 col-span-2">
            <MapPin size={14} className="text-amber-700" />
            <a
              href={land.metadataURI.replace("ipfs://", "https://ipfs.io/ipfs/")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-400 text-xs truncate flex items-center gap-1"
            >
              {land.metadataURI.slice(0, 32)}… <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <Link
        href={`/land/${land.landId}`}
        className="block w-full text-center py-2 rounded btn-ghost text-sm mt-1"
      >
        View Details →
      </Link>
    </div>
  );
}
