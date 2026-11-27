import { expect, type Page, test } from "@playwright/test";
import type {} from "../../src/test-hooks.js";

/**
 * Capturas de referencia (07-calidad-harness.md §5, F3-09). El texto DOM y el de las texturas usa fuentes
 * del sistema, así que las referencias solo valen en el contenedor oficial de Playwright de CI, donde se
 * generan (commit con "[capturas]") y se comparan (CAPTURAS=1). Fuera de él estas pruebas se saltan.
 */
test.skip(!process.env.CAPTURAS, "capturas de referencia: solo en el contenedor de CI (CAPTURAS=1)");
// biome-ignore lint/correctness/noEmptyPattern: Playwright exige desestructurar los fixtures.
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "desktop-720", "las referencias son a 1280×720");
});

test.describe.configure({ timeout: 180_000 });

/** La primera captura tras un cambio grande puede tardar varios segundos con WebGL por software. */
async function captura(page: Page, nombre: string) {
  await expect(page).toHaveScreenshot(nombre, { timeout: 30_000 });
}

async function abrir(page: Page, extra = "") {
  await page.goto(`/?test=1${extra}`);
  await page.waitForFunction(() => window.__planta7?.ready === true);
}

async function mirar(page: Page, x: number, y: number) {
  await page.evaluate(
    ([x, y]) => {
      window.__planta7?.setVista?.("general");
      window.__planta7?.mirar?.(x, y);
    },
    [x, y] as const,
  );
}

async function cerrarDialogos(page: Page) {
  const dialogo = page.getByTestId("dialogo");
  while (await dialogo.isVisible()) await page.keyboard.press("Enter");
}

test("menú: el gafete sobre la escena", async ({ page }) => {
  await abrir(page, "&menu=1");
  await expect(page.getByTestId("menu")).toBeVisible();
  await captura(page, "menu.png");
});

test("cubículo: al frente con el briefing, y sin diálogos de tarde y de noche", async ({ page }) => {
  await abrir(page);
  await mirar(page, 0, 0);
  await expect(page.getByTestId("dialogo")).toBeVisible();
  await captura(page, "frente-briefing.png");
  await cerrarDialogos(page);
  await captura(page, "frente-tarde.png");
  await page.evaluate(() => window.__planta7?.hora?.("18:25"));
  await captura(page, "frente-atardecer.png");
  await page.evaluate(() => window.__planta7?.hora?.("23:00"));
  await captura(page, "frente-noche.png");
});

test("cubículo: mirando a la izquierda, a la derecha y al escritorio", async ({ page }) => {
  await abrir(page);
  await cerrarDialogos(page);
  for (const [nombre, x, y] of [
    ["izquierda", -1, 0],
    ["derecha", 1, 0],
    ["escritorio", 0, -1],
  ] as const) {
    await mirar(page, x, y);
    await captura(page, `mirar-${nombre}.png`);
  }
});

test("vistas acercadas: teléfono, libreta, pizarrón y calendario", async ({ page }) => {
  await abrir(page);
  await cerrarDialogos(page);
  for (const vista of ["telefono", "libreta", "pizarron", "calendario"]) {
    await page.evaluate((v) => window.__planta7?.setVista?.(v), vista);
    await captura(page, `vista-${vista}.png`);
  }
});

test("teléfono (D-28 A): aparato y directorio, marcando y en llamada con Eduardo", async ({ page }) => {
  await abrir(page);
  await cerrarDialogos(page);
  await page.evaluate(() => window.__planta7?.setVista?.("telefono"));
  await expect(page.getByTestId("telefono")).toBeVisible();
  await page.keyboard.type("214");
  await captura(page, "telefono-marcando.png");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("dialogo")).toContainText("¿Qué ocupas?");
  await captura(page, "telefono-llamada.png");
});

