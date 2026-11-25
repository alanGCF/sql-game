import { expect, type Page, test } from "@playwright/test";
import type {} from "../../src/test-hooks.js";

async function abrir(page: Page) {
  await page.goto("/?test=1");
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

test("la escena carga sin errores y respeta el presupuesto de draw calls, de tarde y de noche", async ({
  page,
}) => {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await abrir(page);
  for (const hora of ["15:30", "18:20", "23:00"]) {
    await page.evaluate((h) => window.__planta7?.hora?.(h), hora);
    await page.waitForTimeout(300);
    const info = await page.evaluate(() => window.__planta7?.info?.());
    expect(info?.calls ?? 999).toBeLessThanOrEqual(150);
  }
  expect(errores).toEqual([]);
});

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

test("diálogos: el briefing va en subtítulo con el departamento y la llamada en tarjeta", async ({
  page,
}) => {
  await abrir(page);
  const dialogo = page.getByTestId("dialogo");
  await expect(dialogo).toHaveClass(/subtitulo/);
  await expect(dialogo).toContainText("Eduardo Téllez · Sistemas");
  await expect(dialogo).not.toContainText(/visita/i);
  await page.keyboard.press("Enter");
  await expect(dialogo).toContainText("La terminal siempre está parada");
  await page.keyboard.press("Enter");
  await expect(dialogo).toBeHidden();

  await page.evaluate(() => window.__planta7?.setVista?.("monitor"));
  const input = page.getByLabel("Comando");
  await input.fill("ls tickets | wc -l");
  await input.press("Enter");
  const ultima = page.getByTestId("terminal").locator(".terminal-linea").last();
  await expect(ultima).toHaveText(/^\d+$/);
  const n = (await ultima.textContent())?.trim() ?? "";
  await page.evaluate(
    (valor) =>
      Promise.all([
        window.__planta7?.responder?.("t1-m01-donde-estoy", "responder-carpeta", "/home/becario"),
        window.__planta7?.responder?.("t1-m01-donde-estoy", "responder-tickets", valor),
      ]),
    n,
  );
  await expect(dialogo).toHaveClass(/llamada/);
  await expect(dialogo).toContainText("Eduardo Téllez");
  await expect(dialogo).toContainText("Llamada · ext. 214");
  await dialogo.getByRole("button", { name: /Siguiente/ }).click();
  await expect(dialogo).toHaveClass(/subtitulo/);
  await expect(dialogo).toContainText("Ing. Karla Ibáñez · Calidad");
});

test("con un diálogo en pantalla, Enter con la terminal vacía lo cierra sin ejecutar nada", async ({
  page,
}) => {
  await abrir(page);
  await page.evaluate(() => window.__planta7?.setVista?.("monitor"));
  const input = page.getByLabel("Comando");
  await expect(input).toBeFocused();
  const dialogo = page.getByTestId("dialogo");
  await expect(dialogo).toBeVisible();
  await input.press("Enter");
  await input.press("Enter");
  await expect(dialogo).toBeHidden();
  await expect(page.getByTestId("terminal").locator(".terminal-linea")).toHaveCount(0);
});

test("T1 completo se juega en el navegador: terminal + Tickets hasta terminar el turno", async ({ page }) => {
  test.setTimeout(180_000);
  await abrir(page);
  await page.evaluate(() => window.__planta7?.setVista?.("monitor"));
  const terminal = page.getByTestId("terminal");
  const tickets = page.getByTestId("tickets");
  const mision = async () => (await page.evaluate(() => window.__planta7?.partida?.()))?.mision;

  const comando = async (linea: string, salida?: RegExp) => {
    await page.getByRole("tab", { name: /Terminal/ }).click();
    const input = page.getByLabel("Comando");
    await input.fill(linea);
    await input.press("Enter");
    const ultima = terminal.locator(".terminal-linea").last();
    if (salida) await expect(ultima).toHaveText(salida);
    return (await ultima.textContent())?.trim() ?? "";
  };
  const ticket = async (pregunta: RegExp, valor: string) => {
    await page.getByRole("tab", { name: /Tickets/ }).click();
    await tickets.getByRole("button", { name: pregunta }).click();
    const r = page.getByLabel("Respuesta");
    await r.fill(valor);
    await r.press("Enter");
    await expect(tickets.getByRole("status")).toContainText("Ticket resuelto");
  };

  // T1-M1
  await comando("pwd", /^\/home\/becario$/);
  await ticket(/¿En qué carpeta estás\?/, "/home/becario");
  const n = await comando("ls tickets | wc -l", /^\d+$/);
  await ticket(/¿Cuántos tickets hay/, n);
  expect(await mision()).toBe("t1-m02-el-leeme");

  // T1-M2
  const linea = await comando("grep -r Karla tickets", /T-\d+\.txt:Solicita/);
  const folio = /T-(\d+)/.exec(linea)?.[1] ?? "";
  await ticket(/¿Qué folio le tocó/, folio);
  await comando("cat LEEME.txt", /— R\./);
  await ticket(/¿Con qué inicial firmó/, "R");
  expect(await mision()).toBe("t1-m03-moverse-por-la-planta");

  // T1-M3
  await comando("cd /srv/lineas/linea3");
  const paros = await comando("grep Paros estado.txt | cut -d: -f2", /^\s*\d+$/);
  await ticket(/¿Cuántos paros sin causa/, paros);
  await comando("history", /history$/);
  expect(await mision()).toBe("t1-m04-preguntale-al-manual");

  // T1-M4
  await comando("man ls", /./);
  await ticket(/¿Qué opción de ls muestra/, "-a");
  await comando("cd ~");
  await comando("cat .r/hola", /— R\./);
  expect(await mision()).toBeNull();
  expect((await page.evaluate(() => window.__planta7?.partida?.()))?.eventos).toContain("turno_completado");
});

test("menú (gafete): primer día pide el nombre tecleado y empieza el turno", async ({ page }) => {
  await page.goto("/?test=1&menu=1");
  await page.waitForFunction(() => window.__planta7?.ready === true);
  const menu = page.getByTestId("menu");
  await expect(menu.getByRole("heading", { name: "Rastro en el Log" })).toBeVisible();
  await expect(page.getByTestId("dialogo")).toBeHidden();
  await expect(menu.getByRole("button", { name: "Checar entrada con mi número" })).toBeDisabled();

  await menu.getByRole("button", { name: "Primer día de trabajo" }).click();
  const nombre = page.getByLabel("¿Cómo te llamas? (o un apodo)");
  await expect(nombre).toBeFocused();
  await expect(menu.getByRole("button", { name: "Empezar mi turno" })).toBeDisabled();
  await nombre.dispatchEvent("paste");
  await expect(page.getByTestId("pensamiento")).toContainText("Mejor lo escribo yo");
  await nombre.fill("Ale");
  await expect(menu).toContainText("Ale");
  await menu.getByRole("button", { name: "Empezar mi turno" }).click();

  await expect(menu).toBeHidden();
  await expect(page.getByTestId("dialogo")).toContainText("Eduardo Téllez · Sistemas");
  expect((await page.evaluate(() => window.__planta7?.partida?.()))?.nombre).toBe("Ale");
});

test("ajustes: letra, contraste y reducir movimiento se aplican y se conservan al recargar", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await abrir(page);
  await page.getByRole("button", { name: "Ajustes" }).click();
  const panel = page.getByRole("region", { name: "Ajustes" });
  await panel.getByLabel("Muy grande").check();
  await panel.getByLabel("Contraste alto").check();
  await panel.getByLabel(/Reducir movimiento/).check();
  const raiz = () =>
    page.evaluate(() => [document.documentElement.dataset.letra, document.documentElement.dataset.contraste]);
  expect(await raiz()).toEqual(["muy-grande", "alto"]);

  await page.reload();
  // Recargar la escena con WebGL por software tarda más cuando corre toda la suite.
  await page.waitForFunction(() => window.__planta7?.ready === true, null, { timeout: 90_000 });
  expect(await raiz()).toEqual(["muy-grande", "alto"]);
  await page.getByRole("button", { name: "Ajustes" }).click();
  await expect(page.getByRole("region", { name: "Ajustes" }).getByLabel(/Reducir movimiento/)).toBeChecked();
});
