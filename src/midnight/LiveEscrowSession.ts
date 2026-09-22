import { deployContract, findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import type { ContractAddress } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import { resolveContractCoinMtIndex } from "@kit/resolveMtIndex";
import type { QualifiedShieldedCoinInfo, ShieldedCoinInfo } from "@kit/types";
import type { EscrowProviders, EscrowPrivateState } from "./laceProviders";
import { escrowPrivateStateKey } from "./laceProviders";

export type LiveStepLog = {
  at: number;
  kind: string;
  detail: string;
  tone: "neutral" | "danger" | "ok";
  txId?: string;
};

type CallTxBundle = {
  deposit: (c: unknown) => Promise<{ public: Record<string, unknown> }>;
  release: (c: unknown, caller: Uint8Array) => Promise<{ public: Record<string, unknown> }>;
  refund: (c: unknown, caller: Uint8Array) => Promise<{ public: Record<string, unknown> }>;
};

export class LiveEscrowSession {
  contractAddress: ContractAddress | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deployed: any = null;
  lastCoin: ShieldedCoinInfo | null = null;
  lastQualified: QualifiedShieldedCoinInfo | null = null;
  firstFree: bigint | null = null;
  logs: LiveStepLog[] = [];

  constructor(readonly providers: EscrowProviders) {}

  private log(kind: string, detail: string, tone: LiveStepLog["tone"] = "neutral", txId?: string) {
    this.logs = [...this.logs, { at: Date.now(), kind, detail, tone, txId }];
  }

  private callTx(): CallTxBundle {
    if (!this.deployed?.callTx) throw new Error("No deployed contract.");
    return this.deployed.callTx as CallTxBundle;
  }

  private async loadCompiled() {
    try {
      const managedMod = await import("../../contracts/managed/escrow/contract/index.js");
      const managed = managedMod as unknown as { Contract: new (...args: unknown[]) => unknown };
      const { CompiledContract } = await import("@midnight-ntwrk/midnight-js-protocol/compact-js");
      return CompiledContract.make("ShieldedSettleEscrow", managed.Contract as never).pipe(
        CompiledContract.withWitnesses({} as never),
        CompiledContract.withCompiledFileAssets("/managed/escrow"),
      );
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new Error(
        [
          "Compact managed artifacts not found.",
          "Run: Docker Desktop → npm run compact:fetch && npm run compact",
          "Then: npm run proof-server",
          detail,
        ].join("\n"),
      );
    }
  }

  async deploy(depositor: Uint8Array, beneficiary: Uint8Array): Promise<string> {
    const compiled = await this.loadCompiled();
    const deployed = await deployContract(this.providers, {
      compiledContract: compiled,
      privateStateId: escrowPrivateStateKey,
      initialPrivateState: {} as EscrowPrivateState,
      args: [depositor, beneficiary],
    } as never);
    this.deployed = deployed;
    this.contractAddress = deployed.deployTxData.public.contractAddress;
    this.providers.privateStateProvider.setContractAddress(this.contractAddress);
    const txId = String(deployed.deployTxData.public.txId ?? deployed.deployTxData.public.txHash ?? "");
    this.log("deploy", `Contract ${this.contractAddress}`, "ok", txId);
    return this.contractAddress;
  }

  async join(contractAddress: string): Promise<void> {
    const compiled = await this.loadCompiled();
    const found = await findDeployedContract(this.providers, {
      contractAddress,
      compiledContract: compiled,
      privateStateId: escrowPrivateStateKey,
      initialPrivateState: {} as EscrowPrivateState,
    } as never);
    this.deployed = found;
    this.contractAddress = contractAddress;
    this.providers.privateStateProvider.setContractAddress(contractAddress);
    this.log("join", `Joined ${contractAddress}`, "ok");
  }

  async deposit(coin: ShieldedCoinInfo, runtimeCoin?: { nonce: Uint8Array; color: Uint8Array; value: bigint }): Promise<string> {
    const payload = runtimeCoin ?? {
      nonce: hexToBytes(coin.nonce),
      color: hexToBytes(coin.color),
      value: coin.value,
    };
    const tx = await this.callTx().deposit(payload);
    this.lastCoin = coin;
    const txId = String(tx.public.txId ?? tx.public.txHash ?? "");
    this.log("deposit", `receiveShielded value=${coin.value}`, "ok", txId);
    return txId;
  }

  async probe(): Promise<{ firstFree: bigint; mtIndex: bigint | null; ok: boolean; warning?: string }> {
    if (!this.contractAddress || !this.lastCoin) {
      throw new Error("Need a deployed contract and a deposit before probe.");
    }
    const state = await this.providers.publicDataProvider.queryZSwapAndContractState(this.contractAddress);
    if (!state) throw new Error("Indexer: no zswap/contract state.");
    const firstFree = (state as { firstFree?: bigint }).firstFree ?? 0n;
    this.firstFree = firstFree;
    let debugDump: string | undefined;
    try {
      debugDump =
        (state as { zswapChainState?: { toString?: (d?: boolean) => string } }).zswapChainState?.toString?.(true) ??
        undefined;
    } catch {
      debugDump = undefined;
    }
    const kit = resolveContractCoinMtIndex({
      snapshot: { firstFree, debugDump },
      lookup: { contractAddress: this.contractAddress, coin: this.lastCoin },
    });
    if (kit.ok && kit.qualified) {
      this.lastQualified = kit.qualified;
      this.log(
        "resolve",
        `firstFree=${firstFree} → kit mtIndex=${kit.mtIndex}`,
        firstFree === 0n ? "ok" : "neutral",
      );
      return { firstFree, mtIndex: kit.mtIndex, ok: true };
    }
    this.log("probe", `firstFree=${firstFree} · ${kit.warning ?? kit.detail ?? "kit failed"}`, "danger");
    return { firstFree, mtIndex: null, ok: false, warning: kit.warning ?? kit.detail };
  }

  async release(caller: Uint8Array): Promise<string> {
    if (!this.lastQualified || this.lastQualified.mtIndex === 0n) {
      throw new Error("Resolve a non-zero mtIndex before release.");
    }
    const q = this.lastQualified;
    const tx = await this.callTx().release(
      {
        nonce: hexToBytes(q.nonce),
        color: hexToBytes(q.color),
        value: q.value,
        mt_index: q.mtIndex,
      },
      caller,
    );
    const txId = String(tx.public.txId ?? tx.public.txHash ?? "");
    this.log("release", "sendShielded → beneficiary", "ok", txId);
    return txId;
  }

  async refund(caller: Uint8Array): Promise<string> {
    if (!this.lastQualified || this.lastQualified.mtIndex === 0n) {
      throw new Error("Resolve a non-zero mtIndex before refund.");
    }
    const q = this.lastQualified;
    const tx = await this.callTx().refund(
      {
        nonce: hexToBytes(q.nonce),
        color: hexToBytes(q.color),
        value: q.value,
        mt_index: q.mtIndex,
      },
      caller,
    );
    const txId = String(tx.public.txId ?? tx.public.txHash ?? "");
    this.log("refund", "sendShielded → depositor", "ok", txId);
    return txId;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/^0x/, "");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function hexKeyToBytes32(hex: string): Uint8Array {
  const h = hex.replace(/^0x/, "");
  if (!/^[0-9a-fA-F]{64}$/.test(h)) {
    throw new Error("Expected 32-byte hex coin public key (64 hex chars).");
  }
  return hexToBytes(h);
}
