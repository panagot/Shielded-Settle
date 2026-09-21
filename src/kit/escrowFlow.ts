import {
  allocateDemoMtIndex,
  buildBrokenSnapshot,
  makeCoin,
  makeContractAddress,
} from "./demoChain";
import {
  assertPositiveDeposit,
  assertSpendableCoin,
  resolveContractCoinMtIndex,
  resolveFromFirstFree,
} from "./resolveMtIndex";
import type { EscrowDeal, EscrowEvent, EscrowStatus } from "./types";

export interface EscrowEngineState {
  deal: EscrowDeal | null;
  events: EscrowEvent[];
  realLedgerIndex: bigint | null;
  /** Once settled, further release/refund must no-op (double-spend guard). */
  spentNullifier: string | null;
}

function now(): number {
  return Date.now();
}

function push(
  events: EscrowEvent[],
  kind: EscrowEvent["kind"],
  message: string,
): EscrowEvent[] {
  return [...events, { at: now(), kind, message }];
}

function withStatus(deal: EscrowDeal, status: EscrowStatus): EscrowDeal {
  return { ...deal, status, updatedAt: now() };
}

export function createEmptyEngine(): EscrowEngineState {
  return { deal: null, events: [], realLedgerIndex: null, spentNullifier: null };
}

export function deployEscrow(
  _state: EscrowEngineState,
  input: { depositor: string; beneficiary: string; amount: bigint },
): EscrowEngineState {
  assertPositiveDeposit(input.amount);

  const depositor = input.depositor.trim();
  const beneficiary = input.beneficiary.trim();
  if (!depositor || !beneficiary) {
    throw new Error("Depositor and beneficiary are required.");
  }
  if (depositor.toLowerCase() === beneficiary.toLowerCase()) {
    throw new Error(
      "Depositor and beneficiary must differ — refusing self-escrow party collision.",
    );
  }

  const contractAddress = makeContractAddress();
  const deal: EscrowDeal = {
    id: `deal_${contractAddress.slice(-8)}`,
    contractAddress,
    depositor,
    beneficiary,
    amount: input.amount,
    color: "NIGHT",
    status: "deployed",
    coin: null,
    qualified: null,
    firstFreeObserved: null,
    resolve: null,
    createdAt: now(),
    updatedAt: now(),
  };

  return {
    deal,
    realLedgerIndex: null,
    spentNullifier: null,
    events: push(
      [],
      "deploy",
      `Deployed escrow contract ${contractAddress}. Waiting for shielded deposit.`,
    ),
  };
}

export function depositShielded(state: EscrowEngineState): EscrowEngineState {
  if (!state.deal || state.deal.status !== "deployed") {
    return {
      ...state,
      events: push(state.events, "note", "Deploy an escrow before depositing."),
    };
  }

  assertPositiveDeposit(state.deal.amount);
  const coin = makeCoin(state.deal.amount, state.deal.color);
  const realLedgerIndex = allocateDemoMtIndex();
  const deal = withStatus(
    {
      ...state.deal,
      coin,
      qualified: null,
      firstFreeObserved: null,
      resolve: null,
    },
    "funded",
  );

  return {
    deal,
    realLedgerIndex,
    spentNullifier: null,
    events: push(
      state.events,
      "deposit",
      `receiveShielded accepted ${formatNight(coin.value)} NIGHT. Coin committed at ledger index ${realLedgerIndex.toString()} (hidden from firstFree).`,
    ),
  };
}

export function attemptNaiveResolve(state: EscrowEngineState): EscrowEngineState {
  if (!state.deal?.coin || state.realLedgerIndex === null) {
    return {
      ...state,
      events: push(state.events, "note", "Fund the escrow before resolving mtIndex."),
    };
  }

  const snapshot = buildBrokenSnapshot({
    contractAddress: state.deal.contractAddress,
    realMtIndex: state.realLedgerIndex,
  });
  const naive = resolveFromFirstFree(snapshot, {
    contractAddress: state.deal.contractAddress,
    coin: state.deal.coin,
  });

  const deal: EscrowDeal = {
    ...state.deal,
    firstFreeObserved: snapshot.firstFree,
    resolve: naive,
    updatedAt: now(),
  };

  return {
    ...state,
    deal,
    events: push(
      state.events,
      "resolve-failed",
      `queryZSwapAndContractState → firstFree=${snapshot.firstFree.toString()}. ${naive.warning ?? naive.detail}`,
    ),
  };
}

