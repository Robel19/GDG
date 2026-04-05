"use client";

import { useState } from "react";
import { useLand } from "@/hooks/useContract";
import { Search, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SearchPage() {
  const [input, setInput]     = useState("");
  const [query, setQuery]     = useState<bigint | undefined>();

  const { data: land, isLoading, error } = useLand(query);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const id = parseInt(input, 10);
    if (id >= 1) setQuery(BigInt(id));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="font-mono text-xs text-amber-700 mb-1">PUBLIC LOOKUP</p>
        <h1 className="font-display text-4xl font-bold text-amber-100 mb-2">Search Land Records</h1>
        <p className="text-stone-400">Look up any registered parcel by its on-chain ID.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="number"
          min="1"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter Land ID (e.g. 1)"
          className="registry-input flex-1 px-4 py-3 rounded-lg font-mono text-sm"
        />
        <button type="submit" className="btn-primary px-6 py-3 rounded-lg flex items-center gap-2 text-sm">
          <Search size={16} /> Search
        </button>
      </form>

      {isLoading && (
        <div className="registry-card rounded-xl p-12 flex justify-center">
          <Loader2 size={24} className="animate-spin text-amber-600" />
        </div>
      )}

      {error && (
        <div className="registry-card rounded-xl p-8 text-center text-stone-400">
          No parcel found with ID {query?.toString()}.
        </div>
      )}

      {land && !isLoading && (
        <div className="registry-card rounded-xl p-5 text-center">
          <p className="font-mono text-xs text-amber-700 mb-2">PARCEL #{land.landId.toString()} FOUND</p>
          <p className="text-amber-100 font-semibold mb-4">{land.location}</p>
          <Link
            href={`/land/${land.landId}`}
            className="btn-primary inline-block px-8 py-2.5 rounded-lg text-sm"
          >
            View Full Details →
          </Link>
        </div>
      )}
    </div>
  );
}
