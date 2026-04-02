import { Client } from "xrpl";

const XRPL_NODE_URL =
  process.env.XRPL_NODE_URL ?? "wss://s.altnet.rippletest.net:51233";

const globalForXrpl = globalThis as unknown as { xrplClient: Client | null };

if (!globalForXrpl.xrplClient) {
  globalForXrpl.xrplClient = new Client(XRPL_NODE_URL);
}

export async function getXrplClient(): Promise<Client> {
  const existing = globalForXrpl.xrplClient!;

  if (existing.isConnected()) {
    return existing;
  }

  try {
    await existing.connect();
    return existing;
  } catch {
    // Stale or broken client — destroy it and create a fresh connection.
    // This happens after hot reloads in dev, or when the WebSocket drops
    // and the client ends up in an unrecoverable state.
    try {
      await existing.disconnect();
    } catch {
      // ignore — we're replacing it anyway
    }
    const fresh = new Client(XRPL_NODE_URL);
    await fresh.connect();
    globalForXrpl.xrplClient = fresh;
    return fresh;
  }
}
