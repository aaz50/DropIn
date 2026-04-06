"use client";

import { useEffect, useReducer, useCallback } from "react";
import { useWallet } from "./WalletProvider";
import type { IssuedCurrencyAmount } from "xrpl";

const RLUSD_CURRENCY =
  process.env.NEXT_PUBLIC_RLUSD_CURRENCY ??
  "524C555344000000000000000000000000000000";
const RLUSD_ISSUER = process.env.NEXT_PUBLIC_RLUSD_ISSUER ?? "";

type Props = {
  articleId: string;
  price: number;
  currency: string;
  publisherWalletAddress: string;
  preview: string;
};

type State =
  | { phase: "checking" }
  | { phase: "trustline-checking" }
  | { phase: "trustline-needed" }
  | { phase: "trustline-pending" }
  | { phase: "publisher-no-trustline" }  // publisher can't receive RLUSD — no retry
  | { phase: "idle" }
  | { phase: "signing" }
  | { phase: "verifying" }
  | { phase: "unlocked"; content: string; txHash: string }
  | { phase: "error"; message: string };

type Action =
  | { type: "ALREADY_PAID"; content: string }
  | { type: "NOT_PAID" }
  | { type: "TRUSTLINE_OK" }
  | { type: "TRUSTLINE_MISSING" }
  | { type: "PUBLISHER_NO_TRUSTLINE" }
  | { type: "TRUSTLINE_SIGN_START" }
  | { type: "TRUSTLINE_DONE" }
  | { type: "SIGN_START" }
  | { type: "VERIFY_START" }
  | { type: "SUCCESS"; content: string; txHash: string }
  | { type: "ERROR"; message: string }
  | { type: "RETRY" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ALREADY_PAID":
      return { phase: "unlocked", content: action.content, txHash: "" };
    case "NOT_PAID":
      return { phase: "checking" }; // will be followed by trustline check if RLUSD
    case "TRUSTLINE_OK":
      return { phase: "idle" };
    case "TRUSTLINE_MISSING":
      return { phase: "trustline-needed" };
    case "PUBLISHER_NO_TRUSTLINE":
      return { phase: "publisher-no-trustline" };
    case "TRUSTLINE_SIGN_START":
      return { phase: "trustline-pending" };
    case "TRUSTLINE_DONE":
      return { phase: "idle" };
    case "SIGN_START":
      return { phase: "signing" };
    case "VERIFY_START":
      return { phase: "verifying" };
    case "SUCCESS":
      return { phase: "unlocked", content: action.content, txHash: action.txHash };
    case "ERROR":
      return { phase: "error", message: action.message };
    case "RETRY":
      return { phase: "idle" };
    default:
      return state;
  }
}

function xrpToDropsStr(xrp: number): string {
  return String(Math.round(xrp * 1_000_000));
}

