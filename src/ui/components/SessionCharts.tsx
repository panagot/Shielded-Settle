import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartTheme } from "../chartTheme";
import type { SessionPoint, SessionStats } from "../sessionStats";
import { ChartBlank, ChartLegend } from "./ChartBlank";

const axis = {
  stroke: chartTheme.muted,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export function GapChart({ points }: { points: SessionPoint[] }) {
  if (points.length === 0) {
    return (
      <ChartBlank
        title="Index gap"
        meta="settled deals"
        message="The bar is the mtIndex the kit recovered. The baseline is firstFree, which stays at 0 when the public query lies."
      />
    );
  }

  const data = points.map((point, index) => ({
    n: index + 1,
    mtIndex: point.mtIndex,
    firstFree: point.firstFree,
    gap: point.mtIndex - point.firstFree,
    outcome: point.outcome,
  }));

  return (
    <div className="viz-panel">
      <header className="chart-head">
        <h5>Index gap</h5>
        <span className="muted">recovered position above firstFree</span>
      </header>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height={248}>
          <ComposedChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
            <CartesianGrid stroke={chartTheme.grid} vertical={false} />
            <XAxis dataKey="n" {...axis} />
            <YAxis {...axis} width={36} allowDecimals={false} />
            <ReferenceLine
              y={0}
              stroke={chartTheme.danger}
              strokeDasharray="3 3"
              label={{
                value: "firstFree",
                fill: chartTheme.danger,
                fontSize: 11,
                position: "insideTopLeft",
              }}
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
                      firstFree {row.firstFree}
                    </div>
                    <div className="mono">mtIndex {row.mtIndex}</div>
                    <div style={{ marginTop: 4, color: chartTheme.ok, fontSize: 12 }}>
                      gap {row.gap}
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="gap"
              name="gap"
              fill={chartTheme.accent}
              barSize={22}
              radius={[2, 2, 0, 0]}
              isAnimationActive
              animationDuration={420}
            />
            <Line
              type="monotone"
              dataKey="mtIndex"
              stroke={chartTheme.ok}
              strokeWidth={2}
              dot={{ r: 3.5, fill: chartTheme.ok, stroke: chartTheme.panel }}
              name="mtIndex"
              isAnimationActive
              animationDuration={420}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { swatch: chartTheme.accent, label: "Gap (mtIndex − firstFree)" },
          { swatch: chartTheme.ok, label: "Recovered mtIndex" },
          { swatch: chartTheme.danger, label: "firstFree baseline" },
        ]}
      />
    </div>
  );
}

export function AttemptChart({ stats }: { stats: SessionStats }) {
  const total = stats.firstFreeFailures + stats.kitResolves;
  if (total === 0) {
    return (
      <ChartBlank
        title="Resolve attempts"
        meta="this tab"
        message="Probe firstFree, then resolve. Failures and kit wins land here before you settle."
      />
    );
  }

  const data = [
    { name: "firstFree = 0", value: stats.firstFreeFailures, fill: chartTheme.danger },
    { name: "Kit qualified", value: stats.kitResolves, fill: chartTheme.ok },
  ];

  return (
    <div className="viz-panel">
      <header className="chart-head">
        <h5>Resolve attempts</h5>
        <span className="muted">
          {stats.resolveRate === null ? "—" : `${stats.resolveRate}% kit`}
        </span>
      </header>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height={248}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 28, top: 8, bottom: 0 }}
          >
            <CartesianGrid stroke={chartTheme.grid} horizontal={false} />
            <XAxis type="number" {...axis} allowDecimals={false} domain={[0, "dataMax"]} />
            <YAxis
              type="category"
              dataKey="name"
              width={108}
              {...axis}
            />
            <Tooltip
              cursor={{ fill: "rgba(77, 107, 255, 0.08)" }}
              contentStyle={chartTheme.tooltip}
              formatter={(value) => [value, "Count"]}
            />
            <Bar dataKey="value" barSize={18} radius={[0, 2, 2, 0]} minPointSize={4}>
              {data.map((row) => (
                <Cell key={row.name} fill={row.fill} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                fill={chartTheme.ink}
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { swatch: chartTheme.danger, label: "Public index lied" },
          { swatch: chartTheme.ok, label: "Kit qualified the coin" },
        ]}
      />
    </div>
  );
}
