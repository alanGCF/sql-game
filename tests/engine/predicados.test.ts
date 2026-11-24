import { describe, expect, it } from "vitest";
import { GameClock, Shell } from "../../src/engine";
import type { Predicado } from "../../src/engine/mision/esquema";
import { evaluar, NoImplementado, normalizarRespuesta } from "../../src/engine/mision/predicados";
import { vfsDesde } from "../../src/engine/vfs";

const H = "srv-sistemas";

function estado(respuestas: Record<string, string> = {}, flags: string[] = []) {
  const reloj = GameClock.desde("2026-10-28T15:40:00Z");
  const vfs = vfsDesde(
    [
      { ruta: "/home/becario/", dueno: "becario" },
      { ruta: "/home/becario/LEEME.txt", dueno: "becario", contenido: "nota\n— R.\n" },
      { ruta: "/home/becario/tickets/T-1.txt", dueno: "becario", contenido: "a" },
      { ruta: "/home/becario/tickets/T-2.txt", dueno: "becario", contenido: "b" },
      { ruta: "/home/becario/.r/hola", dueno: "becario", contenido: "hola\n" },
      { ruta: "/home/becario/llave", dueno: "becario", modo: "644" },
    ],
    reloj.now(),
  );
  const shell = Shell.crear(vfs, reloj, { name: "becario", groups: ["becario"], home: "/home/becario" }, H);
  return { shell, respuestas: new Map(Object.entries(respuestas)), flags: new Set(flags) };
}

const ok = (p: Predicado, e = estado(), objetivo = "obj") => evaluar(p, e, objetivo);

describe("predicados (validación por resultado)", () => {
  it("archivo_leido: cat cuenta, ls no", async () => {
    const e = estado();
    const p: Predicado = { archivo_leido: { host: H, ruta: "/home/becario/LEEME.txt" } };
    await e.shell.ejecutar("ls -l LEEME.txt");
    expect(await ok(p, e)).toBe(false);
    await e.shell.ejecutar("cat ./LEEME.txt");
    expect(await ok(p, e)).toBe(true);
  });

  it("archivo_existe, no_existe y archivo_contiene", async () => {
    const e = estado();
    await e.shell.ejecutar("mkdir bitacora && echo uno > bitacora/h.txt && echo dos >> bitacora/h.txt");
    expect(
      await ok({ archivo_existe: { host: H, ruta: "/home/becario/bitacora", tipo: "carpeta" } }, e),
    ).toBe(true);
    expect(
      await ok({ archivo_existe: { host: H, ruta: "/home/becario/bitacora", tipo: "archivo" } }, e),
    ).toBe(false);
    expect(
      await ok({ archivo_contiene: { host: H, ruta: "/home/becario/bitacora/h.txt", lineas_min: 2 } }, e),
    ).toBe(true);
    expect(
      await ok({ archivo_contiene: { host: H, ruta: "/home/becario/bitacora/h.txt", patron: "^dos$" } }, e),
    ).toBe(true);
    await e.shell.ejecutar("rm -r bitacora");
    expect(await ok({ no_existe: { host: H, ruta: "/home/becario/bitacora" } }, e)).toBe(true);
  });

  it("arbol_igual: el respaldo debe tener los mismos archivos y contenidos", async () => {
    const e = estado();
    const p: Predicado = { arbol_igual: { host: H, a: "/home/becario/.r", b: "/home/becario/respaldo_r" } };
    expect(await ok(p, e)).toBe(false);
    await e.shell.ejecutar("cp -r .r respaldo_r");
    expect(await ok(p, e)).toBe(true);
    await e.shell.ejecutar("echo cambio >> respaldo_r/hola");
    expect(await ok(p, e)).toBe(false);
  });

  it("permisos por modo y dueño", async () => {
    const e = estado();
    expect(
      await ok({ permisos: { host: H, ruta: "/home/becario/llave", modo: "644", dueno: "becario" } }, e),
    ).toBe(true);
    expect(await ok({ permisos: { host: H, ruta: "/home/becario/llave", modo: "600" } }, e)).toBe(false);
  });

  it("respuesta fija acepta variantes normalizadas y sinónimos", async () => {
    const p: Predicado = { respuesta: { donde: "ticket", esperado: "R", acepta_tambien: ["r."] } };
    expect(await ok(p, estado({ obj: "  r " }))).toBe(true);
    expect(await ok(p, estado({ obj: "R." }))).toBe(true);
    expect(await ok(p, estado({ obj: "Rebeca" }))).toBe(false);
    expect(await ok(p, estado())).toBe(false);
  });

  it("respuesta calculada del mundo (esperado_de) sin modificar la partida", async () => {
    const p: Predicado = { respuesta: { donde: "ticket", esperado_de: { comando: "ls tickets | wc -l" } } };
    const e = estado({ obj: "2" });
    expect(await ok(p, e)).toBe(true);
    expect(e.shell.sesion.historial).toEqual([]);
    expect(await ok(p, estado({ obj: "3" }))).toBe(false);
  });

  it("flag, sesión y combinadores", async () => {
    const e = estado({}, ["respaldo_r"]);
    await e.shell.ejecutar("cd tickets");
    expect(await ok({ flag: { nombre: "respaldo_r" } }, e)).toBe(true);
    expect(await ok({ sesion_en: { cwd: "/home/becario/tickets", usuario: "becario" } }, e)).toBe(true);
    expect(
      await ok({ todos: [{ flag: { nombre: "respaldo_r" } }, { no: { flag: { nombre: "otra" } } }] }, e),
    ).toBe(true);
    expect(await ok({ alguno: [{ flag: { nombre: "x" } }, { flag: { nombre: "y" } }] }, e)).toBe(false);
  });

  it("comando_ejecutado solo para observacionales", async () => {
    const e = estado();
    await e.shell.ejecutar("pwd");
    expect(await ok({ comando_ejecutado: { comando: "pwd" } }, e)).toBe(true);
  });

  it("los predicados de SQL y red avisan que aún no existen", async () => {
    await expect(ok({ host_descubierto: { host: "mantto-delta" } })).rejects.toBeInstanceOf(NoImplementado);
  });

  it("normaliza acentos, mayúsculas y espacios", () => {
    expect(normalizarRespuesta("  Línea   TRES ")).toBe("linea tres");
  });
});
