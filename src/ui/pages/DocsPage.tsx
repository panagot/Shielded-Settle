import { Link } from "react-router-dom";

const QUESTIONS = [
  {
    num: "01",
    ask: "How do I see the bug?",
    answer: "Deploy, deposit, probe firstFree, resolve, then release or refund. Expect the probe to fail and the kit to recover a non-zero index.",
    to: "/desk",
    label: "Open the desk",
    file: "docs/HOW_TO_USE.md",
  },
  {
    num: "02",
    ask: "Why does the public index lie?",
    answer: "Contract-owned coins are in the tree, but queryZSwapAndContractState().firstFree often returns 0. That is servicedesk#187.",
    to: "/gap",
    label: "Read the gap",
    file: "docs/GAP.md",
  },
  {
    num: "03",
    ask: "How do I call it from Compact?",
    answer: "Pass the debug dump and the deposited coin into resolveContractCoinMtIndex. Spend the qualified result once.",
    to: "/integrate",
    label: "Wire the resolver",
    file: "docs/INTEGRATION.md",
  },
  {
    num: "04",
    ask: "Where is the walkthrough?",
    answer: "Open Demo for the video embed and recording script, or print the slide deck to PDF for the submission form.",
    to: "/demo",
    label: "Open demo",
    file: "docs/Shielded-Settle-Deck.pdf",
  },
  {
    num: "05",
    ask: "How do I settle on real Preprod?",
    answer: "Docker proof server on :6300. Fund Lace with tNIGHT via the Preprod faucet (mn_addr_preprod… only), Generate tDUST on the Midnight account card, then /live — or use npm run settle:preprod with a CLI seed.",
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
          Three questions cover the bug and the kit; Live Preprod is question five. Use the sim
          desk without a wallet; use <Link to="/live">Live</Link> when you have Lace, Docker
          proof server, and tDUST. Markdown under <code>docs/</code> is the longer contract.
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
          <h2>Run the demo</h2>
          <p>From the kit folder. The app in this browser is that demo.</p>
        </div>
        <pre className="run-cmd">
          <code>{`cd MIDNIGHT/escrow-index\nnpm install\nnpm run dev`}</code>
        </pre>
      </div>
    </section>
  );
}