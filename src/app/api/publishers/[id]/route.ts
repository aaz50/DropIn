import { prisma } from "@/lib/db/client";
import { toPublisherProfile } from "@/lib/db/mappers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  const publisher = await prisma.publisher.findUnique({ where: { id } });

  if (!publisher) {
    return Response.json({ error: "Publisher not found" }, { status: 404 });
  }

  return Response.json(toPublisherProfile(publisher));
}
