import { prisma } from "@/lib/db/client";
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
    priceXrp: a.priceXrp,
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

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).title !== "string" ||
    typeof (body as Record<string, unknown>).preview !== "string" ||
    typeof (body as Record<string, unknown>).content !== "string" ||
    typeof (body as Record<string, unknown>).priceXrp !== "number" ||
    typeof (body as Record<string, unknown>).publisherId !== "string" ||
    typeof (body as Record<string, unknown>).walletAddress !== "string"
  ) {
    return Response.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const { title, preview, content, priceXrp, publisherId, walletAddress } = body as {
    title: string;
    preview: string;
    content: string;
    priceXrp: number;
    publisherId: string;
    walletAddress: string;
  };

  if (priceXrp <= 0 || priceXrp > 10) {
    return Response.json(
      { error: "priceXrp must be between 0.01 and 10" },
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

  const article = await prisma.article.create({
    data: { title, preview, content, priceXrp, publisherId },
    include: { publisher: { select: { id: true, name: true } } },
  });

  const result: ArticleSummary = {
    id: article.id,
    title: article.title,
    preview: article.preview,
    priceXrp: article.priceXrp,
    publisherName: article.publisher.name,
    publisherId: article.publisher.id,
    createdAt: article.createdAt.toISOString(),
  };

  return Response.json(result, { status: 201 });
}
