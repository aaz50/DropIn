# Deployment Guide

This guide covers deploying Dropin to Vercel with a Neon PostgreSQL database. The setup takes about 15 minutes.

---

## Prerequisites

- A [Vercel](https://vercel.com) account
- A [Neon](https://neon.tech) account (free tier is sufficient)
- An XRPL testnet wallet to use as the platform wallet (for issuing publisher credentials)
- The repository pushed to GitHub

---

## Step 1: Set up Neon

1. Create a new Neon project.
2. On the project dashboard, copy the **connection string**. It looks like `postgresql://user:password@host/dbname?sslmode=require`.
3. Use the **pooled connection string** if available.

You will use this connection string as `DATABASE_URL` in both your local environment and Vercel (can separate environments later).

---

## Step 2: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repository.
2. Vercel will auto-detect Next.js. Before deploying, set the environment variables (Step 3 below).
3. Set the **Build Command** to:
  ```
   npx prisma db push && next build
  ```
   This syncs the Prisma schema to your Neon database on every deploy before building.
4. Leave the **Output Directory** and **Install Command** at their defaults.

---

## Step 3: Configure environment variables

In your Vercel project settings, go to **Settings > Environment Variables** and add the following:


| Variable                      | Description                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                | Neon PostgreSQL connection string                                                                                                      |
| `XRPL_NODE_URL`               | XRPL WebSocket endpoint. Use `wss://s.altnet.rippletest.net:51233` for testnet.                                                        |
| `NEXT_PUBLIC_PLATFORM_WALLET` | Your platform wallet's XRPL address (starts with `r`). Sent to the client — do not use your seed here.                                 |
| `PLATFORM_WALLET_SEED`        | Your platform wallet's secret seed (starts with `s`). Server-side only — never expose this publicly.                                   |
| `NEXT_PUBLIC_RLUSD_ISSUER`    | Testnet RLUSD issuer address. Find it at [testnet.xrpl.org](https://testnet.xrpl.org) by inspecting a wallet with an RLUSD trust line. |
| `NEXT_PUBLIC_RLUSD_CURRENCY`  | RLUSD currency code in hex: `524C555344000000000000000000000000000000`                                                                 |


Set all variables to apply to **Production**, **Preview**, and **Development** environments as needed.

After adding variables, trigger a new deployment from the Vercel dashboard.

---

## Step 4: Seed the database

After the first successful deploy, seed the database with sample publishers and articles. Run this once from your local machine:

```bash
npx prisma db seed
```

This uses your local `.env` file's `DATABASE_URL`, which should point to the same Neon database as Vercel. The seed creates two publishers and five XRPL-focused articles.

**Important:** The seed generates fresh publisher wallet addresses on every run. If you re-seed, any previously funded publisher wallets will be replaced with new unfunded ones — see Step 5.

---

## Step 5: Activate publisher wallets on testnet

Seed-generated publisher wallet addresses do not exist on the XRPL testnet ledger until they receive enough XRP to meet the base account reserve (~10 XRP). Reader payments cannot create new accounts, so the publisher wallet must be funded first.

After seeding, the seed output will print each publisher's wallet address. From a Crossmark testnet wallet that already has test XRP:

1. Open Crossmark and switch to Testnet.
2. Send at least 10 XRP to each publisher address shown in the seed output.

If your Crossmark wallet doesn't have testnet XRP, get some from the [XRPL testnet faucet](https://xrpl.org/xrpl-testnet-faucet.html) — click "Generate Testnet Credentials" to receive a funded testnet account, then import it into Crossmark.

---

## Step 6: Issue publisher credentials

Publisher credentials are issued automatically when a publisher registers via the app, provided `PLATFORM_WALLET_SEED` is set. For publishers created by the seed script (which bypasses the registration API), credentials need to be issued manually.

Open each publisher's dashboard in the browser and click **Request verification**. This triggers the platform to submit a `CredentialCreate` transaction on-chain. The "Verified on XRPL" badge will appear once the transaction confirms.

---

## Local vs. production environments

By default, your local `.env.local` and Vercel both point to the same Neon database. This means local development reads and writes to the same data as production. For a cleaner setup, create a separate Neon branch or database for local development and use that connection string in `.env` and `.env.local` only.

---

## Re-deploying

Subsequent deployments happen automatically when you push to the main branch (if you have GitHub integration enabled in Vercel). The build command `npx prisma db push && next build` runs on every deploy, which is safe  `db push` is idempotent and does nothing if the schema is already in sync.

Do not run `npx prisma db seed` on every deploy. It will regenerate publisher wallets and overwrite existing seed data.

---

## Troubleshooting

**Build fails with "Can't reach database server"**

Verify that `DATABASE_URL` is set correctly in Vercel's environment variables. The connection string must start with `postgresql://`, not `file:` or `host:5432`.

**Articles load but payments fail with "destination not activated"**

The publisher wallet has not been funded on testnet. Follow Step 5 above.

**RLUSD trust line never detected**

The `NEXT_PUBLIC_RLUSD_ISSUER` env var may be set to the mainnet Ripple issuer address instead of the testnet one. The two are different addresses — verify against a wallet on [testnet.xrpl.org](https://testnet.xrpl.org) that holds testnet RLUSD.

**"Verified on XRPL" badge not appearing after requesting verification**

Check that both `NEXT_PUBLIC_PLATFORM_WALLET` and `PLATFORM_WALLET_SEED` are set and non-empty in Vercel's environment variables. Also verify the platform wallet has enough testnet XRP to cover transaction fees (a few drops per credential).