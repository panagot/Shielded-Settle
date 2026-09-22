import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const toolsDir = join(root, "tools");
const zipName = "compactc_v0.31.0_x86_64-unknown-linux-musl.zip";
const zipPath = join(toolsDir, zipName);
const outDir = join(toolsDir, "compactc-0.31.0");

mkdirSync(toolsDir, { recursive: true });

if (!existsSync(join(outDir, "compactc.bin"))) {
  console.log("Downloading Compactc 0.31.0 (linux musl)…");
  const dl = spawnSync(
    "gh",
    [
      "release",
      "download",
      "compactc-v0.31.0",
      "-R",
      "midnightntwrk/compact",
      "-p",
      zipName,
      "-D",
      toolsDir,
      "--clobber",
    ],
    { stdio: "inherit", shell: true },
  );
  if (dl.status !== 0) process.exit(dl.status ?? 1);

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const unzip = spawnSync(
    "powershell",
    ["-NoProfile", "-Command", `Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir}' -Force`],
    { stdio: "inherit" },
  );
  if (unzip.status !== 0) process.exit(unzip.status ?? 1);
}

console.log("Compactc ready at", outDir);
