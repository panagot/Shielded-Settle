import type { EscrowEvent, EscrowStatus } from "@kit/types";

export interface SessionPoint {
  id: string;
  at: number;
  amountNight: number;
  mtIndex: number;
  firstFree: number;
  outcome: "released" | "refunded";
}

export interface SessionStats {
  dealsSettled: number;
  volumeNight: number;
  firstFreeFailures: number;
  kitResolves: number;
  avgMtIndex: number | null;
  lastMtIndex: number | null;
  resolveRate: number | null;
  points: SessionPoint[];
}

export function emptyStats(): SessionStats {
  return {
    dealsSettled: 0,
    volumeNight: 0,
    firstFreeFailures: 0,
    kitResolves: 0,
    avgMtIndex: null,
    lastMtIndex: null,
    resolveRate: null,
    points: [],
  };
}

export function deriveStats(events: EscrowEvent[], points: SessionPoint[]): SessionStats {
  const firstFreeFailures = events.filter((e) => e.kind === "resolve-failed").length;
  const kitResolves = events.filter((e) => e.kind === "resolve-ok").length;
  const dealsSettled = points.length;
  const volumeNight = points.reduce((s, p) => s + p.amountNight, 0);
  const avgMtIndex =
    points.length === 0
      ? null
      : Math.round(points.reduce((s, p) => s + p.mtIndex, 0) / points.length);
  const lastMtIndex = points.length ? points[points.length - 1].mtIndex : null;
  const resolveRate =
    firstFreeFailures === 0
      ? kitResolves === 0
        ? null
        : 100
      : Math.min(100, Math.round((kitResolves / firstFreeFailures) * 100));

  return {
    dealsSettled,
    volumeNight,
    firstFreeFailures,
    kitResolves,
    avgMtIndex,
    lastMtIndex,
    resolveRate,
    points,
  };
}

export function statusLabel(status: EscrowStatus): string {
  switch (status) {
    case "idle":
      return "Idle";
    case "deployed":
      return "Awaiting deposit";
    case "funded":
      return "Funded — index unknown";
    case "index-resolved":
      return "Ready to settle";
    case "released":
      return "Released";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
}
