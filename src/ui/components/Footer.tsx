import { Link } from "react-router-dom";
import { Tip } from "./Tip";
import { useSession } from "../session";
import { statusLabel } from "../sessionStats";

export function Footer() {
  const { status, stats } = useSession();

  return (
    <footer className="site-foot">
      <div className="foot-brand">
        <strong>Shielded Settle</strong>
        <p>
          Recover the real Merkle index for contract-owned shielded coins, then spend them.
          This UI is a simulated ledger for the kit, not a wallet.
        </p>
      </div>

      <div className="foot-col">
        <p className="foot-label">Pages</p>
        <Link to="/">Home</Link>
        <Link to="/desk">Desk</Link>
        <Link to="/live">Live</Link>
        <Link to="/demo">Demo</Link>
        <Link to="/stats">Stats</Link>
        <Link to="/integrate">Integrate</Link>
        <Link to="/gap">Gap</Link>
        <Link to="/docs">Docs</Link>
      </div>

      <div className="foot-col">
        <p className="foot-label">References</p>
        <Tip content="GitHub issue tracking firstFree = 0 for contract coins." side="top">
          <a href="https://github.com/midnightntwrk/servicedesk/issues/187" target="_blank" rel="noreferrer">
            servicedesk#187
          </a>
        </Tip>
        <Tip content="Forum thread on the missing contract-owned mtIndex API." side="top">
          <a
            href="https://forum.midnight.network/t/a-gap-in-contract-owned-shielded-coin-handling-no-documented-way-to-get-the-real-mtindex-plus-a-couple-of-related-notes/1338"
            target="_blank"
            rel="noreferrer"
          >
            Midnight forum
          </a>
        </Tip>
        <span className="mono">docs/HOW_TO_USE.md</span>
        <span className="mono">docs/INTEGRATION.md</span>
      </div>

      <div className="foot-col">
        <p className="foot-label">This session</p>
        <span>
          Status <strong>{statusLabel(status)}</strong>
        </span>
        <span>
          Settled <strong className="mono">{stats.dealsSettled}</strong>
        </span>
        <span>
          Volume{" "}
          <strong className="mono">
            {stats.volumeNight.toLocaleString(undefined, { maximumFractionDigits: 2 })} NIGHT
          </strong>
        </span>
        <span>
          Last index{" "}
          <strong className="mono">{stats.lastMtIndex === null ? "—" : stats.lastMtIndex}</strong>
        </span>
        <span className="muted">Counts reset when you reload the tab.</span>
      </div>
    </footer>
  );
}
