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
  // F4-04: la llamada suena hasta que contestas.
  await expect(dialogo).toHaveClass(/llamada-sonando/);
  await expect(dialogo).toContainText("Llamada entrante · ext. 214");
  await dialogo.getByRole("button", { name: /Contestar/ }).click();
  await expect(dialogo).toHaveClass(/llamada/);
  await expect(dialogo).toContainText("Eduardo Téllez");
  await expect(dialogo).toContainText("Llamada · ext. 214");
  // F4-06: la llamada trae dos globos.
  await expect(dialogo).toContainText("¡Eso! Ya te ubicas.");
  await dialogo.getByRole("button", { name: /Siguiente/ }).click();
  await expect(dialogo).toContainText("ese LEEME.txt lo dejó la ingeniera");
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
  await expect(menu.getByRole("button", { name: "Checar entrada con mi número" })).toBeEnabled();

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
  await page.getByRole("button", { name: "Ya lo anoté" }).click();
  await expect(page.getByTestId("dialogo")).toContainText("Eduardo Téllez · Sistemas");
  const partida = await page.evaluate(() => window.__planta7?.partida?.());
  expect(partida?.nombre).toBe("Ale");
  expect(partida?.codigo).toMatch(/^[0-9A-HJKMNP-TV-Z]{12}$/);
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

/** Termina T1-M1 desde la terminal y los ganchos de prueba (como el jugador en Tickets). */
async function terminarT1M1(page: Page) {
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
  await expect
    .poll(() => page.evaluate(() => window.__planta7?.partida?.()))
    .toMatchObject({ mision: "t1-m02-el-leeme", guardado: "sincronizado" });
}

async function empezarPrimerDia(page: Page, nombre: string) {
  await page.goto("/?test=1&menu=1");
  await page.waitForFunction(() => window.__planta7?.ready === true);
  const menu = page.getByTestId("menu");
  await menu.getByRole("button", { name: "Primer día de trabajo" }).click();
  await page.getByLabel("¿Cómo te llamas? (o un apodo)").fill(nombre);
  await menu.getByRole("button", { name: "Empezar mi turno" }).click();
  await expect(menu).toBeHidden();
  await page.getByRole("button", { name: "Ya lo anoté" }).click();
  while (await page.getByTestId("dialogo").isVisible()) await page.keyboard.press("Enter");
}

test("guardado (F4-12): termina T1-M1 y en otra computadora checa entrada con su número y sigue en T1-M2", async ({
  page,
  browser,
}, info) => {
  test.setTimeout(120_000);
  await empezarPrimerDia(page, "Ale");
  await terminarT1M1(page);
  const codigo = (await page.evaluate(() => window.__planta7?.partida?.()))?.codigo ?? "";
  expect(codigo).toMatch(/^[0-9A-HJKMNP-TV-Z]{12}$/);

  // Otra computadora: navegador limpio, sin nada guardado.
  const otra = await browser.newContext({
    baseURL: info.project.use.baseURL ?? "http://127.0.0.1:4173",
    viewport: info.project.use.viewport ?? { width: 1280, height: 720 },
  });
  const p2 = await otra.newPage();
  await p2.goto("/?test=1&menu=1");
  await p2.waitForFunction(() => window.__planta7?.ready === true);
  const menu = p2.getByTestId("menu");
  await menu.getByRole("button", { name: "Checar entrada con mi número" }).click();
  const campo = p2.getByLabel("Tu número de empleado");
  await expect(campo).toBeFocused();
  // Un número mal tecleado se detecta sin llamar al servidor.
  await campo.fill(`${codigo.slice(0, 11)}${codigo[11] === "0" ? "1" : "0"}`);
  await menu.getByRole("button", { name: "Checar entrada", exact: true }).click();
  await expect(menu.getByRole("alert")).toContainText("no es válido");
  // Tecleado con guiones y en minúsculas.
  await campo.fill(`${codigo.slice(0, 4)}-${codigo.slice(4, 8)}-${codigo.slice(8)}`.toLowerCase());
  await menu.getByRole("button", { name: "Checar entrada", exact: true }).click();
  await expect(menu).toBeHidden();
  const cargada = await p2.evaluate(() => window.__planta7?.partida?.());
  expect(cargada).toMatchObject({ mision: "t1-m02-el-leeme", nombre: "Ale", codigo });
  // Sin repetir el briefing de la misión ya empezada.
  await expect(p2.getByTestId("dialogo")).toBeHidden();
  await otra.close();
});

