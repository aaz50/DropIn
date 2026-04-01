# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Dropin — XRPL-based micropayment platform. Readers pay per article (cents) via XRP/RLUSD using Crossmark wallet. Publishers set per-article prices. No auth system — reader identity is their wallet address.

## Commands

```bash
# Dev server
npm run dev

# Type checking (run after every file change — zero output = clean)
npm run typecheck

# Linting
npm run lint

# Database
npx prisma migrate dev        # Run migrations
npx prisma db seed            # Seed sample publishers + articles (regenerates wallet addresses)
npx prisma studio             # Browse DB in browser
```

## Environment Variables

Two env files are required — Prisma CLI reads `.env`, Next.js reads `.env.local`:

- `.env` — contains `DATABASE_URL` for Prisma CLI (migrations, seed, studio)
- `.env.local` — contains `DATABASE_URL`, `XRPL_NODE_URL`, `NEXT_PUBLIC_PLATFORM_WALLET`, `PLATFORM_WALLET_SEED` for the Next.js runtime

Both point to `file:./prisma/dev.db`.

## Architecture

**Framework**: Next.js 15 App Router. Server Components fetch data directly via Prisma. Client Components (`"use client"`) handle wallet interaction and payment state.

**Data flow for article unlock**:
1. `PaywallGate.tsx` constructs XRPL Payment tx and calls `window.crossmark.signAndSubmitAndWait()` — Crossmark both signs and submits to ledger (no separate submission needed)
2. Client POSTs the returned `txHash` to `POST /api/payments/verify`
3. `src/lib/xrpl/verify.ts` calls XRPL `tx` command to confirm `tesSUCCESS`, correct destination, and sufficient amount
4. Server upserts Reader + creates Payment record, then returns `article.content`

**XRPL client** (`src/lib/xrpl/client.ts`) — singleton, testnet (`wss://s.altnet.rippletest.net:51233`). Server-side only — never import in Client Components.

**Wallet state** — React context in `WalletProvider.tsx`, address persisted to `localStorage`. Crossmark typed via `Window` interface augmentation in `src/types/crossmark.d.ts` (no official package).

**Amounts** — stored as XRP (Float) in DB everywhere. Convert to drops (`Math.round(xrp * 1_000_000)`) only when constructing XRPL tx objects or calling verification.

**No auth** — publisher dashboard accessed by ID directly. Reader identity is wallet address only. Intentional for MVP demo scope.

## Next.js 15 Param Typing

Route handler and page `params` are Promises in Next.js 15:

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
}
```

## XRPL Constraints

- All features used must be live on mainnet (testnet for dev).
- Batch transactions amendment is NOT live — revenue splitting uses sequential transactions.
- `isValidClassicAddress()` from `xrpl` package validates wallet addresses on publisher registration.

## TypeScript

- `strict: true` — no exceptions, no `any`, no unguarded `unknown`
- All API routes return typed `Response`
- Run `npm run typecheck` after every file — must stay at zero errors

## Markdown Files

All planning/notes `.md` files live in `markdown/` (gitignored). Only `README.md` and this file belong at the project root.
