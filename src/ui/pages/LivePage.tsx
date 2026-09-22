import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plugs, Play, WarningCircle, ArrowRight } from "@phosphor-icons/react";
import { createLaceProviders, isLaceAvailable, type LaceSession } from "../../midnight/laceProviders";
import { LiveEscrowSession, coinPublicKeyToBytes, type LiveStepLog } from "../../midnight/LiveEscrowSession";
import { makeDepositCoin } from "../../midnight/makeDepositCoin";
import { PREPROD } from "../../midnight/config";

type Busy = null | "connect" | "deploy" | "deposit" | "probe" | "release" | "refund" | "full";

function friendlyError(err: unknown): string {
  const msg = extractErrorMessage(err);
  if (/Buffer is not defined/i.test(msg)) {
    return "Browser Buffer polyfill missing — hard-refresh the page (Ctrl+Shift+R).";
  }
  if (/Network ID has not been configured/i.test(msg)) {
    return "Network ID not set — hard-refresh /live, then reconnect Lace.";
  }
  if (/User rejected|user denied|cancelled/i.test(msg)) return "Transaction cancelled in Lace.";
  if (/Failed to fetch|proof server|Failed Proof Server/i.test(msg)) {
    return "Could not reach the proof server at http://127.0.0.1:6300. Run: npm run proof-server";
  }
  if (/no elements in sequence/i.test(msg)) {
    return (
      "Wallet has no spendable Preprod coins yet (empty UTXO set). " +
      "In Lace: Network = Preprod → copy unshielded mn_addr_preprod… → faucet tNIGHT → wait until balance shows → Generate tDUST. " +
      "CLI faucet wallets are separate from Lace."
    );
  }
  if (/tDUST|dust|insufficient|could not balance dust/i.test(msg)) {
    return (
      "Need tDUST for fees (tNIGHT alone is not enough). In Lace, open the Midnight account card → Generate tDUST from your tNIGHT. tDUST cannot be swapped or sent from another wallet."
    );
  }
  return msg || "Unexpected error — check the browser console.";
}

