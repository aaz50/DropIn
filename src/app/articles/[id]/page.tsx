import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { PaywallGate } from "@/components/PaywallGate";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: { publisher: true },
  });

  if (!article) notFound();

  // Publisher avatar initial
  const initial = article.publisher.name[0]?.toUpperCase() ?? "P";

  return (
    <div className="max-w-[640px] mx-auto px-6 md:px-8 pt-12 pb-24">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink transition-colors mb-8"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to articles
      </Link>

      {/* Title */}
      <h1 className="font-display text-[34px] md:text-[38px] font-normal leading-[1.2] tracking-[-0.8px] text-ink mb-5 animate-fade-up">
        {article.title}
      </h1>

      {/* Byline */}
      <div className="flex items-center gap-3 pb-7 mb-8 border-b border-ink/[0.08] animate-fade-up" style={{ animationDelay: "50ms" }}>
        <div className="w-[38px] h-[38px] rounded-full bg-accent-glow flex items-center justify-center flex-shrink-0">
          <span className="font-display text-[16px] text-accent-deep">{initial}</span>
        </div>
        <div>
          <p className="text-[14px] font-semibold text-ink flex items-center gap-1.5">
            {article.publisher.name}
          </p>
          <p className="text-[12px] text-ink-muted mt-0.5">
            {formatDate(article.createdAt)} ·{" "}
            <span className="text-accent font-semibold">{Number(article.price)} {article.currency}</span>
          </p>
        </div>
      </div>

      {/* PaywallGate handles both the preview + unlock flow */}
      <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
        <PaywallGate
          articleId={article.id}
          price={Number(article.price)}
          currency={article.currency}
          publisherWalletAddress={article.publisher.walletAddress}
          preview={article.preview}
        />
      </div>
    </div>
  );
}
