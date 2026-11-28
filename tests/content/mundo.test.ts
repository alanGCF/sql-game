import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { cargarMundo } from "../../scripts/lib/contenido";
import type { Shell } from "../../src/engine";
import { revisarMision } from "../../src/engine/mision/harness";
import { crearShellBase } from "../../src/engine/mundo-base";

const mundo = cargarMundo();
const T1 = { host: "srv-sistemas", usuario: "{{usuario}}", ahora: "2026-10-28T15:30:00Z", jugador: "sofia" };

async function salida(shell: Shell, linea: string): Promise<string> {
  const r = await shell.ejecutar(linea, { sinTerminal: true });
  return r.fragmentos
    .filter((f) => f.tipo === "stdout" || f.tipo === "stderr")
    .map((f) => f.texto)
    .join("");
}

describe("mundo base (content/mundo)", () => {
  it("las variables de partida se resuelven con 25 semillas y dentro de rango", () => {
    for (let s = 0; s < 25; s++) {
      const { vars } = crearShellBase(mundo, s, T1);
      expect(Number(vars.lote)).toBeGreaterThanOrEqual(4000);
      expect(Number(vars.lote)).toBeLessThanOrEqual(4999);
      expect(vars.ip_delta).toMatch(/^10\.7\.3\.\d+$/);
      expect(vars.contrasena_becario).toMatch(/^[a-z]+\d{2}$/);
    }
  });

  it("T1: la carpeta personal tiene LEEME.txt, tickets/ y la carpeta oculta de R.", async () => {
    const { shell } = crearShellBase(mundo, 1, T1);
    expect(await salida(shell, "ls")).toBe("LEEME.txt\ntickets\n");
    expect(await salida(shell, "ls -a")).toContain(".r\n");
    expect(await salida(shell, "cat .r/hola")).toContain("— R.");
    expect(await salida(shell, "cat LEEME.txt")).toContain("no confíes en los números del turno nocturno");
  });

  it("T1: las tres líneas tienen estado y la Línea 3 menciona los paros de las 23:59", async () => {
    const { shell } = crearShellBase(mundo, 1, T1);
    expect(await salida(shell, "ls /srv/lineas")).toBe("linea1\nlinea2\nlinea3\n");
    expect(await salida(shell, "cat /srv/lineas/linea3/estado.txt")).toContain("23:59");
  });

  it("las carpetas personales ajenas no se pueden listar (modo 700)", async () => {
    const { shell } = crearShellBase(mundo, 1, T1);
    expect(await salida(shell, "ls /home/rsalcido")).toContain("Permission denied");
  });

  it("el ejemplo canónico pasa el harness sobre el mundo base real", async () => {
    const ejemplo = parse(readFileSync("docs/ejemplos/mision-ejemplo.yaml", "utf8"));
    const h = await revisarMision(ejemplo, { semillas: 5, mundo });
    expect(h.filter((x) => x.severidad === "error")).toEqual([]);
  });

  it.each([
    ["host_inicial", "srv-nada", /C10: host_inicial desconocido: srv-nada/],
    ["usuario_inicial", "nadie", /C10: usuario_inicial nadie no existe en srv-sistemas/],
  ])("C10: %s inexistente en el mundo base", async (campo, valor, error) => {
    const m = parse(readFileSync("docs/ejemplos/mision-ejemplo.yaml", "utf8"));
    m[campo] = valor;
    const h = await revisarMision(m, { semillas: 1, mundo });
    expect(h.map((x) => `${x.regla}: ${x.mensaje}`).join("\n")).toMatch(error);
  });

  it("cargarMundo exige que el archivo del host se llame como el host", () => {
    expect(() => cargarMundo("tests/content/fixtures/mundo-mal-nombre")).toThrow(
      /debe llamarse como el archivo/,
    );
  });
});
