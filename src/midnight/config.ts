/**
 * Midnight Preprod / Preview network endpoints.
 * Proof server stays local (Docker) — it sees witness data in the clear.
 */
export type MidnightNetworkId = "preprod" | "preview";

export type MidnightNetworkConfig = {
  networkId: MidnightNetworkId;
  indexer: string;
  indexerWS: string;
  node: string;
  nodeWS: string;
  faucet: string;
  /** Default local proof server; Lace may override via getConfiguration(). */
  proofServer: string;
};

export const PREPROD: MidnightNetworkConfig = {
  networkId: "preprod",
  indexer: "https://indexer.preprod.midnight.network/api/v4/graphql",
  indexerWS: "wss://indexer.preprod.midnight.network/api/v4/graphql/ws",
  node: "https://rpc.preprod.midnight.network",
  nodeWS: "wss://rpc.preprod.midnight.network",
  faucet: "https://midnight-tmnight-preprod.nethermind.dev/",
  proofServer: "http://127.0.0.1:6300",
};

export const PREVIEW: MidnightNetworkConfig = {
  networkId: "preview",
  indexer: "https://indexer.preview.midnight.network/api/v4/graphql",
  indexerWS: "wss://indexer.preview.midnight.network/api/v4/graphql/ws",
  node: "https://rpc.preview.midnight.network",
  nodeWS: "wss://rpc.preview.midnight.network",
  faucet: "https://midnight-tmnight-preview.nethermind.dev/",
  proofServer: "http://127.0.0.1:6300",
};

export function networkConfig(id: MidnightNetworkId = "preprod"): MidnightNetworkConfig {
  return id === "preview" ? PREVIEW : PREPROD;
}
