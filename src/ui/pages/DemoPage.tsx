import { Link } from "react-router-dom";
import { Play, ArrowRight } from "@phosphor-icons/react";
import { formatIndex, formatNight } from "@kit/index";
import { DEMO_VIDEO, youtubeEmbedSrc } from "../demoVideo";
import { useSession } from "../session";
import { statusLabel } from "../sessionStats";

const SCRIPT = [
  { time: "0:00", title: "Problem", body: "Show Gap: invalid index into sparse merkle tree: 0" },
  { time: "0:25", title: "Example", body: "Click Run example release on Demo, or Practice on sim desk from Home." },
  { time: "0:50", title: "Signals", body: "Coral firstFree = 0, mint qualified mtIndex, then Released." },
  { time: "1:20", title: "Stats", body: "Open Stats: probes, kit resolves, volume." },
  { time: "1:50", title: "Integrate", body: "Copy resolveContractCoinMtIndex." },
  { time: "2:20", title: "Scope", body: "Sim ledger for review; kit + Compact for live dApps." },
];

export function DemoPage() {
  const embed = youtubeEmbedSrc(DEMO_VIDEO.url);
  const { runExampleDeal, engine, stats, status, exampleSteps } = useSession();
  const deal = engine.deal;

  return (
    <section className="page-view">
      <header className="page-head">
        <div>
          <p className="eyebrow">Hackathon walkthrough</p>
          <h1>Demo</h1>
        </div>
        <p className="lede">
          Judges can run a full settle here in one click. Record the same path as an unlisted
          YouTube video and paste the link into <code>src/ui/demoVideo.ts</code>.
        </p>
      </header>

      <div className="demo-controls">
        <button type="button" className="btn btn-accent" onClick={() => runExampleDeal("released")}>
          <Play size={18} weight="fill" />
          Run example release
        </button>
        <button type="button" className="btn btn-line" onClick={() => runExampleDeal("refunded")}>
          Run example refund
        </button>
        <Link className="btn btn-ghost" to="/desk">
          Open desk
          <ArrowRight size={16} weight="bold" />
        </Link>
      </div>

      {exampleSteps.length > 0 && (
        <ol className="example-rail" aria-label="Example settle steps">
          {exampleSteps.map((step) => (
            <li key={step.id} className={`tone-${step.tone}`}>
              <strong>{step.title}</strong>
              <span>{step.detail}</span>
            </li>
          ))}
        </ol>
      )}

      {deal && (
        <dl className="open-deal">
          <div>
            <dt>Status</dt>
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

      <p className="verdict">
        Session: {stats.dealsSettled} settled · {stats.firstFreeFailures} probes returned 0 ·{" "}
        {stats.kitResolves} kit qualifies · {stats.volumeNight} NIGHT
      </p>

      <div className="demo-stage">
        {embed ? (
          <iframe
            className="demo-frame"
            title={DEMO_VIDEO.title}
            src={embed}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="demo-placeholder">
            <p className="eyebrow">Video slot</p>
            <h2>{DEMO_VIDEO.title}</h2>
            <p>
              Upload an unlisted YouTube walkthrough ({DEMO_VIDEO.durationHint}), then set{" "}
              <code>DEMO_VIDEO.url</code>. Until then, the live example above is the demo.
            </p>
          </div>
        )}
      </div>

      <div className="page-split" style={{ marginTop: "1.25rem" }}>
        <ol className="path-list">
          {SCRIPT.map((row) => (
            <li key={row.time}>
              <span className="doc-num">{row.time}</span>
              <div>
                <h2>{row.title}</h2>
                <p>{row.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <aside className="note-card">
          <h2>Recording checklist</h2>
          <ul className="plain-list">
            <li>1080p, under 3 minutes, unlisted is enough.</li>
            <li>Show Probe failing, then Resolve succeeding.</li>
            <li>Cut to Stats and Integrate once each.</li>
            <li>Say clearly: sim ledger for review; kit for live Compact.</li>
          </ul>
          <p className="docs-links" style={{ marginTop: "0.85rem" }}>
            Deck: <a href="/deck.html">/deck.html</a> (print to PDF) · file also in{" "}
            <code>docs/Shielded-Settle-Deck.pdf</code>
          </p>
        </aside>
      </div>
    </section>
  );
}
