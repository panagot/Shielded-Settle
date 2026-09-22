import { Link } from "react-router-dom";

const QUESTIONS = [
  {
    num: "01",
    ask: "Where do I start as a reviewer?",
    answer:
      "Open Demo → Run example release (no wallet). Expect firstFree = 0, then a non-zero kit mtIndex, then Released. Full script in docs/WALKTHROUGH.md.",
    to: "/demo",
    label: "Open Demo",
    file: "docs/WALKTHROUGH.md",
  },
  {
    num: "02",
    ask: "How do I see the bug step-by-step?",
    answer:
      "On Desk: Deploy → Deposit → Probe (firstFree fails / is 0) → Resolve → Release or Refund.",
    to: "/desk",
    label: "Open the desk",
    file: "docs/HOW_TO_USE.md",
  },
  {
    num: "03",
    ask: "Why does the public index lie?",
    answer:
      "Contract-owned coins are in the tree, but queryZSwapAndContractState().firstFree often returns 0. That is servicedesk#187.",
    to: "/gap",
    label: "Read the gap",
    file: "docs/GAP.md",
  },
  {
    num: "04",
    ask: "How do I call the kit from my dApp?",
    answer:
      "Pass the debug dump and the deposited coin into resolveContractCoinMtIndex. Spend the qualified result once.",
    to: "/integrate",
    label: "Wire the resolver",
    file: "docs/INTEGRATION.md",
  },
  {
    num: "05",
    ask: "How do I settle on real Preprod?",
    answer:
      "Docker proof server on :6300. Fund Lace with tNIGHT (mn_addr_preprod…), Generate tDUST on the Midnight account card, then /live — or npm run settle:preprod.",
    to: "/live",
    label: "Open Live",
    file: "docs/HOW_TO_USE.md",
  },
];

export function DocsPage() {
  return (
    <section className="page-view">
      <header className="page-head">
        <div>
          <p className="eyebrow">Kit notes</p>
          <h1>Start here</h1>
        </div>
        <p className="lede">
          Reviewers: begin with the{" "}
          <a href="https://github.com/panagot/Shielded-Settle/blob/main/docs/WALKTHROUGH.md">
            walkthrough
          </a>{" "}
          or <Link to="/demo">Demo</Link> (no wallet). Use <Link to="/live">Live</Link> only with
          Lace, proof server, and tDUST. Longer markdown lives under <code>docs/</code>.
        </p>
      </header>

      <ol className="question-list">
        {QUESTIONS.map((item) => (
          <li key={item.num}>
            <span className="doc-num">{item.num}</span>
            <div>
              <h2>{item.ask}</h2>
              <p>{item.answer}</p>
              <p className="question-meta">
                <Link to={item.to}>{item.label}</Link>
                <code>{item.file}</code>
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="run-row">
        <div>
          <h2>Run locally</h2>
          <p>From the repo root (this app is that demo).</p>
        </div>
        <pre className="run-cmd">
          <code>{`npm install\nnpm test\nnpm run dev`}</code>
        </pre>
      </div>
    </section>
  );
}
