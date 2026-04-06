import { getCredentialStatus } from "@/lib/xrpl/credentials";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const publisherAddress = searchParams.get("publisherAddress");

  if (!publisherAddress) {
    return Response.json({ error: "publisherAddress required" }, { status: 400 });
  }

  try {
    const status = await getCredentialStatus(publisherAddress);
    return Response.json({ status });
  } catch (err) {
    console.error("[credential] Status check failed:", err);
    return Response.json({ status: "none" });
  }
}
