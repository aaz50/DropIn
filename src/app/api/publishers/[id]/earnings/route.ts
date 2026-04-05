import { prisma } from "@/lib/db/client";
import type { PaymentRecord } from "@/types";

type EarningsResponse = {
  totalXrp: number;
  paymentCount: number;
  uniqueReaders: number;
  payments: PaymentRecord[];
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  const publisher = await prisma.publisher.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!publisher) {
    return Response.json({ error: "Publisher not found" }, { status: 404 });
  }

  const [aggregate, payments] = await Promise.all([
    prisma.payment.aggregate({
      where: { publisherId: id },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.payment.findMany({
      where: { publisherId: id },
      include: {
        article: { select: { title: true } },
        reader: { select: { walletAddress: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const uniqueReaders = await prisma.payment.findMany({
    where: { publisherId: id },
    distinct: ["readerId"],
    select: { readerId: true },
  });

  const body: EarningsResponse = {
    totalXrp: Number(aggregate._sum.amount ?? 0),
    paymentCount: aggregate._count.id,
    uniqueReaders: uniqueReaders.length,
    payments: payments.map((p) => ({
      id: p.id,
      txHash: p.txHash,
      amount: Number(p.amount),
      currency: p.currency,
      articleId: p.articleId,
      articleTitle: p.article.title,
      readerAddress: p.reader.walletAddress,
      createdAt: p.createdAt.toISOString(),
    })),
  };

  return Response.json(body);
}