function extractErrorMessage(err: unknown): string {
  if (!err) return "";
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  const anyErr = err as {
    message?: string;
    cause?: { message?: string; failure?: { message?: string; cause?: { message?: string } } };
  };
  if (anyErr.message) return anyErr.message;
  const failure = anyErr.cause?.failure;
  if (failure?.message) return failure.message;
  if (failure?.cause?.message) return failure.cause.message;
  if (anyErr.cause?.message) return anyErr.cause.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function LivePage() {
  const [session, setSession] = useState<LaceSession | null>(null);
  const [live, setLive] = useState<LiveEscrowSession | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [beneficiaryHex, setBeneficiaryHex] = useState("");
  const [joinAddress, setJoinAddress] = useState("");
  const [amountNight, setAmountNight] = useState("25");
  const [proofOk, setProofOk] = useState<boolean | null>(null);
  const [lacePresent, setLacePresent] = useState(false);
  const [zkAssetsOk, setZkAssetsOk] = useState<boolean | null>(null);

  const refreshProof = useCallback(async (uri = PREPROD.proofServer) => {
    try {
      const res = await fetch(uri.replace(/\/$/, "") + "/health", { method: "GET" }).catch(() => null);
      setProofOk(!!res && res.ok);
      return !!res && res.ok;
    } catch {
      setProofOk(false);
      return false;
    }
  }, []);

  const refreshZkAssets = useCallback(async () => {
    try {
      const base = `${window.location.origin}/managed/escrow`;
      const checks = await Promise.all([
        fetch(`${base}/keys/deposit.prover`, { method: "GET" }),
        fetch(`${base}/zkir/deposit.bzkir`, { method: "GET" }),
      ]);
      const ok = checks.every((r) => r.ok && !(r.headers.get("content-type") ?? "").includes("text/html"));
      setZkAssetsOk(ok);
      return ok;
    } catch {
      setZkAssetsOk(false);
      return false;
    }
  }, []);

  useEffect(() => {
    setLacePresent(isLaceAvailable());
    void refreshProof();
    void refreshZkAssets();
    const id = window.setInterval(() => {
      setLacePresent(isLaceAvailable());
      void refreshProof(session?.proofServerUri ?? PREPROD.proofServer);
    }, 4000);
    return () => window.clearInterval(id);
  }, [refreshProof, refreshZkAssets, session?.proofServerUri]);

  async function connect() {
    setBusy("connect");
    setError(null);
    try {
      if (typeof globalThis.Buffer === "undefined") {
        throw new Error("Buffer is not defined");
      }
      const ok = await refreshProof();
      if (!ok) {
        throw new Error(
          "Proof server not reachable at http://127.0.0.1:6300. Run: npm run proof-server (Docker must be running).",
        );
      }
      const zkOk = await refreshZkAssets();
      if (!zkOk) {
        throw new Error("ZK keys missing under /managed/escrow. Run: npm run compact && npm run zk:copy");
      }
      // Smoke-test ledger Buffer usage before Lace prompts.
      makeDepositCoin(1_000_000n);
      const lace = await createLaceProviders("preprod");
      setSession(lace);
      setLive(new LiveEscrowSession(lace.providers));
      await refreshProof(lace.proofServerUri);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(null);
    }
  }

  function atomicAmount(): bigint {
    const n = Number(amountNight);
    if (!Number.isFinite(n) || n <= 0) throw new Error("Amount must be a positive number of NIGHT.");
    return BigInt(Math.round(n * 1_000_000));
  }

  async function deploy() {
    if (!live || !session) return;
    setBusy("deploy");
    setError(null);
    try {
      const dep = partyKey(session.shieldedCoinPublicKey);
      const ben = beneficiaryHex.trim()
        ? coinPublicKeyToBytes(stripKey(beneficiaryHex.trim()))
        : dep;
      await live.deploy(dep, ben);
      setLive(cloneLive(live));
    } catch (err) {
      setError(friendlyError(err));
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
      setError(friendlyError(err));
    } finally {
      setBusy(null);
    }
  }

  async function deposit() {
    if (!live) return;
    setBusy("deposit");
    setError(null);
    try {
      const made = makeDepositCoin(atomicAmount());
      await live.deposit(made.kit, made.runtime);
      setLive(cloneLive(live));
    } catch (err) {
      setError(friendlyError(err));
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
      setError(friendlyError(err));
    } finally {
      setBusy(null);
    }
  }

  async function release() {
    if (!live || !session) return;
    setBusy("release");
    setError(null);
    try {
      await live.release(partyKey(session.shieldedCoinPublicKey));
      setLive(cloneLive(live));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(null);
    }
  }

  async function refund() {
    if (!live || !session) return;
    setBusy("refund");
    setError(null);
    try {
      await live.refund(partyKey(session.shieldedCoinPublicKey));
      setLive(cloneLive(live));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(null);
    }
  }

  /** Deploy → deposit → probe/kit → release in one pass (Lace confirms each tx). */
  async function runFullRelease() {
    if (!live || !session) return;
    setBusy("full");
    setError(null);
    try {
      if (!live.contractAddress) {
        const dep = partyKey(session.shieldedCoinPublicKey);
        const ben = beneficiaryHex.trim()
          ? coinPublicKeyToBytes(stripKey(beneficiaryHex.trim()))
          : dep;
        await live.deploy(dep, ben);
      }
      const made = makeDepositCoin(atomicAmount());
      await live.deposit(made.kit, made.runtime);
      const probed = await live.probe();
      if (!probed.ok) {
        throw new Error(probed.warning ?? "Kit could not qualify mtIndex after deposit.");
      }
      await live.release(partyKey(session.shieldedCoinPublicKey));
      setLive(cloneLive(live));
    } catch (err) {
      setError(friendlyError(err));
      setLive(live ? cloneLive(live) : null);
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
          Connect Lace, then run a full shielded escrow on Preprod: deploy → deposit → probe{" "}
          <code>firstFree</code> → kit resolve → release. Approvals happen in the wallet.
        </p>
      </header>

      <div className="live-checklist">
        <p>
          Proof server:{" "}
          <strong className={proofOk ? "accent" : proofOk === false ? "danger" : undefined}>
            {proofOk === null ? "checking…" : proofOk ? "reachable on :6300" : "down — npm run proof-server"}
          </strong>
        </p>
        <p>
          ZK assets:{" "}
          <strong className={zkAssetsOk ? "accent" : zkAssetsOk === false ? "danger" : undefined}>
            {zkAssetsOk === null
              ? "checking…"
              : zkAssetsOk
                ? "keys + zkir ready"
                : "missing — npm run compact && npm run zk:copy"}
          </strong>
        </p>
        <p>
          Lace extension:{" "}
          <strong className={lacePresent ? "accent" : "danger"}>
            {lacePresent ? "detected" : "not detected — install Lace and reload"}
          </strong>
        </p>
        <p>
          Network: Preprod · Faucet needs <strong>mn_addr_preprod…</strong> (unshielded) —{" "}
          <a href={PREPROD.faucet} target="_blank" rel="noreferrer">
            request tNIGHT
          </a>
          . Then Midnight account card → <strong>Generate tDUST</strong> (not a swap; tDUST is
          non-transferable). CLI faucet seeds are a different wallet.
        </p>
        <p>
          Lace settings: Network <strong>Preprod</strong>, Proof server{" "}
          <strong>Local (http://localhost:6300)</strong>
        </p>
        <p>
          Sim path (no wallet): <Link to="/desk">Desk</Link> · <Link to="/demo">Demo</Link>
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

          <label className="field-label">
            Deposit amount (NIGHT)
            <input
              className="field"
              type="number"
              min="0.000001"
              step="1"
              value={amountNight}
              onChange={(e) => setAmountNight(e.target.value)}
            />
          </label>

          <label className="field-label">
            Beneficiary coin public key — blank = self
            <input
              className="field"
              value={beneficiaryHex}
              onChange={(e) => setBeneficiaryHex(e.target.value)}
              placeholder="64 hex chars or mn_shield-cpk_preprod…"
            />
          </label>

          <div className="demo-controls">
            <button type="button" className="btn btn-accent" disabled={!!busy} onClick={runFullRelease}>
              <Play size={16} weight="fill" />
              {busy === "full" ? "Running full settle…" : "Run full Preprod settle"}
            </button>
            <ArrowRight size={16} className="muted" />
          </div>

          <div className="demo-controls">
            <button type="button" className="btn btn-line" disabled={!!busy} onClick={deploy}>
              1 · Deploy
            </button>
            <button
              type="button"
              className="btn btn-line"
              disabled={!!busy || !live?.contractAddress}
              onClick={deposit}
            >
              2 · Deposit
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={!!busy || !live?.lastCoin}
              onClick={probe}
            >
              3 · Probe + kit
            </button>
            <button
              type="button"
              className="btn btn-accent"
              disabled={!!busy || !live?.lastQualified}
              onClick={release}
            >
              4 · Release
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={!!busy || !live?.lastQualified}
              onClick={refund}
            >
              Refund
            </button>
          </div>

          <div className="demo-controls">
            <input
              className="field"
              placeholder="Join existing contract address"
              value={joinAddress}
              onChange={(e) => setJoinAddress(e.target.value)}
            />
            <button type="button" className="btn btn-ghost" disabled={!!busy || !joinAddress.trim()} onClick={join}>
              Join
            </button>
          </div>
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
            <dd className="mono accent">{live.lastQualified ? String(live.lastQualified.mtIndex) : "—"}</dd>
          </div>
        </dl>
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

/** Accept 64-char hex or Lace Bech32m (`mn_shield-cpk_…` / `mn_shield-addr_…`). */
function partyKey(raw: string): Uint8Array {
  return coinPublicKeyToBytes(raw);
}
