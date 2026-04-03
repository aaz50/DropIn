import Link from "next/link";
import { DemoCard } from "@/components/landing/DemoCard";
import { Reveal } from "@/components/Reveal";

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="max-w-[1120px] mx-auto px-6 md:px-12 pt-20 pb-28 md:pt-28 md:pb-36">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-wash border border-accent-glow text-[11px] font-medium text-accent tracking-[0.3px] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
              Powered by the XRP Ledger
            </div>
            <h1 className="font-display text-[48px] md:text-[60px] leading-[1.08] tracking-[-1.5px] text-ink mb-8">
              Read what matters.
              <br />
              Pay what&rsquo;s{" "}
              <em className="text-accent" style={{ fontStyle: "italic" }}>
                fair
              </em>
              .
            </h1>
            <p className="text-[17px] text-ink-secondary leading-[1.7] max-w-[400px] mb-10">
              No subscriptions. No ads. Unlock any article for cents, settled
              on-chain in seconds.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/browse"
                className="px-7 py-3 rounded-full bg-accent text-surface text-[14px] font-semibold hover:bg-accent-deep transition-colors"
              >
                Start reading
              </Link>
              <Link
                href="/publishers/register"
                className="px-7 py-3 rounded-full bg-paper-warm border border-ink/[0.10] text-ink text-[14px] font-semibold hover:bg-paper-deep transition-colors"
              >
                I&rsquo;m a publisher
              </Link>
            </div>
          </div>

          {/* Right — demo card */}
          <div className="flex justify-center md:justify-end">
            <div className="w-full max-w-[380px]">
              <DemoCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── Numbers strip ────────────────────────────────────── */}
      <section className="border-y border-ink/[0.06] bg-paper-warm py-14">
        <div className="max-w-[1120px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-ink/[0.08]">
            {[
              { value: "$0.00002", label: "Avg. transaction fee" },
              { value: "3–5s", label: "Settlement time" },
              { value: "~98%", label: "Revenue to publishers" },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 80} className="md:px-12 first:pl-0 last:pr-0">
                <p className="font-display text-[42px] md:text-[54px] leading-none tracking-[-1px] text-ink mb-1.5">
                  {stat.value}
                </p>
                <p className="text-[14px] text-ink-muted">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="max-w-[1120px] mx-auto px-6 md:px-12 py-24 md:py-32">
        <Reveal>
          <p className="text-[11px] font-medium tracking-[1.5px] text-ink-ghost uppercase mb-4">
            How it works
          </p>
          <h2 className="font-display text-[36px] md:text-[44px] leading-[1.1] tracking-[-1px] text-ink mb-16 max-w-[480px]">
            Three steps to unlock anything.
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Connect your wallet",
              body: "Link Crossmark in one click. Your wallet address is your identity. No account or password needed.",
            },
            {
              step: "02",
              title: "Read and unlock",
              body: "Find an article. Pay the price set by the publisher. It unlocks instantly.",
            },
            {
              step: "03",
              title: "Your history travels with you",
              body: "Every article you unlock is remembered. Come back tomorrow and it is still open. Pay once, read forever.",
            },
          ].map((card, i) => (
            <Reveal key={card.step} delay={i * 100}>
              <div className="p-8 rounded-2xl bg-surface border border-ink/[0.07] h-full hover:border-accent-glow hover:shadow-sm transition-all duration-200">
                <p className="font-mono text-[11px] text-ink-ghost font-semibold tracking-[1px] mb-5">
                  {card.step}
                </p>
                <h3 className="font-display text-[22px] leading-[1.2] tracking-[-0.5px] text-ink mb-3">
                  {card.title}
                </h3>
                <p className="text-[14px] text-ink-secondary leading-[1.7]">
                  {card.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Why now (dark) ───────────────────────────────────── */}
      <section className="bg-ink py-24 md:py-32">
        <div className="max-w-[1120px] mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-[11px] font-medium tracking-[1.5px] text-accent uppercase mb-4">
              Why now
            </p>
            <h2 className="font-display text-[36px] md:text-[44px] leading-[1.1] tracking-[-1px] text-surface mb-16 max-w-[520px]">
              The infrastructure finally caught up.
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Credit cards broke micropayments",
                body: "A $0.30 minimum fee per transaction makes anything under $3 uneconomical to charge for. Publishers abandoned micropayments. Not by choice. By necessity.",
              },
              {
                title: "XRPL makes it possible",
                body: "At $0.00002 per transaction, a publisher can charge $0.05 and keep virtually 100% of it. The economics of per-article pricing finally work.",
              },
              {
                title: "Axate proved the model",
                body: "Axate ran a successful micropayment platform for years. Readers will pay small amounts for quality content. The problem was always infrastructure cost, not reader willingness.",
              },
              {
                title: "DropIn is the platform",
                body: "Publishers register once, add their articles, and set their prices. Readers discover, unlock, and pay — all in one place. No payment processor to configure. No code to write.",
              },
            ].map((card, i) => (
              <Reveal key={card.title} delay={i * 80}>
                <div className="p-8 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                  <h3 className="font-display text-[22px] leading-[1.25] tracking-[-0.3px] text-surface mb-3">
                    {card.title}
                  </h3>
                  <p className="text-[14px] text-white/65 leading-[1.75]">
                    {card.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── For publishers — comparison table ────────────────── */}
      <section className="max-w-[1120px] mx-auto px-6 md:px-12 py-24 md:py-32">
        <Reveal>
          <p className="text-[11px] font-medium tracking-[1.5px] text-ink-muted uppercase mb-4">
            For publishers
          </p>
          <h2 className="font-display text-[36px] md:text-[44px] leading-[1.1] tracking-[-1px] text-ink mb-16 max-w-[480px]">
            A revenue model that fits the content.
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <div className="rounded-2xl border border-ink/[0.08] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 bg-paper-warm border-b border-ink/[0.08]">
              <div className="px-6 py-4" />
              {["Subscriptions", "Old micropayments", "DropIn"].map((col) => (
                <div
                  key={col}
                  className={`px-6 py-4 text-center ${col === "DropIn" ? "bg-accent" : ""}`}
                >
                  <p className={`text-[14px] font-semibold ${col === "DropIn" ? "text-surface" : "text-ink"}`}>
                    {col}
                  </p>
                </div>
              ))}
            </div>

            {/* Rows */}
            {[
              { label: "Works for casual readers", values: [false, true, true] },
              { label: "No payment processor fees", values: [false, false, true] },
              { label: "Revenue on first visit", values: [false, false, true] },
              { label: "No subscription fatigue", values: [false, true, true] },
              { label: "Settlement in seconds", values: [false, false, true] },
              { label: "Zero infrastructure to build", values: [false, false, true] },
            ].map((row, ri) => (
              <div
                key={row.label}
                className={`grid grid-cols-4 border-b border-ink/[0.06] last:border-b-0 ${ri % 2 === 0 ? "" : "bg-paper/40"}`}
              >
                <div className="px-6 py-4">
                  <p className="text-[13px] text-ink-secondary">{row.label}</p>
                </div>
                {row.values.map((yes, ci) => (
                  <div
                    key={ci}
                    className={`px-6 py-4 flex items-center justify-center ${ci === 2 ? "bg-accent/[0.07]" : ""}`}
                  >
                    {yes ? (
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-paper-deep flex items-center justify-center flex-shrink-0">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#9B9590" strokeWidth="3">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── XRPL features ────────────────────────────────────── */}
      <section className="border-t border-ink/[0.06] bg-paper-warm py-20">
        <div className="max-w-[720px] mx-auto px-6 md:px-12 text-center">
          <Reveal>
            <p className="text-[11px] font-medium tracking-[1.5px] text-ink-muted uppercase mb-4">
              Built on the XRP Ledger
            </p>
            <h2 className="font-display text-[32px] md:text-[38px] leading-[1.15] tracking-[-0.8px] text-ink mb-10">
              The only ledger built for this.
            </h2>
            <div className="flex flex-wrap justify-center gap-2.5">
              {[
                "3–5s finality",
                "$0.00002 avg fee",
                "No chargebacks",
                "1,500+ tx/sec throughput",
                "Carbon neutral",
                "Open source",
                "No smart contract risk",
                "Native DEX",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 rounded-full border border-ink/[0.10] bg-surface text-[13px] text-ink-secondary font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="max-w-[720px] mx-auto px-6 md:px-12 py-24 md:py-32 text-center">
        <Reveal>
          <h2 className="font-display text-[48px] md:text-[60px] leading-[1.08] tracking-[-1.5px] text-ink mb-5">
            Stop closing tabs.
            <br />
            Start reading.
          </h2>
          <p className="text-[16px] text-ink-secondary leading-[1.8] mb-10 max-w-[380px] mx-auto">
            Pay only for what you read. No subscription required.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/browse"
              className="px-10 py-4 rounded-full bg-accent text-surface text-[14px] font-semibold hover:bg-accent-deep transition-colors shadow-[0_8px_20px_rgba(27,107,79,0.22)]"
            >
              Start reading
            </Link>
            <Link
              href="/publishers/register"
              className="px-8 py-3.5 rounded-full bg-paper-warm border border-ink/[0.10] text-ink text-[14px] font-semibold hover:bg-paper-deep transition-colors"
            >
              Publish your work
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
