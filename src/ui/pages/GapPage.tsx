import { ArrowRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const FORUM =
  "https://forum.midnight.network/t/a-gap-in-contract-owned-shielded-coin-handling-no-documented-way-to-get-the-real-mtindex-plus-a-couple-of-related-notes/1338";

export function GapPage() {
  return (
    <section className="page-view">
      <header className="page-head">
        <div>
          <p className="eyebrow">servicedesk#187</p>
          <h1>firstFree returns 0</h1>
        </div>
        <p className="lede">
          A contract can receive a shielded coin and still have no documented way to read that
          coin’s Merkle index. The next spend then fails.
        </p>
      </header>

      <p className="fault-banner">
        <span>Failure mode</span>
        invalid index into sparse merkle tree: 0
      </p>

      <div className="compare" role="table" aria-label="Documented query versus the kit">
        <div className="compare-head" />
        <div className="compare-head">Documented query</div>
        <div className="compare-head">Shielded Settle</div>

        <div className="compare-label">What you read</div>
        <div>
          <code>firstFree</code>
        </div>
        <div>
          <code>mtIndex</code>
        </div>

        <div className="compare-label">Typical value</div>
        <div className="num-lie">0</div>
        <div className="num-ok">46, 51, 80…</div>

        <div className="compare-label">sendShielded</div>
        <div>Proof rejects index 0</div>
        <div>Release or refund spends the coin</div>

        <div className="compare-label">Source</div>
        <div>queryZSwapAndContractState</div>
        <div>Debug dump, then resolveContractCoinMtIndex</div>
      </div>

      <div className="split-copy">
        <div>
          <h2>Why builders hit it</h2>
          <p>
            Deposit tutorials stop at <code>receiveShielded</code>. The spend path needs{" "}
            <code>QualifiedShieldedCoinInfo.mtIndex</code>. Passing <code>firstFree</code> looks
            correct in the docs and is wrong for coins the contract owns.
          </p>
          <h2>What works until a first-class API exists</h2>
          <ol className="plain-list">
            <li>Deserialize zswap chain state from the indexer.</li>
            <li>
              Call debug <code>toString(true)</code>.
            </li>
            <li>Find the commitment row owned by the contract.</li>
            <li>
              Qualify it with <Link to="/integrate">resolveContractCoinMtIndex</Link>.
            </li>
          </ol>
        </div>
        <aside className="evidence">
          <h2>Evidence</h2>
          <a href="https://github.com/midnightntwrk/servicedesk/issues/187" target="_blank" rel="noreferrer">
            midnightntwrk/servicedesk#187
            <span>Open as of Sep 2026. Contract-owned coins, firstFree = 0.</span>
          </a>
          <a href={FORUM} target="_blank" rel="noreferrer">
            Midnight forum thread
            <span>No documented lookup for the real mtIndex after confirmation.</span>
          </a>
          <p>
            Content bounty #288 showed deposit patterns. It did not recover the index after the
            coin was already in the tree.
          </p>
          <Link className="btn btn-accent" to="/desk">
            Reproduce it on the desk
            <ArrowRight size={16} weight="bold" />
          </Link>
        </aside>
      </div>
    </section>
  );
}
