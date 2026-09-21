import { resolveContractCoinMtIndex } from "@kit/resolveMtIndex";
import type { ShieldedCoinInfo, QualifiedShieldedCoinInfo } from "@kit/types";

export type ProbeResult = {
  contractAddress: string;
  firstFree: bigint;
  debugDump: string | null;
  kit: ReturnType<typeof resolveContractCoinMtIndex>;
};

/**
 * Probe documented firstFree against the Preprod indexer, then run the kit.
 * Used after a live deposit so judges see the #187 lie and the qualify path on-chain.
 */
export async function probeAndResolveLive(args: {
  publicDataProvider: {
    queryZSwapAndContractState: (address: string) => Promise<{
      firstFree?: bigint;
      zswapChainState?: { toString?: (debug?: boolean) => string };
    } | null>;
  };
  contractAddress: string;
  coin: ShieldedCoinInfo;
}): Promise<ProbeResult> {
  const state = await args.publicDataProvider.queryZSwapAndContractState(args.contractAddress);
  if (!state) {
    throw new Error("Indexer returned no zswap/contract state for this address.");
  }

  const firstFree = state.firstFree ?? 0n;
  let debugDump: string | null = null;
  try {
    debugDump = state.zswapChainState?.toString?.(true) ?? null;
  } catch {
    debugDump = null;
  }

  const kit = resolveContractCoinMtIndex({
    snapshot: { firstFree, debugDump: debugDump ?? undefined },
    lookup: { contractAddress: args.contractAddress, coin: args.coin },
  });

  return { contractAddress: args.contractAddress, firstFree, debugDump, kit };
}

export function assertQualifiedForSpend(q: QualifiedShieldedCoinInfo | undefined): QualifiedShieldedCoinInfo {
  if (!q || q.mtIndex === 0n) {
    throw new Error("Refuse spend: kit did not produce a non-zero mtIndex.");
  }
  return q;
}
