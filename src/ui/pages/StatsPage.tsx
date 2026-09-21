import { Link } from "react-router-dom";
import { formatIndex, formatNight } from "@kit/index";
import { AttemptChart, GapChart } from "../components/SessionCharts";
import { StatsRail } from "../components/StatsRail";
import { VolumeChart } from "../components/VolumeChart";
import { useSession } from "../session";
import { statusLabel, type SessionStats } from "../sessionStats";

function sessionVerdict(stats: SessionStats): string {
  if (stats.firstFreeFailures === 0 && stats.kitResolves === 0 && stats.dealsSettled === 0) {
    return "No probes yet. The qualify rate stays blank until firstFree returns 0 and the kit answers.";
  }
  const probes =
    stats.firstFreeFailures === 1
      ? "1 probe returned 0"
      : `${stats.firstFreeFailures} probes returned 0`;
  const qualified =
    stats.kitResolves === 1 ? "the kit qualified 1 coin" : `the kit qualified ${stats.kitResolves} coins`;
  const settled =
    stats.dealsSettled === 0
      ? "Nothing has settled yet."
      : `${stats.volumeNight.toLocaleString(undefined, { maximumFractionDigits: 2 })} NIGHT settled across ${stats.dealsSettled} deal${stats.dealsSettled === 1 ? "" : "s"}.`;
  if (stats.firstFreeFailures === 0) return settled;
  return `${probes}. ${qualified}. ${settled}`;
}

export function StatsPage() {
  const { stats, pulse, points, engine, status } = useSession();
  const deal = engine.deal;

  return (
    <section className="page-view">
      <header className="page-head">
        <div>
          <p className="eyebrow">This browser tab</p>
          <h1>Session stats</h1>
        </div>
        <p className="lede">
          Charts update from deals you settle here. They are not network telemetry.
          {stats.dealsSettled === 0 && (
            <>
              {" "}
              <Link to="/desk">Run a deal</Link> to draw the gap.
            </>
          )}
        </p>
      </header>

      {deal && (
        <dl className="open-deal">
          <div>
            <dt>Latest deal</dt>
            <dd>{statusLabel(status)}</dd>
          </div>
          <div>
            <dt>Parties</dt>
            <dd>
              {deal.depositor} → {deal.beneficiary}
            </dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd className="mono">{formatNight(deal.amount)} NIGHT</dd>
          </div>
          <div>
            <dt>firstFree</dt>
            <dd className={`mono ${deal.firstFreeObserved === 0n ? "danger" : ""}`}>
              {formatIndex(deal.firstFreeObserved ?? null)}
            </dd>
          </div>
          <div>
            <dt>Qualified</dt>
            <dd className="mono accent">{formatIndex(deal.qualified?.mtIndex ?? null)}</dd>
          </div>
        </dl>
      )}

      <StatsRail stats={stats} pulse={pulse} />
      <p className="verdict">{sessionVerdict(stats)}</p>

      <div className="page-split stats-charts">
        <GapChart points={points} />
        <AttemptChart stats={stats} />
      </div>
      <VolumeChart points={points} />
    </section>
  );
}