test("guardado (F4-12): al recargar, el gafete ofrece seguir la partida de este navegador", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await empezarPrimerDia(page, "Mar");
  await terminarT1M1(page);
  const codigo = (await page.evaluate(() => window.__planta7?.partida?.()))?.codigo ?? "";
  await page.reload();
  await page.waitForFunction(() => window.__planta7?.ready === true);
  const menu = page.getByTestId("menu");
  await expect(menu).toContainText("Mar");
  // D-26: en el gafete solo se ven los últimos 4 caracteres, salvo al pedirlo.
  const completo = `${codigo.slice(0, 4)}-${codigo.slice(4, 8)}-${codigo.slice(8)}`;
  await expect(menu).toContainText(`••••-••••-${codigo.slice(8)}`);
  await expect(menu).not.toContainText(completo);
  await menu.getByRole("button", { name: "Mostrar mi número" }).click();
  await expect(menu).toContainText(completo);
  await menu.getByRole("button", { name: "Checar entrada como Mar" }).click();
  await expect(menu).toBeHidden();
  expect(await page.evaluate(() => window.__planta7?.partida?.())).toMatchObject({
    mision: "t1-m02-el-leeme",
    nombre: "Mar",
  });
});

test('guardado (D-26): "No soy yo" olvida la partida en esta computadora', async ({ page }) => {
  test.setTimeout(120_000);
  await empezarPrimerDia(page, "Luz");
  // Ya escrita en el navegador (hasta el primer checkpoint queda "pendiente" de subir).
  await expect
    .poll(() => page.evaluate(() => window.__planta7?.partida?.()?.guardado))
    .not.toBe("sin_partida");
  await page.reload();
  await page.waitForFunction(() => window.__planta7?.ready === true);
  const menu = page.getByTestId("menu");
  await expect(menu.getByRole("button", { name: "Checar entrada como Luz" })).toBeVisible();
  await menu.getByRole("button", { name: /No soy yo/ }).click();
  await expect(menu).toContainText("Esta computadora olvidará la partida de Luz");
  await menu.getByRole("button", { name: "Sí, olvidarla" }).click();
  await expect(menu).toContainText("(nuevo ingreso)");
  await expect(menu.getByRole("button", { name: "Checar entrada con mi número" })).toBeVisible();
  await page.reload();
  await page.waitForFunction(() => window.__planta7?.ready === true);
  await expect(page.getByTestId("menu")).toContainText("(nuevo ingreso)");
});

test("número de empleado (F4-13, D-27): tarjeta de Recursos Humanos y Eduardo lo menciona", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/?test=1&menu=1");
  await page.waitForFunction(() => window.__planta7?.ready === true);
  const menu = page.getByTestId("menu");
  await menu.getByRole("button", { name: "Primer día de trabajo" }).click();
  await page.getByLabel("¿Cómo te llamas? (o un apodo)").fill("Ale");
  await menu.getByRole("button", { name: "Empezar mi turno" }).click();

  const tarjeta = page.getByRole("dialog", { name: "Tu número de empleado" });
  await expect(tarjeta).toBeVisible();
  const codigo = (await page.evaluate(() => window.__planta7?.partida?.()))?.codigo ?? "";
  await expect(tarjeta).toContainText(`${codigo.slice(0, 4)}-${codigo.slice(4, 8)}-${codigo.slice(8)}`);
  await expect(tarjeta).toContainText("Ale");
  // Los diálogos esperan a que el jugador lo anote.
  await expect(page.getByTestId("dialogo")).toBeHidden();
  const boton = tarjeta.getByRole("button", { name: "Ya lo anoté" });
  await expect(boton).toBeFocused();
  await boton.click();
  await expect(tarjeta).toBeHidden();

  const textos: string[] = [];
  const dialogo = page.getByTestId("dialogo");
  while (await dialogo.isVisible()) {
    textos.push((await dialogo.textContent()) ?? "");
    await page.keyboard.press("Enter");
  }
  expect(textos.some((t) => t.includes("Eduardo") && t.includes("número de empleado"))).toBe(true);
});

async function alTelefono(page: Page) {
  await abrir(page);
  const dialogo = page.getByTestId("dialogo");
  while (await dialogo.isVisible()) await page.keyboard.press("Enter");
  await page.evaluate(() => window.__planta7?.setVista?.("telefono"));
  await expect(page.getByTestId("telefono")).toBeVisible();
}

