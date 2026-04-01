import { isValidClassicAddress } from "xrpl";
import { prisma } from "@/lib/db/client";
import type { PublisherProfile } from "@/types";

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

    const profile: PublisherProfile = {
      id: publisher.id,
      name: publisher.name,
      walletAddress: publisher.walletAddress,
      description: publisher.description,
      createdAt: publisher.createdAt.toISOString(),
    };

    return Response.json(profile, { status: 201 });
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
