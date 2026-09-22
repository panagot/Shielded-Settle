import { bech32m } from "@scure/base";

function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/^0x/i, "");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Lace may return hex or Bech32m (`mn_shield-cpk_…` / `mn_shield-addr_…`).
 * Compact depositor/beneficiary need raw 32-byte coin public keys.
 */
export function coinPublicKeyToBytes(raw: string): Uint8Array {
  const s = raw.trim().replace(/^0x/i, "");
  if (/^[0-9a-fA-F]{64}$/.test(s)) return hexToBytes(s);

  if (s.startsWith("mn_")) {
    // Unlimited length: shield-addr exceeds MidnightBech32m.parse's default limit.
    const decoded = bech32m.decodeToBytes(s, false);
    const prefix = decoded.prefix;
    const data = decoded.bytes;
    if (prefix.includes("shield-cpk")) {
      if (data.length !== 32) throw new Error(`shield-cpk length ${data.length}, expected 32`);
      return new Uint8Array(data);
    }
    if (prefix.includes("shield-addr")) {
      if (data.length < 32) throw new Error("shield-addr payload too short for coin public key");
      return new Uint8Array(data.subarray(0, 32));
    }
    throw new Error(`Unsupported Midnight address type in prefix: ${prefix}`);
  }

  const match = s.match(/[0-9a-fA-F]{64}/);
  if (match) return hexToBytes(match[0]);

  throw new Error(
    "Wallet coin public key is not 32-byte hex or mn_shield-cpk / mn_shield-addr Bech32. Check Lace connector version.",
  );
}

export function coinPublicKeyToHex(raw: string): string {
  return bytesToHex(coinPublicKeyToBytes(raw));
}

/** Bech32 encryption keys (`mn_shield-epk_…`) → hex for Midnight.js. */
export function encryptionPublicKeyToHex(raw: string): string {
  const s = raw.trim().replace(/^0x/i, "");
  if (/^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0) return s.toLowerCase();
  if (!s.startsWith("mn_")) return s.toLowerCase();
  const decoded = bech32m.decodeToBytes(s, false);
  return bytesToHex(decoded.bytes);
}

export function hexKeyToBytes32(hex: string): Uint8Array {
  return coinPublicKeyToBytes(hex);
}
