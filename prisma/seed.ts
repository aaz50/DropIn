import { PrismaClient } from "@prisma/client";
import { Wallet } from "xrpl";

const prisma = new PrismaClient();

async function main() {
  // Generate fresh testnet wallets for publishers.
  // IMPORTANT: Fund these with XRP using the XRPL Testnet Faucet:
  // https://xrpl.org/xrp-testnet-faucet.html
  const publisher1Wallet = Wallet.generate();
  const publisher2Wallet = Wallet.generate();

  console.log("\n=== FUND THESE ON XRPL TESTNET FAUCET ===");
  console.log("Publisher 1:", publisher1Wallet.address);
  console.log("Publisher 2:", publisher2Wallet.address);
  console.log("=========================================\n");

  // Delete in dependency order: Payment → Article → Publisher / Reader
  await prisma.payment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.publisher.deleteMany();
  await prisma.reader.deleteMany();

  const publisher1 = await prisma.publisher.create({
    data: {
      name: "The Ledger Report",
      walletAddress: publisher1Wallet.address,
      description:
        "In-depth coverage of blockchain technology, DeFi, and the future of digital finance.",
      articles: {
        create: [
          {
            title: "How XRPL's Consensus Protocol Actually Works",
            preview:
              "Most people assume XRP uses proof-of-work or proof-of-stake. It doesn't. The XRP Ledger uses a Byzantine Fault Tolerant consensus protocol that's fundamentally different from both — and far more efficient.",
            content: `Most people assume XRP uses proof-of-work or proof-of-stake. It doesn't. The XRP Ledger uses a Byzantine Fault Tolerant consensus protocol that's fundamentally different from both — and far more efficient.

## The Problem With Mining

Bitcoin's proof-of-work requires nodes to compete to solve cryptographic puzzles. This consumes enormous energy and limits throughput to ~7 transactions per second. Proof-of-stake improves efficiency but introduces capital lock-up requirements that create their own centralization pressures.

## XRPL's Unique Ledger Consensus Protocol (LCP)

The XRPL uses a Unique Node List (UNL) approach. Each validator trusts a curated list of other validators. For a transaction to clear, it needs agreement from 80% of a validator's trusted peers. This doesn't require energy expenditure — it requires communication.

The process per ledger round:
1. Validators collect proposed transactions
2. Each validator broadcasts a proposal set
3. Iterative voting rounds filter out transactions with low agreement
4. After ~3-5 rounds, >80% consensus triggers ledger close
5. Final ledger is cryptographically signed

## Why This Matters

Throughput: 1,500+ TPS. Finality: 3-5 seconds. Energy: negligible compared to PoW. The tradeoff is that it requires some degree of trust in validator selection — which is why validator diversity is actively encouraged by Ripple and the XRPL Foundation.

Understanding this is essential for any developer building on XRPL, because it shapes what guarantees you can make about finality and transaction ordering.`,
            priceXrp: 0.1,
          },
          {
            title: "Token Escrow on XRPL: The XLS-85 Standard Explained",
            preview:
              "XRPL's new Token Escrow amendment (XLS-85) enables time-locked or condition-locked escrow for fungible tokens — not just XRP. Here's how it works and why it enables entirely new payment architectures.",
            content: `XRPL's new Token Escrow amendment (XLS-85) enables time-locked or condition-locked escrow for fungible tokens — not just XRP. Here's how it works and why it enables entirely new payment architectures.

## What Is Escrow?

Escrow is a mechanism where funds are locked until a condition is met or a time expires. XRPL has supported XRP escrow since 2017. The XLS-85 amendment extends this to any Issued Currency or MPT (Multi-Purpose Token).

## How Token Escrow Works

A token escrow is an on-chain object with:
- **Amount**: The token and quantity locked
- **Destination**: Who can claim the funds
- **FinishAfter**: Earliest time the destination can claim
- **CancelAfter**: Time after which the source can reclaim
- **Condition**: Optional cryptographic condition (PREIMAGE-SHA-256)

Creating an escrow locks the tokens immediately. They're removed from the source wallet's usable balance. The destination claims with an EscrowFinish transaction.

## Reading Budgets via Token Escrow

One compelling use case: pre-funded reading budgets. A reader locks RLUSD into an escrow with a monthly expiry. A platform (as destination) can draw down from this escrow as articles are unlocked. The reader sets a budget once; the platform handles per-article deductions without requiring per-click wallet signatures.

This is the architecture Dropin uses for its advanced budget mode — transforming micropayments from a per-decision friction point into a periodic budgeting decision.

## Key Developer Considerations

- Escrow objects consume reserve on the ledger (2 XRP base reserve + 0.2 XRP per object)
- Conditional escrows require generating a PREIMAGE-SHA-256 condition off-chain
- Token escrow respects trust lines — the destination must have a trust line for the issued currency`,
            priceXrp: 0.15,
          },
          {
            title: "RLUSD: Ripple's Dollar Stablecoin on XRPL",
            preview:
              "Ripple launched RLUSD in late 2024 — a USD-pegged stablecoin issued natively on the XRP Ledger. Here's what makes it different from USDC or USDT, and why it matters for XRPL-based applications.",
            content: `Ripple launched RLUSD in late 2024 — a USD-pegged stablecoin issued natively on the XRP Ledger. Here's what makes it different from USDC or USDT, and why it matters for XRPL-based applications.

## The Basics

RLUSD is a 1:1 USD-backed stablecoin issued by Ripple on both XRP Ledger and Ethereum. Unlike algorithmic stablecoins, each RLUSD is backed by dollar deposits, US Treasury bonds, and cash equivalents held in a regulated trust structure.

## Why Issue on XRPL?

XRPL's native DEX and payment rails make it uniquely suited for stablecoin use cases:
- Sub-cent transaction fees make micro-transfers economically viable
- 3-5 second finality enables real-time settlement
- Built-in DEX allows instant XRP/RLUSD conversion at market price
- No smart contract risk — asset issuance is a protocol primitive

## Trust Lines

RLUSD operates via XRPL's trust line system. Before receiving RLUSD, a wallet must establish a trust line to Ripple's issuing address. This is a one-time on-chain operation. Applications can check for and create trust lines programmatically using xrpl.js.

## For Developers Building Payments

RLUSD is the natural choice for applications that want price-stable micropayments. An article priced at $0.10 stays at $0.10 regardless of XRP price movements. The Dropin platform supports both XRP and RLUSD payments, letting publishers set prices in stable dollar terms.

## Regulatory Status

RLUSD operates under a limited-purpose trust charter from the NYDFS (New York Department of Financial Services). Monthly attestation reports are published by an independent accounting firm.`,
            priceXrp: 0.05,
          },
        ],
      },
    },
  });

  const publisher2 = await prisma.publisher.create({
    data: {
      name: "Protocol Weekly",
      walletAddress: publisher2Wallet.address,
      description:
        "Weekly deep dives into open protocols, distributed systems, and the economics of decentralized networks.",
      articles: {
        create: [
          {
            title: "Why Micropayments Failed Before — And Why They Won't Now",
            preview:
              "Blendle raised $40M and signed deals with the New York Times and Wall Street Journal. Coil had Ripple backing and a W3C standard. Both are effectively dead. Here's the honest post-mortem, and why the landscape is different today.",
            content: `Blendle raised $40M and signed deals with the New York Times and Wall Street Journal. Coil had Ripple backing and a W3C standard. Both are effectively dead. Here's the honest post-mortem, and why the landscape is different today.

## What Went Wrong

**Blendle** (2014-2023): The Dutch micropayment platform let users pay per article. It launched with premium publisher partnerships and genuine user enthusiasm. By 2023 it had quietly pivoted to a subscription model and wound down the micropayment product.

The core issue: cognitive load. Deciding whether each article was worth €0.19 was exhausting. Users didn't want to think about money on every click. Conversion was terrible at the top of the funnel and even worse for individual articles.

**Coil** (2018-2023): Built on the Web Monetization API and Interledger Protocol. Publishers added a meta tag; Coil subscribers streamed micropayments per second while reading. The UX was elegant. The network was not.

Coil's problem: chicken-and-egg. Without publishers, readers had nothing to pay for. Without reader revenue, publishers had no reason to implement. Coil shut down in 2023.

## What's Different Now

Three things have changed:

1. **Economics**: Visa minimum fees made $0.10 transactions irrational. XRPL's ~$0.00002 fee makes them trivially viable. The margin math works.

2. **Wallet UX**: Crossmark, Xaman, and similar wallets have reduced XRPL interaction to a near-Stripe-level UX. Signing a payment is a one-tap operation.

3. **Budget model**: The reading budget concept (pre-fund, auto-spend) removes per-article decision fatigue — the core failure mode of Blendle. Readers decide once per month, not once per article.

The window exists. Whether it stays open depends on execution.`,
            priceXrp: 0.1,
          },
          {
            title: "On-Chain Publisher Identity: XRPL Credentials Explained",
            preview:
              "XRPL's Credentials amendment introduces on-chain verifiable credentials — W3C-compatible attestations that link an XRPL address to real-world identity. Here's how to use them for publisher verification.",
            content: `XRPL's Credentials amendment introduces on-chain verifiable credentials — W3C-compatible attestations that link an XRPL address to real-world identity. Here's how to use them for publisher verification.

## What Are XRPL Credentials?

A Credential is an on-chain object created by an issuer, tied to a subject (another XRPL address), containing a credential type and optional URI pointing to off-chain data. The credential must be accepted by the subject before it becomes active.

Think of it as: "Dropin (issuer) attests that this wallet address (subject) is a verified publisher (credential type)."

## The CredentialCreate Transaction

The CredentialCreate transaction specifies: TransactionType, Account (issuer/platform address), Subject (publisher wallet), CredentialType (hex-encoded string, e.g. "publisherverified"), an optional URI pointing to off-chain metadata, and an optional Expiration timestamp.

The CredentialType is hex-encoded. The URI can point to a JSON-LD document with full publisher metadata.

## Publisher Acceptance

The publisher must accept the credential with a CredentialAccept transaction from their own wallet. This prevents credential spam — issuers can't attach claims to wallets without the subject's cooperation.

## Verification In Practice

When a reader visits a publisher's page, the platform queries the XRPL for an active Credential object with:
- Issuer = platform address
- Subject = publisher wallet
- Type = "publisherverified"

If found and not expired, the publisher badge is shown. No centralized database required.

This is the architecture Dropin uses for the Sprint 2 publisher verification feature.`,
            priceXrp: 0.2,
          },
        ],
      },
    },
  });

  console.log(
    `Seeded: ${publisher1.name} (${publisher1.walletAddress}) — 3 articles`
  );
  console.log(
    `Seeded: ${publisher2.name} (${publisher2.walletAddress}) — 2 articles`
  );
  console.log("\nSeed complete. Remember to fund publisher wallets on testnet.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
