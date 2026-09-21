# Live integration notes

Use this when moving beyond the local demo ledger.

## A. Indexer / public data provider

1. After deposit finality, query contract zswap state.
2. Record `firstFree`.
3. If `firstFree === 0n` (or spend fails with sparse-tree index `0`), obtain raw serialized zswap state and produce a debug dump:

```ts
const bytes = /* from indexer / provider */;
const zswapState = ZswapChainState.deserialize(bytes);
const debugDump = zswapState.toString(true);
```

4. Resolve:

```ts
const result = resolveContractCoinMtIndex({
  snapshot: { firstFree, debugDump },
  lookup: { contractAddress, coin },
});
```

5. Pass `result.qualified` into your Compact `release` / `refund` witness builder.

## B. Proof stack

Escrow settlement still needs a proving path (Lace provider when available, otherwise HTTP proof-server). This kit does not replace proving — it only fixes coin qualification.

## C. Suggested project layout

```text
your-dapp/
  contracts/escrow.compact      # start from this repo’s sample
  src/escrow/
    resolveMtIndex.ts           # copy or import from Escrow Index
    release.ts                  # builds witness + submits tx
  src/ui/                       # optional operator console
```

## D. Acceptance checks

- [ ] Deposit tx confirms and contract `funded == true`
- [ ] Naive `firstFree` path fails or returns `0`
- [ ] Kit returns non-zero `mtIndex`
- [ ] Release/refund proof succeeds against that index
- [ ] Second spend of the same coin fails (nullifier / settled guard)

## E. When Midnight fixes #187

Keep the kit’s API, but prefer the official contract-coin lookup once documented. Treat dump-parsing as deprecated fallback.
