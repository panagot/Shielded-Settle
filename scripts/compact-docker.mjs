import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..").replace(/\\/g, "/");
const tools = `${root}/tools/compactc-0.31.0`;
const out = `${root}/contracts/managed/escrow`;

if (!existsSync(`${tools}/compactc.bin`)) {
  console.error("Compactc missing. Run: npm run compact:fetch");
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const cmd = [
  "run",
  "--rm",
  "-v",
  `${root}:/work`,
  "-v",
  `${tools}:/opt/compactc`,
  "-w",
  "/work",
  "--entrypoint",
  "/bin/sh",
  "alpine:3.20",
  "-c",
  "apk add --no-cache libgcc libstdc++ gcompat bash >/dev/null && chmod +x /opt/compactc/compactc /opt/compactc/compactc.bin /opt/compactc/zkir /opt/compactc/zkir-v3 && PATH=/opt/compactc:$PATH /opt/compactc/compactc /work/contracts/escrow.compact /work/contracts/managed/escrow",
];

console.log("Compiling escrow.compact via Docker Alpine + Compactc 0.31.0…");
const result = spawnSync("docker", cmd, { stdio: "inherit", shell: true });
process.exit(result.status ?? 1);
