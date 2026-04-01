import { prisma } from "@/lib/db/client";
import type { PaymentRecord } from "@/types";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const readerAddress = searchParams.get("readerAddress");

  if (!readerAddress) {
    return Response.json(
      { error: "readerAddress query parameter is required" },
      { status: 400 }
    );
  }

  const payments = await prisma.payment.findMany({
    where: { reader: { walletAddress: readerAddress } },
    include: {
      article: { select: { title: true } },
      reader: { select: { walletAddress: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const body: PaymentRecord[] = payments.map((p) => ({
    id: p.id,
    txHash: p.txHash,
    amount: p.amount,
    articleId: p.articleId,
    articleTitle: p.article.title,
    readerAddress: p.reader.walletAddress,
    createdAt: p.createdAt.toISOString(),
  }));

  return Response.json(body);
}
