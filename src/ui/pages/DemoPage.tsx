import { Link } from "react-router-dom";
import { DEMO_VIDEO, youtubeEmbedSrc } from "../demoVideo";

const CHAPTERS = [
  {
    time: "0:00",
    title: "Problem",
    body: "Contract receives a shielded coin. firstFree often returns 0. sendShielded fails.",
  },
  {
    time: "0:30",
    title: "Desk path",
    body: "Deploy → Deposit → Probe the lie → Resolve with the kit → Release or refund.",
  },
  {
    time: "1:30",
    title: "Signal band",
    body: "Coral is firstFree. Ice is the real ledger. Mint is the qualified mtIndex.",
  },
  {
    time: "2:00",
    title: "Integrate",
    body: "Copy resolveContractCoinMtIndex. Proof stack stays Lace or your proof server.",
  },
  {
    time: "2:30",
    title: "Honest scope",
    body: "Simulated ledger for the demo. Kit is what you wire into a live Compact dApp.",
  },
];

export function DemoPage() {
  const embed = youtubeEmbedSrc(DEMO_VIDEO.url);

  return (
    <section className="page-view">
      <header className="page-head">
        <div>
          <p className="eyebrow">Hackathon walkthrough</p>
          <h1>Demo video</h1>
        </div>
        <p className="lede">
          {DEMO_VIDEO.durationHint}. After you upload an unlisted YouTube link, paste it into{" "}
          <code className="tip-code">src/ui/demoVideo.ts</code> and redeploy. Until then, use the
          chapter list as a recording script, or open the{" "}
          <Link to="/desk">desk</Link> live.
        </p>
      </header>

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
            <p className="eyebrow">Awaiting upload</p>
            <h2>{DEMO_VIDEO.title}</h2>
            <p>
              Create an unlisted YouTube video, then set{" "}
              <code>DEMO_VIDEO.url</code> to the watch link or video id.
            </p>
            <div className="demo-actions">
              <Link className="btn btn-accent" to="/desk">
                Run the live desk
              </Link>
              <a className="btn btn-line" href="/deck.html" target="_blank" rel="noreferrer">
                Open slide deck
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="page-split" style={{ marginTop: "1.25rem" }}>
        <ol className="path-list">
          {CHAPTERS.map((chapter) => (
            <li key={chapter.time}>
              <span className="doc-num">{chapter.time}</span>
              <div>
                <h2>{chapter.title}</h2>
                <p>{chapter.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <aside className="note-card">
          <h2>Recording tips</h2>
          <ul className="plain-list">
            <li>1080p, under 3 minutes, unlisted is fine for organizers.</li>
            <li>Show the Probe step failing at firstFree = 0, then Resolve.</li>
            <li>Cut to Stats once, then Gap for the failure string.</li>
            <li>End on Integrate with the copy button.</li>
          </ul>
          <p className="docs-links" style={{ marginTop: "0.85rem" }}>
            Deck PDF: print <a href="/deck.html">/deck.html</a> → Save as PDF, or use{" "}
            <code>docs/Shielded-Settle-Deck.pdf</code> after generation.
          </p>
        </aside>
      </div>
    </section>
  );
}
