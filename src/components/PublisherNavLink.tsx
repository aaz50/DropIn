"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWallet } from "./WalletProvider";
import type { PublisherProfile } from "@/types";

// undefined = not yet checked, null = checked + not a publisher, string = publisher ID
type PublisherIdState = string | null | undefined;

export function PublisherNavLink() {
  const { address } = useWallet();
  const [publisherId, setPublisherId] = useState<PublisherIdState>(undefined);

  useEffect(() => {
    if (!address) {
      setPublisherId(undefined);
      return;
    }

    let cancelled = false;
    setPublisherId(undefined);

    fetch(`/api/publishers?walletAddress=${encodeURIComponent(address)}`)
      .then((r) => {
        if (!r.ok) return null;
        return r.json() as Promise<PublisherProfile>;
      })
      .then((data) => {
        if (cancelled) return;
        setPublisherId(data?.id ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setPublisherId(null);
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  if (typeof publisherId === "string") {
    return (
      <Link
        href={`/publishers/${publisherId}/dashboard`}
        className="text-[13px] font-medium text-accent hover:text-accent-deep transition-colors tracking-[0.1px]"
      >
        My Dashboard
      </Link>
    );
  }

  return (
    <Link
      href="/publishers/register"
      className="text-[13px] font-medium text-ink-secondary hover:text-ink transition-colors tracking-[0.1px]"
    >
      For publishers
    </Link>
  );
}
