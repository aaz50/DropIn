import { prisma } from "@/lib/db/client";
import type { PublisherProfile } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  const publisher = await prisma.publisher.findUnique({ where: { id } });

  if (!publisher) {
    return Response.json({ error: "Publisher not found" }, { status: 404 });
  }

  const profile: PublisherProfile = {
    id: publisher.id,
    name: publisher.name,
    walletAddress: publisher.walletAddress,
    description: publisher.description,
    createdAt: publisher.createdAt.toISOString(),
  };

  return Response.json(profile);
}
