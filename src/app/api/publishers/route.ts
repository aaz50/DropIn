import { isValidClassicAddress } from "xrpl";
import { prisma } from "@/lib/db/client";
import { toPublisherProfile } from "@/lib/db/mappers";
import { issueCredential } from "@/lib/xrpl/credentials";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("walletAddress");

  if (!walletAddress) {
    return Response.json(
      { error: "walletAddress query param required" },
      { status: 400 }
    );
  }

  const publisher = await prisma.publisher.findUnique({
    where: { walletAddress },
  });

  if (!publisher) {
    return Response.json({ error: "Publisher not found" }, { status: 404 });
  }

  return Response.json(toPublisherProfile(publisher));
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
    typeof (body as Record<string, unknown>).name !== "string" ||
    typeof (body as Record<string, unknown>).walletAddress !== "string"
  ) {
    return Response.json(
      { error: "Missing required fields: name, walletAddress" },
      { status: 400 }
    );
  }

  const { name, walletAddress, description } = body as {
    name: string;
    walletAddress: string;
    description?: string;
  };

  if (name.trim().length === 0) {
    return Response.json({ error: "name cannot be empty" }, { status: 400 });
  }

  if (!isValidClassicAddress(walletAddress)) {
    return Response.json(
      { error: "walletAddress is not a valid XRPL classic address" },
      { status: 400 }
    );
  }

  try {
    const publisher = await prisma.publisher.create({
      data: {
        name: name.trim(),
        walletAddress,
        description: description?.trim() ?? null,
      },
    });

    // Fire-and-forget: issue credential after registration. Failures are logged
    // but do not affect the registration response.
    void issueCredential(publisher.walletAddress).catch((err: unknown) => {
      console.error("[credential] Failed to issue credential for", publisher.walletAddress, err);
    });

    return Response.json(toPublisherProfile(publisher), { status: 201 });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return Response.json(
        { error: "A publisher with this wallet address already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
}
