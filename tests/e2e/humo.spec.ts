import { expect, test } from "@playwright/test";
import type {} from "../../src/test-hooks.js";

test("la página carga con WebGL2, sin errores y con cabeceras seguras", async ({ page }) => {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errores.push(m.text());
  });

  const res = await page.goto("/?test=1");
  expect(res?.status()).toBe(200);
  const headers = res?.headers() ?? {};
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["x-frame-options"]).toBe("DENY");

  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForFunction(() => window.__planta7?.ready === true);
  expect(await page.evaluate(() => window.__planta7?.webgl)).toBe(true);
  expect(errores).toEqual([]);
});

test("las fuentes empaquetadas (D-25) cargan del mismo origen y se aplican", async ({ page }) => {
  const fuentesDeFuera: string[] = [];
  page.on("request", (r) => {
    if (r.resourceType() === "font" && !r.url().startsWith("http://127.0.0.1")) fuentesDeFuera.push(r.url());
  });
  await page.goto("/?test=1");
  await page.waitForFunction(() => window.__planta7?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(async () => {
    await document.fonts.load('400 16px "Atkinson Hyperlegible"');
    await document.fonts.load('400 16px "JetBrains Mono"');
    return {
      ui: document.fonts.check('400 16px "Atkinson Hyperlegible"'),
      mono: document.fonts.check('400 16px "JetBrains Mono"'),
      cuerpo: getComputedStyle(document.body).fontFamily,
    };
  });
  expect(r.ui).toBe(true);
  expect(r.mono).toBe(true);
  expect(r.cuerpo).toContain("Atkinson Hyperlegible");
  await page.evaluate(() => window.__planta7?.setVista?.("monitor"));
  const terminal = await page.getByTestId("terminal").evaluate((e) => getComputedStyle(e).fontFamily);
  expect(terminal).toContain("JetBrains Mono");
  expect(fuentesDeFuera).toEqual([]);
});
