import {
  catchError,
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  take,
  throwError,
  timeout,
} from "rxjs";
import { pipe as fnPipe } from "fp-ts/function";
import semver from "semver";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  type TransactionId,
} from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { fromHex, toHex } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import type { UnboundTransaction, MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import { inMemoryPrivateStateProvider } from "./inMemoryPrivateState";
import { networkConfig, type MidnightNetworkId } from "./config";

const COMPATIBLE_CONNECTOR_API_VERSION = "4.x";

export type EscrowCircuitKeys = "deposit" | "release" | "refund";
export type EscrowPrivateState = Record<string, never>;
export const escrowPrivateStateKey = "escrowPrivateState";

export type EscrowProviders = MidnightProviders<
  EscrowCircuitKeys,
  typeof escrowPrivateStateKey,
  EscrowPrivateState
>;

/** Lace ConnectedAPI — typed loosely; connector package shape varies by wallet build. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LaceConnectedAPI = any;

export type LaceSession = {
  connectedAPI: LaceConnectedAPI;
  providers: EscrowProviders;
  networkId: MidnightNetworkId;
  shieldedCoinPublicKey: string;
  shieldedEncryptionPublicKey: string;
  proofServerUri: string;
};

function getFirstCompatibleWallet(): LaceConnectedAPI | undefined {
  const midnight = (window as unknown as { midnight?: Record<string, LaceConnectedAPI> }).midnight;
  if (!midnight) return undefined;
  return Object.values(midnight).find(
    (wallet) =>
      !!wallet &&
      typeof wallet === "object" &&
      "apiVersion" in wallet &&
      semver.satisfies(String((wallet as { apiVersion: string }).apiVersion), COMPATIBLE_CONNECTOR_API_VERSION),
  );
}

export function connectLace(networkId: MidnightNetworkId): Promise<LaceConnectedAPI> {
  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => getFirstCompatibleWallet()),
      filter((api): api is LaceConnectedAPI => !!api),
      take(1),
      timeout({
        first: 2_000,
        with: () =>
          throwError(
            () =>
              new Error(
                "Midnight Lace wallet not found. Install Lace, set Network to Preprod, Proof server to Local (http://localhost:6300).",
              ),
          ),
      }),
      concatMap(async (initialAPI: LaceConnectedAPI) => {
        const connected = await initialAPI.connect(networkId);
        const status = await connected.getConnectionStatus();
        if (status.status !== "connected") {
          throw new Error(`Lace connection status: ${status.status}`);
        }
        return connected;
      }),
      timeout({
        first: 60_000,
        with: () =>
          throwError(() => new Error("Lace did not respond to connect(). Approve the request in the wallet.")),
      }),
      catchError((error: unknown) =>
        throwError(() => (error instanceof Error ? error : new Error(String(error)))),
      ),
    ),
  );
}

/**
 * Build Midnight.js providers for browser + Lace on Preprod/Preview.
 * ZK keys/ZKIR are fetched from the same origin under /managed/escrow/.
 */
export async function createLaceProviders(
  networkId: MidnightNetworkId = "preprod",
): Promise<LaceSession> {
  const connectedAPI = await connectLace(networkId);
  const cfg = await connectedAPI.getConfiguration();
  const net = networkConfig(networkId);
  const proofServerUri = (cfg.proverServerUri as string | undefined) || net.proofServer;
  const zkConfigPath = `${window.location.origin}/managed/escrow`;
  const keyMaterialProvider = new FetchZkConfigProvider<EscrowCircuitKeys>(
    zkConfigPath,
    fetch.bind(window),
  );
  const privateStateProvider = inMemoryPrivateStateProvider<
    typeof escrowPrivateStateKey,
    EscrowPrivateState
  >();
  const shielded = await connectedAPI.getShieldedAddresses();

  const providers: EscrowProviders = {
    privateStateProvider,
    zkConfigProvider: keyMaterialProvider,
    proofProvider: httpClientProofProvider(proofServerUri, keyMaterialProvider),
    publicDataProvider: indexerPublicDataProvider(
      (cfg.indexerUri as string | undefined) || net.indexer,
      (cfg.indexerWsUri as string | undefined) || net.indexerWS,
    ),
    walletProvider: {
      getCoinPublicKey(): string {
        return shielded.shieldedCoinPublicKey as string;
      },
      getEncryptionPublicKey(): string {
        return shielded.shieldedEncryptionPublicKey as string;
      },
      balanceTx: async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
        void ttl;
        const serializedTx = toHex(tx.serialize());
        const received = await connectedAPI.balanceUnsealedTransaction(serializedTx);
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          "signature",
          "proof",
          "binding",
          fromHex(received.tx),
        );
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connectedAPI.submitTransaction(toHex(tx.serialize()));
        const ids = tx.identifiers();
        return ids[0];
      },
    },
  };

  return {
    connectedAPI,
    providers,
    networkId,
    shieldedCoinPublicKey: shielded.shieldedCoinPublicKey as string,
    shieldedEncryptionPublicKey: shielded.shieldedEncryptionPublicKey as string,
    proofServerUri,
  };
}

export function isLaceAvailable(): boolean {
  return !!getFirstCompatibleWallet();
}
