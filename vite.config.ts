import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), wasm()],
  resolve: {
    alias: {
      "@kit": fileURLToPath(new URL("./src/kit", import.meta.url)),
      "@midnight": fileURLToPath(new URL("./src/midnight", import.meta.url)),
    },
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".wasm"],
    mainFields: ["browser", "module", "main"],
  },
  optimizeDeps: {
    exclude: ["@midnight-ntwrk/onchain-runtime-v3", "@midnight-ntwrk/midnight-js-protocol"],
  },
  build: {
    target: "esnext",
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 5177,
    strictPort: true,
  },
  publicDir: "public",
});
