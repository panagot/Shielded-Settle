# How to use Shielded Settle

## 1. Run the demo

```bash
npm install
npm run dev
```

Visit [http://localhost:5177](http://localhost:5177).

Recommended click path:

1. Open **Home** (`/`) and click **Run judge example**, or step through **Desk**
2. On Desk: **Deploy** → **Deposit** → **Probe** (`firstFree` = 0) → **Resolve** → **Release** / **Refund**
3. Confirm **Stats**, then **Gap** / **Integrate** for evidence and the kit call

## 2. Use the TypeScript kit in your app

```ts
import {
  resolveContractCoinMtIndex,
  resolveFromFirstFree,
  resolveFromDebugDump,
} from "./src/kit";
```

### Inputs you need

| Field | Source |
|---|---|
| `contractAddress` | Your deployed Compact escrow |
| `coin.nonce / color / value` | The shielded coin you deposited |
| `snapshot.firstFree` | From `publicDataProvider.queryZSwapAndContractState(address)` |
| `snapshot.debugDump` | From `ZswapChainState.deserialize(bytes).toString(true)` when `firstFree` is wrong |

### Output

On success:

- `result.ok === true`
- `result.mtIndex` is a non-zero `bigint`
- `result.qualified` is ready for `sendShielded`

On failure, read `result.detail` and `result.warning`.

## 3. Compact contract

See `contracts/escrow.compact`.

Flow mirrored by the kit:

1. `deposit(coin)` → `receiveShielded` + store vault coin
2. Off-chain: resolve `mtIndex` with this kit
3. `release(qualifiedCoin, caller)` or `refund(qualifiedCoin, caller)` → `sendShielded`

Compile with your Midnight Compact toolchain (0.31.x / language 0.23+). Adjust imports if your Standard Library path differs.

## 4. What not to do

- Do not hardcode `mtIndex: 0` for coins committed in a **previous** transaction.
- Do not trust `firstFree` alone for contract-owned coins.
- Do not ship the demo UI as “mainnet live” — label it demo until an indexer is wired.

## 5. Next step after the demo

Follow [INTEGRATION.md](./INTEGRATION.md) to replace the simulated ledger with your indexer + proof server.
