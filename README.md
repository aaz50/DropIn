# Dropin

A per-article micropayment platform built on the XRP Ledger. Readers pay cents to unlock individual articles instead of committing to monthly subscriptions. Publishers set their own prices and receive instant payments directly to their XRPL wallet.

XRPL's near-zero transaction fees (~$0.00002 per tx) make per-article pricing economically viable, something credit card processing fees ($.30 floor) have always made impossible.

---

## Features

**For readers**
- Connect an XRPL wallet (Crossmark) to unlock articles instantly
- Pay in XRP or RLUSD (USD-pegged stablecoin)
- Automatic trust line setup for RLUSD articles

**For publishers**
- Register a wallet address and start publishing immediately
- Set individual prices per article in XRP or RLUSD
- Rich text editor with bold, italic, and heading support
- Earnings dashboard with revenue stats, sales counts, and payment history
- On-chain verification via XRPL Credentials

**XRPL integration**
- Payments go directly to the publisher's wallet — no custodial holding
- Payment verification reads from the ledger directly, not from Crossmark's response
- Publisher identity attested on-chain via `CredentialCreate`
- All XRPL features used are live on mainnet (testnet used for development)

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Neon (Prisma ORM) |
| XRPL | xrpl.js, Crossmark wallet |
| Deployment | Vercel |

---

## Local development

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)
- Crossmark browser extension installed and set to **Testnet**
- An XRPL testnet wallet with test XRP (from the [XRPL faucet](https://xrpl.org/xrpl-testnet-faucet.html))

### 1. Clone and install

```bash
git clone <repo-url>
cd DropIn
npm install
```

### 2. Set up environment variables

Two env files are required — Prisma CLI reads `.env`, Next.js reads `.env.local`.

**`.env`**
```
DATABASE_URL="postgresql://..."
```

**`.env.local`**
```
DATABASE_URL="postgresql://..."
XRPL_NODE_URL="wss://s.altnet.rippletest.net:51233"
NEXT_PUBLIC_PLATFORM_WALLET="r..."
PLATFORM_WALLET_SEED="s..."
NEXT_PUBLIC_RLUSD_ISSUER="r..."
NEXT_PUBLIC_RLUSD_CURRENCY="524C555344000000000000000000000000000000"
```

See `.env.example` for descriptions of each variable.

**Getting a platform wallet:** Create a testnet wallet via the XRPL faucet. The address goes in `NEXT_PUBLIC_PLATFORM_WALLET` and the seed in `PLATFORM_WALLET_SEED`. Keep the seed secret — it is used server-side to issue publisher credentials on-chain.

**Getting the RLUSD issuer address:** Open [testnet.xrpl.org](https://testnet.xrpl.org), find any wallet that holds testnet RLUSD, and copy the issuer address from its trust lines.

### 3. Set up the database

```bash
npx prisma db push
npx prisma db seed
```

`db seed` creates two publishers and five sample articles covering XRPL consensus, AMMs, the DEX, RLUSD, and Credentials.

### 4. Activate publisher wallets on testnet

The seed generates fresh wallet addresses for publishers. These need to exist on-ledger (funded with at least 10 XRP) before readers can pay them — XRPL micropayments cannot create a new account if the payment amount is below the base reserve.

From your Crossmark testnet wallet, send at least 10 XRP to each publisher address printed by the seed output.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Commands

```bash
npm run dev          # Start dev server
npm run typecheck    # TypeScript check (must stay at zero errors)
npm run lint         # ESLint

npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma db push   # Sync schema to database
npx prisma db seed   # Seed sample publishers and articles
npx prisma studio    # Browse database in browser
```

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                          # Reader home — article browse
│   ├── articles/[id]/page.tsx            # Article detail + paywall
│   ├── publishers/
│   │   ├── register/page.tsx             # Publisher registration
│   │   └── [id]/dashboard/page.tsx       # Publisher dashboard
│   └── api/
│       ├── articles/                     # GET (filterable by publisherId), POST
│       ├── articles/[id]/                # GET single article (gated by payment)
│       ├── publishers/                   # GET by wallet, POST register
│       ├── publishers/[id]/earnings/     # GET earnings summary
│       ├── publishers/[id]/credential/   # POST trigger credential issuance
│       ├── credential/                   # GET credential status by address
│       ├── trustline/                    # GET RLUSD trust line status
│       └── payments/verify/              # POST verify tx and unlock article
├── components/
│   ├── PaywallGate.tsx                   # Paywall + payment state machine
│   ├── PublisherArticleForm.tsx          # Article creation form with toolbar
│   ├── WalletProvider.tsx                # Crossmark wallet context
│   └── ConnectWalletButton.tsx
└── lib/
    ├── format.ts                         # Shared formatting utilities
    ├── db/client.ts                      # Prisma singleton
    └── xrpl/
        ├── client.ts                     # XRPL WebSocket client singleton
        ├── verify.ts                     # Payment verification logic
        ├── credentials.ts               # CredentialCreate / status check
        ├── currency.ts                   # RLUSD constants, CREDENTIAL_TYPE_HEX
        └── types.ts                      # XRPL TypeScript types
```

---

## How the payment flow works

1. A reader opens an article. `PaywallGate` checks whether a payment record exists for their wallet address.
2. If not, the paywall is shown. The reader clicks "Unlock" — Crossmark signs and submits the payment transaction directly to the ledger.
3. The client sends the returned transaction hash to `POST /api/payments/verify`.
4. The server queries the XRPL ledger to confirm: correct destination, correct amount, `tesSUCCESS` result. It reads `delivered_amount` from the transaction metadata — never the `Amount` field — to prevent short-pay attacks.
5. On success, a `Payment` record is created and the article content is returned.

RLUSD payments follow the same flow with an additional trust line check before payment. If the trust line is missing, Crossmark walks the reader through a `TrustSet` transaction first.

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full Vercel + Neon deployment guide.

---