import { formatDistanceToNow, format } from "date-fns";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTimestamp(ts: bigint): string {
  const date = new Date(Number(ts) * 1000);
  return format(date, "dd MMM yyyy, HH:mm");
}

export function timeAgo(ts: bigint): string {
  const date = new Date(Number(ts) * 1000);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatSize(sqm: bigint): string {
  const n = Number(sqm);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} km²`;
  if (n >= 10_000)    return `${(n / 10_000).toFixed(2)} ha`;
  return `${n.toLocaleString()} m²`;
}

export function explorerTxUrl(hash: string, chainId = 84532): string {
  const base = chainId === 8453
    ? "https://basescan.org"
    : "https://sepolia.basescan.org";
  return `${base}/tx/${hash}`;
}

export function explorerAddressUrl(address: string, chainId = 84532): string {
  const base = chainId === 8453
    ? "https://basescan.org"
    : "https://sepolia.basescan.org";
  return `${base}/address/${address}`;
}
