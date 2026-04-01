import { Client } from "xrpl";

const XRPL_NODE_URL =
  process.env.XRPL_NODE_URL ?? "wss://s.altnet.rippletest.net:51233";

const globalForXrpl = globalThis as unknown as { xrplClient: Client | null };

if (!globalForXrpl.xrplClient) {
  globalForXrpl.xrplClient = new Client(XRPL_NODE_URL);
}

export async function getXrplClient(): Promise<Client> {
  const client = globalForXrpl.xrplClient!;
  if (!client.isConnected()) {
    await client.connect();
  }
  return client;
}
