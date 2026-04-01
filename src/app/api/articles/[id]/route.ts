import { prisma } from "@/lib/db/client";
import type { ArticleSummary, ArticleFull } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: { publisher: { select: { id: true, name: true, walletAddress: true } } },
  });

  if (!article) {
    return Response.json({ error: "Article not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const readerAddress = searchParams.get("readerAddress");

  // Check if this reader has already paid for this article
  if (readerAddress) {
    const payment = await prisma.payment.findFirst({
      where: {
        articleId: id,
        reader: { walletAddress: readerAddress },
      },
    });

    if (payment) {
      const full: ArticleFull & { publisherWalletAddress: string } = {
        id: article.id,
        title: article.title,
        preview: article.preview,
        content: article.content,
        priceXrp: article.priceXrp,
        publisherName: article.publisher.name,
        publisherId: article.publisher.id,
        publisherWalletAddress: article.publisher.walletAddress,
        createdAt: article.createdAt.toISOString(),
      };
      return Response.json(full);
    }
  }

  // Return summary (no content) + publisher wallet for payment tx construction
  const summary: ArticleSummary & { publisherWalletAddress: string } = {
    id: article.id,
    title: article.title,
    preview: article.preview,
    priceXrp: article.priceXrp,
    publisherName: article.publisher.name,
    publisherId: article.publisher.id,
    publisherWalletAddress: article.publisher.walletAddress,
    createdAt: article.createdAt.toISOString(),
  };
  return Response.json(summary);
}
