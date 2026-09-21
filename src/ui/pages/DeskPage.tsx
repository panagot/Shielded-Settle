import { ArrowRight, ArrowsClockwise, Play, WarningCircle } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { formatIndex, formatNight } from "@kit/index";
import { FlowSteps } from "../components/FlowSteps";
import { EventLog } from "../components/EventLog";
import { IndexChart } from "../components/IndexChart";
import { VolumeChart } from "../components/VolumeChart";
import { Tip } from "../components/Tip";
import { useSession } from "../session";
import { statusLabel } from "../sessionStats";

function nextHint(status: string, probed: boolean): string {
  switch (status) {
    case "idle":
    case "released":
    case "refunded":
      return "Set parties and amount, then deploy the vault.";
    case "deployed":
      return "Deposit shielded NIGHT into the contract.";
    case "funded":
      return probed
        ? "firstFree lied. Resolve the real mtIndex with the kit."
        : "Probe firstFree (expect 0), then resolve the real mtIndex.";
    case "index-resolved":
      return "Release to the beneficiary or refund the depositor.";
    default:
      return "";
  }
}

function SignalBand({
  firstFree,
  ledger,
  kit,
}: {
  firstFree: bigint | null;
  ledger: bigint | null;
  kit: bigint | null;
}) {
  const gap = firstFree !== null && kit !== null ? Number(kit - firstFree) : null;
  return (
    <dl className="signal-band">
      <div className={firstFree === 0n ? "signal-cell signal-lie" : firstFree !== null ? "signal-cell signal-ledger" : "signal-cell"}>
        <dt>firstFree</dt>
        <dd>{formatIndex(firstFree)}</dd>
        <small>
          {firstFree === 0n ? <Link to="/gap">Public query lied</Link> : "Documented index"}
        </small>
      </div>
      <div className={ledger !== null ? "signal-cell signal-ledger" : "signal-cell"}>
        <dt>Real ledger</dt>
        <dd>{formatIndex(ledger)}</dd>
        <small>Position in the tree</small>
      </div>
      <div className={kit !== null ? "signal-cell signal-kit" : "signal-cell"}>
        <dt>Kit mtIndex</dt>
        <dd>{formatIndex(kit)}</dd>
        <small>Qualified for spend</small>
      </div>
      <div className={gap !== null && gap > 0 ? "signal-cell signal-gap" : "signal-cell"}>
        <dt>Gap</dt>
        <dd>{gap === null ? "—" : String(gap)}</dd>
        <small>mtIndex minus firstFree</small>
      </div>
    </dl>
  );
}

