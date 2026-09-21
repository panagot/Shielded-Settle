import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@kit": fileURLToPath(new URL("./src/kit", import.meta.url)),
    },
  },
  server: {
    port: 5177,
    strictPort: true,
  },
});