export function resolveWithKit(state: EscrowEngineState): EscrowEngineState {
  if (!state.deal?.coin || state.realLedgerIndex === null) {
    return {
      ...state,
      events: push(state.events, "note", "Fund the escrow before resolving mtIndex."),
    };
  }
  if (state.deal.status === "released" || state.deal.status === "refunded") {
    return {
      ...state,
      events: push(state.events, "note", "Escrow already settled — refusing re-resolve."),
    };
  }

  const snapshot = buildBrokenSnapshot({
    contractAddress: state.deal.contractAddress,
    realMtIndex: state.realLedgerIndex,
  });

  const resolved = resolveContractCoinMtIndex({
    snapshot,
    lookup: {
      contractAddress: state.deal.contractAddress,
      coin: state.deal.coin,
    },
  });

  if (!resolved.ok || !resolved.qualified) {
    return {
      ...state,
      deal: {
        ...state.deal,
        firstFreeObserved: snapshot.firstFree,
        resolve: resolved,
        updatedAt: now(),
      },
      events: push(state.events, "resolve-failed", resolved.detail),
    };
  }

  // Fund-safety: resolved index must match the known ledger commitment.
  if (resolved.qualified.mtIndex !== state.realLedgerIndex) {
    return {
      ...state,
      deal: {
        ...state.deal,
        firstFreeObserved: snapshot.firstFree,
        resolve: {
          ...resolved,
          ok: false,
          detail: `Resolved mtIndex ${resolved.qualified.mtIndex} != ledger index ${state.realLedgerIndex}. Refusing to qualify.`,
        },
        updatedAt: now(),
      },
      events: push(
        state.events,
        "resolve-failed",
        `Index mismatch — refusing spend. kit=${resolved.qualified.mtIndex} ledger=${state.realLedgerIndex}`,
      ),
    };
  }

  try {
    assertSpendableCoin(resolved.qualified, {
      value: state.deal.amount,
      nonce: state.deal.coin.nonce,
      color: state.deal.color,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ...state,
      events: push(state.events, "resolve-failed", message),
    };
  }

  const deal = withStatus(
    {
      ...state.deal,
      firstFreeObserved: snapshot.firstFree,
      resolve: resolved,
      qualified: resolved.qualified,
    },
    "index-resolved",
  );

  return {
    ...state,
    deal,
    events: push(
      state.events,
      "resolve-ok",
      `Shielded Settle resolved mtIndex=${resolved.mtIndex?.toString()} via ${resolved.strategy}. Coin is now QualifiedShieldedCoinInfo.`,
    ),
  };
}

export function releaseToBeneficiary(state: EscrowEngineState): EscrowEngineState {
  return settle(state, "release");
}

export function refundToDepositor(state: EscrowEngineState): EscrowEngineState {
  return settle(state, "refund");
}

function settle(
  state: EscrowEngineState,
  kind: "release" | "refund",
): EscrowEngineState {
  if (state.spentNullifier || state.deal?.status === "released" || state.deal?.status === "refunded") {
    return {
      ...state,
      events: push(
        state.events,
        "note",
        "Double-spend blocked: escrow already settled.",
      ),
    };
  }

  if (!state.deal?.qualified || state.deal.status !== "index-resolved") {
    return {
      ...state,
      events: push(
        state.events,
        "note",
        kind === "release"
          ? "Resolve a non-zero mtIndex before sendShielded release."
          : "Resolve a non-zero mtIndex before refund.",
      ),
    };
  }

  const qualified = state.deal.qualified;
  try {
    assertSpendableCoin(qualified, {
      value: state.deal.amount,
      nonce: state.deal.coin?.nonce,
      color: state.deal.color,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ...state,
      events: push(state.events, "note", message),
    };
  }

  const recipient = kind === "release" ? state.deal.beneficiary : state.deal.depositor;
  const nextStatus: EscrowStatus = kind === "release" ? "released" : "refunded";
  const deal = withStatus(state.deal, nextStatus);
  const nullifier = `${qualified.nonce}:${qualified.mtIndex.toString()}`;

  return {
    ...state,
    deal,
    spentNullifier: nullifier,
    events: push(
      state.events,
      kind,
      kind === "release"
        ? `sendShielded → ${recipient} for ${formatNight(deal.amount)} NIGHT using mtIndex ${qualified.mtIndex.toString()}.`
        : `sendShielded refund → ${recipient} for ${formatNight(deal.amount)} NIGHT using mtIndex ${qualified.mtIndex.toString()}.`,
    ),
  };
}

export function formatNight(value: bigint): string {
  if (value < 0n) return `-${formatNight(-value)}`;
  const whole = value / 1_000_000n;
  const frac = (value % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}

export function parseNightInput(raw: string): bigint {
  const cleaned = raw.trim().replace(/,/g, "");
  if (!cleaned) return 0n;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return 0n;
  const [w, f = ""] = cleaned.split(".");
  if (f.length > 6) {
    // Refuse silent truncation of dust precision — caller must round explicitly.
    throw new Error("Amount has more than 6 decimal places — refusing silent truncation.");
  }
  const frac = (f + "000000").slice(0, 6);
  return BigInt(w) * 1_000_000n + BigInt(frac);
}
