# Live integration notes

Use this when moving beyond the local sim desk — either `/live` (Lace) or the CLI settle path.

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

On Preprod, this repo’s `/live` page and `npm run settle:preprod` already do steps 1–5 against:

- Indexer: `https://indexer.preprod.midnight.network/api/v4/graphql`
- Node: `https://rpc.preprod.midnight.network`
- Proof server: local Docker `:6300` (`npm run proof-server`, image `8.1.0`)

## B. Proof stack

Escrow settlement still needs a proving path (Lace dApp connector, or HTTP proof-server + wallet balancing). This kit does not replace proving — it only fixes coin qualification.

Fees on Midnight consume **tDUST**. On Preprod, designate your tNIGHT in Lace (**Generate tDUST** on the Midnight account card) or run `npm run wallet:dust` for a CLI seed. tDUST is non-transferable — there is no peer send or DEX swap.

## C. Suggested project layout

```text
your-dapp/
  contracts/escrow.compact      # start from this repo’s sample
  src/escrow/
    resolveMtIndex.ts           # copy or import from Shielded Settle
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
