import type { EscrowEvent } from "@kit/types";

export function EventLog({ events }: { events: EscrowEvent[] }) {
  return (
    <div className="log-panel">
      <div className="log-head">
        <h4>Trace</h4>
        <span className="muted">{events.length}</span>
      </div>
      {events.length === 0 ? (
        <p className="empty-log">No events yet. Deploy a contract to start the trace.</p>
      ) : (
        <ul className="log-list">
          {[...events].reverse().map((event, i) => (
            <li key={`${event.at}-${i}`} className={`log-item kind-${event.kind}`}>
              <time dateTime={new Date(event.at).toISOString()}>
                {new Date(event.at).toLocaleTimeString()}
              </time>
              <span className="log-kind">{event.kind}</span>
              <p>{event.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
