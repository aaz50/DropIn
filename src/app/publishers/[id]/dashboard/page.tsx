"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { use } from "react";
import { PublisherArticleForm } from "@/components/PublisherArticleForm";
import type { ArticleSummary, PaymentRecord, PublisherProfile } from "@/types";

type EarningsData = {
  totalXrp: number;
  paymentCount: number;
  uniqueReaders: number;
  payments: PaymentRecord[];
};

type Props = {
  params: Promise<{ id: string }>;
};

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function truncateHash(hash: string): string {
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage({ params }: Props) {
  const { id } = use(params);
  const [publisher, setPublisher] = useState<PublisherProfile | null>(null);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [pubRes, artRes, earnRes] = await Promise.all([
        fetch(`/api/publishers/${id}`),
        fetch(`/api/articles`),
        fetch(`/api/publishers/${id}/earnings`),
      ]);

      if (!pubRes.ok) {
        setError("Publisher not found");
        return;
      }

      const [pub, allArticles, earn] = await Promise.all([
        pubRes.json() as Promise<PublisherProfile>,
        artRes.json() as Promise<ArticleSummary[]>,
        earnRes.json() as Promise<EarningsData>,
      ]);

      setPublisher(pub);
      setArticles(allArticles.filter((a) => a.publisherId === id));
      setEarnings(earn);
    } catch {
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function handleArticleAdded(article: ArticleSummary) {
    setArticles((prev) => [article, ...prev]);
    setShowForm(false);
  }

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto px-6 pt-16 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-ink-ghost border-t-ink-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !publisher) {
    return (
      <div className="max-w-[800px] mx-auto px-6 pt-16 text-center">
        <p className="text-ink-muted text-[14px]">{error || "Publisher not found"}</p>
        <Link href="/" className="text-accent text-[13px] mt-3 inline-block">
          Back to articles
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-6 md:px-8 pt-12 pb-24">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-9">
        <h1 className="font-display text-[28px] md:text-[32px] font-normal tracking-[-0.5px] text-ink">
          {publisher.name}
        </h1>
        <Link href="/" className="text-[13px] font-medium text-accent hover:underline">
          View as reader →
        </Link>
      </div>

      {/* Stats row */}
      {earnings && (
        <div className="grid grid-cols-3 gap-4 mb-10">
          <StatBox
            label="Revenue"
            value={`${earnings.totalXrp.toFixed(2)} XRP`}
            accent
          />
          <StatBox label="Articles sold" value={String(earnings.paymentCount)} />
          <StatBox label="Unique readers" value={String(earnings.uniqueReaders)} />
        </div>
      )}

      {/* Articles section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-bold tracking-[0.3px] text-ink">
            Your articles
          </h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-full bg-accent text-surface text-[12px] font-semibold hover:bg-accent-deep transition-colors"
          >
            {showForm ? "Cancel" : "+ New article"}
          </button>
        </div>

        {/* New article form */}
        {showForm && (
          <div className="bg-surface border border-ink/[0.08] rounded-xl px-6 py-7 mb-5 animate-slide-down">
            <h3 className="text-[14px] font-semibold text-ink mb-5">New article</h3>
            <PublisherArticleForm
              publisherId={id}
              onSuccess={handleArticleAdded}
            />
          </div>
        )}

        {/* Article table */}
        <div className="bg-surface border border-ink/[0.06] rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-paper-deep border-b border-ink/[0.06]">
                <th className="text-left text-[10px] font-bold tracking-[1px] uppercase text-ink-muted px-5 py-3.5">
                  Title
                </th>
                <th className="text-left text-[10px] font-bold tracking-[1px] uppercase text-ink-muted px-5 py-3.5">
                  Price
                </th>
                <th className="text-left text-[10px] font-bold tracking-[1px] uppercase text-ink-muted px-5 py-3.5">
                  Sales
                </th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-8 text-center text-[13px] text-ink-muted"
                  >
                    No articles yet. Add your first one above.
                  </td>
                </tr>
              ) : (
                articles.map((article) => {
                  const sales = earnings?.payments.filter(
                    (p) => p.articleId === article.id
                  ).length ?? 0;
                  return (
                    <tr
                      key={article.id}
                      className="border-b border-ink/[0.04] last:border-0 hover:bg-paper/50 transition-colors"
                    >
                      <td className="px-5 py-4 text-[14px] text-ink">
                        <Link
                          href={`/articles/${article.id}`}
                          className="hover:text-accent transition-colors"
                        >
                          {article.title}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent-wash border border-accent-glow text-accent-deep text-[12px] font-semibold font-mono">
                          {article.priceXrp}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[14px] text-ink-secondary">
                        {sales}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent payments */}
      {earnings && earnings.payments.length > 0 && (
        <section>
          <h2 className="text-[14px] font-bold tracking-[0.3px] text-ink mb-4">
            Recent payments
          </h2>
          <div className="bg-surface border border-ink/[0.06] rounded-xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-paper-deep border-b border-ink/[0.06]">
                  <th className="text-left text-[10px] font-bold tracking-[1px] uppercase text-ink-muted px-5 py-3.5">
                    Reader
                  </th>
                  <th className="text-left text-[10px] font-bold tracking-[1px] uppercase text-ink-muted px-5 py-3.5 hidden md:table-cell">
                    Article
                  </th>
                  <th className="text-left text-[10px] font-bold tracking-[1px] uppercase text-ink-muted px-5 py-3.5">
                    Amount
                  </th>
                  <th className="text-left text-[10px] font-bold tracking-[1px] uppercase text-ink-muted px-5 py-3.5 hidden md:table-cell">
                    Tx
                  </th>
                  <th className="text-left text-[10px] font-bold tracking-[1px] uppercase text-ink-muted px-5 py-3.5">
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {earnings.payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-ink/[0.04] last:border-0 hover:bg-paper/50 transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-[12px] text-ink-secondary">
                      {truncateAddress(p.readerAddress)}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-secondary hidden md:table-cell max-w-[180px] truncate">
                      {p.articleTitle}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent-wash border border-accent-glow text-accent-deep text-[12px] font-semibold font-mono">
                        {p.amount}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-ink-muted hidden md:table-cell">
                      {truncateHash(p.txHash)}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-muted">
                      {timeAgo(p.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Publisher info footer */}
      <div className="mt-10 pt-6 border-t border-ink/[0.06]">
        <p className="text-[12px] text-ink-muted">
          Wallet:{" "}
          <span className="font-mono text-ink-secondary">{publisher.walletAddress}</span>
        </p>
        {publisher.description && (
          <p className="text-[13px] text-ink-secondary mt-1">{publisher.description}</p>
        )}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface border border-ink/[0.06] rounded-xl px-5 py-5">
      <p className="text-[11px] font-bold tracking-[1px] uppercase text-ink-muted mb-2.5">
        {label}
      </p>
      <p
        className={`font-display text-[28px] font-normal tracking-[-0.5px] leading-none ${
          accent ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
