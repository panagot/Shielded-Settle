/**
 * NIGHT already registered — keep syncing until tDUST appears (dust merkle catch-up).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pino from "pino";
import { firstValueFrom, filter, timeout, throttleTime, tap } from "rxjs";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { MidnightWalletProvider } from "@midnight-ntwrk/testkit-js";
import { unshieldedToken } from "@midnight-ntwrk/midnight-js-protocol/ledger";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const walletPath = join(root, ".wallet", "preprod-test-wallet.json");
const statusPath = join(root, ".wallet", "sync-status.json");
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

function status(patch) {
  let prev = {};
  try {
    prev = JSON.parse(readFileSync(statusPath, "utf8"));
  } catch {
    /* */
  }
  writeFileSync(statusPath, JSON.stringify({ ...prev, ...patch, updatedAt: new Date().toISOString() }, null, 2));
}

const logger = pino({ level: "warn" });
const provider = await MidnightWalletProvider.build(logger, env, saved.masterSeed);
console.log("Address:", provider.unshieldedKeystore.getBech32Address().asString());
await provider.wallet.start(provider.zswapSecretKeys, provider.dustSecretKey);
const nightRaw = unshieldedToken().raw;

console.log("Waiting for tDUST (up to 3h) while dust tree syncs…");
status({ phase: "waiting-dust-long" });

try {
  const withDust = await firstValueFrom(
    provider.wallet.state().pipe(
      throttleTime(15_000),
      tap((s) => {
        const dp = s.dust.state.progress;
        const dPct = dp.highestRelevantWalletIndex
          ? Number((dp.appliedIndex * 10000n) / dp.highestRelevantWalletIndex) / 100
          : 0;
        const dust = s.dust.balance(new Date());
        const night = s.unshielded.balances?.[nightRaw] ?? 0n;
        const registered = s.unshielded.availableCoins?.map((c) => c.meta?.registeredForDustGeneration);
        console.log(
          `tDUST=${dust} coins=${s.dust.availableCoins?.length ?? 0} dustTree=${dPct.toFixed(2)}% registered=${registered}`,
        );
        status({
          phase: "waiting-dust-long",
          dust: dust.toString(),
          dustSyncPct: dPct,
          night: night.toString(),
          registered,
        });
      }),
      filter((s) => s.dust.balance(new Date()) > 0n),
      timeout({ first: 3 * 60 * 60_000 }),
    ),
  );
  const dust = withDust.dust.balance(new Date());
  saved.lastBalanceCheck = {
    at: new Date().toISOString(),
    night: String(withDust.unshielded.balances[nightRaw] ?? 0n),
    dust: dust.toString(),
  };
  writeFileSync(walletPath, JSON.stringify(saved, null, 2));
  status({ phase: "ready", dust: dust.toString() });
  console.log("READY tDUST=", dust.toString());
  await provider.stop();
  process.exit(0);
} catch (err) {
  console.error("Timed out / failed:", err instanceof Error ? err.message : err);
  status({ phase: "dust-wait-failed", error: String(err) });
  await provider.stop();
  process.exit(3);
}
