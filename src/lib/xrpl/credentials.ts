import { Wallet } from "xrpl";
import { getXrplClient } from "./client";
import { CREDENTIAL_TYPE_HEX } from "./currency";

export type CredentialStatus = "accepted" | "pending" | "none";

// lsfAccepted flag on Credential ledger objects — set after CredentialAccept tx
const LSF_ACCEPTED = 0x00010000;

/**
 * Submits a CredentialCreate transaction from the platform wallet,
 * attesting that the given publisher address is a verified publisher.
 * Idempotent: silently returns if the credential already exists (tecDUPLICATE).
 * Server-side only — requires PLATFORM_WALLET_SEED.
 */
export async function issueCredential(publisherWalletAddress: string): Promise<void> {
  const seed = process.env.PLATFORM_WALLET_SEED;
  if (!seed) throw new Error("PLATFORM_WALLET_SEED is not configured");

  const client = await getXrplClient();
  const platformWallet = Wallet.fromSeed(seed);

  const tx = {
    TransactionType: "CredentialCreate" as const,
    Account: platformWallet.address,
    Subject: publisherWalletAddress,
    CredentialType: CREDENTIAL_TYPE_HEX,
  };

  const prepared = await client.autofill(tx as Parameters<typeof client.autofill>[0]);
  const signed = platformWallet.sign(prepared as Parameters<typeof platformWallet.sign>[0]);
  const result = await client.submitAndWait(signed.tx_blob);

  const meta = result.result.meta;
  if (meta && typeof meta !== "string") {
    const txResult = meta.TransactionResult;
    // tecDUPLICATE means the credential already exists — idempotent, not an error
    if (txResult === "tecDUPLICATE") return;
    if (txResult !== "tesSUCCESS") {
      throw new Error(`CredentialCreate failed: ${txResult}`);
    }
  }
}

/**
 * Queries the XRPL ledger for the credential status of a publisher.
 * Returns "accepted" if the publisher has accepted the credential,
 * "pending" if the platform issued it but the publisher hasn't accepted,
 * "none" if no credential exists.
 */
export async function getCredentialStatus(
  publisherWalletAddress: string
): Promise<CredentialStatus> {
  const platformAddress = process.env.NEXT_PUBLIC_PLATFORM_WALLET;
  if (!platformAddress) return "none";

  const client = await getXrplClient();

  try {
    const resp = await client.request({
      command: "ledger_entry",
      credential: {
        subject: publisherWalletAddress,
        issuer: platformAddress,
        credentialType: CREDENTIAL_TYPE_HEX,
      },
      ledger_index: "validated",
    } as Parameters<typeof client.request>[0]);

    const node = (resp.result as { node?: { Flags?: number } }).node;
    if (!node) return "none";

    const isAccepted = ((node.Flags ?? 0) & LSF_ACCEPTED) !== 0;
    return isAccepted ? "accepted" : "pending";
  } catch {
    // ledger_entry throws when the object doesn't exist
    return "none";
  }
}
