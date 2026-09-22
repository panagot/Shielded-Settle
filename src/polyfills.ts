/**
 * Must load before any Midnight.js / ledger imports.
 * Several SDK packages assume Node's Buffer exists.
 */
import { Buffer } from "buffer";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

const g = globalThis as Record<string, unknown>;
g.Buffer = Buffer;
g.global ??= globalThis;
const proc = (g.process as { env?: Record<string, string | undefined> } | undefined) ?? { env: {} };
if (!proc.env) proc.env = {};
g.process = proc;

setNetworkId("preprod");
