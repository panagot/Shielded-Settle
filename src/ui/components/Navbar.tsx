import { NavLink } from "react-router-dom";
import { Tip } from "./Tip";

const LINKS = [
  { to: "/desk", label: "Desk", tip: "Run deposit, resolve, and settle on the simulated ledger." },
  { to: "/stats", label: "Stats", tip: "Session KPIs for deals settled in this browser tab." },
  { to: "/integrate", label: "Integrate", tip: "TypeScript pattern for wiring the kit into a Compact dApp." },
  { to: "/gap", label: "Gap", tip: "Why firstFree returns 0, and servicedesk#187." },
  { to: "/docs", label: "Docs", tip: "How to run the demo and what each kit call expects." },
  { to: "/demo", label: "Demo", tip: "Hackathon walkthrough video and recording script." },
];

export function Navbar() {
  return (
    <nav className="navbar" aria-label="Primary">
      <Tip content="Back to the settlement desk." side="bottom">
        <NavLink className="nav-brand" to="/desk">
          <span className="brand-mark" aria-hidden>
            <span />
            <span />
            <span />
          </span>
          <span className="brand-text">
            <strong>Shielded Settle</strong>
            <small>Midnight</small>
          </span>
        </NavLink>
      </Tip>

      <ul className="nav-links">
        {LINKS.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              title={link.tip}
              className={({ isActive }) => (isActive ? "is-active" : undefined)}
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="nav-trail">
        <Tip content="Local simulation. No mainnet funds move from this UI." side="bottom">
          <span className="nav-chip">Sim ledger</span>
        </Tip>
        <Tip content="Open the contract-owned firstFree = 0 report." side="bottom">
          <a
            className="nav-chip nav-chip-link"
            href="https://github.com/midnightntwrk/servicedesk/issues/187"
            target="_blank"
            rel="noreferrer"
          >
            #187
          </a>
        </Tip>
      </div>
    </nav>
  );
}
