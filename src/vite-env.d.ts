/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NETWORK_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "@midnight-ntwrk/dapp-connector-api";
