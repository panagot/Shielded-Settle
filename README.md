# Shielded Settle

Recover the real Merkle index for **contract-owned shielded coins** on [Midnight](https://midnight.network), then settle escrow that can actually spend them.

> **One-liner (submission form):** Developer kit + settlement desk that recovers `mtIndex` when `firstFree` returns `0`, so Compact escrow can release or refund shielded deposits.

**Live demo:** [https://shielded-settle.vercel.app/](https://shielded-settle.vercel.app/)  
**GitHub:** [panagot/Shielded-Settle](https://github.com/panagot/Shielded-Settle)  
**Judge walkthrough:** [docs/WALKTHROUGH.md](docs/WALKTHROUGH.md)

---

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

That gap is tracked in [servicedesk#187](https://github.com/midnightntwrk/servicedesk/issues/187). Shielded Settle packages the community workaround into a TypeScript kit and a settlement desk you can demo in the browser — plus an optional **Live Preprod** path for real Midnight transactions.

---

## What this repo is

| Layer | What reviewers get |
|---|---|
| **Compact sample** | `contracts/escrow.compact` — shielded `deposit` / `release` / `refund` |
| **TypeScript kit** | `src/kit` — `resolveContractCoinMtIndex` + 31 fund-safety tests |
| **Sim desk** | Vite React UI that reproduces `#187` without a wallet |
| **Live Preprod** | `/live` via Lace, or CLI scripts with a seed wallet + local proof server |

| Mode | Route / command | Network |
|---|---|---|
| **Sim desk** | `/desk`, `/demo` | In-browser simulated ledger |
| **Live (Lace)** | `/live` | Real Preprod txs (Lace + Docker proof server) |
| **Live (CLI)** | `npm run settle:preprod` | Real Preprod txs (seed wallet, no browser) |

The TypeScript kit in `src/kit` is what every mode uses to qualify `mtIndex` when `firstFree` returns `0`.

---

## Reviewer walkthrough (start here)

**Fast path (~8 min, no wallet)** — full detail in [docs/WALKTHROUGH.md](docs/WALKTHROUGH.md):

1. Open the [live demo](https://shielded-settle.vercel.app/) or `npm run dev`
2. Go to **Demo** → click **Run example release**
3. Expect: probe shows `firstFree = 0` → kit returns a non-zero `mtIndex` → status **Released**
4. Skim **Gap** (`/gap`) and **Integrate** (`/integrate`)

**What success looks like**

| Signal | Expected |
|---|---|
| Probe | `firstFree` is `0` (the bug) |
| Resolve / kit | Non-zero qualified `mtIndex` |
| Release | Settles once; second spend of the same coin is refused |
| Stats | Counts update for **this browser tab only** |

---

## How to run

```bash
npm install
npm test         # 31 fund-safety tests
npm run build    # TypeScript + Vite production build
npm run dev      # http://127.0.0.1:5177
```

### Sim click path (no wallet)

1. `/demo` → **Run example release**, or `/desk` step-by-step
2. Confirm coral `firstFree = 0`, then mint qualified index, then Released
3. Open `/stats`, `/gap`, `/integrate`

### Live Preprod with Lace

Prerequisites: [Docker Desktop](https://docs.docker.com/desktop/), [Lace](https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk) on **Preprod** with proof server **Local (`http://localhost:6300`)**.

1. Copy Lace’s **unshielded** address (`mn_addr_preprod…` — not `mn_shield-…` / `mn_dust-…`) → [Preprod faucet](https://midnight-tmnight-preprod.nethermind.dev/) → wait for tNIGHT
2. Midnight account card in Lace → **Generate tDUST** (from your tNIGHT; **not** swappable or transferable)
3. Then:

```bash
npm run compact:fetch   # once
npm run compact          # Docker + compactc 0.31
npm run proof-server    # midnightntwrk/proof-server:8.1.0 on :6300
npm run dev             # /live → Connect Lace → Run full Preprod settle
```

`/live` accepts Lace coin public keys as hex or Bech32m (`mn_shield-cpk_…`).

### Live Preprod CLI (seed wallet, no Lace)

```bash
npm run proof-server
npm run wallet:preprod:faucet
npm run wallet:sync
npm run wallet:dust             # dust-tree sync can be slow / memory-heavy
npm run settle:preprod
```

Artifacts under `.wallet/` (gitignored). Prefer Lace for demos if CLI dust sync stalls.

---

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing + Preprod action checklist |
| `/desk` | Simulated settlement desk |
| `/live` | Lace + Preprod deploy / deposit / probe / release |
| `/demo` | One-click sim settle + recording script |
| `/stats` | Session KPIs for deals settled in this browser tab |
| `/integrate` | Resolver snippet + acceptance checks |
| `/gap` | Why `firstFree` lies |
| `/docs` | FAQ index |
| `/deck.html` | Hackathon slide deck (print to PDF) |

---

## How Midnight is used

**Privacy.** Amounts stay in shielded coins. The contract holds a vault coin via `receiveShielded` and later spends with `sendShielded`.

**What Compact proves.** Who may release/refund and that settle happens once. The spend witness needs a correct `QualifiedShieldedCoinInfo.mtIndex`.

**What the kit fixes.** Until Midnight exposes a first-class contract-coin index API:

1. Records public `firstFree` (often `0`)
2. Parses `ZswapChainState.toString(true)` for **this** contract’s commitment
3. Returns a non-zero `mtIndex` / `qualified` coin, or refuses to guess

Fund-safety: refuses `mtIndex === 0`, wrong-contract dump matches, ambiguous multi-index dumps, party collision, over-precision amounts, and a second spend of the same coin.

---

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

---

## Repository layout

| Path | Purpose |
|---|---|
| `src/kit/` | Resolver + escrow flow engine + tests |
| `src/ui/` | Settlement desk + `/live` Preprod page |
| `src/midnight/` | Lace providers, live session, Buffer/coin-key helpers |
| `contracts/escrow.compact` | Sample Compact escrow (+ compiled ZK assets) |
| `scripts/` | Compact compile, wallet, dust, CLI settle |
| `docs/` | Walkthrough, how-to, gap, integration, deck PDF |
| `public/deck.html` | Printable slide deck |

---

## Honest scope

- **Sim desk** reproduces `#187` without Lace — preferred for fast judge review.
- **`/live` / CLI** talk to real Preprod. Need Docker proof server `8.1.0`, tNIGHT, and **tDUST**.
- Lace faucet funds and CLI seeds are **different wallets**.
- Dump-parsing is a **temporary workaround** until `#187` is fixed in-protocol.
- `npm run build` builds the UI; Compact compile is `npm run compact` (Docker on Windows).

---

## Docs

- [Reviewer walkthrough](docs/WALKTHROUGH.md) ← start here
- [How to use](docs/HOW_TO_USE.md)
- [The gap](docs/GAP.md)
- [Live integration](docs/INTEGRATION.md)
- [Slide deck PDF](docs/Shielded-Settle-Deck.pdf)

## References

- [servicedesk#187](https://github.com/midnightntwrk/servicedesk/issues/187)
- [Forum: contract-owned mtIndex gap](https://forum.midnight.network/t/a-gap-in-contract-owned-shielded-coin-handling-no-documented-way-to-get-the-real-mtindex-plus-a-couple-of-related-notes/1338)
- [Midnight Korea Hackathon 2026](https://www.hackathon.midnightkorea.org/)
