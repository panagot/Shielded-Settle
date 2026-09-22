import { createShieldedCoinInfo, encodeRawTokenType, shieldedToken } from "@midnight-ntwrk/ledger-v8";
import type { ShieldedCoinInfo as KitCoin } from "@kit/types";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, "");
  const h = clean.length % 2 === 0 ? clean : `0${clean}`;
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/**
 * Build a fresh shielded coin for contract deposit.
 * Lace/wallet funds this output when balancing the transaction.
 */
export function makeDepositCoin(amountAtomic: bigint): {
  runtime: { nonce: Uint8Array; color: Uint8Array; value: bigint };
  kit: KitCoin;
} {
  if (amountAtomic <= 0n) {
    throw new Error("Deposit amount must be > 0");
  }
  const coin = createShieldedCoinInfo(shieldedToken().raw, amountAtomic);
  const nonce = hexToBytes(String(coin.nonce).replace(/^0x/, ""));
  const color = encodeRawTokenType(coin.type);
  return {
    runtime: { nonce, color, value: coin.value },
    kit: {
      nonce: bytesToHex(nonce),
      color: bytesToHex(color),
      value: coin.value,
    },
  };
}