test("teléfono (F4-01): marca 214 con el teclado, contesta Eduardo y Esc cuelga", async ({ page }) => {
  await alTelefono(page);
  const pantalla = page.getByTestId("telefono-pantalla");
  await expect(pantalla).toContainText("Ext. 210");
  await page.keyboard.type("2149");
  await expect(pantalla).toContainText("2149");
  await page.keyboard.press("Backspace");
  await expect(pantalla).toContainText("Marcar214");
  await page.keyboard.press("Enter");
  await expect(pantalla).toContainText("En llamada");
  const dialogo = page.getByTestId("dialogo");
  await expect(dialogo).toHaveClass(/llamada/);
  await expect(dialogo).toContainText("Eduardo Téllez");
  await expect(dialogo.getByRole("list", { name: "Responder" })).toBeVisible();
  // Mientras hablas, las teclas no marcan (y 9 no es una opción).
  await page.keyboard.type("9");
  await expect(pantalla).not.toContainText("9");
  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();
  await expect(pantalla).toContainText("Ext. 210");
  // El primer Esc colgó; el segundo levanta la vista.
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("telefono")).toBeHidden();
});

test("teléfono (F4-01): marca 214 con clic; tu extensión da ocupado y otra no existe", async ({ page }) => {
  await alTelefono(page);
  const telefono = page.getByTestId("telefono");
  const pantalla = page.getByTestId("telefono-pantalla");
  for (const d of ["2", "1", "0"]) await telefono.getByRole("button", { name: d, exact: true }).click();
  await telefono.getByRole("button", { name: /Llamar/ }).click();
  await expect(pantalla).toContainText("Ocupado");
  for (const d of ["7", "7", "7"]) await telefono.getByRole("button", { name: d, exact: true }).click();
  await page.keyboard.press("Enter");
  await expect(pantalla).toContainText("No existe");
  for (const d of ["2", "1", "4"]) await telefono.getByRole("button", { name: d, exact: true }).click();
  await telefono.getByRole("button", { name: /Llamar/ }).click();
  const dialogo = page.getByTestId("dialogo");
  await expect(dialogo).toContainText("Eduardo Téllez");
  await dialogo.getByRole("button", { name: /nomás quería platicar/ }).click();
  await dialogo.getByRole("button", { name: /ya me voy ubicando/ }).click();
  await dialogo.getByRole("button", { name: /Colgar/ }).click();
  await expect(dialogo).toBeHidden();
  await expect(pantalla).toContainText("Ext. 210");
});

test("llamadas (F4-02): opciones de respuesta y paciencia hasta que ya no contestan", async ({ page }) => {
  await alTelefono(page);
  const pantalla = page.getByTestId("telefono-pantalla");
  const dialogo = page.getByTestId("dialogo");
  const marcar = async (ext: string) => {
    await page.keyboard.type(ext);
    await page.keyboard.press("Enter");
  };
  // Eduardo: con pendientes pregunta qué ocupas; platicar (2) pone la del turno, con opciones.
  await marcar("214");
  await expect(dialogo).toContainText("¿Qué ocupas?");
  await page.keyboard.press("2");
  await expect(dialogo).toContainText("¿Cómo vas con tu primer turno?");
  await page.keyboard.press("2");
  await expect(dialogo).toContainText("nadie le entiende a nada");
  await page.keyboard.press("Enter");
  await expect(dialogo).toBeHidden();
  // Karla: 1–2 platica, 3 "ponte a trabajar", 4 ya no contesta y lo piensas.
  await marcar("402");
  await expect(dialogo).toContainText("¿Es por mi ticket?");
  await page.keyboard.press("1");
  await expect(dialogo).toContainText("Lo reviso entre junta y junta");
  await page.keyboard.press("Enter");
  await marcar("402");
  await expect(dialogo).toContainText("Estoy por entrar a junta");
  await page.keyboard.press("Enter");
  await expect(dialogo).toContainText("contéstalo en la app");
  await page.keyboard.press("Enter");
  await marcar("402");
  await expect(dialogo).toContainText(/Ponte a trabajar/i);
  await page.keyboard.press("Enter");
  await expect(dialogo).toBeHidden();
  await marcar("402");
  await expect(pantalla).toContainText("Sin respuesta");
  await expect(page.getByTestId("pensamiento")).toContainText("buzón de Karla");
  await expect(dialogo).toBeHidden();
});

