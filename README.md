# Shielded Settle

Recover the real Merkle index for **contract-owned shielded coins** on [Midnight](https://midnight.network), then settle escrow that can actually spend them.

> **One-liner (submission form):** Developer kit + settlement desk that recovers `mtIndex` when `firstFree` returns `0`, so Compact escrow can release or refund shielded deposits.

**Live demo:** [https://shielded-settle.vercel.app/](https://shielded-settle.vercel.app/)

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

That gap is tracked in [servicedesk#187](https://github.com/midnightntwrk/servicedesk/issues/187). Shielded Settle packages the community workaround into a TypeScript kit and a settlement desk you can demo in the browser.

## What this repo is

| Layer | What judges get |
|---|---|
| **Compact sample** | `contracts/escrow.compact` — shielded `deposit` / `release` / `refund` |
| **TypeScript kit** | `src/kit` — `resolveContractCoinMtIndex` + fund-safety guards |
| **Demo UI** | Vite React desk that **simulates** the ledger so anyone can reproduce the bug and the fix without Lace or Preprod |

The UI is an honest **simulated ledger**. It does not move mainnet or Preprod funds. The resolver in `src/kit` is what you wire into a live Compact dApp with an indexer and proof server.

## How to run (judges)

```bash
npm install
npm run build    # compiles; required check
npm test         # 31 fund-safety tests
npm run dev      # http://localhost:5177
```

**Demo click path (judges)**

1. Open `/` — click **Run example settle** (or use `/demo`)
2. Watch deposit → probe (`firstFree` = 0) → resolve → release
3. Confirm `/stats` recorded the session
4. Open `/gap` for the failure string and `#187` evidence
5. Open `/integrate` for the copy-ready kit call

| Route | Purpose |
|---|---|
| `/` | Judge landing + one-click example |
| `/desk` | Deploy → deposit → probe → resolve → settle |
| `/demo` | Live example settle + video slot |
| `/stats` | Session KPIs from deals in this tab |
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
| `src/ui/` | Settlement desk (React + Vite) |
| `contracts/escrow.compact` | Sample Compact escrow |
| `docs/` | How to use, gap notes, integration, deck PDF |
| `public/deck.html` | Printable slide deck |

## Honest scope (read this)

- **Demo UI ≠ live Midnight node.** It reproduces `#187` locally so review does not require Lace, Docker proof server, or Preprod faucet.
- **Compact sample** compiles with your Midnight Compact toolchain (language 0.23+ / compiler 0.31.x family). Adjust Standard Library imports if your install differs. `npm run build` compiles the TypeScript app; it does not invoke `compact`.
- Dump-parsing is a **temporary workaround**. Keep the kit API; swap the dump path for the official lookup when `#187` is fixed.

## Docs

- [How to use](docs/HOW_TO_USE.md)
- [The gap](docs/GAP.md)
- [Live integration](docs/INTEGRATION.md)
- [Slide deck PDF](docs/Shielded-Settle-Deck.pdf)

## References

- [servicedesk#187](https://github.com/midnightntwrk/servicedesk/issues/187)
- [Forum: contract-owned mtIndex gap](https://forum.midnight.network/t/a-gap-in-contract-owned-shielded-coin-handling-no-documented-way-to-get-the-real-mtindex-plus-a-couple-of-related-notes/1338)
- [Midnight Korea Hackathon 2026](https://www.hackathon.midnightkorea.org/)
