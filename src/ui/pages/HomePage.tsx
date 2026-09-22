import { ArrowRight, Wallet, TreeStructure, ShieldCheck, Play } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { PREPROD } from "../../midnight/config";
import { useSession } from "../session";

const REVIEWER = [
  {
    n: "01",
    title: "Run the sim settle",
    body: "No wallet. One click shows firstFree = 0, kit recovery, then release.",
    to: "/demo",
    label: "Open Demo",
  },
  {
    n: "02",
    title: "Read the gap",
    body: "Why the public index lies for contract-owned shielded coins (servicedesk#187).",
    to: "/gap",
    label: "Open Gap",
  },
  {
    n: "03",
    title: "Copy the kit call",
    body: "Same resolveContractCoinMtIndex the desk uses — ready for your Compact dApp.",
    to: "/integrate",
    label: "Open Integrate",
  },
];

const LIVE_ACTIONS = [
  {
    n: "01",
    title: "Fund Lace (Preprod)",
    body: "Copy unshielded mn_addr_preprod… into the faucet — not shield or dust addresses.",
    href: PREPROD.faucet,
    external: true,
    label: "Open faucet",
  },
  {
    n: "02",
    title: "Generate tDUST",
    body: "On the Midnight account card in Lace, Generate tDUST from your tNIGHT. Set proof server to Local (:6300).",
    to: "/live",
    label: "Live checklist",
  },
  {
    n: "03",
    title: "Settle on Preprod",
    body: "Connect Lace → Run full Preprod settle (deploy → deposit → kit → release).",
    to: "/live",
    label: "Open Live",
  },
];

export function HomePage() {
  const { stats } = useSession();

  return (
    <section className="home">
      <header className="home-hero">
        <p className="eyebrow">Midnight · Korea Hackathon</p>
        <h1>Shielded Settle</h1>
        <p className="home-tag">
          Recover the real <code>mtIndex</code> when <code>firstFree</code> returns 0 — then release
          shielded escrow. Sim desk for reviewers; optional Live Preprod with Lace.
        </p>
        <div className="home-actions">
          <Link className="btn btn-accent" to="/demo">
            <Play size={18} weight="fill" />
            Reviewer: run sim settle
          </Link>
          <Link className="btn btn-line" to="/live">
            <Wallet size={18} weight="bold" />
            Live Preprod
            <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
        <p className="home-note">
          Judges: start on Demo (no wallet). Live needs Lace + Docker proof server + tDUST.
          {stats.dealsSettled > 0
            ? ` This tab has settled ${stats.dealsSettled} deal${stats.dealsSettled === 1 ? "" : "s"}.`
            : null}{" "}
          Full script: <Link to="/docs">Docs</Link> ·{" "}
          <a href="https://github.com/panagot/Shielded-Settle/blob/main/docs/WALKTHROUGH.md">
            WALKTHROUGH.md
          </a>
        </p>
      </header>

      <section className="home-actions-block" aria-labelledby="reviewer-heading">
        <div className="home-actions-head">
          <h2 id="reviewer-heading">For reviewers (no wallet)</h2>
          <p>Three stops. Expect coral firstFree = 0, then a mint qualified mtIndex.</p>
        </div>
        <ol className="home-action-list">
          {REVIEWER.map((step) => (
            <li key={step.n}>
              <span className="home-action-n" aria-hidden>
                {step.n}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                <Link to={step.to}>
                  {step.label}
                  <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <dl className="home-signals">
        <div className="signal-cell signal-lie">
          <dt>firstFree</dt>
          <dd>0</dd>
          <small>Public index lies</small>
        </div>
        <div className="signal-cell signal-ledger">
          <dt>
            <TreeStructure size={14} weight="bold" aria-hidden /> Ledger
          </dt>
          <dd>46+</dd>
          <small>Real tree position</small>
        </div>
        <div className="signal-cell signal-kit">
          <dt>
            <ShieldCheck size={14} weight="bold" aria-hidden /> Kit
          </dt>
          <dd>mtIndex</dd>
          <small>Qualified for spend</small>
        </div>
        <div className="signal-cell signal-gap">
          <dt>Then</dt>
          <dd>Release</dd>
          <small>Spend succeeds</small>
        </div>
      </dl>

      <section className="home-actions-block" aria-labelledby="live-heading">
        <div className="home-actions-head">
          <h2 id="live-heading">Optional: Live Preprod</h2>
          <p>Real chain txs. Requires Lace, faucet tNIGHT, Generate tDUST, local proof server.</p>
        </div>
        <ol className="home-action-list">
          {LIVE_ACTIONS.map((step) => (
            <li key={step.n}>
              <span className="home-action-n" aria-hidden>
                {step.n}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                {step.external && step.href ? (
                  <a href={step.href} target="_blank" rel="noreferrer">
                    {step.label}
                    <ArrowRight size={14} weight="bold" />
                  </a>
                ) : (
                  <Link to={step.to!}>
                    {step.label}
                    <ArrowRight size={14} weight="bold" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="home-pillars">
        <article className="home-pillar">
          <h2>Why this exists</h2>
          <p>
            Contract-owned shielded coins sit in the tree, but <code>firstFree</code> often returns
            0 — so <code>sendShielded</code> fails until you recover the real index.
          </p>
          <Link to="/gap">
            Read #187
            <ArrowRight size={14} weight="bold" />
          </Link>
        </article>
        <article className="home-pillar">
          <h2>Wire the kit</h2>
          <p>
            Same <code>resolveContractCoinMtIndex</code> call the Live desk uses after a real
            deposit.
          </p>
          <Link to="/integrate">
            Copy the call
            <ArrowRight size={14} weight="bold" />
          </Link>
        </article>
        <article className="home-pillar">
          <h2>Hands-on desk</h2>
          <p>Step through deploy → deposit → probe → resolve → release on the simulated ledger.</p>
          <Link to="/desk">
            Open sim desk
            <ArrowRight size={14} weight="bold" />
          </Link>
        </article>
      </div>
    </section>
  );
}
