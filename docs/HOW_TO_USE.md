# How to use Shielded Settle

## 1. Run the sim demo (no wallet)

```bash
npm install
npm run dev
```

Visit [http://localhost:5177](http://localhost:5177).

Recommended click path:

1. Open **Home** (`/`) → **Practice on sim desk**, or **Demo** → **Run example release**
2. On Desk: **Deploy** → **Deposit** → **Probe** (`firstFree` = 0) → **Resolve** → **Release** / **Refund**
3. Confirm **Stats**, then **Gap** / **Integrate** for evidence and the kit call

## 2. Live Preprod with Lace

Real Midnight transactions on Preprod.

1. Install [Lace](https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk); set Network to **Preprod**, Proof server to **Local (`http://localhost:6300`)**
2. Copy Lace’s **unshielded** address (`mn_addr_preprod…`). Do **not** paste shielded (`mn_shield-…`) or dust (`mn_dust-…`) into the faucet.
3. Request tNIGHT from the [Preprod faucet](https://midnight-tmnight-preprod.nethermind.dev/) → wait until the balance shows in Lace
4. On the **Midnight account card** in Lace: **Generate tDUST** (registers tNIGHT for dust generation). tDUST pays fees; it cannot be swapped or sent between wallets.
5. Local stack:

```bash
npm run proof-server    # Docker: midnightntwrk/proof-server:8.1.0
npm run compact:fetch   # once, if Compact artifacts are missing
npm run compact
npm run dev             # open /live
```

6. On `/live`: **Connect Lace** → **Run full Preprod settle** (deploy → deposit → kit probe → release). Approve each tx in Lace.

CLI faucet wallets and Lace wallets are different — always fund the wallet you will connect.

## 3. Live Preprod CLI (seed wallet)

```bash
npm run proof-server
npm run wallet:preprod:faucet
npm run wallet:sync
npm run wallet:dust          # may take a long time for dust-tree sync; needs a large Node heap
npm run settle:preprod
```

See `.wallet/last-settle.json` for contract address and tx ids (gitignored). Prefer **Lace** for the hackathon demo path if CLI dust sync is slow.

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
- Do not expect tDUST from the tNIGHT faucet alone — you must **Generate tDUST** in Lace after funding.

## 7. Next step after the demo

- Judges: [WALKTHROUGH.md](./WALKTHROUGH.md)
- Builders: [INTEGRATION.md](./INTEGRATION.md)
