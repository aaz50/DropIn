import { prisma } from "@/lib/db/client";
import { RLUSD_ISSUER } from "@/lib/xrpl/currency";
import type { ArticleSummary } from "@/types";

export async function GET(): Promise<Response> {
  const articles = await prisma.article.findMany({
    include: { publisher: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const body: ArticleSummary[] = articles.map((a) => ({
    id: a.id,
    title: a.title,
    preview: a.preview,
    price: Number(a.price),
    currency: a.currency,
    issuer: a.issuer ?? undefined,
    publisherName: a.publisher.name,
    publisherId: a.publisher.id,
    createdAt: a.createdAt.toISOString(),
  }));

  return Response.json(body);
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  if (
    typeof body !== "object" ||
    body === null ||
    typeof b.title !== "string" ||
    typeof b.preview !== "string" ||
    typeof b.content !== "string" ||
    typeof b.price !== "number" ||
    typeof b.publisherId !== "string" ||
    typeof b.walletAddress !== "string"
  ) {
    return Response.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const currency = typeof b.currency === "string" ? b.currency : "XRP";
  if (currency !== "XRP" && currency !== "RLUSD") {
    return Response.json({ error: "currency must be XRP or RLUSD" }, { status: 400 });
  }

  const { title, preview, content, price, publisherId, walletAddress } = b as {
    title: string;
    preview: string;
    content: string;
    price: number;
    publisherId: string;
    walletAddress: string;
  };

  if (price <= 0 || price > (currency === "RLUSD" ? 100 : 10)) {
    const max = currency === "RLUSD" ? "100 RLUSD" : "10 XRP";
    return Response.json(
      { error: `price must be between 0.01 and ${max}` },
      { status: 400 }
    );
  }
  if (preview.length > 400) {
    return Response.json(
      { error: "preview must be 400 characters or fewer" },
      { status: 400 }
    );
  }

  const publisher = await prisma.publisher.findUnique({
    where: { id: publisherId },
    select: { id: true, name: true, walletAddress: true },
  });
  if (!publisher) {
    return Response.json({ error: "Publisher not found" }, { status: 404 });
  }
  if (publisher.walletAddress !== walletAddress) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  // For RLUSD, use the server-side authoritative issuer — never trust client-supplied issuer
  const issuer = currency === "RLUSD" ? RLUSD_ISSUER : null;
  if (currency === "RLUSD" && !issuer) {
    return Response.json(
      { error: "RLUSD issuer not configured on server" },
      { status: 500 }
    );
  }

  const article = await prisma.article.create({
    data: {
      title,
      preview,
      content,
      price,
      currency,
      issuer,
      publisherId,
    },
    include: { publisher: { select: { id: true, name: true } } },
  });

  const result: ArticleSummary = {
    id: article.id,
    title: article.title,
    preview: article.preview,
    price: Number(article.price),
    currency: article.currency,
    issuer: article.issuer ?? undefined,
    publisherName: article.publisher.name,
    publisherId: article.publisher.id,
    createdAt: article.createdAt.toISOString(),
  };

  return Response.json(result, { status: 201 });
}
