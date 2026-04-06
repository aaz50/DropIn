import { prisma } from "@/lib/db/client";
import { issueCredential } from "@/lib/xrpl/credentials";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  const publisher = await prisma.publisher.findUnique({ where: { id } });
  if (!publisher) {
    return Response.json({ error: "Publisher not found" }, { status: 404 });
  }

  try {
    await issueCredential(publisher.walletAddress);
    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to issue credential";
    return Response.json({ error: message }, { status: 500 });
  }
}
