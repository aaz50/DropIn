import { prisma } from "@/lib/db/client";
import { ArticleCard } from "@/components/ArticleCard";
import type { ArticleSummary } from "@/types";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const articles = await prisma.article.findMany({
    include: { publisher: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const summaries: ArticleSummary[] = articles.map((a) => ({
    id: a.id,
    title: a.title,
    preview: a.preview,
    priceXrp: a.priceXrp,
    publisherName: a.publisher.name,
    publisherId: a.publisher.id,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-[720px] mx-auto px-6 md:px-8 pt-14 pb-20">
      <div className="mb-12 animate-fade-up">
        <h1 className="font-display text-[40px] md:text-[48px] font-normal leading-[1.15] tracking-[-1px] text-ink mb-3">
          Read what matters.
          <br />
          Pay what&rsquo;s{" "}
          <em className="text-accent" style={{ fontStyle: "italic" }}>
            fair
          </em>
          .
        </h1>
        <p className="text-[15px] text-ink-secondary leading-[1.65] max-w-[440px]">
          No subscriptions. No ads. Great writing unlocked for cents on the XRP
          Ledger.
        </p>
      </div>

      {summaries.length === 0 ? (
        <div className="py-16 text-center text-ink-muted text-[14px]">
          No articles yet.{" "}
          <a href="/publishers/register" className="text-accent underline">
            Publish one.
          </a>
        </div>
      ) : (
        <div>
          {summaries.map((article, i) => (
            <ArticleCard key={article.id} article={article} index={i} />
          ))}
          <div className="border-b border-ink/[0.08]" />
        </div>
      )}
    </div>
  );
}