test("libreta (D-29 B): Historia y Comandos con lo de T1-M1", async ({ page }) => {
  await abrir(page);
  await cerrarDialogos(page);
  await page.evaluate(() => window.__planta7?.setVista?.("monitor"));
  const input = page.getByLabel("Comando");
  await input.fill("ls tickets | wc -l");
  await input.press("Enter");
  const ultima = page.getByTestId("terminal").locator(".terminal-linea").last();
  await expect(ultima).toHaveText(/^\d+$/);
  const n = (await ultima.textContent())?.trim() ?? "";
  await page.evaluate(
    (v) =>
      Promise.all([
        window.__planta7?.responder?.("t1-m01-donde-estoy", "responder-carpeta", "/home/becario"),
        window.__planta7?.responder?.("t1-m01-donde-estoy", "responder-tickets", v),
      ]),
    n,
  );
  await cerrarDialogos(page);
  await page.evaluate(() => window.__planta7?.setVista?.("libreta"));
  const libreta = page.getByTestId("libreta");
  await expect(libreta).toContainText("Mi carpeta en el servidor");
  await captura(page, "libreta-historia.png");
  await libreta.getByRole("tab", { name: "Comandos" }).click();
  await expect(libreta).toContainText("Para qué sirve");
  await captura(page, "libreta-comandos.png");
});

test("pizarrón (F4-07): antes y después de cumplir un pendiente", async ({ page }) => {
  await abrir(page);
  await cerrarDialogos(page);
  await page.evaluate(() => window.__planta7?.setVista?.("pizarron"));
  await captura(page, "pizarron-antes.png");
  await page.evaluate(() =>
    window.__planta7?.responder?.("t1-m01-donde-estoy", "responder-carpeta", "/home/becario"),
  );
  await expect
    .poll(async () => (await page.evaluate(() => window.__planta7?.pizarron?.()))?.renglones[0])
    .toMatch(/^\[x\]/);
  await captura(page, "pizarron-despues.png");
});

test("calendario (F4-08): días trabajados y resumen del día en curso", async ({ page }) => {
  await abrir(page);
  await cerrarDialogos(page);
  await page.evaluate(() =>
    window.__planta7?.responder?.("t1-m01-donde-estoy", "responder-carpeta", "/home/becario"),
  );
  await page.evaluate(() => window.__planta7?.setVista?.("calendario"));
  await page.getByRole("navigation", { name: "Días trabajados" }).getByRole("button").click();
  await expect(page.getByTestId("resumen-dia")).toContainText("en curso");
  await captura(page, "calendario-resumen.png");
});

test("monitor: terminal con salida y app Tickets", async ({ page }) => {
  await abrir(page);
  await cerrarDialogos(page);
  await page.evaluate(() => window.__planta7?.setVista?.("monitor"));
  const input = page.getByLabel("Comando");
  for (const cmd of ["pwd", "ls -l", "cat LEEME.txt"]) {
    await input.fill(cmd);
    await input.press("Enter");
  }
  await expect(page.getByTestId("terminal")).toContainText("Para quien me reemplace");
  await captura(page, "monitor-terminal.png");
  await page.getByRole("tab", { name: /Tickets/ }).click();
  await captura(page, "monitor-tickets.png");
});

test("llamada entrante y en tarjeta al cerrar T1-M1", async ({ page }) => {
  await abrir(page);
  await cerrarDialogos(page);
  await page.evaluate(() =>
    window.__planta7?.responder?.("t1-m01-donde-estoy", "responder-carpeta", "/home/becario"),
  );
  await page.evaluate(() => window.__planta7?.setVista?.("monitor"));
  const input = page.getByLabel("Comando");
  await input.fill("ls tickets | wc -l");
  await input.press("Enter");
  const ultima = page.getByTestId("terminal").locator(".terminal-linea").last();
  await expect(ultima).toHaveText(/^\d+$/);
  const n = (await ultima.textContent())?.trim() ?? "";
  await page.evaluate((v) => window.__planta7?.responder?.("t1-m01-donde-estoy", "responder-tickets", v), n);
  const dialogo = page.getByTestId("dialogo");
  // F4-04: primero suena; Enter contesta.
  await expect(dialogo).toHaveClass(/llamada-sonando/);
  await captura(page, "llamada-entrante.png");
  await page.keyboard.press("Enter");
  await expect(dialogo).not.toHaveClass(/llamada-sonando/);
  await captura(page, "llamada.png");
});
