"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useRoles } from "@/hooks/useContract";
import { cn } from "@/lib/utils";
import { Map, Plus, LayoutDashboard, ArrowLeftRight, Search, Shield, AlertTriangle } from "lucide-react";

const NAV_LINKS = [
  { href: "/",          label: "Home",      icon: Map           },
  { href: "/register",  label: "Register",  icon: Plus          },
  { href: "/transfer",  label: "Transfer",  icon: ArrowLeftRight },
  { href: "/land",      label: "Search",    icon: Search, adminOnly: true },
  { href: "/admin",     label: "Admin",     icon: Shield, adminOnly: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected } = useAccount();
  const { isAdmin, isRegistrar } = useRoles();

  const wasConnected = useRef(isConnected);

  useEffect(() => {
    if (wasConnected.current && !isConnected) {
      if (pathname !== "/") {
        router.push("/");
      }
    }
    wasConnected.current = isConnected;
  }, [isConnected, pathname, router]);

  // Dynamic portfolio link based on role
  const portfolioLink = isAdmin 
    ? { href: "/unverified", label: "Pending", icon: AlertTriangle }
    : { href: "/my-lands",   label: "My Lands", icon: LayoutDashboard };

  return (
    <header className="sticky top-0 z-50 border-b border-amber-900/30 bg-stone-950/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="text-amber-500 text-2xl">⚖</span>
          <span className="font-display text-lg font-semibold gold-text hidden sm:block">
            LandChain
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-0.5 mx-4 overflow-x-auto">
          {[NAV_LINKS[0], NAV_LINKS[1], portfolioLink, ...NAV_LINKS.slice(2)].map(({ href, label, icon: Icon, adminOnly }: any) => {
            if (adminOnly && !isAdmin) return null;
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  active
                    ? "bg-amber-900/30 text-amber-400"
                    : "text-stone-400 hover:text-amber-300 hover:bg-stone-800/50"
                )}
              >
                <Icon size={14} />
                <span className="hidden md:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Role badges + wallet */}
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-xs badge-pending font-mono">
              ADMIN
            </span>
          )}
          {isRegistrar && !isAdmin && (
            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-xs badge-verified font-mono">
              REGISTRAR
            </span>
          )}
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus="avatar"
          />
        </div>
      </div>
    </header>
  );
}
