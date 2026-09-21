import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "contracts", "managed", "escrow");
const dest = join(root, "public", "managed", "escrow");

if (!existsSync(join(src, "keys")) || !existsSync(join(src, "zkir"))) {
  console.warn("No keys/zkir yet — run npm run compact first. Skipping public copy.");
  process.exit(0);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(join(src, "keys"), join(dest, "keys"), { recursive: true });
cpSync(join(src, "zkir"), join(dest, "zkir"), { recursive: true });
console.log("Copied ZK assets to public/managed/escrow for Lace FetchZkConfigProvider.");
