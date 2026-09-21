# The gap Shielded Settle targets

## Symptom

Contract receives a shielded coin (`receiveShielded`). Later spend (`sendShielded`) needs `QualifiedShieldedCoinInfo.mtIndex`.

Builders call:

```ts
const state = await publicDataProvider.queryZSwapAndContractState(contractAddress);
const mtIndex = state.firstFree; // often 0 for contract-owned coins
```

Proof/submit then fails:

```text
invalid index into sparse merkle tree: 0
```

## Evidence

- GitHub: [midnightntwrk/servicedesk#187](https://github.com/midnightntwrk/servicedesk/issues/187) (open as of Sep 2026)
- Forum: [contract-owned mtIndex gap](https://forum.midnight.network/t/a-gap-in-contract-owned-shielded-coin-handling-no-documented-way-to-get-the-real-mtindex-plus-a-couple-of-related-notes/1338)
- Related content bounty tutorial (#288) covered deposit patterns but did not solve retrieval of the real index after confirmation

## Working community workaround

1. Deserialize the full zswap chain state bytes from the indexer
2. Call debug `toString(true)`
3. Locate the commitment row owned by the contract address
4. Use that row’s index as `mtIndex`

Shielded Settle packages that into `resolveContractCoinMtIndex`.

## What success looks like

Side-by-side:

| Source | Typical value |
|---|---|
| `firstFree` (documented) | `0` |
| Real ledger position | e.g. `46`, `51`, `56`… |
| Kit resolved `mtIndex` | matches real position |

Then `sendShielded` can release or refund.
