import { describe, expect, it } from "vitest";
import { crearShellBase } from "../../src/engine/mundo-base";
import { type MundoBase, MundoEsquema } from "../../src/engine/mundo-esquema";

const mundo: MundoBase = MundoEsquema.parse({
  variables: { lote: { tipo: "entero", min: 4000, max: 4999 } },
  hosts: [
    {
      host: "srv-prueba",
      usuarios: {
        becario: { grupos: ["becario", "sistemas"], home: "/home/becario" },
        rsalcido: { grupos: ["rsalcido", "sistemas"], home: "/home/rsalcido" },
      },
      fs: [
        { ruta: "/home/becario/", dueno: "becario", modo: "700" },
        { ruta: "/home/becario/lote.txt", dueno: "becario", contenido: "Lote {{lote}}\n" },
        { ruta: "/home/rsalcido/", dueno: "rsalcido", modo: "700" },
      ],
    },
  ],
});
const opciones = { host: "srv-prueba", usuario: "becario", ahora: "2026-10-28T15:30:00Z" };

describe("mundo base", () => {
  it("crea la sesión en el host, con el usuario, sus grupos y su carpeta personal", async () => {
    const { shell } = crearShellBase(mundo, 1, opciones);
    expect(shell.prompt()).toContain("becario@srv-prueba");
    expect(shell.sesion.cwd).toBe("/home/becario");
    expect(shell.sesion.usuario.groups).toEqual(["becario", "sistemas"]);
    const r = await shell.ejecutar("ls /home/rsalcido", { sinTerminal: true });
    expect(r.fragmentos.map((f) => f.texto).join("")).toContain("Permission denied");
  });

  it("sustituye las variables de partida en los archivos, igual con la misma semilla", async () => {
    const leer = async (semilla: number) => {
      const { shell, vars } = crearShellBase(mundo, semilla, opciones);
      const r = await shell.ejecutar("cat lote.txt", { sinTerminal: true });
      return {
        texto: r.fragmentos
          .filter((f) => f.tipo === "stdout")
          .map((f) => f.texto)
          .join(""),
        lote: vars.lote,
      };
    };
    const a = await leer(7);
    expect(a.texto).toBe(`Lote ${a.lote}\n`);
    expect(await leer(7)).toEqual(a);
    const otros = new Set(await Promise.all([1, 2, 3, 4, 5].map(async (s) => (await leer(s)).lote)));
    expect(otros.size).toBeGreaterThan(1);
  });

  it("rechaza host o usuario que no existen", () => {
    expect(() => crearShellBase(mundo, 1, { ...opciones, host: "srv-x" })).toThrow(/host desconocido: srv-x/);
    expect(() => crearShellBase(mundo, 1, { ...opciones, usuario: "nadie" })).toThrow(
      /el usuario nadie no existe en srv-prueba/,
    );
  });

  it("el esquema rechaza rutas relativas y modos inválidos", () => {
    const malo = (fs: unknown) =>
      MundoEsquema.safeParse({ variables: {}, hosts: [{ host: "h", usuarios: {}, fs }] }).success;
    expect(malo([{ ruta: "home/x" }])).toBe(false);
    expect(malo([{ ruta: "/x", modo: "999" }])).toBe(false);
  });
});
