import { describe, expect, it } from "vitest";
import {
  assertSpendableCoin,
  attemptNaiveResolve,
  buildBrokenSnapshot,
  createEmptyEngine,
  depositShielded,
  deployEscrow,
  formatNight,
  FundSafetyError,
  parseNightInput,
  refundToDepositor,
  releaseToBeneficiary,
  resolveContractCoinMtIndex,
  resolveFromDebugDump,
  resolveFromFirstFree,
  resolveWithKit,
} from "../index";

function fundedDeal(amount: bigint) {
  let state = createEmptyEngine();
  state = deployEscrow(state, {
    depositor: "Alice",
    beneficiary: "Bob",
    amount,
  });
  state = depositShielded(state);
  return state;
}

describe("parseNightInput amounts", () => {
  it.each([
    ["0", 0n],
    ["1", 1_000_000n],
    ["25", 25_000_000n],
    ["0.000001", 1n],
    ["1.5", 1_500_000n],
    ["1000000", 1_000_000_000_000n],
    ["1,000", 1_000_000_000n],
    ["  42  ", 42_000_000n],
  ])("parses %s", (raw, expected) => {
    expect(parseNightInput(raw)).toBe(expected);
  });

  it("rejects over-precision instead of truncating", () => {
    expect(() => parseNightInput("1.1234567")).toThrow(/6 decimal/);
  });

  it("rejects non-numeric garbage as 0", () => {
    expect(parseNightInput("abc")).toBe(0n);
    expect(parseNightInput("-5")).toBe(0n);
  });
});

describe("formatNight", () => {
  it("round-trips common values", () => {
    expect(formatNight(25_000_000n)).toBe("25");
    expect(formatNight(1_500_000n)).toBe("1.5");
    expect(formatNight(1n)).toBe("0.000001");
  });
});

describe("mtIndex resolver fund-safety", () => {
  const coin = {
    nonce: "0xabc12345deadbeef",
    color: "NIGHT",
    value: 10_000_000n,
  };

  it("rejects firstFree=0", () => {
    const result = resolveFromFirstFree(
      { firstFree: 0n },
      { contractAddress: "mn_escrow_test", coin },
    );
    expect(result.ok).toBe(false);
    expect(result.mtIndex).toBe(0n);
  });

  it("rejects forcedIndex=0", () => {
    const result = resolveContractCoinMtIndex({
      snapshot: { firstFree: 0n },
      lookup: { contractAddress: "mn_escrow_test", coin },
      forcedIndex: 0n,
    });
    expect(result.ok).toBe(false);
  });

  it("parses matching contract dump index", () => {
    const address = "mn_escrow_aabbccddeeff0011";
    const snapshot = buildBrokenSnapshot({
      contractAddress: address,
      realMtIndex: 61n,
    });
    const result = resolveFromDebugDump(snapshot, { contractAddress: address, coin });
    expect(result.ok).toBe(true);
    expect(result.mtIndex).toBe(61n);
    expect(result.qualified?.mtIndex).toBe(61n);
  });

  it("refuses another contract's dump row", () => {
    const snapshot = buildBrokenSnapshot({
      contractAddress: "mn_escrow_otherparty0001",
      realMtIndex: 77n,
    });
    const result = resolveFromDebugDump(snapshot, {
      contractAddress: "mn_escrow_mineonly0001",
      coin,
    });
    expect(result.ok).toBe(false);
    expect(result.detail).toMatch(/Refusing to guess/i);
  });

  it("refuses ambiguous multi-index dump for same address", () => {
    const address = "mn_escrow_dupetest0001";
    const dump = [
      `46: (, Some(ContractAddress(${address})))`,
      `82: (, Some(ContractAddress(${address})))`,
    ].join("\n");
    const result = resolveFromDebugDump(
      { firstFree: 0n, debugDump: dump },
      { contractAddress: address, coin },
    );
    expect(result.ok).toBe(false);
    expect(result.detail).toMatch(/Ambiguous/i);
  });

  it("rejects zero-value coins", () => {
    const result = resolveContractCoinMtIndex({
      snapshot: { firstFree: 5n },
      lookup: {
        contractAddress: "mn_escrow_x",
        coin: { ...coin, value: 0n },
      },
    });
    expect(result.ok).toBe(false);
  });

  it("assertSpendableCoin blocks mtIndex 0", () => {
    expect(() =>
      assertSpendableCoin({
        ...coin,
        mtIndex: 0n,
      }),
    ).toThrow(FundSafetyError);
  });
});

