import type { IssuedCurrencyAmount } from "xrpl";

export type XrplPaymentAmount = string | IssuedCurrencyAmount;

export type XrplPaymentTx = {
  TransactionType: "Payment";
  Account: string;
  Destination: string;
  Amount: XrplPaymentAmount;
  hash?: string;
};

export type VerifyPaymentResult = {
  verified: boolean;
  txHash: string;
  senderAddress: string;
  destinationAddress: string;
  amountXrp: number;
  currency: string;
};
