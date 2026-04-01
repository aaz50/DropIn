import Link from "next/link";
import type { ArticleSummary } from "@/types";

type Props = {
  article: ArticleSummary;
  index: number;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ArticleCard({ article, index }: Props) {
  const stagger = `stagger-${Math.min(index + 1, 5)}` as
    | "stagger-1"
    | "stagger-2"
    | "stagger-3"
    | "stagger-4"
    | "stagger-5";

  return (
    <Link
      href={`/articles/${article.id}`}
      className={`group flex gap-8 items-start py-8 border-t border-ink/[0.08] hover:opacity-70 transition-opacity animate-fade-up ${stagger}`}
    >
      {/* Left: text */}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[11px] text-ink-ghost tracking-[1px] mb-2.5">
          {String(index + 1).padStart(2, "0")}
        </p>
        <h2 className="font-display text-[22px] md:text-[26px] font-normal leading-[1.3] tracking-[-0.3px] text-ink mb-2">
          {article.title}
        </h2>
        <p className="text-[13px] text-ink-muted mb-3 flex items-center gap-2">
          <span>{article.publisherName}</span>
          <span className="w-[3px] h-[3px] rounded-full bg-ink-ghost inline-block" />
          <span>{formatDate(article.createdAt)}</span>
        </p>
        <p className="text-[14px] leading-[1.65] text-ink-secondary line-clamp-2">
          {article.preview}
        </p>
      </div>

      {/* Right: price badge */}
      <div className="flex-shrink-0 mt-[38px]">
        <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-accent-wash border border-accent-glow text-accent-deep text-[13px] font-semibold font-mono tracking-[-0.3px] group-hover:bg-accent-glow transition-colors">
          {article.priceXrp} XRP
        </span>
      </div>
    </Link>
  );
}
