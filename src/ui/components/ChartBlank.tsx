export function ChartBlank({
  title,
  meta,
  message,
  items,
}: {
  title: string;
  meta: string;
  message: string;
  items?: { swatch: string; label: string }[];
}) {
  return (
    <div className="viz-panel is-empty">
      <header className="chart-head">
        <h5>{title}</h5>
        <span className="muted">{meta}</span>
      </header>
      <div className="chart-blank" role="img" aria-label={message}>
        <div className="chart-blank-plot" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </div>
        <p>{message}</p>
      </div>
      {items && <ChartLegend items={items} />}
    </div>
  );
}

export function ChartLegend({
  items,
}: {
  items: { swatch: string; label: string }[];
}) {
  return (
    <ul className="chart-legend">
      {items.map((item) => (
        <li key={item.label}>
          <i style={{ background: item.swatch }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