export function DeskPage() {
  const s = useSession();
  const primary = (() => {
    if (s.canDeploy) {
      return {
        label: "Deploy contract",
        tip: "Create the escrow contract on the simulated ledger.",
        enabled: s.amount > 0n && !s.amountError,
        danger: false,
      };
    }
    if (s.canDeposit) {
      return {
        label: "Deposit · receiveShielded",
        tip: "Commit the shielded coin. Its Merkle position stays hidden from firstFree.",
        enabled: true,
        danger: false,
      };
    }
    if (s.status === "funded" && !s.probed) {
      return {
        label: "Probe firstFree",
        tip: "Run the documented query. Expect 0 and a proof failure.",
        enabled: true,
        danger: true,
      };
    }
    if (s.status === "funded") {
      return {
        label: "Resolve with kit",
        tip: "Parse the debug dump and qualify the coin at its real index.",
        enabled: true,
        danger: false,
      };
    }
    if (s.canSettle) {
      return {
        label: `Release → ${s.engine.deal?.beneficiary ?? "beneficiary"}`,
        tip: "sendShielded using the qualified, non-zero mtIndex.",
        enabled: true,
        danger: false,
      };
    }
    return {
      label: "Start next deal",
      tip: "Clear the current deal and deploy another.",
      enabled: true,
      danger: false,
    };
  })();

  return (
    <section className="desk">
      <header className="desk-head">
        <div className="desk-intro">
          <p className="eyebrow">Simulated ledger · Shielded Settle</p>
          <div className="desk-title-row">
            <h1>Settlement desk</h1>
            {s.showFaultChip && (
              <Tip content="The public index returned 0. Open Gap for the failure mode.">
                <Link className="fault-chip" to="/gap">
                  <WarningCircle size={14} weight="bold" />
                  firstFree = 0
                </Link>
              </Tip>
            )}
          </div>
          <p className="lede">
            Recover contract-owned{" "}
            <Tip content="Merkle position required by sendShielded. Never hardcode 0.">
              <code className="tip-code">mtIndex</code>
            </Tip>{" "}
            when{" "}
            <Tip content="Next-free index from queryZSwapAndContractState. Often wrong for contract coins.">
              <code className="tip-code">firstFree</code>
            </Tip>{" "}
            returns 0.
          </p>
        </div>
        <FlowSteps status={s.status} />
      </header>

      <div className="judge-strip">
        <div>
          <p className="eyebrow">For judges</p>
          <p>One click runs deposit → probe (firstFree = 0) → resolve → release on the sim ledger.</p>
        </div>
        <button
          type="button"
          className="btn btn-line"
          onClick={() => s.runExampleDeal("released")}
        >
          <Play size={16} weight="fill" />
          Run example settle
        </button>
      </div>

      <div className={`command-bar tone-${s.status}`} role="region" aria-label="Next action">
        <div className="command-meta">
          <span className={`status-pill status-${s.status}`}>{statusLabel(s.status)}</span>
          <p>{nextHint(s.status, s.probed)}</p>
          {s.stats.dealsSettled > 0 && (
            <p className="command-session mono">
              {s.stats.dealsSettled} settled
              {s.stats.lastMtIndex !== null ? ` · last idx ${s.stats.lastMtIndex}` : ""}
            </p>
          )}
        </div>
        <Tip content={primary.tip} side="bottom">
          <button
            type="button"
            className={`btn btn-command ${primary.danger ? "btn-danger" : "btn-accent"}`}
            disabled={!primary.enabled}
            onClick={s.runPrimary}
          >
            <span>{primary.label}</span>
            <ArrowRight size={18} weight="bold" />
          </button>
        </Tip>
      </div>

      <SignalBand
        firstFree={s.engine.deal?.firstFreeObserved ?? null}
        ledger={s.engine.realLedgerIndex}
        kit={s.engine.deal?.qualified?.mtIndex ?? null}
      />

      <div className="desk-body">
        <div className="panel workflow">
          <div className="panel-head">
            <h2>Deal</h2>
            <span className="muted">Parties, deposit, resolve</span>
          </div>

          <div className="party-row">
            <label className="field">
              <span>Depositor</span>
              <input
                value={s.depositor}
                onChange={(e) => s.setDepositor(e.target.value)}
                disabled={!s.canDeploy}
              />
            </label>
            <label className="field">
              <span>Beneficiary</span>
              <input
                value={s.beneficiary}
                onChange={(e) => s.setBeneficiary(e.target.value)}
                disabled={!s.canDeploy}
              />
            </label>
            <label className="field">
              <span>Amount (NIGHT)</span>
              <input
                value={s.amountRaw}
                onChange={(e) => s.setAmountRaw(e.target.value)}
                disabled={!s.canDeploy}
                inputMode="decimal"
              />
            </label>
          </div>

          {(s.formError || s.amountError) && (
            <p className="form-error" role="alert">
              {s.formError ?? s.amountError}
            </p>
          )}

          <div className="step-actions">
            <Tip content="Instantiate the vault. Parties lock after this step.">
              <button
                type="button"
                className={`btn ${s.canDeploy && s.amount > 0n && !s.amountError ? "btn-accent" : "btn-line"}`}
                disabled={!s.canDeploy || s.amount <= 0n || Boolean(s.amountError)}
                onClick={s.deploy}
              >
                1 · Deploy
              </button>
            </Tip>
            <Tip content="Coin enters the tree. Position stays hidden from firstFree.">
              <button
                type="button"
                className={`btn ${s.canDeposit ? "btn-accent" : "btn-line"}`}
                disabled={!s.canDeposit}
                onClick={s.deposit}
              >
                2 · Deposit
              </button>
            </Tip>
            <Tip content="Documented path. Expect firstFree = 0 and a proof error.">
              <button
                type="button"
                className={`btn ${s.canNaive && !s.probed ? "btn-danger" : "btn-line"}`}
                disabled={!s.canNaive}
                onClick={s.probe}
              >
                3 · Probe
              </button>
            </Tip>
            <Tip content="Parse the dump and qualify the coin at the real index.">
              <button
                type="button"
                className={`btn ${s.canResolve && s.status === "funded" && s.probed ? "btn-accent" : "btn-line"}`}
                disabled={!s.canResolve}
                onClick={s.resolve}
              >
                4 · Resolve
              </button>
            </Tip>
          </div>

          <div className="settle-row">
            <Tip content="Spend to the beneficiary with a non-zero mtIndex. A second spend is blocked.">
              <button
                type="button"
                className={`btn ${s.canSettle ? "btn-accent" : "btn-line"}`}
                disabled={!s.canSettle}
                onClick={s.release}
              >
                Release → {s.engine.deal?.beneficiary ?? "beneficiary"}
              </button>
            </Tip>
            <Tip content="Same spend path. Destination is the depositor.">
              <button
                type="button"
                className="btn btn-line"
                disabled={!s.canSettle}
                onClick={s.refund}
              >
                Refund → {s.engine.deal?.depositor ?? "depositor"}
              </button>
            </Tip>
            <Tip content="Drop the current deal. Session stats stay.">
              <button type="button" className="btn btn-ghost" onClick={s.reset}>
                <ArrowsClockwise size={16} />
                Reset
              </button>
            </Tip>
          </div>

          <dl className="kv">
            <div>
              <dt>Contract</dt>
              <dd className="mono">{s.engine.deal?.contractAddress ?? "—"}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd className="mono">
                {s.engine.deal ? `${formatNight(s.engine.deal.amount)} NIGHT` : "—"}
              </dd>
            </div>
            <div>
              <dt>firstFree</dt>
              <dd className={`mono ${s.showFaultChip ? "danger" : ""}`}>
                {formatIndex(s.engine.deal?.firstFreeObserved ?? null)}
              </dd>
            </div>
            <div>
              <dt>Qualified mtIndex</dt>
              <dd className="mono accent">
                {formatIndex(s.engine.deal?.qualified?.mtIndex ?? null)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="viz-stack">
          <IndexChart deal={s.engine.deal} realIndex={s.engine.realLedgerIndex} />
          <VolumeChart points={s.points} />
        </div>
      </div>

      <EventLog events={s.engine.events} />
    </section>
  );
}
