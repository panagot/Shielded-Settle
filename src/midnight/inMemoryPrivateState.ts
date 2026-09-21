import type { ContractAddress, SigningKey } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import type {
  ExportPrivateStatesOptions,
  ExportSigningKeysOptions,
  ImportPrivateStatesOptions,
  ImportPrivateStatesResult,
  ImportSigningKeysOptions,
  ImportSigningKeysResult,
  PrivateStateExport,
  PrivateStateId,
  PrivateStateProvider,
  SigningKeyExport,
} from "@midnight-ntwrk/midnight-js-types";

/** Browser in-memory private state (same pattern as official example-bboard). */
export function inMemoryPrivateStateProvider<PSI extends PrivateStateId, PS = unknown>(): PrivateStateProvider<
  PSI,
  PS
> {
  const privateStates = new Map<ContractAddress, Map<PSI, PS>>();
  const signingKeys = new Map<ContractAddress, SigningKey>();
  let contractAddress: ContractAddress | null = null;

  const requireAddress = (): ContractAddress => {
    if (contractAddress === null) {
      throw new Error("Contract address not set. Call setContractAddress() first.");
    }
    return contractAddress;
  };

  const scoped = (address: ContractAddress): Map<PSI, PS> => {
    let map = privateStates.get(address);
    if (!map) {
      map = new Map();
      privateStates.set(address, map);
    }
    return map;
  };

  const encode = <T>(value: T): string => JSON.stringify(value);
  const decode = <T>(value: string): T => JSON.parse(value) as T;

  return {
    setContractAddress(address: ContractAddress): void {
      contractAddress = address;
    },
    set(key: PSI, state: PS): Promise<void> {
      scoped(requireAddress()).set(key, state);
      return Promise.resolve();
    },
    get(key: PSI): Promise<PS | null> {
      return Promise.resolve(scoped(requireAddress()).get(key) ?? null);
    },
    remove(key: PSI): Promise<void> {
      scoped(requireAddress()).delete(key);
      return Promise.resolve();
    },
    clear(): Promise<void> {
      privateStates.delete(requireAddress());
      return Promise.resolve();
    },
    setSigningKey(address: ContractAddress, signingKey: SigningKey): Promise<void> {
      signingKeys.set(address, signingKey);
      return Promise.resolve();
    },
    getSigningKey(address: ContractAddress): Promise<SigningKey | null> {
      return Promise.resolve(signingKeys.get(address) ?? null);
    },
    removeSigningKey(address: ContractAddress): Promise<void> {
      signingKeys.delete(address);
      return Promise.resolve();
    },
    clearSigningKeys(): Promise<void> {
      signingKeys.clear();
      return Promise.resolve();
    },
    exportPrivateStates(_options?: ExportPrivateStatesOptions): Promise<PrivateStateExport> {
      const address = requireAddress();
      return Promise.resolve({
        format: "midnight-private-state-export",
        encryptedPayload: encode({
          contractAddress: address,
          states: Object.fromEntries(
            Array.from(scoped(address).entries()).map(([id, value]) => [id, encode(value)]),
          ),
        }),
        salt: "in-memory-private-state-provider",
      });
    },
    importPrivateStates(
      exportData: PrivateStateExport,
      options?: ImportPrivateStatesOptions,
    ): Promise<ImportPrivateStatesResult> {
      const address = requireAddress();
      const conflictStrategy = options?.conflictStrategy ?? "error";
      const payload = decode<{ states?: Record<string, string> }>(exportData.encryptedPayload);
      const states = payload.states ?? {};
      const map = scoped(address);
      let imported = 0;
      let skipped = 0;
      let overwritten = 0;
      for (const [rawId, serialized] of Object.entries(states)) {
        const stateId = rawId as PSI;
        const has = map.has(stateId);
        if (has) {
          if (conflictStrategy === "skip") {
            skipped += 1;
            continue;
          }
          if (conflictStrategy === "error") {
            return Promise.reject(new Error(`Private state conflict for '${stateId}'`));
          }
          overwritten += 1;
        } else {
          imported += 1;
        }
        map.set(stateId, decode<PS>(serialized));
      }
      return Promise.resolve({ imported, skipped, overwritten });
    },
    exportSigningKeys(_options?: ExportSigningKeysOptions): Promise<SigningKeyExport> {
      return Promise.resolve({
        format: "midnight-signing-key-export",
        encryptedPayload: encode({ keys: Object.fromEntries(signingKeys.entries()) }),
        salt: "in-memory-signing-key-provider",
      });
    },
    importSigningKeys(
      exportData: SigningKeyExport,
      options?: ImportSigningKeysOptions,
    ): Promise<ImportSigningKeysResult> {
      const conflictStrategy = options?.conflictStrategy ?? "error";
      const payload = decode<{ keys?: Record<ContractAddress, SigningKey> }>(exportData.encryptedPayload);
      const keys = payload.keys ?? {};
      let imported = 0;
      let skipped = 0;
      let overwritten = 0;
      for (const [address, signingKey] of Object.entries(keys)) {
        const has = signingKeys.has(address);
        if (has) {
          if (conflictStrategy === "skip") {
            skipped += 1;
            continue;
          }
          if (conflictStrategy === "error") {
            return Promise.reject(new Error(`Signing key conflict for '${address}'`));
          }
          overwritten += 1;
        } else {
          imported += 1;
        }
        signingKeys.set(address, signingKey);
      }
      return Promise.resolve({ imported, skipped, overwritten });
    },
  };
}
