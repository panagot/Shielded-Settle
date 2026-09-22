# How to use Shielded Settle

## 1. Run the sim demo (no wallet)

```bash
npm install
npm run dev
```

Visit [http://localhost:5177](http://localhost:5177).

Recommended click path:

1. Open **Home** (`/`) and click **Run judge example**, or step through **Desk**
2. On Desk: **Deploy** → **Deposit** → **Probe** (`firstFree` = 0) → **Resolve** → **Release** / **Refund**
3. Confirm **Stats**, then **Gap** / **Integrate** for evidence and the kit call

## 2. Live Preprod with Lace

Real Midnight transactions on Preprod.

1. Install [Lace](https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk); set Network to **Preprod**, Proof server to **Local (`http://localhost:6300`)**
2. Copy Lace’s unshielded Preprod address → [faucet](https://midnight-tmnight-preprod.nethermind.dev/) → wait for tNIGHT
3. In Lace: **Generate tDUST**
4. Local stack:

```bash
npm run proof-server    # Docker: midnightntwrk/proof-server:8.1.0
npm run compact:fetch   # once, if Compact artifacts are missing
npm run compact
npm run dev             # open /live
```

5. On `/live`: **Connect Lace** → **Run full Preprod settle** (deploy → deposit → kit probe → release)

CLI faucet wallets and Lace wallets are different — always fund the wallet you will connect.

## 3. Live Preprod CLI (seed wallet)

```bash
npm run proof-server
npm run wallet:preprod:faucet
npm run wallet:sync
npm run wallet:dust          # may take a long time for dust-tree sync
npm run settle:preprod
```

See `.wallet/last-settle.json` for contract address and tx ids (gitignored).

## 4. Use the TypeScript kit in your app

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

## 5. Compact contract

See `contracts/escrow.compact`.

Flow mirrored by the kit:

1. `deposit(coin)` → `receiveShielded` + store vault coin
2. Off-chain: resolve `mtIndex` with this kit
3. `release(qualifiedCoin, caller)` or `refund(qualifiedCoin, caller)` → `sendShielded`

Compile with `npm run compact` (Compact 0.31.x / language 0.23+), or your own Midnight Compact toolchain.

## 6. What not to do

- Do not hardcode `mtIndex: 0` for coins committed in a **previous** transaction.
- Do not trust `firstFree` alone for contract-owned coins.
- Do not treat the **sim desk** as mainnet — use `/live` or CLI for Preprod proofs.

## 7. Next step after the demo

Follow [INTEGRATION.md](./INTEGRATION.md) to wire the kit into your own indexer + proof stack.