function truncateHash(hash: string): string {
  if (hash.length < 12) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

type TrustLineResult = { hasTrustLine: boolean; publisherHasTrustLine?: boolean };

async function checkTrustLines(
  address: string,
  publisherAddress: string
): Promise<TrustLineResult> {
  try {
    const res = await fetch(
      `/api/trustline?address=${encodeURIComponent(address)}&publisher=${encodeURIComponent(publisherAddress)}`
    );
    if (!res.ok) return { hasTrustLine: false };
    return (await res.json()) as TrustLineResult;
  } catch {
    return { hasTrustLine: false };
  }
}

export function PaywallGate({
  articleId,
  price,
  currency,
  publisherWalletAddress,
  preview,
}: Props) {
  const { address, isConnected, connect } = useWallet();
  const [state, dispatch] = useReducer(reducer, { phase: "checking" });
  const isRLUSD = currency === "RLUSD";

  // On mount (or wallet connect): check if reader already paid, then check trust line
  useEffect(() => {
    if (!isConnected || !address) {
      dispatch({ type: "TRUSTLINE_OK" }); // jump straight to idle
      return;
    }

    let cancelled = false;

    // Publisher previewing their own article — fetch without payment
    if (address === publisherWalletAddress) {
      fetch(`/api/articles/${articleId}?publisherAddress=${encodeURIComponent(address)}`)
        .then((r) => r.json())
        .then((data: unknown) => {
          if (cancelled) return;
          if (
            typeof data === "object" &&
            data !== null &&
            "content" in data &&
            typeof (data as Record<string, unknown>).content === "string"
          ) {
            dispatch({ type: "ALREADY_PAID", content: (data as { content: string }).content });
          } else {
            dispatch({ type: "TRUSTLINE_OK" });
          }
        })
        .catch(() => { if (!cancelled) dispatch({ type: "TRUSTLINE_OK" }); });
      return () => { cancelled = true; };
    }

    fetch(`/api/articles/${articleId}?readerAddress=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then(async (data: unknown) => {
        if (cancelled) return;
        if (
          typeof data === "object" &&
          data !== null &&
          "content" in data &&
          typeof (data as Record<string, unknown>).content === "string"
        ) {
          dispatch({
            type: "ALREADY_PAID",
            content: (data as { content: string }).content,
          });
          return;
        }

        // Not paid — if RLUSD, check trust lines before showing pay button
        if (isRLUSD) {
          const result = await checkTrustLines(address, publisherWalletAddress);
          if (cancelled) return;
          if (result.publisherHasTrustLine === false) {
            dispatch({ type: "PUBLISHER_NO_TRUSTLINE" });
          } else if (result.hasTrustLine) {
            dispatch({ type: "TRUSTLINE_OK" });
          } else {
            dispatch({ type: "TRUSTLINE_MISSING" });
          }
        } else {
          dispatch({ type: "TRUSTLINE_OK" });
        }
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: "TRUSTLINE_OK" });
      });

    return () => {
      cancelled = true;
    };
  }, [articleId, address, isConnected, isRLUSD]);

  const handleSetupTrustLine = useCallback(async () => {
    if (!address || !window.xrpl?.crossmark) {
      dispatch({ type: "ERROR", message: "Crossmark extension not found" });
      return;
    }
    if (!RLUSD_ISSUER) {
      dispatch({ type: "ERROR", message: "RLUSD issuer not configured. Check your .env.local file." });
      return;
    }

    dispatch({ type: "TRUSTLINE_SIGN_START" });

    try {
      const trustSetTx = {
        TransactionType: "TrustSet",
        Account: address,
        LimitAmount: {
          currency: RLUSD_CURRENCY,
          issuer: RLUSD_ISSUER,
          value: "1000000",
        } satisfies IssuedCurrencyAmount,
      };
      await window.xrpl.crossmark.methods.signAndSubmitAndWait(trustSetTx);
      dispatch({ type: "TRUSTLINE_DONE" });
    } catch {
      dispatch({ type: "ERROR", message: "Trust line setup failed. Please try again." });
    }
  }, [address]);

  const handleUnlock = useCallback(async () => {
    if (!isConnected || !address) {
      await connect();
      return;
    }

    if (!window.xrpl?.crossmark) {
      dispatch({ type: "ERROR", message: "Crossmark extension not found" });
      return;
    }

    dispatch({ type: "SIGN_START" });

    if (isRLUSD && !RLUSD_ISSUER) {
      dispatch({ type: "ERROR", message: "RLUSD issuer not configured. Check your .env.local file." });
      return;
    }

    let txHash: string;
    try {
      const amount: string | IssuedCurrencyAmount = isRLUSD
        ? ({ currency: RLUSD_CURRENCY, issuer: RLUSD_ISSUER, value: String(price) } satisfies IssuedCurrencyAmount)
        : xrpToDropsStr(price);

      const tx = {
        TransactionType: "Payment",
        Account: address,
        Destination: publisherWalletAddress,
        Amount: amount,
      };
      const result = await window.xrpl.crossmark.methods.signAndSubmitAndWait(tx);
      txHash = result.response.data.resp.result.hash;
    } catch {
      dispatch({ type: "ERROR", message: "Transaction rejected or failed in wallet" });
      return;
    }

    dispatch({ type: "VERIFY_START" });

    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash, articleId, readerAddress: address }),
      });
      const data = (await res.json()) as
        | { success: true; content: string }
        | { success: false; error: string };

      if (data.success) {
        dispatch({ type: "SUCCESS", content: data.content, txHash });
      } else {
        dispatch({ type: "ERROR", message: data.error });
      }
    } catch {
      dispatch({ type: "ERROR", message: "Verification request failed. Please retry." });
    }
  }, [address, isConnected, connect, articleId, price, publisherWalletAddress, isRLUSD]);

  const priceLabel = `${price} ${currency}`;

  // ── Checking state ─────────────────────────────────────────────────────────
  if (state.phase === "checking" || state.phase === "trustline-checking") {
    return (
      <div className="mt-8">
        <ProsePreview preview={preview} />
        <div className="relative z-10 -mt-10 bg-surface border border-ink/[0.08] rounded-xl p-9 text-center shadow-[0_8px_40px_rgba(20,18,17,0.06)]">
          <div className="w-5 h-5 border-2 border-ink-ghost border-t-ink-secondary rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // ── Trust line needed ───────────────────────────────────────────────────────
  if (state.phase === "trustline-needed") {
    return (
      <div className="mt-8">
        <ProsePreview preview={preview} />
        <div className="relative z-10 -mt-10 bg-surface border border-ink/[0.08] rounded-xl px-9 py-10 text-center shadow-[0_8px_40px_rgba(20,18,17,0.06)]">
          <div className="w-[52px] h-[52px] rounded-full bg-paper border border-ink/[0.06] flex items-center justify-center mx-auto mb-5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B9590" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h3 className="font-display text-[22px] font-normal mb-1.5">One-time setup required</h3>
          <p className="text-[13px] text-ink-muted mb-6">
            This article is priced in RLUSD. You need to enable RLUSD in your wallet once before paying.
          </p>
          <button
            onClick={handleSetupTrustLine}
            className="inline-flex items-center gap-2.5 px-9 py-3.5 rounded-full text-[15px] font-semibold bg-accent text-surface hover:bg-accent-deep hover:-translate-y-px transition-all duration-200 cursor-pointer"
          >
            Enable RLUSD in Crossmark
          </button>
          <p className="text-[11px] text-ink-ghost mt-4 tracking-[0.3px]">
            This sets a trust line to the RLUSD issuer. Standard XRPL operation.
          </p>
        </div>
      </div>
    );
  }

  // ── Trust line pending ──────────────────────────────────────────────────────
  if (state.phase === "trustline-pending") {
    return (
      <div className="mt-8">
        <ProsePreview preview={preview} />
        <div className="relative z-10 -mt-10 bg-surface border border-ink/[0.08] rounded-xl p-9 text-center shadow-[0_8px_40px_rgba(20,18,17,0.06)]">
          <div className="w-5 h-5 border-2 border-ink-ghost border-t-ink-secondary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-ink-muted">Setting up RLUSD in Crossmark…</p>
        </div>
      </div>
    );
  }

  // ── Publisher has no RLUSD trust line ──────────────────────────────────────
  if (state.phase === "publisher-no-trustline") {
    return (
      <div className="mt-8">
        <ProsePreview preview={preview} />
        <div className="relative z-10 -mt-10 bg-surface border border-ink/[0.08] rounded-xl px-9 py-10 text-center shadow-[0_8px_40px_rgba(20,18,17,0.06)]">
          <div className="w-[52px] h-[52px] rounded-full bg-paper border border-ink/[0.06] flex items-center justify-center mx-auto mb-5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B9590" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h3 className="font-display text-[22px] font-normal mb-1.5">Unavailable</h3>
          <p className="text-[13px] text-ink-muted">
            This publisher has not enabled RLUSD on their wallet yet. The article cannot be purchased at this time.
          </p>
        </div>
      </div>
    );
  }

  // ── Unlocked state ──────────────────────────────────────────────────────────
  if (state.phase === "unlocked") {
    return (
      <div className="animate-fade-in">
        {state.txHash && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-accent-wash border border-accent-glow mb-8 animate-slide-down">
            <div className="w-[22px] h-[22px] rounded-full bg-accent flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-accent-deep">
                Article unlocked · {priceLabel}
              </p>
              <p className="text-[11px] text-accent font-mono mt-0.5">
                tx: {truncateHash(state.txHash)} · verified on ledger
              </p>
            </div>
          </div>
        )}
        <ArticleProse content={state.content} />
      </div>
    );
  }

  // ── Idle / Signing / Verifying / Error states (all show paywall) ────────────
  const isProcessing =
    state.phase === "signing" || state.phase === "verifying";

  return (
    <div className="mt-8">
      <ProsePreview preview={preview} />

      {/* Paywall card */}
      <div className="relative z-10 -mt-10 bg-surface border border-ink/[0.08] rounded-xl px-9 py-10 text-center shadow-[0_8px_40px_rgba(20,18,17,0.06)]">
        {/* Lock icon */}
        <div className="w-13 h-13 rounded-full bg-paper border border-ink/[0.06] flex items-center justify-center mx-auto mb-5" style={{ width: 52, height: 52 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B9590" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        <h3 className="font-display text-[22px] font-normal mb-1.5">
          Continue reading
        </h3>
        <p className="text-[13px] text-ink-muted mb-6">
          One-time micropayment · Instant unlock
        </p>

        {/* Error message */}
        {state.phase === "error" && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-negative/[0.08] border border-negative/20 text-[13px] text-negative font-medium">
            {state.message}
          </div>
        )}

        {/* CTA button */}
        <button
          onClick={
            state.phase === "error" ? () => dispatch({ type: "RETRY" }) : handleUnlock
          }
          disabled={isProcessing}
          className={`
            inline-flex items-center gap-2.5 px-9 py-3.5 rounded-full text-[15px] font-semibold
            transition-all duration-200 cursor-pointer
            ${
              isProcessing
                ? "bg-paper-warm text-ink-muted cursor-default"
                : state.phase === "error"
                ? "bg-ink text-surface hover:bg-ink-secondary"
                : !isConnected
                ? "bg-ink text-surface hover:bg-ink-secondary"
                : "bg-accent text-surface hover:bg-accent-deep hover:-translate-y-px"
            }
          `}
        >
          {isProcessing && (
            <span className="w-4 h-4 border-2 border-ink-ghost border-t-ink-secondary rounded-full animate-spin" />
          )}
          <span>
            {state.phase === "error"
              ? "Try again"
              : !isConnected
              ? "Connect wallet to unlock"
              : state.phase === "signing"
              ? "Confirm in Crossmark…"
              : state.phase === "verifying"
              ? "Verifying on ledger…"
              : `Pay ${priceLabel} to read`}
          </span>
        </button>

        <p className="text-[11px] text-ink-ghost mt-4 tracking-[0.3px]">
          Settled on the XRP Ledger · No subscription required
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProsePreview({ preview }: { preview: string }) {
  return (
    <div className="prose-fade pb-8">
      <p className="text-[17px] leading-[1.9] text-ink">{preview}</p>
    </div>
  );
}

function ArticleProse({ content }: { content: string }) {
  const paragraphs = content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5">
      {paragraphs.map((para, i) => {
        if (para.startsWith("## ")) {
          return (
            <h2 key={i} className="font-display text-[24px] font-normal mt-8 mb-2 tracking-[-0.3px] text-ink">
              {para.slice(3)}
            </h2>
          );
        }
        if (para.startsWith("# ")) {
          return (
            <h1 key={i} className="font-display text-[30px] font-normal mt-8 mb-3 tracking-[-0.5px] text-ink">
              {para.slice(2)}
            </h1>
          );
        }
        return (
          <p key={i} className="text-[17px] leading-[1.9] text-ink">
            {para}
          </p>
        );
      })}
    </div>
  );
}
