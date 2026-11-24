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
