import { dropsToXrp, type TxResponse } from "xrpl";
import { getXrplClient } from "./client";
import type { VerifyPaymentResult } from "./types";

/**
 * Verifies that a submitted XRPL payment transaction:
 *   1. Exists and is validated (finality, not just submitted)
 *   2. Is a tesSUCCESS Payment tx
 *   3. Goes to the correct destination (publisher wallet)
 *   4. Delivered at least the expected amount
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
  const client = await getXrplClient();

  const response: TxResponse = await client.request({
    command: "tx",
    transaction: txHash,
  });

  const result = response.result;

  // Must be validated — submission success is not finality
  if (!result.validated) {
    throw new Error("Transaction is not yet validated");
  }

  // In xrpl.js v4, transaction fields live under result.tx_json
  const tx = result.tx_json;

  // Must be a Payment transaction
  if (tx.TransactionType !== "Payment") {
    throw new Error("Transaction is not a Payment");
  }

  // Must have succeeded on-ledger (tec* codes land in a validated ledger but fail)
  const meta = result.meta;
  if (!meta || typeof meta === "string") {
    throw new Error("Transaction metadata unavailable");
  }
  if (meta.TransactionResult !== "tesSUCCESS") {
    throw new Error(`Transaction failed: ${meta.TransactionResult}`);
  }

  // Destination must match the publisher's wallet
  if (tx.Destination !== expectedDestination) {
    throw new Error("Payment sent to wrong destination");
  }

  // CRITICAL: Check delivered_amount, not Amount.
  // Amount can be set to anything by the sender; delivered_amount is computed by the ledger.
  const delivered = meta.delivered_amount;
  if (typeof delivered !== "string") {
    // delivered_amount is "unavailable" on very old txs, or an object for non-XRP payments
    throw new Error("Could not determine delivered XRP amount");
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
