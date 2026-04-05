import type { IssuedCurrencyAmount } from "xrpl";

export const RLUSD_CURRENCY =
  process.env.NEXT_PUBLIC_RLUSD_CURRENCY ??
  "524C555344000000000000000000000000000000";

export const RLUSD_ISSUER = process.env.NEXT_PUBLIC_RLUSD_ISSUER ?? "";

export function isIOU(v: unknown): v is IssuedCurrencyAmount {
  return (
    typeof v === "object" &&
    v !== null &&
    "currency" in v &&
    "issuer" in v &&
    "value" in v
  );
}
