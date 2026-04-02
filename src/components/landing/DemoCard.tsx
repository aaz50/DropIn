"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "confirming" | "verifying" | "unlocked";

export function DemoCard() {
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const runDemo = useCallback(() => {
    if (phase !== "idle") return;
    clearTimers();
    setPhase("confirming");
    timers.current.push(setTimeout(() => setPhase("verifying"), 400));
    timers.current.push(setTimeout(() => setPhase("unlocked"), 1000));
    timers.current.push(setTimeout(() => setPhase("idle"), 9000));
  }, [phase]);

  useEffect(() => () => clearTimers(), []);

  return (
    <div className="animate-hero-float">
      <div className="bg-surface border border-ink/[0.08] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(20,18,17,0.08),0_1px_3px_rgba(20,18,17,0.04)]">
        {/* Fake browser chrome */}
        <div className="flex items-center gap-2 px-5 py-[14px] border-b border-ink/[0.06]">
          <div className="flex gap-[6px]">
            <div className="w-2 h-2 rounded-full bg-paper-deep" />
            <div className="w-2 h-2 rounded-full bg-paper-deep" />
            <div className="w-2 h-2 rounded-full bg-paper-deep" />
          </div>
          <span className="flex-1 text-center text-[11px] text-ink-ghost font-mono tracking-tight">
            theledgerreport.com/xrpl-fees
          </span>
          <div className="w-[44px]" />
        </div>

        {/* Article preview */}
        <div className="p-7">
          <h3 className="font-display text-[18px] leading-[1.3] mb-1.5">
            Why XRPL's fee structure changes everything
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-ink-muted mb-4">
            <span>The Ledger Report</span>
            <span className="w-[3px] h-[3px] rounded-full bg-ink-ghost inline-block" />
            <span>6 min read</span>
          </div>

          <p className="text-[13px] leading-[1.7] text-ink-secondary mb-2">
            The economics of online content have been broken for two decades.
            Publishers know their work has value, yet most give it away because
            no viable micro-billing layer existed — until now.
          </p>
          {phase !== "unlocked" && (
            <p className="text-[13px] leading-[1.7] text-ink-muted mb-4">
              Credit card networks impose a minimum $0.30 fee per transaction,
              which makes any content priced below a few dollars economically
              irrational to charge for. Publishers abandoned micropayments not
              by choice, but by necessity. The XRP&nbsp;Ledger changes&nbsp;…
            </p>
          )}

          {phase === "unlocked" ? (
            <div className="mt-4 animate-fade-in space-y-3">
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-accent-wash border border-accent-glow">
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-accent-deep">Unlocked · 0.10 XRP</p>
                  <p className="text-[10px] text-accent font-mono mt-0.5">tx: 8A3F…C91E · 3.2s</p>
                </div>
              </div>
              <p className="text-[13px] leading-[1.7] text-ink">
                The XRP Ledger fundamentally changes this equation. With fees
                averaging $0.00002, a publisher can charge $0.05 and retain
                virtually 100% of revenue.
              </p>
            </div>
          ) : (
            <div className="mt-4 px-5 py-5 text-center border border-ink/[0.06] rounded-xl bg-paper">
              <p className="text-[14px] font-semibold mb-1">Unlock this article</p>
              <p className="text-[11px] text-ink-muted mb-3.5">Powered by DropIn · 0.10 XRP</p>
              <button
                onClick={runDemo}
                disabled={phase !== "idle"}
                className={`px-6 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                  phase === "idle"
                    ? "bg-accent text-surface hover:bg-accent-deep cursor-pointer"
                    : "bg-paper-warm text-ink-muted cursor-default"
                }`}
              >
                {phase === "idle"
                  ? "Pay 0.10 XRP"
                  : phase === "confirming"
                  ? "Confirming…"
                  : "Verifying…"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
