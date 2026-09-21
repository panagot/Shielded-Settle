import { ArrowRight, Play } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../session";

const PILLARS = [
  {
    title: "The gap",
    body: "Contract-owned shielded coins land in the tree, but firstFree often returns 0. sendShielded then fails.",
    to: "/gap",
    label: "Read #187",
  },
  {
    title: "The kit",
    body: "resolveContractCoinMtIndex recovers the real mtIndex from the debug dump for this contract only.",
    to: "/integrate",
    label: "Copy the call",
  },
  {
    title: "The desk",
    body: "An honest simulated ledger so judges can reproduce the lie, the fix, and a full release without Lace.",
    to: "/desk",
    label: "Open the desk",
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { runExampleDeal, stats } = useSession();

  function playExample() {
    runExampleDeal("released");
    navigate("/demo");
  }

  return (
    <section className="home">
      <header className="home-hero">
        <p className="eyebrow">Midnight Korea Hackathon 2026</p>
        <h1>Shielded Settle</h1>
        <p className="home-tag">
          Recover the real <code>mtIndex</code> when <code>firstFree</code> returns 0, then release
          or refund contract-held shielded coins.
        </p>
        <div className="home-actions">
          <button type="button" className="btn btn-accent" onClick={playExample}>
            <Play size={18} weight="fill" />
            Run judge example
          </button>
          <Link className="btn btn-line" to="/desk">
            Settlement desk
            <ArrowRight size={16} weight="bold" />
          </Link>
          <a className="btn btn-ghost" href="/deck.html" target="_blank" rel="noreferrer">
            Slide deck
          </a>
        </div>
        <p className="home-note">
          Simulated ledger for review. Compact sample + TypeScript kit for live Compact dApps.
          {stats.dealsSettled > 0
            ? ` This tab has settled ${stats.dealsSettled} deal${stats.dealsSettled === 1 ? "" : "s"}.`
            : null}
        </p>
      </header>

      <dl className="home-signals">
        <div className="signal-cell signal-lie">
          <dt>firstFree</dt>
          <dd>0</dd>
          <small>Documented path lies</small>
        </div>
        <div className="signal-cell signal-ledger">
          <dt>Real ledger</dt>
          <dd>46+</dd>
          <small>Position in the tree</small>
        </div>
        <div className="signal-cell signal-kit">
          <dt>Kit mtIndex</dt>
          <dd>46+</dd>
          <small>Qualified for spend</small>
        </div>
        <div className="signal-cell signal-gap">
          <dt>Result</dt>
          <dd>Spend</dd>
          <small>Release or refund once</small>
        </div>
      </dl>

      <div className="home-pillars">
        {PILLARS.map((pillar) => (
          <article key={pillar.title} className="home-pillar">
            <h2>{pillar.title}</h2>
            <p>{pillar.body}</p>
            <Link to={pillar.to}>
              {pillar.label}
              <ArrowRight size={14} weight="bold" />
            </Link>
          </article>
        ))}
      </div>

      <aside className="home-judge">
        <h2>For reviewers</h2>
        <ol className="plain-list">
          <li>
            <code>npm install && npm run build && npm test</code>
          </li>
          <li>
            Click <strong>Run judge example</strong>, then inspect Desk / Stats / Gap.
          </li>
          <li>
            Midnight usage: shielded <code>receiveShielded</code> / <code>sendShielded</code> plus
            off-chain qualification until servicedesk#187 lands.
          </li>
        </ol>
      </aside>
    </section>
  );
}
