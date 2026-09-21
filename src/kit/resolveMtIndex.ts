import type {
  ContractCoinLookup,
  MtIndexResolveResult,
  QualifiedShieldedCoinInfo,
  ShieldedCoinInfo,
  ZswapChainStateSnapshot,
} from "./types";

const ZERO = 0n;

export class FundSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FundSafetyError";
  }
}

/** Reject coins that must never be submitted to sendShielded. */
export function assertSpendableCoin(
  coin: QualifiedShieldedCoinInfo,
  expected?: { value?: bigint; nonce?: string; color?: string },
): void {
  if (coin.mtIndex === ZERO) {
    throw new FundSafetyError(
      "Refuse spend: mtIndex is 0 (servicedesk#187 failure mode).",
    );
  }
  if (coin.mtIndex < ZERO) {
    throw new FundSafetyError("Refuse spend: mtIndex is negative.");
  }
  if (coin.value <= ZERO) {
    throw new FundSafetyError("Refuse spend: coin value must be > 0.");
  }
  if (!coin.nonce || coin.nonce.length < 8) {
    throw new FundSafetyError("Refuse spend: coin nonce missing or too short.");
  }
  if (!coin.color) {
    throw new FundSafetyError("Refuse spend: coin color/token type missing.");
  }
  if (expected?.value !== undefined && coin.value !== expected.value) {
    throw new FundSafetyError(
      `Refuse spend: value mismatch (coin ${coin.value} vs expected ${expected.value}).`,
    );
  }
  if (expected?.nonce !== undefined && coin.nonce !== expected.nonce) {
    throw new FundSafetyError("Refuse spend: nonce mismatch with deposited coin.");
  }
  if (expected?.color !== undefined && coin.color !== expected.color) {
    throw new FundSafetyError("Refuse spend: color mismatch with deposited coin.");
  }
}

export function assertPositiveDeposit(amount: bigint): void {
  if (amount <= ZERO) {
    throw new FundSafetyError("Deposit amount must be greater than zero.");
  }
}

/**
 * Naive path almost every tutorial suggests.
 * On contract-owned coins this routinely returns firstFree = 0 (servicedesk#187).
 */
export function resolveFromFirstFree(
  snapshot: ZswapChainStateSnapshot,
  lookup: ContractCoinLookup,
): MtIndexResolveResult {
  try {
    assertPositiveDeposit(lookup.coin.value);
  } catch (err) {
    return fail("query-first-free", err);
  }

  const mtIndex = snapshot.firstFree;
  if (mtIndex === ZERO) {
    return {
      ok: false,
      mtIndex: ZERO,
      strategy: "query-first-free",
      warning:
        "firstFree is 0. Using it as mtIndex fails proof-time with: invalid index into sparse merkle tree: 0",
      detail:
        "publicDataProvider.queryZSwapAndContractState(contract).firstFree is not trustworthy for contract-owned coins.",
    };
  }
  if (mtIndex < ZERO) {
    return {
      ok: false,
      mtIndex,
      strategy: "query-first-free",
      detail: "firstFree was negative — refusing to qualify coin.",
    };
  }

  return {
    ok: true,
    mtIndex,
    strategy: "query-first-free",
    warning:
      "firstFree looked non-zero; still verify against dump/indexer before moving real funds.",
    detail: "firstFree looked non-zero; treat as provisional until proven on-chain.",
    qualified: qualify(lookup.coin, mtIndex),
  };
}

/**
 * Workaround for #187: parse debug dump for THIS contract's commitment only.
 * Never returns another contract's index (fund-safety).
 */
