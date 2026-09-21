import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Plugs, Play, WarningCircle } from "@phosphor-icons/react";
import { createLaceProviders, isLaceAvailable, type LaceSession } from "../../midnight/laceProviders";
import { LiveEscrowSession, hexKeyToBytes32, type LiveStepLog } from "../../midnight/LiveEscrowSession";
import { PREPROD } from "../../midnight/config";
import type { ShieldedCoinInfo } from "@kit/types";

type Busy = null | "connect" | "deploy" | "deposit" | "probe" | "release" | "refund";

export function LivePage() {
  const [session, setSession] = useState<LaceSession | null>(null);
  const [live, setLive] = useState<LiveEscrowSession | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [beneficiaryHex, setBeneficiaryHex] = useState("");
  const [joinAddress, setJoinAddress] = useState("");
  const [coinNonce, setCoinNonce] = useState("");
  const [coinColor, setCoinColor] = useState("");
  const [coinValue, setCoinValue] = useState("25000000");
  const [proofOk, setProofOk] = useState<boolean | null>(null);
  const lacePresent = typeof window !== "undefined" && isLaceAvailable();

  const refreshProof = useCallback(async (uri: string) => {
    try {
      const res = await fetch(uri.replace(/\/$/, "") + "/health", { method: "GET" }).catch(() => null);
      setProofOk(!!res && res.ok);
    } catch {
      setProofOk(false);
    }
  }, []);

  async function connect() {
    setBusy("connect");
    setError(null);
    try {
      const lace = await createLaceProviders("preprod");
      setSession(lace);
      setLive(new LiveEscrowSession(lace.providers));
      await refreshProof(lace.proofServerUri);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function deploy() {
    if (!live || !session) return;
    setBusy("deploy");
    setError(null);
    try {
      const dep = hexKeyToBytes32(stripKey(session.shieldedCoinPublicKey));
      const benHex = beneficiaryHex.trim() || stripKey(session.shieldedCoinPublicKey);
      const ben = hexKeyToBytes32(benHex);
      await live.deploy(dep, ben);
      setLive(cloneLive(live));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function join() {
    if (!live || !joinAddress.trim()) return;
    setBusy("deploy");
    setError(null);
    try {
      await live.join(joinAddress.trim());
      setLive(cloneLive(live));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function deposit() {
    if (!live) return;
    setBusy("deposit");
    setError(null);
    try {
      const coin: ShieldedCoinInfo = {
        nonce: normalizeHex(coinNonce),
        color: normalizeHex(coinColor),
        value: BigInt(coinValue),
      };
      await live.deposit(coin);
      setLive(cloneLive(live));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function probe() {
    if (!live) return;
    setBusy("probe");
    setError(null);
    try {
      await live.probe();
      setLive(cloneLive(live));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function release() {
    if (!live || !session) return;
    setBusy("release");
    setError(null);
    try {
      await live.release(hexKeyToBytes32(stripKey(session.shieldedCoinPublicKey)));
      setLive(cloneLive(live));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function refund() {
    if (!live || !session) return;
    setBusy("refund");
    setError(null);
    try {
      await live.refund(hexKeyToBytes32(stripKey(session.shieldedCoinPublicKey)));
      setLive(cloneLive(live));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="page-view">
      <header className="page-head">
        <div>
          <p className="eyebrow">Midnight Preprod · real txs</p>
          <h1>Live settle</h1>
        </div>
        <p className="lede">
          Connect Lace on <strong>Preprod</strong>, run a local proof server, then deploy → deposit → probe{" "}
          <code>firstFree</code> → kit resolve → release. This path hits the Midnight network — not the sim desk.
        </p>
      </header>

      <div className="live-checklist">
        <p>
          Proof server:{" "}
          {proofOk === null ? "unchecked" : proofOk ? "reachable" : "down — run npm run proof-server"}
        </p>
        <p>Lace extension: {lacePresent ? "detected" : "not detected in this browser"}</p>
        <p>
          Faucet:{" "}
          <a href={PREPROD.faucet} target="_blank" rel="noreferrer">
            tNIGHT Preprod
          </a>{" "}
          · then Generate tDUST in Lace
        </p>
        <p>
          Sim path stays on <Link to="/desk">Desk</Link> for judges without Lace.
        </p>
      </div>

      {!session ? (
        <button type="button" className="btn btn-accent" disabled={busy === "connect"} onClick={connect}>
          <Plugs size={18} weight="bold" />
          {busy === "connect" ? "Connecting…" : "Connect Lace (Preprod)"}
        </button>
      ) : (
        <div className="live-connected">
          <p className="mono">
            Connected · coinPk {short(session.shieldedCoinPublicKey)} · proof {session.proofServerUri}
          </p>
          <div className="demo-controls">
            <button type="button" className="btn btn-accent" disabled={!!busy} onClick={deploy}>
              <Play size={16} weight="fill" />
              Deploy escrow
            </button>
            <button type="button" className="btn btn-line" disabled={!!busy || !joinAddress.trim()} onClick={join}>
              Join address
            </button>
            <input
              className="field"
              placeholder="mn_… or hex contract address"
              value={joinAddress}
              onChange={(e) => setJoinAddress(e.target.value)}
            />
          </div>
          <label className="field-label">
            Beneficiary coin public key (hex, 32 bytes) — blank = self
            <input
              className="field"
              value={beneficiaryHex}
              onChange={(e) => setBeneficiaryHex(e.target.value)}
              placeholder="optional · defaults to your coinPk"
            />
          </label>
        </div>
      )}

      {live?.contractAddress && (
        <dl className="open-deal">
          <div>
            <dt>Contract</dt>
            <dd className="mono">{live.contractAddress}</dd>
          </div>
          <div>
            <dt>firstFree</dt>
            <dd className={`mono ${live.firstFree === 0n ? "danger" : ""}`}>
              {live.firstFree === null ? "—" : String(live.firstFree)}
            </dd>
          </div>
          <div>
            <dt>Kit mtIndex</dt>
            <dd className="mono accent">
              {live.lastQualified ? String(live.lastQualified.mtIndex) : "—"}
            </dd>
          </div>
        </dl>
      )}

      {live?.contractAddress && (
        <div className="live-fund">
          <h2>Deposit coin (shielded)</h2>
          <p className="muted">
            Paste the shielded coin fields from your wallet / indexer for the deposit you will commit.
          </p>
          <div className="form-grid">
            <label>
              nonce (hex)
              <input className="field" value={coinNonce} onChange={(e) => setCoinNonce(e.target.value)} />
            </label>
            <label>
              color (hex)
              <input className="field" value={coinColor} onChange={(e) => setCoinColor(e.target.value)} />
            </label>
            <label>
              value (atomic)
              <input className="field" value={coinValue} onChange={(e) => setCoinValue(e.target.value)} />
            </label>
          </div>
          <div className="demo-controls">
            <button type="button" className="btn btn-line" disabled={!!busy} onClick={deposit}>
              Deposit · receiveShielded
            </button>
            <button type="button" className="btn btn-danger" disabled={!!busy} onClick={probe}>
              Probe firstFree + kit
            </button>
            <button type="button" className="btn btn-accent" disabled={!!busy || !live.lastQualified} onClick={release}>
              Release on-chain
            </button>
            <button type="button" className="btn btn-ghost" disabled={!!busy || !live.lastQualified} onClick={refund}>
              Refund on-chain
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="live-error" role="alert">
          <WarningCircle size={16} weight="bold" />
          <span style={{ whiteSpace: "pre-wrap" }}>{error}</span>
        </p>
      )}

      {live && live.logs.length > 0 && (
        <ol className="path-list" aria-label="Live transaction log">
          {live.logs.map((row: LiveStepLog) => (
            <li key={`${row.at}-${row.kind}`}>
              <span className="doc-num">{row.kind}</span>
              <div>
                <h2 className={row.tone === "danger" ? "danger" : undefined}>{row.detail}</h2>
                {row.txId ? <p className="mono">tx {row.txId}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function cloneLive(live: LiveEscrowSession): LiveEscrowSession {
  const next = Object.assign(Object.create(Object.getPrototypeOf(live)), live) as LiveEscrowSession;
  next.logs = [...live.logs];
  return next;
}

function short(v: string): string {
  if (v.length <= 16) return v;
  return `${v.slice(0, 10)}…${v.slice(-6)}`;
}

function stripKey(v: string): string {
  return v.replace(/^0x/, "");
}

function normalizeHex(v: string): string {
  const h = v.trim().replace(/^0x/, "");
  if (!/^[0-9a-fA-F]+$/.test(h) || h.length < 8) {
    throw new Error("Coin field must be hex.");
  }
  return h;
}
