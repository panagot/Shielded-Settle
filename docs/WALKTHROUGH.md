# Reviewer walkthrough

What Shielded Settle is, what to click, and what you should see.  
**Live site:** [https://shielded-settle.vercel.app/](https://shielded-settle.vercel.app/) · **Repo:** [panagot/Shielded-Settle](https://github.com/panagot/Shielded-Settle)

---

## What it is

A **developer kit + settlement desk** for Midnight Compact escrow.

When a contract holds a shielded coin, builders often read `firstFree` from the public zswap state and get `0`. Spending then fails with `invalid index into sparse merkle tree: 0` ([servicedesk#187](https://github.com/midnightntwrk/servicedesk/issues/187)).

This project:

1. **Reproduces** that failure on a sim desk (no wallet)
2. **Recovers** a non-zero `mtIndex` via `resolveContractCoinMtIndex`
3. **Settles** (release / refund) with a qualified coin
4. Optionally runs the same flow on **real Preprod** with Lace (`/live`)

---

## What it is not

- Not a mainnet product or a DEX
- The **sim desk is not live chain** — labels say so; Stats are **this browser tab only**
- tDUST cannot be swapped or sent; it is generated from tNIGHT in Lace

---

## Recommended review path (~8 minutes, no wallet)

| Step | Where | What to expect |
|---|---|---|
| 1 | `/` Home | Problem framing + links to Live and sim desk |
| 2 | `/demo` → **Run example release** | Step rail: deposit → probe (`firstFree` = **0**, coral) → kit qualify (mint `mtIndex`) → **Released** |
| 3 | `/desk` | Same flow manually: Deploy → Deposit → Probe → Resolve → Release |
| 4 | `/stats` | Counts for probes / kit resolves / volume in **this tab** |
| 5 | `/gap` | Why `firstFree` lies; link to #187 |
| 6 | `/integrate` | Copy-paste `resolveContractCoinMtIndex` + acceptance checks |
| 7 | `/docs` | FAQ index into `docs/` markdown |

**Pass criteria for sim review**

- Probe shows `firstFree === 0`
- Resolve / kit returns a **non-zero** qualified index
- Release (or refund) succeeds once; a second spend of the same coin is refused

---

## Local run (judges)

```bash
git clone https://github.com/panagot/Shielded-Settle.git
cd Shielded-Settle
npm install
npm test          # 31 fund-safety tests
npm run build     # production bundle
npm run dev       # http://127.0.0.1:5177
```

Or skip clone and use the [Vercel demo](https://shielded-settle.vercel.app/).

---

## Live Preprod path (optional, needs Lace + Docker)

Use this only if you want a real on-chain settle. Sim path alone is enough to understand the kit.

### Prerequisites

| Need | Detail |
|---|---|
| Lace | Chrome/Edge extension, network **Preprod** |
| Proof server | Docker: `npm run proof-server` → `http://127.0.0.1:6300` |
| tNIGHT | Faucet to **unshielded** `mn_addr_preprod…` only |
| tDUST | Lace Midnight account card → **Generate tDUST** (not transferable) |

### Steps

1. `npm run proof-server` (and `npm run compact` once if ZK assets missing)
2. `npm run dev` → open `/live`
3. Checklist should show proof server reachable + ZK assets ready
4. **Connect Lace** → **Run full Preprod settle**
5. Approve each Lace prompt (deploy, deposit, release)

### What you should see on `/live`

| Signal | Meaning |
|---|---|
| Contract address | Deployed Compact escrow on Preprod |
| `firstFree` | Often `0` after deposit (the bug) |
| Kit `mtIndex` | Non-zero recovery from dump / snapshot |
| Log rows | deploy / deposit / resolve / release with tx ids when present |

### Common Live failures

| Message | Fix |
|---|---|
| Buffer is not defined | Hard-refresh after latest deploy |
| no elements in sequence | Empty wallet — faucet `mn_addr_preprod…`, wait for tNIGHT |
| could not balance dust | Generate tDUST in Lace from your tNIGHT |
| Proof server down | `npm run proof-server` (Docker running) |

---

## Page map

| Route | Role for reviewers |
|---|---|
| `/` | Landing + Preprod action list |
| `/desk` | Hands-on sim settle |
| `/demo` | One-click sim + recording script |
| `/live` | Real Preprod + Lace |
| `/stats` | Session KPIs (this tab) |
| `/integrate` | Kit snippet for builders |
| `/gap` | Problem statement / #187 |
| `/docs` | Short FAQ |
| `/deck.html` | Slide deck (print to PDF) |

---

## Architecture (one paragraph)

`contracts/escrow.compact` implements shielded `deposit` / `release` / `refund`. The TypeScript kit in `src/kit` qualifies `mtIndex` when `firstFree` is wrong. The UI sim engine uses the same kit. `/live` wires Lace + Midnight.js providers, local proof server, and kit probe after a real deposit.

---

## Docs index

| Doc | Content |
|---|---|
| [HOW_TO_USE.md](./HOW_TO_USE.md) | Install, sim, Lace, CLI |
| [GAP.md](./GAP.md) | Symptom, evidence, workaround |
| [INTEGRATION.md](./INTEGRATION.md) | Wire kit into your dApp |
| [WALKTHROUGH.md](./WALKTHROUGH.md) | This file |

---

## Honest submission notes

- Primary claim: **DevEx kit** for contract-owned shielded coin spendability
- Demo mode is an **honest simulation** of the ledger/index gap
- Live Preprod is **supported and documented**; success depends on faucet + Lace tDUST + local proof server
- Dump-parsing is a **temporary** bridge until Midnight ships a first-class contract-coin index API
