import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";
import type { SessionStats } from "../sessionStats";
import { chartTheme } from "../chartTheme";

function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function StatsRail({
  stats,
  pulse = false,
}: {
  stats: SessionStats;
  pulse?: boolean;
}) {
  const hasRate = stats.resolveRate !== null;
  const rate = hasRate ? stats.resolveRate! : 0;
  const ring = hasRate
    ? [
        { name: "resolved", value: rate },
        { name: "rest", value: Math.max(0, 100 - rate) },
      ]
    : [{ name: "track", value: 100 }];

  const items = [
    {
      label: "Settled deals",
      value: String(stats.dealsSettled),
      tip: "Cycles closed in this tab only.",
      tone: "ink",
    },
    {
      label: "Session volume",
      value: `${fmt(stats.volumeNight)} NIGHT`,
      tip: "NIGHT that left the vault this session.",
      tone: "accent",
    },
    {
      label: "firstFree failures",
      value: String(stats.firstFreeFailures),
      tip: "Times the public index lied.",
      tone: "danger",
    },
    {
      label: "Kit resolves",
      value: String(stats.kitResolves),
      tip: "Parse the dump. Qualify the coin.",
      tone: "ok",
    },
    {
      label: "Avg mtIndex",
      value: stats.avgMtIndex === null ? "—" : String(stats.avgMtIndex),
      tip: "Mean Merkle position across settled deals this session.",
      tone: "accent",
    },
  ] as const;

  return (
    <section className="stats-rail" aria-label="Session statistics">
      <div
        className="stats-ring"
        title="Kit qualifies divided by probes that returned 0."
      >
        <div
          className={`ring-wrap${pulse ? " is-pulse" : ""}`}
          aria-label={
            hasRate
              ? `Qualified ${stats.resolveRate} percent of probes`
              : "Qualify rate unavailable"
          }
        >
          <ResponsiveContainer width="100%" height={88}>
            <PieChart>
              <Pie
                data={ring}
                dataKey="value"
                innerRadius={28}
                outerRadius={40}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                isAnimationActive={hasRate}
                animationDuration={420}
              >
                {hasRate ? (
                  <>
                    <Cell fill={chartTheme.accent} />
                    <Cell fill={chartTheme.grid} />
                  </>
                ) : (
                  <Cell fill={chartTheme.grid} />
                )}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="ring-label">
            <strong>{hasRate ? `${stats.resolveRate}%` : "—"}</strong>
            <span>qualified</span>
          </div>
        </div>
      </div>

      {items.map((item) => (
        <div
          key={item.label}
          className={`stat-cell tone-${item.tone}`}
          tabIndex={0}
          title={item.tip}
        >
          <span className="stat-label">{item.label}</span>
          <strong className="stat-value">{item.value}</strong>
        </div>
      ))}
    </section>
  );
}