describe("escrow lifecycle — happy paths with varied amounts", () => {
  it.each([1n, 1_000_000n, 25_000_000n, 999_999_999_000_000n])(
    "full release path for amount %s",
    (amount) => {
      let state = fundedDeal(amount);
      expect(state.deal?.status).toBe("funded");
      expect(state.deal?.coin?.value).toBe(amount);

      state = attemptNaiveResolve(state);
      expect(state.deal?.resolve?.ok).toBe(false);
      expect(state.deal?.firstFreeObserved).toBe(0n);

      state = resolveWithKit(state);
      expect(state.deal?.status).toBe("index-resolved");
      expect(state.deal?.qualified?.mtIndex).toBe(state.realLedgerIndex);
      expect(state.deal?.qualified?.mtIndex).not.toBe(0n);
      expect(state.deal?.qualified?.value).toBe(amount);

      state = releaseToBeneficiary(state);
      expect(state.deal?.status).toBe("released");
      expect(state.spentNullifier).toBeTruthy();
    },
  );

  it("refund path returns funds to depositor", () => {
    let state = fundedDeal(7_500_000n);
    state = resolveWithKit(state);
    state = refundToDepositor(state);
    expect(state.deal?.status).toBe("refunded");
    expect(state.events.at(-1)?.message).toMatch(/Alice/);
  });
});

describe("escrow lifecycle — attack / misuse cases", () => {
  it("blocks deposit before deploy", () => {
    const state = depositShielded(createEmptyEngine());
    expect(state.events.at(-1)?.kind).toBe("note");
  });

  it("blocks release before resolve", () => {
    let state = fundedDeal(5_000_000n);
    state = releaseToBeneficiary(state);
    expect(state.deal?.status).toBe("funded");
    expect(state.events.at(-1)?.message).toMatch(/Resolve a non-zero mtIndex/);
  });

  it("blocks double release", () => {
    let state = fundedDeal(5_000_000n);
    state = resolveWithKit(state);
    state = releaseToBeneficiary(state);
    const firstNullifier = state.spentNullifier;
    state = releaseToBeneficiary(state);
    expect(state.spentNullifier).toBe(firstNullifier);
    expect(state.events.at(-1)?.message).toMatch(/Double-spend blocked/);
  });

  it("blocks refund after release", () => {
    let state = fundedDeal(5_000_000n);
    state = resolveWithKit(state);
    state = releaseToBeneficiary(state);
    state = refundToDepositor(state);
    expect(state.deal?.status).toBe("released");
    expect(state.events.at(-1)?.message).toMatch(/Double-spend blocked/);
  });

  it("rejects identical depositor/beneficiary", () => {
    expect(() =>
      deployEscrow(createEmptyEngine(), {
        depositor: "Alice",
        beneficiary: "alice",
        amount: 1_000_000n,
      }),
    ).toThrow(/must differ/i);
  });

  it("rejects zero deploy amount", () => {
    expect(() =>
      deployEscrow(createEmptyEngine(), {
        depositor: "Alice",
        beneficiary: "Bob",
        amount: 0n,
      }),
    ).toThrow(/greater than zero/i);
  });

  it("rejects empty party names", () => {
    expect(() =>
      deployEscrow(createEmptyEngine(), {
        depositor: "  ",
        beneficiary: "Bob",
        amount: 1_000_000n,
      }),
    ).toThrow(/required/i);
  });
});

describe("end-to-end kit vs naive across many ledger indices", () => {
  it("resolves correctly for many simulated tree positions", () => {
    for (let i = 0; i < 30; i++) {
      let state = fundedDeal(BigInt((i + 1) * 1_000_000));
      const ledger = state.realLedgerIndex!;
      expect(ledger).toBeGreaterThan(0n);

      const naive = resolveFromFirstFree(
        buildBrokenSnapshot({
          contractAddress: state.deal!.contractAddress,
          realMtIndex: ledger,
        }),
        {
          contractAddress: state.deal!.contractAddress,
          coin: state.deal!.coin!,
        },
      );
      expect(naive.ok).toBe(false);

      state = resolveWithKit(state);
      expect(state.deal?.qualified?.mtIndex).toBe(ledger);
    }
  });
});
