/**
 * CLI Preprod settle: deploy → deposit → probe mtIndex → release.
 * Requires: funded+dusted wallet, proof server :6300.
 *
 *   npm run settle:preprod
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pino from "pino";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import {
  MidnightWalletProvider,
  initializeMidnightProviders,
  syncWallet,
} from "@midnight-ntwrk/testkit-js";
import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { createShieldedCoinInfo, encodeRawTokenType, shieldedToken } from "@midnight-ntwrk/ledger-v8";
import { resolveContractCoinMtIndex } from "../src/kit/resolveMtIndex";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const walletPath = join(root, ".wallet", "preprod-test-wallet.json");
const outPath = join(root, ".wallet", "last-settle.json");
const saved = JSON.parse(readFileSync(walletPath, "utf8"));

setNetworkId("preprod");
const env = {
  walletNetworkId: "preprod",
  networkId: "preprod",
  indexer: "https://indexer.preprod.midnight.network/api/v4/graphql",
  indexerWS: "wss://indexer.preprod.midnight.network/api/v4/graphql/ws",
  node: "https://rpc.preprod.midnight.network",
  nodeWS: "wss://rpc.preprod.midnight.network",
  faucet: "https://midnight-tmnight-preprod.nethermind.dev/",
  proofServer: "http://127.0.0.1:6300",
};

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function hexToBytes(hex: string) {
  const h = hex.replace(/^0x/, "");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

const logger = pino({ level: "info" });
console.log("=== Shielded Settle — Preprod CLI ===");

const health = await fetch("http://127.0.0.1:6300/health").then((r) => r.json()).catch(() => null);
if (!health || health.status !== "ok") {
  console.error("Proof server not healthy on :6300 — run npm run proof-server");
  process.exit(1);
}

const walletProvider = await MidnightWalletProvider.build(logger, env, saved.masterSeed);
await walletProvider.wallet.start(walletProvider.zswapSecretKeys, walletProvider.dustSecretKey);
console.log("Syncing wallet…");
const state = await syncWallet(walletProvider.wallet, 5_000, 90 * 60_000);
const dust = state.dust.balance(new Date());
console.log("tDUST:", dust.toString());
if (dust === 0n) {
  console.error("Need tDUST > 0. Run: npm run wallet:dust");
  await walletProvider.stop();
  process.exit(2);
}

const zkPath = join(root, "contracts", "managed", "escrow");
const providers = initializeMidnightProviders(walletProvider, env, {
  privateStateStoreName: "shielded-settle-escrow",
  zkConfigPath: zkPath,
});

const managedUrl = pathToFileURL(join(zkPath, "contract", "index.js")).href;
const managed = await import(managedUrl);
const compiled = CompiledContract.make("ShieldedSettleEscrow", managed.Contract).pipe(
  CompiledContract.withWitnesses({}),
  CompiledContract.withCompiledFileAssets(zkPath),
);

const coinPk = walletProvider.getCoinPublicKey();
const depBytes =
  typeof coinPk === "string" ? hexToBytes(coinPk.replace(/^0x/, "")) : hexToBytes(String(coinPk));
console.log("Deploying escrow…");
const deployed = await deployContract(providers, {
  compiledContract: compiled,
  privateStateId: "escrowPrivateState",
  initialPrivateState: {},
  args: [depBytes, depBytes],
});
const contractAddress = deployed.deployTxData.public.contractAddress;
const deployTx = String(deployed.deployTxData.public.txId ?? deployed.deployTxData.public.txHash ?? "");
console.log("Contract:", contractAddress, "tx:", deployTx);
providers.privateStateProvider.setContractAddress(contractAddress);

const depositAtomic = 1_000_000n;
const coin = createShieldedCoinInfo(shieldedToken().raw, depositAtomic);
const nonce = hexToBytes(String(coin.nonce).replace(/^0x/, ""));
const color = encodeRawTokenType(coin.type);
const kitCoin = { nonce: bytesToHex(nonce), color: bytesToHex(color), value: coin.value };

console.log("Depositing…");
const depTx = await deployed.callTx.deposit({ nonce, color, value: coin.value });
const depositTxId = String(depTx.public.txId ?? depTx.public.txHash ?? "");
console.log("Deposit tx:", depositTxId);

await new Promise((r) => setTimeout(r, 10_000));
const zstate = await providers.publicDataProvider.queryZSwapAndContractState(contractAddress);
const firstFree = zstate?.firstFree ?? 0n;
let debugDump: string | undefined;
try {
  debugDump = zstate?.zswapChainState?.toString?.(true);
} catch {
  debugDump = undefined;
}
const kit = resolveContractCoinMtIndex({
  snapshot: { firstFree, debugDump },
  lookup: { contractAddress, coin: kitCoin },
});
console.log("Probe firstFree=", firstFree.toString(), kit);

if (!kit.ok || !kit.qualified || kit.mtIndex === 0n) {
  writeFileSync(outPath, JSON.stringify({ contractAddress, deployTx, depositTxId, firstFree: firstFree.toString(), kit }, null, 2));
  console.error("mtIndex resolve failed");
  await walletProvider.stop();
  process.exit(4);
}

const q = kit.qualified;
console.log("Releasing mtIndex=", q.mtIndex.toString());
const relTx = await deployed.callTx.release(
  {
    nonce: hexToBytes(q.nonce),
    color: hexToBytes(q.color),
    value: q.value,
    mt_index: q.mtIndex,
  },
  depBytes,
);
const releaseTxId = String(relTx.public.txId ?? relTx.public.txHash ?? "");

const result = {
  network: "preprod",
  at: new Date().toISOString(),
  contractAddress,
  deployTx,
  depositTxId,
  releaseTxId,
  firstFree: firstFree.toString(),
  mtIndex: q.mtIndex.toString(),
  depositAtomic: depositAtomic.toString(),
};
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log("\n=== SETTLED ON PREPROD ===\n", JSON.stringify(result, null, 2));
await walletProvider.stop();
process.exit(0);