export function resolveFromDebugDump(
  snapshot: ZswapChainStateSnapshot,
  lookup: ContractCoinLookup,
): MtIndexResolveResult {
  try {
    assertPositiveDeposit(lookup.coin.value);
  } catch (err) {
    return fail("debug-dump-parse", err);
  }

  const dump = snapshot.debugDump?.trim();
  if (!dump) {
    return {
      ok: false,
      mtIndex: null,
      strategy: "debug-dump-parse",
      detail:
        "No debugDump provided. Call ZswapChainState.deserialize(bytes).toString(true) first.",
    };
  }

  const needles = addressNeedles(lookup.contractAddress);
  if (needles.length === 0) {
    return {
      ok: false,
      mtIndex: null,
      strategy: "debug-dump-parse",
      detail: "Contract address is empty — refusing ambiguous dump parse.",
    };
  }

  const lines = dump.split(/\r?\n/);
  const hits: Array<{ index: bigint; line: string }> = [];

  for (const line of lines) {
    if (!/contractaddress/i.test(line)) continue;
    if (!needles.some((n) => line.includes(n))) continue;

    const match = line.match(/^\s*(\d+)\s*:/);
    if (!match) continue;
    const index = BigInt(match[1]);
    if (index === ZERO) continue;
    hits.push({ index, line: line.trim() });
  }

  if (hits.length === 0) {
    return {
      ok: false,
      mtIndex: null,
      strategy: "debug-dump-parse",
      detail: `No commitment row matched contract ${lookup.contractAddress}. Refusing to guess another contract's index.`,
    };
  }

  if (hits.length > 1) {
    const unique = new Set(hits.map((h) => h.index.toString()));
    if (unique.size > 1) {
      return {
        ok: false,
        mtIndex: null,
        strategy: "debug-dump-parse",
        warning: "Multiple distinct indices matched this contract address.",
        detail: `Ambiguous dump matches for ${lookup.contractAddress}: ${[...unique].join(", ")}. Manual review required before moving funds.`,
      };
    }
  }

  const chosen = hits[hits.length - 1];
  return {
    ok: true,
    mtIndex: chosen.index,
    strategy: "debug-dump-parse",
    warning:
      "Debug-dump parsing is a temporary workaround until Midnight exposes a first-class contract-coin mtIndex API.",
    detail: `Parsed mtIndex ${chosen.index.toString()} from dump line: ${chosen.line}`,
    qualified: qualify(lookup.coin, chosen.index),
  };
}

/**
 * Preferred kit entry: try documented API first, then fall back to dump parse.
 * `forcedIndex` must be non-zero; zero is always rejected.
 */
export function resolveContractCoinMtIndex(input: {
  snapshot: ZswapChainStateSnapshot;
  lookup: ContractCoinLookup;
  forcedIndex?: bigint;
}): MtIndexResolveResult {
  try {
    assertPositiveDeposit(input.lookup.coin.value);
  } catch (err) {
    return fail("demo-ledger", err);
  }

  if (input.forcedIndex !== undefined) {
    if (input.forcedIndex === ZERO) {
      return {
        ok: false,
        mtIndex: ZERO,
        strategy: "demo-ledger",
        detail: "forcedIndex=0 rejected — would recreate the sparse merkle tree failure.",
      };
    }
    if (input.forcedIndex < ZERO) {
      return {
        ok: false,
        mtIndex: input.forcedIndex,
        strategy: "demo-ledger",
        detail: "forcedIndex is negative — refused.",
      };
    }
    return {
      ok: true,
      mtIndex: input.forcedIndex,
      strategy: "demo-ledger",
      detail: "Using ledger-known index (demo or operator-provided).",
      qualified: qualify(input.lookup.coin, input.forcedIndex),
    };
  }

  const naive = resolveFromFirstFree(input.snapshot, input.lookup);
  if (naive.ok && naive.mtIndex !== null && naive.mtIndex !== ZERO) {
    return naive;
  }

  const parsed = resolveFromDebugDump(input.snapshot, input.lookup);
  if (parsed.ok) return parsed;

  return {
    ok: false,
    mtIndex: naive.mtIndex,
    strategy: "query-first-free",
    warning: naive.warning,
    detail: `${naive.detail} Fallback dump parse also failed: ${parsed.detail}`,
  };
}

export function qualify(
  coin: ShieldedCoinInfo,
  mtIndex: bigint,
): QualifiedShieldedCoinInfo {
  const qualified = {
    nonce: coin.nonce,
    color: coin.color,
    value: coin.value,
    mtIndex,
  };
  assertSpendableCoin(qualified);
  return qualified;
}

function addressNeedles(address: string): string[] {
  const trimmed = address.trim();
  if (!trimmed) return [];
  const withoutPrefix = trimmed.replace(/^mn_/, "");
  const needles = new Set<string>([trimmed, withoutPrefix]);
  if (withoutPrefix.length >= 12) needles.add(withoutPrefix.slice(0, 24));
  return [...needles].filter(Boolean);
}

function fail(
  strategy: MtIndexResolveResult["strategy"],
  err: unknown,
): MtIndexResolveResult {
  const message = err instanceof Error ? err.message : String(err);
  return {
    ok: false,
    mtIndex: null,
    strategy,
    detail: message,
  };
}

/** Tiny helper for UIs / logs. */
export function formatIndex(value: bigint | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toString();
}
