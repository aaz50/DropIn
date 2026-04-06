import { PrismaClient } from "@prisma/client";
import { Wallet } from "xrpl";

const prisma = new PrismaClient();

async function main() {
  // Generate fresh testnet wallets for publishers.
  // After seeding, fund these addresses using a funded Crossmark testnet wallet:
  // send at least 15 XRP to each address to activate it on-ledger.
  const publisher1Wallet = Wallet.generate();
  const publisher2Wallet = Wallet.generate();

  console.log("\n=== FUND THESE ON XRPL TESTNET ===");
  console.log("Publisher 1:", publisher1Wallet.address);
  console.log("Publisher 2:", publisher2Wallet.address);
  console.log("===================================\n");

  // Delete in dependency order: Payment → Article → Publisher / Reader
  await prisma.payment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.publisher.deleteMany();
  await prisma.reader.deleteMany();

  await prisma.publisher.create({
    data: {
      name: "The Ledger Report",
      walletAddress: publisher1Wallet.address,
      description:
        "In-depth technical coverage of the XRP Ledger — consensus, tokens, and protocol primitives.",
      articles: {
        create: [
          {
            title: "How XRPL's Consensus Protocol Actually Works",
            preview:
              "Most blockchains reach agreement through proof-of-work or proof-of-stake. The XRP Ledger uses neither. Its consensus protocol closes ledgers in 3 to 5 seconds without mining, without staking, and without forks — and understanding how it works reveals what makes XRPL's design unusual.",
            content: `Most blockchains reach agreement through proof-of-work or proof-of-stake. The XRP Ledger uses neither. Its consensus protocol closes ledgers in 3 to 5 seconds without mining, without staking, and without forks.

## The Core Idea

Every XRPL node called a validator maintains a Unique Node List — a curated set of other validators it trusts to behave honestly. For a transaction to be included in a ledger, it needs to reach 80% agreement across a validator's trusted peers. No single validator wins the round. Instead, they converge through iterative voting.

## How a Ledger Closes

During each round, validators collect proposed transactions from the network and broadcast a candidate set to their peers. Validators compare notes, and transactions that fall below the agreement threshold get removed from the candidate set. After several rounds of narrowing, when the remaining transactions have achieved at least 80% agreement, the ledger closes and is cryptographically signed. This process repeats every 3 to 5 seconds under normal network conditions.

## What This Means in Practice

The XRPL processes over 1,500 transactions per second. Finality is deterministic — there are no forks to resolve and no waiting for additional block confirmations. A transaction included in a closed ledger is final. Transaction fees are not competitive bids. Validators use a small base fee that adjusts to current network load rather than allowing a bidding war.

## Energy and Decentralization

Because consensus does not require computational work, validators can run on standard server hardware. The energy consumption of the entire XRPL validator network is negligible compared to proof-of-work systems. The XRPL Foundation and Ripple actively encourage independent validator operation. Any operator can run a validator, and diversifying the validator set is an ongoing community effort.`,
            price: 0.1,
          },
          {
            title: "AMMs on XRPL: How the XLS-30 Amendment Works",
            preview:
              "In March 2024, the XLS-30 amendment brought Automated Market Makers to the XRP Ledger mainnet. Unlike AMMs on smart-contract chains, XRPL AMMs are first-class ledger objects built directly into the protocol. Here is how the design works and what makes it different.",
            content: `In March 2024, the XLS-30 amendment brought Automated Market Makers to the XRP Ledger mainnet. Unlike AMMs that run as smart contracts on other chains, XRPL AMMs are first-class ledger objects — part of the protocol itself, not code deployed on top of it.

## What Is an AMM Pool

An AMM pool on XRPL holds two assets: XRP paired with a token, or two different tokens paired together. Anyone can become a liquidity provider by depositing both assets in proportion to the current pool ratio. In return they receive LP tokens representing their share of the pool. When they withdraw, they receive their proportional share of the pool including any fees that accumulated while their liquidity was active.

## The Constant Product Formula

XRPL AMMs use a constant product formula to determine exchange rates. When one asset is removed from the pool, the price of the remaining asset increases proportionally, keeping the product of the two reserves constant. This creates automatic price discovery without a traditional order book on either side of the pool.

## The Continuous Auction Mechanism

XRPL's AMM includes a feature called the Continuous Auction Mechanism. This is a single-slot auction that gives one arbitrageur the right to trade at a discounted rate. Instead of multiple bots racing to capture price discrepancies and paying fees to external validators, the auction price flows back into the pool and benefits liquidity providers. The design keeps arbitrage value inside the protocol rather than extracting it externally.

## Integration With the Order Book DEX

XRPL has had a built-in order book exchange since its launch. AMMs work alongside it rather than replacing it. When the protocol routes a payment or fills an offer, it evaluates both the AMM pool and the order book and uses whichever path delivers the better rate, or combines both for optimal execution. This gives the protocol access to deeper liquidity across both market structures simultaneously.

## Trading Fees

Liquidity providers set a trading fee when creating an AMM pool, configurable from 0% to 1%. These fees accumulate in the pool and are distributed proportionally to liquidity providers when they withdraw their position.`,
            price: 0.15,
          },
          {
            title: "RLUSD: Ripple's Dollar Stablecoin on XRPL",
            preview:
              "Ripple launched RLUSD in late 2024 — a USD-pegged stablecoin issued natively on both the XRP Ledger and Ethereum. Here is what distinguishes it from other stablecoins and how it integrates with the XRPL protocol.",
            content: `Ripple launched RLUSD in late 2024, a USD-pegged stablecoin available on both the XRP Ledger and Ethereum. Each RLUSD is backed 1:1 by dollar deposits, US Treasury bonds, and cash equivalents held in a regulated trust structure.

## Regulatory Framework

RLUSD operates under a limited-purpose trust charter granted by the New York Department of Financial Services. This regulatory classification places it under similar oversight to other regulated stablecoins. Monthly attestation reports confirming reserves are published by an independent accounting firm, providing ongoing transparency to holders.

## Why the XRP Ledger

The XRP Ledger's protocol primitives make it well-suited for stablecoin use cases. Transaction fees are fractions of a cent, making small transfers economically practical. Ledger finality arrives in 3 to 5 seconds, enabling near-real-time settlement. The built-in DEX and AMM pools allow conversion between XRP and RLUSD at market rates with no external bridge or wrapped asset required. Asset issuance on XRPL is a protocol-level feature — there are no smart contracts to audit or upgrade.

## Trust Lines

Before a wallet can hold RLUSD, it must establish a trust line to Ripple's issuing address on the ledger. This is a one-time on-chain operation that signals the wallet is willing to hold the asset up to a specified limit. Once the trust line is set, sending and receiving RLUSD works identically to any other XRPL payment.

## Testnet vs Mainnet

RLUSD is available on both XRPL mainnet and testnet, but each network uses a different issuer address. Applications should read the issuer address from configuration rather than hardcoding it, so the same codebase can point at either network without modification.`,
            price: 0.05,
          },
        ],
      },
    },
  });

  await prisma.publisher.create({
    data: {
      name: "Protocol Weekly",
      walletAddress: publisher2Wallet.address,
      description:
        "Weekly analysis of open protocols, decentralized infrastructure, and the XRP Ledger ecosystem.",
      articles: {
        create: [
          {
            title: "XRPL's Built-In Exchange: How Native DEX Trading Works",
            preview:
              "The XRP Ledger has had a fully functional decentralized exchange built directly into the protocol since it launched in 2012. No smart contracts, no separate deployment — trading is a native ledger operation. Here is how the order book, auto-bridging, and cross-currency payments actually work.",
            content: `The XRP Ledger has had a built-in decentralized exchange since it launched in 2012. Trading is not a smart contract deployed on top of the protocol — it is part of the ledger itself, executed by every validator on every ledger close.

## Offers and the Order Book

The fundamental trading primitive on XRPL is an Offer object. A wallet creates an Offer by specifying a TakerPays amount (what they are willing to give) and a TakerGets amount (what they want in return). When a new offer crosses an existing one from the opposite side, both sides settle atomically and the assets transfer in the same ledger close. Partially filled offers remain in the ledger's order book until consumed by a future offer or manually cancelled.

## Auto-Bridging With XRP

XRPL includes a built-in auto-bridging feature. If a trader wants to exchange one issued currency for another and no direct market exists between them, the protocol automatically considers routing through XRP. If routing through XRP produces a better rate than trading directly, the protocol uses XRP as an intermediary and handles both hops atomically within a single transaction. The trader sees a single operation regardless of the internal path.

## Cross-Currency Payments

XRPL's path-finding system enables a sender to make a payment in one currency while the recipient receives a different currency, all in one atomic transaction. The sender specifies a maximum amount they are willing to spend, the recipient's address, and the currency the recipient should receive. The protocol finds the best available path through the order books and trust line relationships, executes the conversion, and guarantees the recipient receives at least the specified amount.

## Rippling

XRPL supports a mechanism called rippling, where balances flow through chains of trust relationships. If Alice trusts Bob for USD and Bob trusts Carol for USD, Alice can send USD to Carol via Bob in a single operation, with Bob's balances adjusting accordingly. Wallets can disable rippling on individual trust lines if they prefer not to act as an intermediary in these chains.`,
            price: 0.1,
          },
          {
            title: "Verifiable Credentials on the XRP Ledger",
            preview:
              "The XRPL Credentials amendment adds on-chain verifiable credentials to the XRP Ledger. These are attestations issued by one address about another — useful for identity verification, access control, KYC status, and professional certification without relying on a centralized database.",
            content: `The XRPL Credentials amendment adds on-chain verifiable credentials to the XRP Ledger. A credential is an on-chain object where one XRPL address (the issuer) makes a verifiable attestation about another address (the subject).

## The Two-Step Model

Creating an active credential requires two transactions. First, the issuer submits a CredentialCreate transaction specifying the subject's address, a credential type, an optional expiration timestamp, and an optional URI pointing to off-chain metadata such as a JSON-LD document. The credential object is written to the ledger in a pending state.

Second, the subject must explicitly accept the credential by submitting a CredentialAccept transaction from their own wallet. Only after this acceptance does the credential become active. This design prevents issuers from attaching claims to addresses without the subject's knowledge or consent, which would otherwise create a spam vector.

## Credential Types

The credential type is a 1 to 64-byte value defined by the issuer and encoded as a hex string in transactions. Issuers decide what their credential types represent. An identity provider might use a type representing KYC completion. A professional network might issue credentials representing employment verification. A platform might attest that a wallet address has completed a registration process.

## Querying Credentials

Applications can query the XRPL to check for active credentials on any address. A credential lookup returns the credential object if found, including the issuer, subject, type, optional URI, and expiration date if set. If the credential has not been accepted by the subject, or if it has expired, it does not appear as active.

## DepositAuth Integration

XRPL Credentials integrate with the DepositAuth feature. A wallet with DepositAuth enabled can specify that incoming payment senders must hold a credential from a trusted issuer before payments are allowed through. This creates a protocol-level compliance layer where an issuer, such as a regulated entity, can define which counterparties a wallet is willing to transact with.`,
            price: 0.2,
          },
        ],
      },
    },
  });

  console.log("Seeded: The Ledger Report — 3 articles");
  console.log("Seeded: Protocol Weekly — 2 articles");
  console.log("\nFund both publisher wallets on XRPL testnet before testing payments.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
