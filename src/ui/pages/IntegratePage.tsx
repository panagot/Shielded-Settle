import { Link } from "react-router-dom";
import { CodePanel } from "../components/CodePanel";

const INPUTS = [
  { field: "snapshot.firstFree", from: "queryZSwapAndContractState" },
  { field: "snapshot.debugDump", from: "ZswapChainState.toString(true)" },
  { field: "lookup.contractAddress", from: "Your deployed escrow" },
  { field: "lookup.coin", from: "The shielded coin you deposited" },
];

const STEPS = [
  {
    title: "Wait for finality",
    body: "receiveShielded has landed. The coin is in the tree. You still do not have its index.",
  },
  {
    title: "Record the public lie",
    body: "Read firstFree. If it is 0, or a later spend fails on index 0, take the debug dump.",
  },
  {
    title: "Qualify the coin",
    body: "resolveContractCoinMtIndex returns a qualified coin or a detail string. Do not spend on a failed result.",
  },
  {
    title: "Spend once",
    body: "Pass qualified into sendShielded. A second spend of the same coin is rejected.",
  },
];

const CHECKS = [
  "Deposit confirms and the contract is funded.",
  "The naive firstFree path returns 0 or the proof rejects it.",
  "The kit returns a non-zero mtIndex.",
  "Release or refund proves against that index.",
  "A second spend of the same coin fails.",
];

export function IntegratePage() {
  return (
    <section className="page-view">
      <header className="page-head">
        <div>
          <p className="eyebrow">Compact dApp</p>
          <h1>Wire the resolver</h1>
        </div>
        <p className="lede">
          The desk is a simulated ledger. A live app uses the same call after a real deposit.
          Read <Link to="/gap">why firstFree lies</Link> before you copy this in.
        </p>
      </header>

      <div className="integrate-grid">
        <div>
          <h2 className="block-title">What you pass</h2>
          <dl className="io-list">
            {INPUTS.map((row) => (
              <div key={row.field}>
                <dt className="mono">{row.field}</dt>
                <dd>{row.from}</dd>
              </div>
            ))}
          </dl>
          <p className="boundary">
            The kit qualifies the coin. Lace, or an HTTP proof server, still builds the proof.
            When Midnight documents a contract-coin lookup for #187, keep this function and treat
            the dump as the fallback.
          </p>
        </div>
        <CodePanel />
      </div>

      <ol className="path-list">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <span className="doc-num">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="note-card">
        <h2>Acceptance</h2>
        <ul className="plain-list">
          {CHECKS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="docs-links">
          Full notes in <code>docs/INTEGRATION.md</code>. Sample contract in{" "}
          <code>contracts/escrow.compact</code>.
        </p>
      </div>
    </section>
  );
}
