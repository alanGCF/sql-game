import { expect, type Page, test } from "@playwright/test";
import type {} from "../../src/test-hooks.js";

async function abrir(page: Page, estilo = "a") {
  await page.goto(`/?test=1&estilo=${estilo}`);
  await page.waitForFunction(() => window.__planta7?.ready === true);
  await page.evaluate(() => window.__planta7?.mirar?.(0, 0));
}

test("clic en la computadora acerca la vista y muestra la terminal alineada", async ({ page }) => {
  await abrir(page);
  const vp = page.viewportSize();
  if (!vp) throw new Error("sin viewport");
  await page.mouse.click(vp.width / 2, vp.height * 0.42);
  const terminal = page.getByTestId("terminal");
  await expect(terminal).toBeVisible();
  const caja = await terminal.boundingBox();
  expect(caja?.width ?? 0).toBeGreaterThan(vp.width * 0.5);
  await expect(page.getByLabel("Comando")).toBeFocused();
  await expect(page.getByRole("button", { name: /Levantar la vista/ })).toBeVisible();
});

test("la terminal usa el motor real, bloquea lo fuera de alcance y no deja pegar", async ({ page }) => {
  await abrir(page);
  await page.evaluate(() => window.__planta7?.setVista?.("monitor"));
  const terminal = page.getByTestId("terminal");
  const input = page.getByLabel("Comando");
  await expect(input).toBeFocused();

  await input.pressSequentially("pwd");
  await input.press("Enter");
  await expect(input).toHaveValue("");
  await expect(terminal).toContainText("/home/becario");

  await input.pressSequentially("ls");
  await input.press("Enter");
  await expect(terminal.locator(".ansi-fg34", { hasText: "tickets" })).toBeVisible();

  await input.pressSequentially("cat leeme.txt");
  await input.press("Enter");
  await expect(terminal).toContainText("cat: leeme.txt: No such file or directory");
  await expect(terminal.locator(".glosa").last()).toContainText("¿será LEEME.txt?");

  await input.press("ArrowUp");
  await expect(input).toHaveValue("cat leeme.txt");
  await input.fill("");

  await input.pressSequentially("awk '{print $1}' datos.txt");
  await input.press("Enter");
  await expect(page.getByTestId("pensamiento")).toContainText("mejor no le doy Enter");
  await expect(input).toHaveValue("awk '{print $1}' datos.txt");

  await input.fill("");
  await input.dispatchEvent("paste");
  await expect(page.getByTestId("pensamiento")).toContainText("Mejor lo escribo yo");
  await expect(input).toHaveValue("");
});

test("Esc regresa a la vista general", async ({ page }) => {
  await abrir(page);
  await page.evaluate(() => window.__planta7?.setVista?.("monitor"));
  await expect(page.getByTestId("terminal")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("terminal")).toBeHidden();
});

for (const estilo of ["a", "b", "c"]) {
  test(`estilo ${estilo}: carga sin errores y respeta el presupuesto de draw calls`, async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));
    await abrir(page, estilo);
    await page.waitForTimeout(300);
    const info = await page.evaluate(() => window.__planta7?.info?.());
    expect(info?.calls ?? 999).toBeLessThanOrEqual(150);
    expect(errores).toEqual([]);
  });
}
