import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EscrowDeal } from "@kit/types";
import { formatIndex } from "@kit/resolveMtIndex";
import { INDEX_COLORS, chartTheme } from "../chartTheme";
import { ChartBlank, ChartLegend } from "./ChartBlank";

export function IndexChart({
  deal,
  realIndex,
}: {
  deal: EscrowDeal | null;
  realIndex: bigint | null;
}) {
  const firstFree = deal?.firstFreeObserved;
  const resolved =
    deal?.qualified?.mtIndex ??
    (deal?.resolve?.ok ? deal.resolve.mtIndex : null);

  const ff = firstFree === null || firstFree === undefined ? null : Number(firstFree);
  const led = realIndex === null ? null : Number(realIndex);
  const kit = resolved === null || resolved === undefined ? null : Number(resolved);

  const data = [
    {
      name: "firstFree",
      label: "Documented firstFree",
      value: ff ?? 0,
      fill: INDEX_COLORS.firstFree,
    },
    {
      name: "ledger",
      label: "Real ledger",
      value: led ?? 0,
      fill: INDEX_COLORS.ledger,
    },
    {
      name: "kit",
      label: "Kit mtIndex",
      value: kit ?? 0,
      fill: INDEX_COLORS.kit,
    },
  ];

  if (!deal?.coin) {
    return (
      <ChartBlank
        title="Index compare"
        meta="awaiting deposit"
        message="Deposit a coin. Coral is the lie, blue is the ledger, mint is the index you can spend."
        items={[
          { swatch: INDEX_COLORS.firstFree, label: "firstFree" },
          { swatch: INDEX_COLORS.ledger, label: "Real ledger" },
          { swatch: INDEX_COLORS.kit, label: "Kit mtIndex" },
        ]}
      />
    );
  }

  return (
    <div className="viz-panel">
      <header className="chart-head">
        <h5>Index compare</h5>
        <span className="mono muted">
          ff {formatIndex(firstFree)} · led {formatIndex(realIndex)} · kit{" "}
          {formatIndex(resolved)}
          {led !== null && ff !== null ? ` · Δ ${led - ff}` : ""}
        </span>
      </header>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height={188}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 4, right: 28, top: 4, bottom: 0 }}
          >
            <CartesianGrid stroke={chartTheme.grid} horizontal={false} />
            <XAxis
              type="number"
              stroke={chartTheme.muted}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={118}
              stroke={chartTheme.muted}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,254,0.08)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as {
                  name: string;
                  label: string;
                  value: number;
                };
                const delta =
                  ff !== null && (row.name === "ledger" || row.name === "kit")
                    ? row.value - ff
                    : null;
                return (
                  <div style={{ ...chartTheme.tooltip, padding: "8px 10px" }}>
                    <strong>{row.label}</strong>
                    <div className="mono" style={{ marginTop: 4 }}>
                      {row.value}
                    </div>
                    {delta !== null && (
                      <div style={{ marginTop: 4, color: chartTheme.muted, fontSize: 11 }}>
                        Δ vs firstFree = {delta}
                      </div>
                    )}
                    {row.name === "firstFree" && row.value === 0 && (
                      <div style={{ marginTop: 4, color: chartTheme.danger, fontSize: 11 }}>
                        Public path veiled the position.
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Bar
              dataKey="value"
              radius={[0, 2, 2, 0]}
              barSize={12}
              minPointSize={4}
              isAnimationActive
              animationDuration={420}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                fill={chartTheme.ink}
                fontSize={11}
                fontFamily="IBM Plex Mono, ui-monospace, monospace"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { swatch: INDEX_COLORS.firstFree, label: "firstFree" },
          { swatch: INDEX_COLORS.ledger, label: "Real ledger" },
          { swatch: INDEX_COLORS.kit, label: "Kit mtIndex" },
        ]}
      />
    </div>
  );
}
