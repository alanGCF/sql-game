import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    sourcemap: false,
    target: "es2022",
    // El presupuesto real lo vigila scripts/size.mjs (JS inicial gzip).
    chunkSizeWarningLimit: 1500,
  },
  server: {
    proxy: { "/api": "http://localhost:3000" },
  },
  test: {
    include: [
      "tests/engine/**/*.test.ts",
      "tests/server/**/*.test.ts",
      "tests/content/**/*.test.ts",
      "tests/game/**/*.test.ts",
    ],
    environment: "node",
  },
});
