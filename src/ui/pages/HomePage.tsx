import { ArrowRight, Wallet, TreeStructure, ShieldCheck } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { PREPROD } from "../../midnight/config";
import { useSession } from "../session";

const ACTIONS = [
  {
    n: "01",
    title: "Fund your Lace wallet",
    body: "Open Lace on Preprod, copy your unshielded address, request tNIGHT from the faucet.",
    href: PREPROD.faucet,
    external: true,
    label: "Open faucet",
  },
  {
    n: "02",
    title: "Generate tDUST",
    body: "In Lace: Generate tDUST so fees can be paid. Point proof server to Local (http://localhost:6300).",
    to: "/live",
    label: "Open Live checklist",
  },
  {
    n: "03",
    title: "Create the escrow",
    body: "Connect Lace on /live, then deploy. Depositor and beneficiary default to your coin public key.",
    to: "/live",
    label: "Deploy on Preprod",
  },
  {
    n: "04",
    title: "Deposit and settle",
    body: "Fund a shielded deposit, probe firstFree (expect 0), let the kit recover mtIndex, then release.",
    to: "/live",
    label: "Run full settle",
  },
];

export function HomePage() {
  const { stats } = useSession();

  return (
    <section className="home">
      <header className="home-hero">
        <p className="eyebrow">Midnight Preprod · real txs</p>
        <h1>Shielded Settle</h1>
        <p className="home-tag">
          Create a shielded escrow, deposit coins, recover the real <code>mtIndex</code>, and
          release — on live Preprod.
        </p>
        <div className="home-actions">
          <Link className="btn btn-accent" to="/live">
            <Wallet size={18} weight="bold" />
            Start live settle
          </Link>
          <Link className="btn btn-line" to="/desk">
            Practice on sim desk
            <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
        <p className="home-note">
          Needs Lace (Preprod) + Docker proof server. Sim desk is optional for reviewers without a
          wallet.
          {stats.dealsSettled > 0
            ? ` This tab has settled ${stats.dealsSettled} deal${stats.dealsSettled === 1 ? "" : "s"}.`
            : null}
        </p>
      </header>

      <section className="home-actions-block" aria-labelledby="home-actions-heading">
        <div className="home-actions-head">
          <h2 id="home-actions-heading">Take action</h2>
          <p>Four steps from empty Lace to a settled Preprod escrow.</p>
        </div>
        <ol className="home-action-list">
          {ACTIONS.map((step) => (
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
          <small>Once, on Preprod</small>
        </div>
      </dl>

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
          <h2>No Lace yet?</h2>
          <p>Run the full deposit → probe → resolve → release path on the simulated ledger.</p>
          <Link to="/desk">
            Open sim desk
            <ArrowRight size={14} weight="bold" />
          </Link>
        </article>
      </div>
    </section>
  );
}
