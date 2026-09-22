# Shielded Settle

Recover the real Merkle index for **contract-owned shielded coins** on [Midnight](https://midnight.network), then settle escrow that can actually spend them.

> **One-liner (submission form):** Developer kit + settlement desk that recovers `mtIndex` when `firstFree` returns `0`, so Compact escrow can release or refund shielded deposits.

**Live demo:** [https://shielded-settle.vercel.app/](https://shielded-settle.vercel.app/) · sim desk on `/` · real Preprod on `/live`

**GitHub:** [panagot/Shielded-Settle](https://github.com/panagot/Shielded-Settle)

## The Midnight problem

When a Compact contract receives a shielded coin, builders often call:

```ts
const state = await publicDataProvider.queryZSwapAndContractState(contractAddress);
const mtIndex = state.firstFree; // often 0 for contract-owned coins
```

Proof submission then fails with:

```text
invalid index into sparse merkle tree: 0
```

That gap is tracked in [servicedesk#187](https://github.com/midnightntwrk/servicedesk/issues/187). Shielded Settle packages the community workaround into a TypeScript kit and a settlement desk you can demo in the browser — plus a **Live Preprod** path for real Midnight transactions.

## What this repo is

| Layer | What judges get |
|---|---|
| **Compact sample** | `contracts/escrow.compact` — shielded `deposit` / `release` / `refund` |
| **TypeScript kit** | `src/kit` — `resolveContractCoinMtIndex` + fund-safety guards |
| **Sim desk** | Vite React UI that reproduces `#187` without a wallet |
| **Live Preprod** | `/live` via Lace, or CLI scripts with a seed wallet + local proof server |

| Mode | Route / command | Network |
|---|---|---|
| **Sim desk** | `/desk`, `/demo` | In-browser simulated ledger |
| **Live (Lace)** | `/live` | Real Preprod txs (Lace + Docker proof server) |
| **Live (CLI)** | `npm run settle:preprod` | Real Preprod txs (seed wallet, no browser) |

The TypeScript kit in `src/kit` is what every mode uses to qualify `mtIndex` when `firstFree` returns `0`.

## How to run (judges)

```bash
npm install
npm run build    # TypeScript + Vite production build
npm test         # fund-safety tests
npm run dev      # http://localhost:5177
```

### Sim click path (no wallet)

1. Open `/` — click **Run judge example** (or use `/demo`)
2. Watch deposit → probe (`firstFree` = 0) → resolve → release
3. Confirm `/stats`, `/gap`, `/integrate`

### Live Preprod with Lace

Prerequisites: [Docker Desktop](https://docs.docker.com/desktop/), [Lace](https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk) on **Preprod** with proof server **Local (`http://localhost:6300`)**.

1. Fund **Lace’s** Preprod unshielded address from the [Preprod faucet](https://midnight-tmnight-preprod.nethermind.dev/)
2. In Lace: **Generate tDUST** (register NIGHT for dust)
3. Then:

```bash
npm run compact:fetch   # once
npm run compact          # Docker Alpine + compactc 0.31
npm run proof-server    # midnightntwrk/proof-server:8.1.0 on :6300
npm run dev             # open /live → Connect Lace → Run full Preprod settle
```

### Live Preprod CLI (seed wallet, no Lace)

```bash
npm run proof-server
npm run wallet:preprod:faucet   # print seed + faucet address (or fund that address)
npm run wallet:sync             # confirm tNIGHT balance
npm run wallet:dust             # sync + register NIGHT → tDUST (dust tree catch-up can take a while)
npm run settle:preprod          # deploy → deposit → kit probe → release
```

Artifacts stay under `.wallet/` (gitignored): `preprod-test-wallet.json`, `sync-status.json`, `last-settle.json`.

| Route | Purpose |
|---|---|
| `/` | Judge landing + one-click sim example |
| `/desk` | Simulated settlement desk |
| `/live` | Lace + Preprod deploy / deposit / probe / release |
| `/demo` | Sim example walkthrough + video slot |
| `/stats` | Session KPIs for deals settled in this browser tab |
| `/integrate` | Resolver snippet + acceptance checks |
| `/gap` | Why `firstFree` lies |
| `/docs` | Kit docs index |
| `/deck.html` | Hackathon slide deck (print to PDF) |

## How Midnight is used

**Privacy.** Amounts stay in shielded coins. The contract holds a vault coin via `receiveShielded` and later spends with `sendShielded`. Parties and funded/settled flags can sit on ledger; value and commitment stay shielded.

**What Compact proves.** Ownership of the escrow flow (who may release/refund, single settle). The spend witness must include a correct `QualifiedShieldedCoinInfo.mtIndex`.

**What the kit fixes.** Until Midnight exposes a first-class contract-coin index API, the documented `firstFree` path is wrong for coins the contract owns. The kit:

1. Records the public `firstFree` (often `0`)
2. Parses `ZswapChainState.toString(true)` for **this** contract’s commitment only
3. Returns a non-zero `mtIndex` / `qualified` coin, or refuses to guess

Fund-safety: refuses `mtIndex === 0`, wrong-contract dump matches, ambiguous multi-index dumps, party collision, over-precision amounts, and a second spend of the same coin.

## Kit API

```ts
import { resolveContractCoinMtIndex } from "./src/kit";

const result = resolveContractCoinMtIndex({
  snapshot: {
    firstFree: 0n,
    debugDump: zswapState.toString(true),
  },
  lookup: {
    contractAddress,
    coin: { nonce, color, value },
  },
});

if (!result.ok || !result.qualified) {
  throw new Error(result.detail);
}

// result.qualified is safe to pass into sendShielded
```

## Repository layout

| Path | Purpose |
|---|---|
| `src/kit/` | Resolver + escrow flow engine + tests |
| `src/ui/` | Settlement desk + `/live` Preprod page |
| `src/midnight/` | Lace providers, live session, deposit coin helper |
| `contracts/escrow.compact` | Sample Compact escrow (+ compiled ZK assets) |
| `scripts/` | Compact compile, wallet, dust, CLI settle |
| `docs/` | How to use, gap notes, integration, deck PDF |
| `public/deck.html` | Printable slide deck |

## Honest scope

- **Sim desk** reproduces `#187` without Lace or Preprod — use it for fast judge review.
- **`/live` and CLI settle** talk to real Midnight Preprod (indexer + node). They need Docker proof server `8.1.0`, tNIGHT, and tDUST.
- Lace faucet funds and CLI seed funds are **separate wallets** — fund the address you will actually use.
- Dump-parsing is a **temporary workaround**. Keep the kit API; swap the dump path for the official lookup when `#187` is fixed.
- `npm run build` compiles the TypeScript app; Compact compile is `npm run compact` (Docker on Windows).

## Docs

- [How to use](docs/HOW_TO_USE.md)
- [The gap](docs/GAP.md)
- [Live integration](docs/INTEGRATION.md)
- [Slide deck PDF](docs/Shielded-Settle-Deck.pdf)

## References

- [servicedesk#187](https://github.com/midnightntwrk/servicedesk/issues/187)
- [Forum: contract-owned mtIndex gap](https://forum.midnight.network/t/a-gap-in-contract-owned-shielded-coin-handling-no-documented-way-to-get-the-real-mtindex-plus-a-couple-of-related-notes/1338)
- [Midnight Korea Hackathon 2026](https://www.hackathon.midnightkorea.org/)
