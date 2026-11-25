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

test("Tab autocompleta y un segundo Tab lista las opciones", async ({ page }) => {
  await abrir(page);
  await page.evaluate(() => window.__planta7?.setVista?.("monitor"));
  const input = page.getByLabel("Comando");
  await input.pressSequentially("cat LE");
  await input.press("Tab");
  await expect(input).toHaveValue("cat LEEME.txt ");
  await expect(input).toBeFocused();
  await input.fill("cd /srv/lineas/linea");
  await input.press("Tab");
  await input.press("Tab");
  await expect(page.getByTestId("terminal")).toContainText("linea1/  linea2/  linea3/");
  await expect(input).toHaveValue("cd /srv/lineas/linea");
});

test("T1-M1 se cumple desde la terminal y la partida avanza a T1-M2", async ({ page }) => {
  await abrir(page);
  await page.evaluate(() => window.__planta7?.setVista?.("monitor"));
  const terminal = page.getByTestId("terminal");
  const input = page.getByLabel("Comando");
  const estado = () => page.evaluate(() => window.__planta7?.partida?.());

  expect((await estado())?.mision).toBe("t1-m01-donde-estoy");
  expect((await estado())?.eventos).toContain("dialogo");

  await input.fill("pwd");
  await input.press("Enter");
  await expect(terminal).toContainText("/home/becario");
  const carpeta = await page.evaluate(() =>
    window.__planta7?.responder?.("t1-m01-donde-estoy", "responder-carpeta", "/home/becario"),
  );
  expect(carpeta?.correcta).toBe(true);

  await input.fill("ls tickets | wc -l");
  await input.press("Enter");
  const ultima = terminal.locator(".terminal-linea").last();
  await expect(ultima).toHaveText(/^\d+$/);
  const n = (await ultima.textContent())?.trim() ?? "";
  const tickets = await page.evaluate(
    (valor) => window.__planta7?.responder?.("t1-m01-donde-estoy", "responder-tickets", valor),
    n,
  );
  expect(tickets?.correcta).toBe(true);

  const final = await estado();
  expect(final?.mision).toBe("t1-m02-el-leeme");
  expect(final?.eventos).toContain("mision_completada");
  expect(final?.pendientes.some((p) => p.includes("t1-m02-el-leeme/leer-leeme"))).toBe(true);
});

test("el pizarrón muestra los pendientes de la misión y tacha los cumplidos", async ({ page }) => {
  await abrir(page);
  const pizarron = () => page.evaluate(() => window.__planta7?.pizarron?.());
  expect((await pizarron())?.renglones).toEqual([
    "[ ] Ticket de Eduardo: ¿en qué carpeta estás? (ruta completa)",
    "[ ] Ticket de Eduardo: ¿cuántos tickets hay en tu carpeta de tickets?",
  ]);
  expect((await pizarron())?.favores).toEqual([]);
  await page.evaluate(() =>
    window.__planta7?.responder?.("t1-m01-donde-estoy", "responder-carpeta", "/home/becario"),
  );
  expect((await pizarron())?.renglones[0]).toBe(
    "[x] Ticket de Eduardo: ¿en qué carpeta estás? (ruta completa)",
  );
});

test("la app Tickets responde tecleando, comenta la respuesta equivocada y no deja pegar", async ({
  page,
}) => {
  await abrir(page);
  await page.evaluate(() => window.__planta7?.setVista?.("monitor"));
  await page.getByRole("tab", { name: /Tickets/ }).click();
  const tickets = page.getByTestId("tickets");
  await expect(tickets.getByRole("button", { name: /¿En qué carpeta estás\?/ })).toBeVisible();
  const respuesta = page.getByLabel("Respuesta");
  await expect(respuesta).toBeFocused();

  await respuesta.fill("~");
  await respuesta.press("Enter");
  await expect(tickets.getByRole("status")).toContainText("~ es el atajo de tu carpeta personal");

  await respuesta.fill("/home/becario");
  await respuesta.press("Enter");
  await expect(tickets.getByRole("status")).toContainText("Ticket resuelto");
  await expect(tickets.getByRole("button", { name: /¿En qué carpeta estás\?.*Resuelto/ })).toBeVisible();
  expect((await page.evaluate(() => window.__planta7?.pizarron?.()))?.renglones[0]).toMatch(/^\[x\]/);

  await respuesta.dispatchEvent("paste");
  await expect(page.getByTestId("pensamiento")).toContainText("Mejor lo escribo yo");
  await expect(respuesta).toHaveValue("");
});
