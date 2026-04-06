"use client";

import { useEffect, useState } from "react";
import { useWallet } from "./WalletProvider";
import { truncateAddress } from "@/lib/format";

export function ConnectWalletButton() {
  const { address, isConnected, connect, disconnect, connectError } = useWallet();
  const [crossmarkMissing, setCrossmarkMissing] = useState(false);

  useEffect(() => {
    // The Crossmark extension injects window.xrpl.crossmark asynchronously on
    // cold page load. Poll up to 1 second before concluding it's absent.
    if (window.xrpl?.crossmark) {
      return;
    }
    let attempts = 0;
    const id = setInterval(() => {
      attempts++;
      if (window.xrpl?.crossmark) {
        clearInterval(id);
        // Found — leave crossmarkMissing as false
      } else if (attempts >= 10) {
        clearInterval(id);
        setCrossmarkMissing(true);
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Install Crossmark prompt
  if (crossmarkMissing) {
    return (
      <a
        href="https://crossmark.io"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[12px] font-medium text-amber-600 hover:text-amber-700 border border-amber-200 rounded-full px-3.5 py-1.5 transition-colors"
      >
        Install Crossmark
      </a>
    );
  }

  // Connected state
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2.5">
        {/* Pulsing connected indicator */}
        <div className="relative flex items-center gap-2 border border-accent-glow bg-accent-wash rounded-full px-3.5 py-1.5">
          <span className="relative flex">
            <span className="w-[7px] h-[7px] rounded-full bg-accent" />
            <span className="absolute inset-0 rounded-full bg-accent animate-pulse-ring opacity-60" />
          </span>
          <span className="font-mono text-[12px] text-ink-secondary">
            {truncateAddress(address)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="text-[12px] font-medium text-ink-muted hover:text-ink transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Default: connect button (pill-shaped, matches prototype)
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={connect}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-ink-ghost bg-transparent text-[13px] font-medium text-ink hover:border-ink-muted hover:bg-surface transition-all"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="16" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
        Connect wallet
      </button>
      {connectError && (
        <p className="text-[11px] text-negative font-medium">{connectError}</p>
      )}
    </div>
  );
}
