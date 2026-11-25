import { defineConfig } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.015 } },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "off",
    deviceScaleFactor: 1,
    launchOptions: {
      // WebGL por software en headless (SwiftShader); determinista para capturas.
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
    },
  },
  projects: [
    { name: "desktop-1080", use: { browserName: "chromium", viewport: { width: 1920, height: 1080 } } },
    { name: "desktop-720", use: { browserName: "chromium", viewport: { width: 1280, height: 720 } } },
  ],
  webServer: {
    command: `npm run build && PARTIDAS_EN_MEMORIA=1 PORT=${PORT} node dist/node/server/src/index.js`,
    url: `http://127.0.0.1:${PORT}/healthz`,
    // Siempre un servidor nuevo: las partidas en memoria y los límites de tasa empiezan de cero.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
