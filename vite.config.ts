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
    // Fuentes siempre como archivo: un data: URI lo bloquea la CSP (font-src 'self').
    assetsInlineLimit: (archivo: string) => (/\.woff2?$/.test(archivo) ? false : undefined),
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
