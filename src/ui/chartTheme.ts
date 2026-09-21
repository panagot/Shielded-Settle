/** Shared Recharts theme — keep in sync with styles.css tokens. */
export const chartTheme = {
  void: "#07080c",
  panel: "#10131a",
  ink: "#F4F7FF",
  muted: "#B4C0DC",
  line: "rgba(183, 198, 255, 0.16)",
  accent: "#6D8BFF",
  ice: "#C5D2FF",
  ok: "#3DDEB4",
  danger: "#FF8B84",
  tooltip: {
    background: "#141820",
    border: "1px solid rgba(183, 198, 255, 0.36)",
    borderRadius: 0,
    fontSize: 12,
    color: "#F4F7FF",
  },
  grid: "rgba(183, 198, 255, 0.16)",
} as const;

export const INDEX_COLORS = {
  firstFree: chartTheme.danger,
  ledger: chartTheme.accent,
  kit: chartTheme.ok,
} as const;
