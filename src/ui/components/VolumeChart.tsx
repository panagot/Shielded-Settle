import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SessionPoint } from "../sessionStats";
import { chartTheme } from "../chartTheme";
import { ChartBlank, ChartLegend } from "./ChartBlank";

export function VolumeChart({ points }: { points: SessionPoint[] }) {
  const data = points.map((p, i) => ({
    n: i + 1,
    amount: p.amountNight,
    mtIndex: p.mtIndex,
    outcome: p.outcome,
  }));

  if (points.length === 0) {
    return (
      <ChartBlank
        title="Settlement volume"
        meta="session"
        message="Release or refund a deal to plot NIGHT against the recovered mtIndex."
      />
    );
  }

  return (
    <div className="viz-panel">
      <header className="chart-head">
        <h5>Settlement volume</h5>
        <span className="muted">
          {points.length} settle{points.length === 1 ? "" : "s"} · NIGHT
        </span>
      </header>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid stroke={chartTheme.grid} vertical={false} />
            <XAxis
              dataKey="n"
              stroke={chartTheme.muted}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={chartTheme.muted}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              cursor={{ fill: "rgba(77, 107, 255, 0.08)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as (typeof data)[number];
                return (
                  <div style={{ ...chartTheme.tooltip, padding: "8px 10px" }}>
                    <strong>
                      Settle #{row.n} · {row.outcome}
                    </strong>
                    <div className="mono" style={{ marginTop: 4 }}>
                      {row.amount} NIGHT
                    </div>
                    <div className="mono">mtIndex {row.mtIndex}</div>
                  </div>
                );
              }}
            />
            <Bar dataKey="amount" barSize={22} radius={[2, 2, 0, 0]} isAnimationActive animationDuration={400}>
              {data.map((row) => (
                <Cell
                  key={row.n}
                  fill={row.outcome === "refunded" ? chartTheme.ice : chartTheme.accent}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { swatch: chartTheme.accent, label: "Released" },
          { swatch: chartTheme.ice, label: "Refunded" },
        ]}
      />
    </div>
  );
}
