/**
 * Wait for wallet sync, then register NIGHT→tDUST (docs: generating-dust-programmatically).
 * First registration can fail if UTXO is too new for projected fee dust — retries with backoff.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pino from "pino";
import { firstValueFrom, filter, timeout, throttleTime, tap } from "rxjs";
import { setNetworkId, getNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { MidnightWalletProvider } from "@midnight-ntwrk/testkit-js";
import { DustAddress, MidnightBech32m } from "@midnight-ntwrk/wallet-sdk-address-format";
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
console.log("Building wallet…");
const provider = await MidnightWalletProvider.build(logger, env, saved.masterSeed);
const address = provider.unshieldedKeystore.getBech32Address().asString();
console.log("Address:", address);
await provider.wallet.start(provider.zswapSecretKeys, provider.dustSecretKey);
const nightRaw = unshieldedToken().raw;

console.log("Syncing until unshielded+shielded complete (dust tree can finish later)…");
status({ phase: "sync-shielded", address });

const synced = await firstValueFrom(
  provider.wallet.state().pipe(
    throttleTime(8_000),
    tap((s) => {
      const sp = s.shielded.state.progress;
      const dp = s.dust.state.progress;
      const sPct = sp.highestRelevantWalletIndex
        ? Number((sp.appliedIndex * 10000n) / sp.highestRelevantWalletIndex) / 100
        : 0;
      const dPct = dp.highestRelevantWalletIndex
        ? Number((dp.appliedIndex * 10000n) / dp.highestRelevantWalletIndex) / 100
        : 0;
      console.log(
        `  sync shielded=${sPct.toFixed(2)}% dustTree=${dPct.toFixed(2)}% isSynced=${s.isSynced} u=${s.unshielded.progress.isStrictlyComplete()}`,
      );
      status({
        phase: "sync-shielded",
        shieldedPct: sPct,
        dustSyncPct: dPct,
        isSynced: s.isSynced,
        night: String(s.unshielded.balances?.[nightRaw] ?? 0n),
      });
    }),
    filter(
      (s) =>
        s.unshielded.progress.isStrictlyComplete() &&
        (s.shielded.state.progress.isStrictlyComplete() || s.isSynced === true),
    ),
    timeout({ first: 90 * 60_000 }),
  ),
);

console.log("Fully synced. tNIGHT=", String(synced.unshielded.balances[nightRaw] ?? 0n));

// Age briefly so projected dust covers registration fee (midnight-wallet#415).
// This UTXO is already hours old from the faucet — short wait is enough.
console.log("Brief wait for fee budget (30s)…");
status({ phase: "aging-utxo" });
await new Promise((r) => setTimeout(r, 30_000));

const state = await firstValueFrom(provider.wallet.state());
const unregistered = state.unshielded.availableCoins.filter(
  (c) => c.utxo.type === nightRaw && c.meta.registeredForDustGeneration === false,
);
console.log("Unregistered UTXOs:", unregistered.length);

if (unregistered.length === 0) {
  console.log("Already registered — waiting for tDUST…");
} else {
  const target = String(DustAddress.encodePublicKey(getNetworkId(), state.dust.publicKey));
  const dustReceiver = MidnightBech32m.parse(target).decode(DustAddress, getNetworkId());
  console.log("Dust receiver:", target);

  let txId;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      console.log(`Register attempt ${attempt}…`);
      status({ phase: "registering", attempt });
      const recipe = await provider.wallet.registerNightUtxosForDustGeneration(
        unregistered,
        provider.unshieldedKeystore.getPublicKey(),
        (payload) => provider.unshieldedKeystore.signData(payload),
        dustReceiver,
      );
      const finalized = await provider.wallet.finalizeRecipe(recipe);
      txId = await provider.wallet.submitTransaction(finalized);
      console.log("SUCCESS:", txId);
      saved.dustRegistrationTxId = String(txId);
      break;
    } catch (err) {
      console.error("  fail:", err instanceof Error ? err.message : err);
      status({ phase: "register-fail", attempt, error: String(err) });
      // Wait for more projected dust / chain tip
      await new Promise((r) => setTimeout(r, 30_000 * Math.min(attempt, 4)));
    }
  }
  if (!txId) {
    status({ phase: "register-exhausted" });
    await provider.stop();
    process.exit(1);
  }
}

console.log("Waiting for tDUST balance…");
status({ phase: "waiting-dust" });
const withDust = await firstValueFrom(
  provider.wallet.state().pipe(
    throttleTime(10_000),
    tap((s) => {
      const d = s.dust.balance(new Date());
      console.log("  tDUST=", d.toString(), "coins=", s.dust.availableCoins?.length ?? 0);
      status({ phase: "waiting-dust", dust: d.toString() });
    }),
    filter((s) => s.dust.balance(new Date()) > 0n),
    timeout({ first: 15 * 60_000 }),
  ),
);

saved.lastBalanceCheck = {
  at: new Date().toISOString(),
  night: String(withDust.unshielded.balances[nightRaw] ?? 0n),
  dust: String(withDust.dust.balance(new Date())),
};
writeFileSync(walletPath, JSON.stringify(saved, null, 2));
status({ phase: "ready", dust: saved.lastBalanceCheck.dust });
console.log("READY — tDUST=", saved.lastBalanceCheck.dust);
await provider.stop();
process.exit(0);
