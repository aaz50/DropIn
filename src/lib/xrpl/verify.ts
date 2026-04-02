import { dropsToXrp, type TxResponse } from "xrpl";
import { getXrplClient } from "./client";
import type { VerifyPaymentResult } from "./types";

const POLL_ATTEMPTS = 6;   // try up to 6 times
const POLL_DELAY_MS = 1500; // 1.5 s between attempts → up to ~9 s total

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Verifies that a submitted XRPL payment transaction:
 *   1. Exists and is validated (finality, not just submitted)
 *   2. Is a tesSUCCESS Payment tx
 *   3. Goes to the correct destination (publisher wallet)
 *   4. Delivered at least the expected amount
 *
 * Polls up to POLL_ATTEMPTS times to handle the window between Crossmark
 * returning (tx submitted) and the ledger closing (tx validated).
 *
 * SECURITY: Uses `meta.delivered_amount`, NOT `tx_json.Amount`.
 * The Amount field can be spoofed via tfPartialPayment — delivered_amount
 * reflects what was actually received by the destination.
 */
export async function verifyPayment(
  txHash: string,
  expectedDestination: string,
  expectedMinAmountDrops: number
): Promise<VerifyPaymentResult> {
  let client = await getXrplClient();

  let lastError = "Transaction not found on ledger";

  for (let attempt = 1; attempt <= POLL_ATTEMPTS; attempt++) {
    let response: TxResponse;
    try {
      response = await client.request({
        command: "tx",
        transaction: txHash,
      });
    } catch (err) {
      // Network / connection error — rebuild the client and retry
      const msg = err instanceof Error ? err.message : String(err);
      lastError = `XRPL node error: ${msg}`;

      if (attempt < POLL_ATTEMPTS) {
        client = await getXrplClient();
        await sleep(POLL_DELAY_MS);
        continue;
      }
      throw new Error(lastError);
    }

    const result = response.result;

    // Transaction exists but ledger hasn't closed yet — wait and retry
    if (!result.validated) {
      lastError = "Transaction is pending — ledger not yet closed";
      if (attempt < POLL_ATTEMPTS) {
        await sleep(POLL_DELAY_MS);
        continue;
      }
      throw new Error(
        "Transaction was submitted but has not been validated after several retries. " +
        "The ledger may be slow — check your txHash on https://testnet.xrpl.org and try again."
      );
    }

    // ── Transaction is validated — run all checks ──────────────────────────

    // In xrpl.js v4, transaction fields live under result.tx_json
    const tx = result.tx_json;

    if (tx.TransactionType !== "Payment") {
      throw new Error("Transaction is not a Payment");
    }

    const meta = result.meta;
    if (!meta || typeof meta === "string") {
      throw new Error("Transaction metadata unavailable");
    }
    if (meta.TransactionResult !== "tesSUCCESS") {
      throw new Error(`Transaction failed on ledger: ${meta.TransactionResult}`);
    }

    if (tx.Destination !== expectedDestination) {
      throw new Error(
        "Payment destination does not match the publisher wallet for this article"
      );
    }

    // CRITICAL: Check delivered_amount, not Amount.
    // Amount can be set to anything by the sender; delivered_amount is computed by the ledger.
    const delivered = meta.delivered_amount;
    if (typeof delivered !== "string") {
      throw new Error("Could not determine delivered XRP amount (non-XRP or unavailable)");
    }
    if (Number(delivered) < expectedMinAmountDrops) {
      throw new Error(
        `Insufficient payment: delivered ${delivered} drops, expected at least ${expectedMinAmountDrops}`
      );
    }

    return {
      verified: true,
      txHash: result.hash as string,
      senderAddress: tx.Account,
      destinationAddress: tx.Destination,
      amountXrp: Number(dropsToXrp(delivered)),
    };
  }

  // Unreachable — loop always returns or throws, but satisfies TypeScript
  throw new Error(lastError);
}
