import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  attemptNaiveResolve,
  createEmptyEngine,
  depositShielded,
  deployEscrow,
  parseNightInput,
  refundToDepositor,
  releaseToBeneficiary,
  resolveWithKit,
  type EscrowEngineState,
} from "@kit/index";
import { deriveStats, type SessionPoint, type SessionStats } from "./sessionStats";
import type { EscrowStatus } from "@kit/types";

type SessionValue = {
  engine: EscrowEngineState;
  points: SessionPoint[];
  stats: SessionStats;
  depositor: string;
  beneficiary: string;
  amountRaw: string;
  amount: bigint;
  formError: string | null;
  amountError: string | null;
  pulse: boolean;
  status: EscrowStatus;
  probed: boolean;
  showFaultChip: boolean;
  canDeploy: boolean;
  canDeposit: boolean;
  canNaive: boolean;
  canResolve: boolean;
  canSettle: boolean;
  setDepositor: (v: string) => void;
  setBeneficiary: (v: string) => void;
  setAmountRaw: (v: string) => void;
  deploy: () => void;
  deposit: () => void;
  probe: () => void;
  resolve: () => void;
  release: () => void;
  refund: () => void;
  reset: () => void;
  runPrimary: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [engine, setEngine] = useState<EscrowEngineState>(() => createEmptyEngine());
  const [points, setPoints] = useState<SessionPoint[]>([]);
  const [priorAttempts, setPriorAttempts] = useState({ failures: 0, resolves: 0 });
  const [depositor, setDepositor] = useState("Alice");
  const [beneficiary, setBeneficiary] = useState("Bob");
  const [amountRaw, setAmountRawState] = useState("25");
  const [formError, setFormError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);

  const stats = useMemo(() => {
    const live = deriveStats(engine.events, points);
    const firstFreeFailures = live.firstFreeFailures + priorAttempts.failures;
    const kitResolves = live.kitResolves + priorAttempts.resolves;
    return {
      ...live,
      firstFreeFailures,
      kitResolves,
      resolveRate: qualifyRate(firstFreeFailures, kitResolves),
    };
  }, [engine.events, points, priorAttempts]);

  const amountInfo = useMemo(() => {
    try {
      return { amount: parseNightInput(amountRaw), error: null as string | null };
    } catch (err) {
      return {
        amount: 0n,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }, [amountRaw]);

  const status = engine.deal?.status ?? "idle";
  const amount = amountInfo.amount;
  const canDeploy = status === "idle" || status === "released" || status === "refunded";
  const canDeposit = status === "deployed";
  const canNaive = status === "funded" || status === "index-resolved";
  const canResolve = status === "funded" || status === "index-resolved";
  const canSettle = status === "index-resolved";
  const probed =
    engine.deal?.firstFreeObserved !== null &&
    engine.deal?.firstFreeObserved !== undefined;
  const showFaultChip =
    engine.deal?.resolve?.ok === false ||
    (engine.deal?.firstFreeObserved !== null &&
      engine.deal?.firstFreeObserved !== undefined &&
      engine.deal.firstFreeObserved === 0n);

  function rememberAttempts(state: EscrowEngineState) {
    const failures = state.events.filter((event) => event.kind === "resolve-failed").length;
    const resolves = state.events.filter((event) => event.kind === "resolve-ok").length;
    if (failures === 0 && resolves === 0) return;
    setPriorAttempts((prev) => ({
      failures: prev.failures + failures,
      resolves: prev.resolves + resolves,
    }));
  }

  function flash() {
    setPulse(true);
    window.setTimeout(() => setPulse(false), 900);
  }

  function recordSettle(next: EscrowEngineState) {
    setEngine(next);
    const deal = next.deal;
    const qualified = deal?.qualified;
    if (!deal || !qualified) return;
    if (deal.status !== "released" && deal.status !== "refunded") return;
    setPoints((prev) => [
      ...prev,
      {
        id: `${deal.id}-${Date.now()}`,
        at: Date.now(),
        amountNight: Number(deal.amount) / 1_000_000,
        mtIndex: Number(qualified.mtIndex),
        firstFree: Number(deal.firstFreeObserved ?? 0n),
        outcome: deal.status === "released" ? "released" : "refunded",
      },
    ]);
  }

  function deploy() {
    setFormError(null);
    if (amountInfo.error) {
      setFormError(amountInfo.error);
      return;
    }
    try {
      rememberAttempts(engine);
      setEngine(deployEscrow(engine, { depositor, beneficiary, amount }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  }

  function deposit() {
    setEngine(depositShielded(engine));
  }

  function probe() {
    setEngine(attemptNaiveResolve(engine));
  }

  function resolve() {
    const next = resolveWithKit(engine);
    setEngine(next);
    if (next.deal?.status === "index-resolved") flash();
  }

  function release() {
    recordSettle(releaseToBeneficiary(engine));
    flash();
  }

  function refund() {
    recordSettle(refundToDepositor(engine));
    flash();
  }

  function reset() {
    setFormError(null);
    rememberAttempts(engine);
    setEngine(createEmptyEngine());
  }

  function runPrimary() {
    if (canDeploy && amount > 0n && !amountInfo.error) {
      deploy();
      return;
    }
    if (canDeposit) {
      deposit();
      return;
    }
    if (status === "funded" && !probed) {
      probe();
      return;
    }
    if (canResolve && status === "funded") {
      resolve();
      return;
    }
    if (canSettle) {
      release();
      return;
    }
    reset();
  }

  const value: SessionValue = {
    engine,
    points,
    stats,
    depositor,
    beneficiary,
    amountRaw,
    amount,
    formError,
    amountError: amountInfo.error,
    pulse,
    status,
    probed,
    showFaultChip,
    canDeploy,
    canDeposit,
    canNaive,
    canResolve,
    canSettle,
    setDepositor,
    setBeneficiary,
    setAmountRaw: (v) => {
      setAmountRawState(v);
      setFormError(null);
    },
    deploy,
    deposit,
    probe,
    resolve,
    release,
    refund,
    reset,
    runPrimary,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function qualifyRate(failures: number, resolves: number): number | null {
  if (failures === 0) return resolves === 0 ? null : 100;
  return Math.min(100, Math.round((resolves / failures) * 100));
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
