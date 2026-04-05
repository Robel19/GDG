import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title:       "LandChain – Decentralized Land Registry on Base",
  description: "Secure, transparent on-chain land ownership registry powered by Base Chain",
  icons:       { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar />
          <main className="relative z-10 min-h-[calc(100vh-4rem)]">
            {children}
          </main>
          <footer className="relative z-10 border-t border-amber-900/20 py-6 text-center text-xs text-stone-600 font-mono">
            LandChain · Deployed on Base Chain · Immutable · Transparent
          </footer>
        </Providers>
      </body>
    </html>
  );
}
