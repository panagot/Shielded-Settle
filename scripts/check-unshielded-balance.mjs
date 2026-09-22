/**
 * Fast balance check — wait only for unshielded sync (not shielded/dust).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pino from "pino";
import { firstValueFrom, filter, map, timeout, tap } from "rxjs";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { MidnightWalletProvider } from "@midnight-ntwrk/testkit-js";
import { unshieldedToken } from "@midnight-ntwrk/midnight-js-protocol/ledger";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const walletPath = join(root, ".wallet", "preprod-test-wallet.json");
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

const logger = pino({ level: "warn" });
const provider = await MidnightWalletProvider.build(logger, env, saved.masterSeed);
const address = provider.unshieldedKeystore.getBech32Address().asString();
console.log("Address:", address);

await provider.wallet.start(provider.zswapSecretKeys, provider.dustSecretKey);

const nightRaw = unshieldedToken().raw;
console.log("Waiting for unshielded sync (max 60s)…");

const snap = await firstValueFrom(
  provider.wallet.state().pipe(
    tap((s) => {
      const u = s.unshielded.progress?.isStrictlyComplete?.() === true;
      const bal = s.unshielded.balances?.[nightRaw] ?? 0n;
      if (u) console.log("  unshielded synced, tNIGHT=", bal.toString());
    }),
    filter((s) => s.unshielded.progress?.isStrictlyComplete?.() === true),
    map((s) => ({
      night: s.unshielded.balances?.[nightRaw] ?? 0n,
      coins: s.unshielded.availableCoins?.length ?? 0,
      dust: (() => {
        try {
          return s.dust.balance(new Date());
        } catch {
          return null;
        }
      })(),
      shieldedDone: s.shielded.state.progress.isStrictlyComplete(),
      dustDone: s.dust.state.progress.isStrictlyComplete(),
    })),
    timeout({ first: 60_000 }),
  ),
);

console.log("");
console.log("=== Unshielded snapshot ===");
console.log("tNIGHT:", snap.night.toString());
console.log("UTXOs:", snap.coins);
console.log("tDUST (may be incomplete):", String(snap.dust));
console.log("shielded synced:", snap.shieldedDone, "dust synced:", snap.dustDone);

saved.faucetAddress = address;
saved.lastBalanceCheck = {
  at: new Date().toISOString(),
  night: snap.night.toString(),
  coins: snap.coins,
  faucetTxHint: "00fabb6945092b42703442e240e1ba95cdd2f3b131c6e7b0e239009e3e6f507f8e",
};
writeFileSync(walletPath, JSON.stringify(saved, null, 2), "utf8");

await provider.stop();
process.exit(snap.night > 0n ? 0 : 2);
