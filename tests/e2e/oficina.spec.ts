import { expect, type Page, test } from "@playwright/test";
import type {} from "../../src/test-hooks.js";

/** Oficina viva (F4-15): alguien cruza a lo lejos y la escena quieta no pide cuadros (ADR-018). */

async function abrir(page: Page, extra = "") {
  await page.goto(`/?test=1${extra}`);
  await page.waitForFunction(() => window.__planta7?.ready === true);
  await page.evaluate(() => window.__planta7?.mirar?.(0, 0));
}

const cuadros = (page: Page) => page.evaluate(() => window.__planta7?.cuadros?.() ?? -1);
const paseando = (page: Page) => page.evaluate(() => window.__planta7?.paseante?.() ?? null);

/**
 * Espera a que la escena termine de acomodarse (texturas, cámara, el último cuadro de un paseo) y regresa sus
 * cuadros en ese momento: 1.5 s sin dibujar (con WebGL por software un cuadro puede tardar más de medio segundo).
 */
async function quieta(page: Page): Promise<number> {
  let antes = await cuadros(page);
  let iguales = 0;
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(500);
    const ahora = await cuadros(page);
    iguales = ahora === antes ? iguales + 1 : 0;
    if (iguales === 3) return ahora;
    antes = ahora;
  }
  throw new Error("la escena nunca se quedó quieta");
}

test("oficina viva (F4-15): la escena quieta no pide cuadros, tampoco con animaciones", async ({ page }) => {
  for (const extra of ["", "&animar=1"]) {
    await abrir(page, extra);
    const f = await quieta(page);
    expect(f).toBeGreaterThan(0);
    await page.waitForTimeout(3000);
    expect(await cuadros(page)).toBe(f);
  }
});

test("oficina viva (F4-15): alguien cruza a lo lejos, pide cuadros solo mientras camina", async ({
  page,
}) => {
  await abrir(page, "&animar=1");
  const f0 = await quieta(page);
  await page.evaluate(() => window.__planta7?.paseo?.(0, 1));
  await expect.poll(() => paseando(page)).toBe(true);
  await page.waitForTimeout(1500);
  expect(await cuadros(page)).toBeGreaterThan(f0 + 5);
  // Tarda unos 8 s en cruzar y se va.
  await expect.poll(() => paseando(page), { timeout: 15_000 }).toBe(false);
  const f1 = await quieta(page);
  await page.waitForTimeout(2500);
  expect(await cuadros(page)).toBe(f1);
});
