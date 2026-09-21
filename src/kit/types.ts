/**
 * Core types for Escrow Index.
 * Mirrors Midnight QualifiedShieldedCoinInfo / Zswap shapes used by builders.
 */

export type HexAddress = `mn_${string}` | string;

export interface ShieldedCoinInfo {
  nonce: string;
  color: string;
  value: bigint;
}

/** Coin already committed on the ledger — required by sendShielded. */
export interface QualifiedShieldedCoinInfo extends ShieldedCoinInfo {
  mtIndex: bigint;
}

export interface ZswapChainStateSnapshot {
  /** Documented field. For contract-owned coins this often returns 0 (bug). */
  firstFree: bigint;
  /** Hex-encoded raw zswap state bytes (when available from indexer). */
  serializedStateHex?: string;
  /** Human-readable debug dump from ZswapChainState.toString(true), if present. */
  debugDump?: string;
}

export interface ContractCoinLookup {
  contractAddress: HexAddress;
  coin: ShieldedCoinInfo;
}

export type ResolveStrategy =
  | "query-first-free"
  | "debug-dump-parse"
  | "serialized-tree-scan"
  | "demo-ledger";

export interface MtIndexResolveResult {
  ok: boolean;
  mtIndex: bigint | null;
  strategy: ResolveStrategy;
  warning?: string;
  detail: string;
  qualified?: QualifiedShieldedCoinInfo;
}

export type EscrowStatus =
  | "idle"
  | "deployed"
  | "funded"
  | "index-resolved"
  | "released"
  | "refunded";

export interface EscrowDeal {
  id: string;
  contractAddress: HexAddress;
  depositor: string;
  beneficiary: string;
  amount: bigint;
  color: string;
  status: EscrowStatus;
  coin: ShieldedCoinInfo | null;
  qualified: QualifiedShieldedCoinInfo | null;
  firstFreeObserved: bigint | null;
  resolve: MtIndexResolveResult | null;
  createdAt: number;
  updatedAt: number;
}

export interface EscrowEvent {
  at: number;
  kind:
    | "deploy"
    | "deposit"
    | "resolve-failed"
    | "resolve-ok"
    | "release"
    | "refund"
    | "note";
  message: string;
}
