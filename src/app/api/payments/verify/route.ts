import { prisma } from "@/lib/db/client";
import { verifyPayment } from "@/lib/xrpl/verify";

type RequestBody = {
  txHash: string;
  articleId: string;
  readerAddress: string;
};

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).txHash !== "string" ||
    typeof (body as Record<string, unknown>).articleId !== "string" ||
    typeof (body as Record<string, unknown>).readerAddress !== "string"
  ) {
    return Response.json(
      { success: false, error: "Missing required fields: txHash, articleId, readerAddress" },
      { status: 400 }
    );
  }

  const { txHash, articleId, readerAddress } = body as RequestBody;

  // Validate txHash format — XRPL tx hashes are exactly 64 hex characters
  if (!/^[0-9A-Fa-f]{64}$/.test(txHash)) {
    return Response.json(
      { success: false, error: "Invalid transaction hash format" },
      { status: 400 }
    );
  }

  // Fetch article + publisher wallet for verification
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { publisher: { select: { walletAddress: true } } },
  });

  if (!article) {
    return Response.json({ success: false, error: "Article not found" }, { status: 404 });
  }

  // Verify the XRPL transaction — partial-payment-safe
  let verifyResult;
  try {
    verifyResult = await verifyPayment(
      txHash,
      article.publisher.walletAddress,
      Math.round(article.priceXrp * 1_000_000)
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    // Log full error server-side so it's visible in terminal during dev
    console.error("[payments/verify] XRPL verification failed:", err);
    return Response.json({ success: false, error: message }, { status: 400 });
  }

  // Upsert reader, then create payment record (idempotent via txHash @unique)
  try {
    const reader = await prisma.reader.upsert({
      where: { walletAddress: readerAddress },
      create: { walletAddress: readerAddress },
      update: {},
    });

    await prisma.payment.create({
      data: {
        txHash: verifyResult.txHash,
        amount: verifyResult.amountXrp,
        articleId,
        readerId: reader.id,
        publisherId: article.publisherId,
      },
    });
  } catch (err: unknown) {
    // P2002 = unique constraint violation — tx already recorded, content still returned
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code !== "P2002"
    ) {
      throw err;
    }
  }

  return Response.json({ success: true, content: article.content });
}
