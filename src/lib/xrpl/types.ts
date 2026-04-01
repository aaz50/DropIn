export type XrplPaymentTx = {
  TransactionType: "Payment";
  Account: string;
  Destination: string;
  Amount: string; // In drops
  hash?: string;
};

export type VerifyPaymentResult = {
  verified: boolean;
  txHash: string;
  senderAddress: string;
  destinationAddress: string;
  amountXrp: number;
};
