import type { HexAddress, ShieldedCoinInfo, ZswapChainStateSnapshot } from "./types";

/** Deterministic hex helpers for the local demo ledger (not cryptographic). */
export function randomHex(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function makeContractAddress(): HexAddress {
  return `mn_escrow_${randomHex(8)}`;
}

export function makeCoin(value: bigint, color = "NIGHT"): ShieldedCoinInfo {
  return {
    nonce: `0x${randomHex(32)}`,
    color,
    value,
  };
}

/**
 * Simulated chain state that reproduces the production bug:
 * firstFree stays 0 while the coin sits at a real non-zero tree index.
 */
export function buildBrokenSnapshot(input: {
  contractAddress: HexAddress;
  realMtIndex: bigint;
}): ZswapChainStateSnapshot {
  const addr = input.contractAddress;
  const idx = input.realMtIndex.toString();
  const debugDump = [
    "ZswapChainState {",
    "  commitment_tree:",
    `    ${Number(idx) - 2}: (Some(Wallet), None)`,
    `    ${Number(idx) - 1}: (Some(Wallet), None)`,
    `    ${idx}: (, Some(ContractAddress(${addr})))`,
    `    ${Number(idx) + 1}: empty`,
    "  first_free (contract query): 0   // buggy surface",
    "}",
  ].join("\n");

  return {
    firstFree: 0n,
    debugDump,
    serializedStateHex: `demo:${addr}:${idx}`,
  };
}

/** Allocate a realistic non-zero index like observed on devnet (46, 51, 56…). */
export function allocateDemoMtIndex(seed = Date.now()): bigint {
  const base = 40 + (seed % 50);
  return BigInt(base);
}