test("pistas (F4-03): Eduardo da las tres de T1-M1 por teléfono, quedan anotadas y no gastan paciencia", async ({
  page,
}) => {
  await alTelefono(page);
  const dialogo = page.getByTestId("dialogo");
  const pedirPista = async () => {
    await page.keyboard.type("214");
    await page.keyboard.press("Enter");
    await expect(dialogo.getByRole("button", { name: /Necesito una pista/ })).toBeVisible();
    await page.keyboard.press("1");
    // T1-M1 tiene dos pendientes: ¿con cuál te atoraste? Se elige el primero.
    await expect(dialogo.getByRole("list", { name: "Responder" })).toBeVisible();
    await page.keyboard.press("1");
  };
  for (let i = 0; i < 3; i++) {
    await pedirPista();
    await expect(dialogo.getByRole("button", { name: /Colgar/ })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(dialogo).toBeHidden();
  }
  const pistas = await page.evaluate(() => window.__planta7?.pistas?.() ?? []);
  expect(pistas.map((p) => p.nivel)).toEqual([1, 2, 3]);
  expect(new Set(pistas.map((p) => p.objetivo)).size).toBe(1);
  expect(pistas[2]?.texto).toMatch(/`[^`]+`/);
  // La cuarta repite el comando exacto y no anota nada nuevo.
  await pedirPista();
  await expect(dialogo).toContainText(/va de nuevo/i);
  await page.keyboard.press("Enter");
  await expect(dialogo).toContainText(pistas[2]?.texto.slice(0, 20) ?? "");
  await page.keyboard.press("Escape");
  expect((await page.evaluate(() => window.__planta7?.pistas?.() ?? [])).length).toBe(3);
  // Pedir pistas no gastó paciencia: platicar todavía es la charla del turno.
  await page.keyboard.type("214");
  await page.keyboard.press("Enter");
  await page.keyboard.press("2");
  await expect(dialogo).toContainText("¿Cómo vas con tu primer turno?");
});

test("pistas (F4-03): tres comandos con error seguidos te hacen pensar en marcarle a Eduardo", async ({
  page,
}) => {
  await abrir(page);
  const dialogo = page.getByTestId("dialogo");
  while (await dialogo.isVisible()) await page.keyboard.press("Enter");
  await page.evaluate(() => window.__planta7?.setVista?.("monitor"));
  const input = page.getByLabel("Comando");
  for (const c of ["cat no-existe", "cd nada"]) {
    await input.fill(c);
    await input.press("Enter");
  }
  await expect(page.getByTestId("pensamiento")).toBeHidden();
  await input.fill("ls nada");
  await input.press("Enter");
  await expect(page.getByTestId("pensamiento")).toHaveText("Igual y le marco a Eduardo…");
});

async function cerrarT1M1SinContestar(page: Page) {
  await abrir(page);
  const dialogo = page.getByTestId("dialogo");
  while (await dialogo.isVisible()) await page.keyboard.press("Enter");
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
  await expect(dialogo).toHaveClass(/llamada-sonando/);
}

test("llamada entrante (F4-04): se contesta con Enter", async ({ page }) => {
  await cerrarT1M1SinContestar(page);
  const dialogo = page.getByTestId("dialogo");
  await expect(dialogo).toContainText("[Suena tu teléfono]");
  await page.keyboard.press("Enter");
  await expect(dialogo).toContainText("Ya te ubicas");
  expect(await page.evaluate(() => window.__planta7?.buzon?.())).toBe(0);
});

test("llamada entrante (F4-04): si nadie contesta, queda en el buzón y se escucha desde el teléfono", async ({
  page,
}) => {
  await cerrarT1M1SinContestar(page);
  const dialogo = page.getByTestId("dialogo");
  await page.evaluate(() => window.__planta7?.dejarSonar?.());
  expect(await page.evaluate(() => window.__planta7?.buzon?.())).toBe(1);
  // Lo que venía después de la llamada sigue (Karla deja su ticket).
  await expect(dialogo).toContainText("Ing. Karla Ibáñez · Calidad");
  while (await dialogo.isVisible()) await page.keyboard.press("Enter");
  await page.evaluate(() => window.__planta7?.setVista?.("telefono"));
  const telefono = page.getByTestId("telefono");
  await expect(page.getByTestId("telefono-pantalla")).toContainText("Buzón 1");
  await telefono.getByRole("button", { name: /Buzón \(1\)/ }).click();
  await expect(dialogo).toContainText("Buzón · ext. 214");
  await expect(dialogo).toContainText("Ya te ubicas");
  expect(await page.evaluate(() => window.__planta7?.buzon?.())).toBe(0);
  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();
  await expect(telefono.getByRole("button", { name: /Buzón/ })).toBeHidden();
});

test("libreta (F4-05): apuntes de la misión, comando aprendido y pista en su pestaña", async ({ page }) => {
  await cerrarT1M1SinContestar(page);
  await page.keyboard.press("Enter");
  while (await page.getByTestId("dialogo").isVisible()) await page.keyboard.press("Enter");
  // Una pista de T1-M2 por teléfono.
  await page.evaluate(() => window.__planta7?.setVista?.("telefono"));
  const dialogo = page.getByTestId("dialogo");
  await expect(page.getByTestId("telefono")).toBeVisible();
  await page.keyboard.type("214");
  await page.keyboard.press("Enter");
  await expect(dialogo).toContainText("¿Qué ocupas?");
  await page.keyboard.press("1");
  // T1-M2 tiene varios pendientes: ¿con cuál te atoraste? Se elige el primero.
  await expect(dialogo).toContainText("¿Con cuál te atoraste?");
  await page.keyboard.press("1");
  await expect(dialogo.getByRole("button", { name: /Colgar/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.evaluate(() => window.__planta7?.setVista?.("libreta"));
  const libreta = page.getByTestId("libreta");
  await expect(libreta).toContainText("Mi carpeta en el servidor es /home/becario");
  await libreta.getByRole("tab", { name: "Comandos" }).click();
  await expect(libreta.getByRole("button", { name: "pwd" })).toBeVisible();
  await libreta.getByRole("button", { name: "pwd" }).click();
  await expect(libreta).toContainText("Para qué sirve");
  await libreta.getByRole("tab", { name: "Pistas" }).click();
  await expect(libreta).toContainText("pista 1 de 3");
  const [pista] = await page.evaluate(() => window.__planta7?.pistas?.() ?? []);
  await expect(libreta).toContainText(pista?.texto ?? "(sin pista)");
});

test("libreta (F4-05): no se copia, no se pega y la nota tecleada se guarda con la partida", async ({
  page,
}) => {
  // Dos cargas de la escena con WebGL por software: más tiempo, como T1 completo.
  test.setTimeout(90_000);
  await empezarPrimerDia(page, "Ale");
  await page.evaluate(() => window.__planta7?.setVista?.("libreta"));
  const libreta = page.getByTestId("libreta");
  // Copiar: bloqueado y el texto no se puede seleccionar.
  const copiado = await libreta.evaluate((el) => {
    const e = new ClipboardEvent("copy", { bubbles: true, cancelable: true });
    el.dispatchEvent(e);
    return e.defaultPrevented;
  });
  expect(copiado).toBe(true);
  expect(await libreta.evaluate((el) => getComputedStyle(el).userSelect)).toBe("none");
  await libreta.getByRole("tab", { name: "Mis notas" }).click();
  const nota = page.getByLabel("Nota nueva");
  await nota.dispatchEvent("paste");
  await expect(page.getByTestId("pensamiento")).toContainText("Mejor lo escribo yo");
  await expect(nota).toHaveValue("");
  await nota.pressSequentially("ls -a muestra los ocultos");
  await nota.press("Control+Enter");
  await expect(nota).toHaveValue("");
  await expect(libreta.getByText("ls -a muestra los ocultos")).toBeVisible();
  // Se guarda con la partida (en el navegador, agrupado): al recargar y seguir, ahí está.
  const notasGuardadas = () =>
    page.evaluate(
      () =>
        new Promise<string>((listo) => {
          const r = indexedDB.open("rastro-en-el-log");
          r.onsuccess = () => {
            const g = r.result.transaction("partida").objectStore("partida").get("actual");
            g.onsuccess = () => listo(JSON.stringify(g.result?.partida?.notas ?? []));
            g.onerror = () => listo("[]");
          };
          r.onerror = () => listo("[]");
        }),
    );
  await expect.poll(notasGuardadas).toContain("ls -a muestra los ocultos");
  await page.reload();
  await page.waitForFunction(() => window.__planta7?.ready === true, null, { timeout: 45_000 });
  await page.getByRole("button", { name: /Checar entrada como Ale/ }).click();
  await expect(page.getByTestId("menu")).toBeHidden();
  while (await page.getByTestId("dialogo").isVisible()) await page.keyboard.press("Enter");
  await page.evaluate(() => window.__planta7?.setVista?.("libreta"));
  await page.getByTestId("libreta").getByRole("tab", { name: "Mis notas" }).click();
  await expect(page.getByTestId("libreta")).toContainText("ls -a muestra los ocultos");
});

test("pensamiento (F4-06): al cerrar T1-M2, Don Chuy en dos globos y luego lo que piensas, en tu nube", async ({
  page,
}) => {
  await cerrarT1M1SinContestar(page);
  const dialogo = page.getByTestId("dialogo");
  while (await dialogo.isVisible()) await page.keyboard.press("Enter");
  const input = page.getByLabel("Comando");
  await input.fill("grep -r Karla tickets");
  await input.press("Enter");
  const linea = (await page.getByTestId("terminal").locator(".terminal-linea").last().textContent()) ?? "";
  const folio = /T-(\d+)/.exec(linea)?.[1] ?? "";
  await input.fill("cat LEEME.txt");
  await input.press("Enter");
  await page.evaluate(
    (f) =>
      Promise.all([
        window.__planta7?.responder?.("t1-m02-el-leeme", "responder-folio", f),
        window.__planta7?.responder?.("t1-m02-el-leeme", "responder-firma", "R"),
      ]),
    folio,
  );
  await expect(dialogo).toContainText("¿Qué tanto lees, joven?");
  await expect(dialogo).toContainText("Mantenimiento");
  await page.keyboard.press("Enter");
  await expect(dialogo).toContainText("nunca se equivocaba");
  await page.keyboard.press("Enter");
  await expect(dialogo).toHaveClass(/dialogo-pensamiento/);
  await expect(dialogo).toContainText("Primer turno y ya heredé un misterio");
  await page.keyboard.press("Enter");
  await expect(dialogo.filter({ hasText: "heredé un misterio" })).toHaveCount(0);
});

/** Ejecuta comandos en la terminal y devuelve la última línea de salida. */
async function teclear(page: Page, ...lineas: string[]): Promise<string> {
  await page.evaluate(() => window.__planta7?.setVista?.("monitor"));
  const input = page.getByLabel("Comando");
  for (const l of lineas) {
    await input.fill(l);
    await input.press("Enter");
  }
  return ((await page.getByTestId("terminal").locator(".terminal-linea").last().textContent()) ?? "").trim();
}

const animacion = (page: Page) => page.evaluate(() => window.__planta7?.animacionPizarron?.());

test("pizarrón (F4-07): el plumón raya el pendiente y el post-it del favor cae al bote", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/?test=1&animar=1");
  await page.waitForFunction(() => window.__planta7?.ready === true);
  const dialogo = page.getByTestId("dialogo");
  const cerrar = async () => {
    while (await dialogo.isVisible()) await page.keyboard.press("Enter");
  };
  const responder = (m: string, o: string, v: string) =>
    page.evaluate(([m, o, v]) => window.__planta7?.responder?.(m, o, v), [m, o, v] as const);
  await cerrar();
  // T1-M1: el primer pendiente se raya con animación.
  await responder("t1-m01-donde-estoy", "responder-carpeta", "/home/becario");
  await expect.poll(async () => (await animacion(page))?.vistos.tachados).toBe(1);
  await expect.poll(async () => (await animacion(page))?.tachando).toBe(0);
  const n = await teclear(page, "ls tickets | wc -l");
  await responder("t1-m01-donde-estoy", "responder-tickets", n);
  await cerrar();
  // T1-M2 y T1-M3 para que llegue el favor de Don Chuy con T1-M4.
  const folio = /T-(\d+)/.exec(await teclear(page, "grep -r Karla tickets"))?.[1] ?? "";
  await teclear(page, "cat LEEME.txt");
  await responder("t1-m02-el-leeme", "responder-folio", folio);
  await responder("t1-m02-el-leeme", "responder-firma", "R");
  await cerrar();
  const paros = await teclear(page, "cd /srv/lineas/linea3", "grep Paros estado.txt | cut -d: -f2");
  await responder("t1-m03-moverse-por-la-planta", "responder-paros", paros.trim());
  await teclear(page, "history");
  await cerrar();
  expect((await page.evaluate(() => window.__planta7?.pizarron?.()))?.favores.length).toBe(1);
  // El favor: al terminarlo, su post-it se arruga y cae al bote.
  const piezas = await teclear(page, "grep Piezas /srv/lineas/linea1/estado.txt | cut -d: -f2");
  await responder("t1-f01-lentes-de-don-chuy", "responder-piezas", piezas.trim());
  await expect.poll(async () => (await animacion(page))?.vistos.caidos).toBe(1);
  await expect.poll(async () => (await animacion(page))?.cayendo, { timeout: 10_000 }).toBe(0);
  expect((await page.evaluate(() => window.__planta7?.pizarron?.()))?.favores).toEqual([]);
});

test("pizarrón (F4-07): con reducir movimiento se tacha sin animación", async ({ page }) => {
  await page.goto("/?test=1&animar=1");
  await page.waitForFunction(() => window.__planta7?.ready === true);
  const dialogo = page.getByTestId("dialogo");
  while (await dialogo.isVisible()) await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Ajustes" }).click();
  await page.getByLabel(/Reducir movimiento/).check();
  await page.getByRole("button", { name: "Cerrar" }).click();
  await page.evaluate(() =>
    window.__planta7?.responder?.("t1-m01-donde-estoy", "responder-carpeta", "/home/becario"),
  );
  await expect
    .poll(async () => (await page.evaluate(() => window.__planta7?.pizarron?.()))?.renglones[0])
    .toMatch(/^\[x\]/);
  expect((await animacion(page))?.vistos.tachados).toBe(0);
});

test("calendario (F4-08): con T1 terminado, el día trae sus estrellas y su resumen", async ({ page }) => {
  test.setTimeout(120_000);
  await abrir(page);
  const dialogo = page.getByTestId("dialogo");
  const cerrar = async () => {
    while (await dialogo.isVisible()) await page.keyboard.press("Enter");
  };
  const responder = (m: string, o: string, v: string) =>
    page.evaluate(([m, o, v]) => window.__planta7?.responder?.(m, o, v), [m, o, v] as const);
  await cerrar();
  // A medias, el día es "hoy" y el resumen dice "en curso".
  await page.evaluate(() => window.__planta7?.setVista?.("calendario"));
  const dias = page.getByRole("navigation", { name: "Días trabajados" });
  await expect(dias).toContainText("hoy");
  await page.evaluate(() => window.__planta7?.setVista?.("general"));
  // T1 completo con la solución de cada misión.
  await responder("t1-m01-donde-estoy", "responder-carpeta", "/home/becario");
  await responder("t1-m01-donde-estoy", "responder-tickets", await teclear(page, "ls tickets | wc -l"));
  await cerrar();
  const folio = /T-(\d+)/.exec(await teclear(page, "grep -r Karla tickets"))?.[1] ?? "";
  await teclear(page, "cat LEEME.txt");
  await responder("t1-m02-el-leeme", "responder-folio", folio);
  await responder("t1-m02-el-leeme", "responder-firma", "R");
  await cerrar();
  const paros = await teclear(page, "cd /srv/lineas/linea3", "grep Paros estado.txt | cut -d: -f2");
  await responder("t1-m03-moverse-por-la-planta", "responder-paros", paros.trim());
  await teclear(page, "history");
  await cerrar();
  await teclear(page, "man ls");
  await responder("t1-m04-preguntale-al-manual", "responder-opcion", "-a");
  await teclear(page, "cd ~", "cat .r/hola");
  await cerrar();
  expect((await page.evaluate(() => window.__planta7?.partida?.()))?.eventos).toContain("turno_completado");
  // El día trae sus estrellas; al elegirlo, el resumen.
  await page.evaluate(() => window.__planta7?.setVista?.("calendario"));
  const dia = dias.getByRole("button", { name: /28/ });
  await expect(dia.getByRole("img", { name: "3 de 3 estrellas" })).toBeVisible();
  await dia.click();
  const resumen = page.getByTestId("resumen-dia");
  await expect(resumen).toContainText("Turno 1");
  await expect(resumen).toContainText("¿Dónde estoy?");
  await expect(resumen.getByRole("img", { name: "3 de 3 estrellas" })).toHaveCount(5);
  await expect(resumen).toContainText("Mi carpeta en el servidor es /home/becario");
  await resumen.getByRole("button", { name: "Cerrar" }).click();
  await expect(resumen).toBeHidden();
});
