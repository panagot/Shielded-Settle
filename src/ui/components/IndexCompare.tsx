import { formatIndex } from "@kit/resolveMtIndex";
import type { EscrowDeal } from "@kit/types";

export function IndexCompare({
  deal,
  realIndex,
}: {
  deal: EscrowDeal | null;
  realIndex: bigint | null;
}) {
  if (!deal?.coin) {
    return (
      <p className="compare-empty">
        After deposit, this panel compares broken <code>firstFree</code> against the kit result.
      </p>
    );
  }

  return (
    <div className="compare">
      <div className="compare-cell is-bad">
        <span className="compare-label">Documented firstFree</span>
        <strong className="mono">{formatIndex(deal.firstFreeObserved)}</strong>
      </div>
      <div className="compare-cell is-ledger">
        <span className="compare-label">Real ledger index</span>
        <strong className="mono">{formatIndex(realIndex)}</strong>
      </div>
      <div className="compare-cell is-ok">
        <span className="compare-label">Kit resolved mtIndex</span>
        <strong className="mono">{formatIndex(deal.qualified?.mtIndex ?? deal.resolve?.mtIndex)}</strong>
      </div>
    </div>
  );
}
