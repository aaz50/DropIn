import { getXrplClient } from "@/lib/xrpl/client";
import { RLUSD_CURRENCY, RLUSD_ISSUER } from "@/lib/xrpl/currency";

async function checkAddress(address: string): Promise<boolean> {
  const client = await getXrplClient();
  try {
    const response = await client.request({
      command: "account_lines",
      account: address,
    });
    const lines = response.result.lines;

    // Match by both currency (hex or ASCII) AND issuer
    const found = lines.some(
      (line) =>
        (line.currency === RLUSD_CURRENCY || line.currency === "RLUSD") &&
        line.account === RLUSD_ISSUER
    );

    // Diagnostic: surface issuer mismatches immediately in dev server logs
    if (!found) {
      const wrongIssuer = lines.filter(
        (line) => line.currency === RLUSD_CURRENCY || line.currency === "RLUSD"
      );
      if (wrongIssuer.length > 0) {
        console.warn(
          `[trustline] RLUSD line found but issuer mismatch. Found: ${wrongIssuer.map((l) => l.account).join(", ")} — Expected: ${RLUSD_ISSUER}`
        );
      }
    }

    return found;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Account doesn't exist on ledger yet — no trust line
    if (msg.includes("actNotFound") || msg.includes("Account not found")) {
      return false;
    }
    throw err;
  }
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const publisher = searchParams.get("publisher");

  if (!address) {
    return Response.json({ error: "address is required" }, { status: 400 });
  }

  if (!RLUSD_ISSUER) {
    return Response.json({ error: "RLUSD issuer not configured" }, { status: 500 });
  }

  try {
    const readerHasTrustLine = await checkAddress(address);

    // If publisher address provided, check it too
    let publisherHasTrustLine: boolean | undefined;
    if (publisher) {
      publisherHasTrustLine = await checkAddress(publisher);
    }

    return Response.json({ hasTrustLine: readerHasTrustLine, publisherHasTrustLine });
  } catch (err) {
    console.error("[trustline] XRPL error:", err);
    return Response.json({ error: "Failed to check trust line" }, { status: 500 });
  }
}
