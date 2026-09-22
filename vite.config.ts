import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait({
      promiseExportName: "__tla",
      promiseImportName: (i) => `__tla_${i}`,
    }),
    {
      name: "wasm-module-resolver",
      resolveId(source, importer) {
        if (
          source === "@midnight-ntwrk/onchain-runtime-v3" &&
          importer &&
          importer.includes("@midnight-ntwrk/compact-runtime")
        ) {
          return { id: source, external: false, moduleSideEffects: true };
        }
        return null;
      },
    },
  ],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@kit": fileURLToPath(new URL("./src/kit", import.meta.url)),
      "@midnight": fileURLToPath(new URL("./src/midnight", import.meta.url)),
      buffer: "buffer/",
    },
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".wasm"],
    mainFields: ["browser", "module", "main"],
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
      supported: { "top-level-await": true },
      platform: "browser",
      format: "esm",
      loader: { ".wasm": "binary" },
      define: {
        global: "globalThis",
      },
    },
    include: ["buffer", "@midnight-ntwrk/compact-runtime"],
    exclude: [
      "@midnight-ntwrk/onchain-runtime-v3",
      "@midnight-ntwrk/midnight-js-protocol",
      "@midnight-ntwrk/onchain-runtime-v3/midnight_onchain_runtime_wasm_bg.wasm",
      "@midnight-ntwrk/onchain-runtime-v3/midnight_onchain_runtime_wasm.js",
    ],
  },
  build: {
    target: "esnext",
    minify: false,
    commonjsOptions: {
      transformMixedEsModules: true,
      extensions: [".js", ".cjs"],
      ignoreDynamicRequires: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          wasm: ["@midnight-ntwrk/onchain-runtime-v3"],
        },
      },
    },
  },
  server: {
    port: 5177,
    strictPort: true,
    host: "127.0.0.1",
  },
  publicDir: "public",
});
