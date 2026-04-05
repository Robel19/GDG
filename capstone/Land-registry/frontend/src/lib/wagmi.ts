import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { baseSepolia, base } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";

/** Real ID from https://cloud.walletconnect.com — omit or leave placeholder to use browser wallets only. */
function walletConnectProjectId(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
  if (!raw) return undefined;
  if (/^your_project_id_here$/i.test(raw)) return undefined;
  if (raw === "YOUR_PROJECT_ID") return undefined;
  if (raw.length < 10) return undefined;
  return raw;
}

const wcId = walletConnectProjectId();

// Dynamically build connectors — only import walletConnect if needed
const connectors = [
  coinbaseWallet({ appName: "Land Registry | Base Chain" }),
];

export const config = createConfig({
  chains:      [baseSepolia, base],
  connectors,
  transports: {
    [baseSepolia.id]: http(),
    [base.id]:        http(),
  },
  ssr:    true,
  storage: createStorage({ storage: cookieStorage }),
});

export const HAS_WALLETCONNECT = Boolean(wcId);

export { baseSepolia, base };
export const TARGET_CHAIN = baseSepolia;
