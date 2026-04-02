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

**Testnet micropayments (why purchases fail with “destination not activated”)** — `PaywallGate` sends XRP to the article’s **publisher wallet** from the DB (not `NEXT_PUBLIC_PLATFORM_WALLET`). Seed uses `Wallet.generate()`, so each run prints **new** publisher addresses. Those addresses must **already exist on-ledger** (activated with enough XRP to meet reserve) before a reader’s micropayment can succeed. Article prices are far below the ledger’s **account reserve**, so a reader payment **cannot** create a brand-new account — the destination must be activated first. The [XRPL testnet faucet](https://xrpl.org/xrpl-testnet-faucet.html) **mints new testnet accounts with test XRP**; it does **not** send XRP to arbitrary addresses you paste in. So you cannot “fund” seed-printed publisher addresses by typing them into the faucet UI. Practical options: (1) send test XRP **from** a wallet that already has testnet XRP (e.g. a Crossmark account you created when the faucet gave you a funded account) **to** each publisher address shown in the seed output; or (2) replace publisher `walletAddress` in the DB with an address you obtained from the faucet’s **generated** account, if you align seed data manually. Use Crossmark on **Testnet** to match the server’s node (`XRPL_NODE_URL`).

If the faucet experience you use **only** exposes new keys and never credits test XRP to arbitrary addresses, treat that the same as above: **some** wallet you control must hold testnet XRP and **pay** each publisher address enough to activate it on-ledger.

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

## Claude Code — collaboration workflow (follow for substantial work)

Use this loop so research and decisions live in **persistent files**, not only in chat history. Prefer **deep, codebase-grounded** understanding before coding.

### 0. Before starting any work — read the markdown docs

**Always read the relevant `markdown/` documents before touching code.** Context compresses across long conversations — the ground truth lives in the files, not in chat history. Read at minimum:
- `markdown/plan.md` — current phases, tasks, decisions, and status
- `markdown/phase2-changes.md` (or latest `phaseN-changes.md`) — what was actually built, deviations, and why
- `markdown/Context.md` — product context, demo deadline, differentiators

### 1. Research (understand deeply)

- Ask Claude to **map the relevant code paths end-to-end** (call sites, data flow, env vars, failure modes), not a surface summary.
- Require **findings in writing** in an existing doc under `markdown/` (e.g. append to `plan.md`, `phaseN-changes.md`, or `Context.md`) — **not** “chat-only” conclusions. Include file paths, key functions, and edge cases.

### 2. Planning (`markdown/plan.md`)

- Ask for a **detailed** `plan.md` (or updates to the current plan): phases, tasks, dependencies, risks.
- Where possible, **cite reference material**: existing UI patterns in the repo, comparable components, ID/slug patterns, prior API shapes — so implementation stays consistent.

### 3. Annotating (iterate without implementing)

- Add **inline notes** in `plan.md` (or the active phase doc): corrections, constraints, “do not implement yet,” product decisions.
- Send Claude back to the annotated document. Expect **several** review cycles (often **1–6**) until the plan matches intent. Keep **explicit**: no implementation until you say so.

### 4. Pre-implementation — detailed todo list

- Before coding, ask for a **step-by-step todo list** (similar to Cursor’s task list): ordered, checkable items tied to the plan.

### 5. Implementation

- Single prompt: **implement it all**; after each task or phase, **mark it complete in the plan document**; do not stop until all phases are done.
- Rules: **no unnecessary comments or JSDoc**; **no `any`**; avoid **unguarded `unknown`** (project standard — use narrowing); run **`npm run typecheck`** frequently and fix regressions immediately.

### 6. Document every change (granularly)

After implementation, **append a section to the active `phaseN-changes.md`** (or create a new one) documenting:
- Every file created or modified — and **why** (not just what)
- Any deviation from the plan, with the reason
- Key architectural decisions made during implementation
- Bugs discovered and fixed mid-implementation
- TypeScript / lint status after completion

This is mandatory, not optional. Chat history compresses. The `markdown/` docs are the permanent record. If a change isn't documented here, it effectively didn't happen from the perspective of future sessions.

The canonical implementation plan and checklist live in **`markdown/plan.md`**; high-level product context in **`markdown/Context.md`**. Keep new files in `markdown/` only when an existing doc is the wrong home.
