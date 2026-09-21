# Shielded Settle

Recover the real Merkle index for **contract-owned shielded coins** on [Midnight](https://midnight.network), then settle escrow that can actually spend them.

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

## What it does

1. **Deposit** shielded NIGHT into a contract vault (`receiveShielded`)
2. **Probe** the documented `firstFree` path (expect `0`)
3. **Resolve** the real `mtIndex` from the zswap debug dump
4. **Release** or **refund** with a qualified, non-zero index
5. **Refuse** a second spend of the same coin

The UI is an honest **simulated ledger**. It does not move mainnet funds. The resolver in `src/kit` is what you wire into a live Compact dApp.

## Live demo

Deploy this repo on Vercel (Vite preset), or run locally:

```bash
npm install
npm run dev
```

Open [http://localhost:5177](http://localhost:5177)

| Route | Purpose |
|---|---|
| `/desk` | Run deploy → deposit → probe → resolve → settle |
| `/stats` | Session KPIs and charts from deals in this tab |
| `/integrate` | Copy the resolver call and acceptance checks |
| `/gap` | Why `firstFree` lies, with evidence for #187 |
| `/docs` | How to run the demo and where the kit files live |
| `/demo` | Walkthrough video page (paste your YouTube URL) |

Interactive slide deck (print to PDF): open `/deck.html` after deploy, or see [`docs/Shielded-Settle-Deck.pdf`](docs/Shielded-Settle-Deck.pdf).

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
| `src/kit/` | Resolver + escrow flow engine |
| `src/ui/` | Settlement desk (React + Vite) |
| `contracts/escrow.compact` | Sample Compact escrow |
| `docs/` | How to use, gap notes, live integration |

## Scripts

```bash
npm run dev        # local demo UI
npm run build      # production build (Vercel)
npm test           # fund-safety kit tests
npm run typecheck
```

## Honest scope

- Demo mode does **not** connect to Midnight mainnet or preprod.
- The Compact sample needs your local `compact` toolchain to compile.
- Dump-parsing is a **temporary workaround** until Midnight ships a first-class contract-coin index API. Keep the kit’s call shape; swap the dump path for the official lookup when it lands.

## References

- [servicedesk#187](https://github.com/midnightntwrk/servicedesk/issues/187)
- [Forum: contract-owned mtIndex gap](https://forum.midnight.network/t/a-gap-in-contract-owned-shielded-coin-handling-no-documented-way-to-get-the-real-mtindex-plus-a-couple-of-related-notes/1338)
- [How to use](docs/HOW_TO_USE.md) · [Gap](docs/GAP.md) · [Integration](docs/INTEGRATION.md)

## License

Private / hackathon submission unless otherwise noted.
