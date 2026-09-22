/**
 * Generate a fresh Preprod test wallet (seed + faucet address).
 * Usage:
 *   node scripts/generate-preprod-wallet.mjs
 *   node scripts/generate-preprod-wallet.mjs --faucet
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pino from "pino";
import { createKeystore, PublicKey } from "@midnight-ntwrk/wallet-sdk";
import { FaucetClient, WalletSeeds } from "@midnight-ntwrk/testkit-js";
import { ZswapSecretKeys } from "@midnight-ntwrk/midnight-js-protocol/ledger";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, ".wallet");
const outFile = join(outDir, "preprod-test-wallet.json");

const FAUCET_URL = "https://midnight-tmnight-preprod.nethermind.dev/";
const logger = pino({ level: "warn" });

console.log("Generating fresh Preprod wallet…");

const seeds = WalletSeeds.generateRandom();
const keystore = createKeystore(seeds.unshielded, "preprod");
const publicKey = PublicKey.fromKeyStore(keystore);
const faucetAddress = (() => {
  if (typeof keystore.getBech32Address === "function") {
    const encoded = keystore.getBech32Address();
    return typeof encoded?.asString === "function" ? encoded.asString() : String(encoded);
  }
  return String(publicKey.address);
})();

const shieldedKeys = ZswapSecretKeys.fromSeed(seeds.shielded);
const coinPublicKey =
  typeof shieldedKeys.coinPublicKeyString === "function"
    ? shieldedKeys.coinPublicKeyString()
    : String(shieldedKeys.coinPublicKey ?? "");

const payload = {
  network: "preprod",
  createdAt: new Date().toISOString(),
  masterSeed: seeds.masterSeed,
  faucetAddress,
  coinPublicKey,
  publicKeyHex: publicKey.publicKey,
  faucetUrl: FAUCET_URL,
  note: "TEST ONLY. Fund faucetAddress at the Preprod faucet. Prefer Lace for the live desk (its own Preprod address). Never commit this file.",
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(payload, null, 2), "utf8");

console.log("");
console.log("=== Preprod test wallet (SAVE THIS) ===");
console.log(`Master seed (64 hex):  ${payload.masterSeed}`);
console.log(`Faucet address:        ${payload.faucetAddress}`);
console.log(`Shielded coinPk:       ${payload.coinPublicKey}`);
console.log(`Saved to:              ${outFile}`);
console.log("");
console.log(`1) Open faucet: ${FAUCET_URL}`);
console.log("2) Paste the faucet address and request tNIGHT");
console.log("3) Wait 1–3 minutes for funds");
console.log("4) For /live: use Lace Preprod wallet (Chrome) + Local proof server");
console.log("");

if (process.argv.includes("--faucet")) {
  console.log("Requesting tokens from faucet…");
  const faucet = new FaucetClient(FAUCET_URL, logger);
  await faucet.requestTokens(payload.faucetAddress);
  console.log("Faucet request submitted. Check balance in a few minutes.");
}

process.exit(0);
