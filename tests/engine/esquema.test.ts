import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { validarMision } from "../../src/engine/mision/esquema";

const ejemplo = () =>
  parse(readFileSync("docs/ejemplos/mision-ejemplo.yaml", "utf8")) as Record<string, unknown>;

// biome-ignore lint/suspicious/noExplicitAny: las pruebas mutan YAML arbitrario.
type Yaml = Record<string, any>;

function errores(mutar: (m: Yaml) => void): string[] {
  const m = ejemplo();
  mutar(m);
  const r = validarMision(m);
  return r.ok ? [] : r.errores;
}

describe("esquema de misión (regla C1)", () => {
  it("el ejemplo canónico es válido", () => {
    const r = validarMision(ejemplo());
    expect(r.ok ? [] : r.errores).toEqual([]);
  });

  it.each<[string, (m: Yaml) => void, RegExp]>([
    [
      "globo de más de 280 caracteres",
      (m) => {
        m.briefing[0].texto = "a".repeat(281);
      },
      /briefing\.0\.texto: máximo 280/,
    ],
    ["un solo globo", (m) => (m.briefing = [m.briefing[0]]), /briefing/],
    [
      "pista 3 sin comando entre backticks",
      (m) => {
        m.objetivos[0].pistas[2] = "usa cat";
      },
      /objetivos\.0\.pistas: la pista 3/,
    ],
    ["más de 2 conceptos nuevos", (m) => (m.ensena = ["linux.a.b", "linux.c.d", "linux.e.f"]), /ensena/],
    [
      "contraejemplo a objetivo inexistente",
      (m) => {
        m.contraejemplos[0].objetivo = "nada";
      },
      /objetivo inexistente: nada/,
    ],
    [
      "respuesta con esperado y esperado_de",
      (m) => {
        m.objetivos[2].cuando.respuesta.esperado = "3";
      },
      /exactamente uno/,
    ],
    ["campo desconocido", (m) => (m.campo_raro = 1), /campo_raro|Unrecognized/i],
    ["id con formato inválido", (m) => (m.id = "Mision1"), /id: id tN-mNN-slug/],
    [
      "favor sin refuerza",
      (m) => {
        m.tipo = "favor";
        m.ensena = [];
      },
      /favor necesita refuerza/,
    ],
    ["sin contraejemplos", (m) => (m.contraejemplos = []), /contraejemplos/],
    [
      "responder a objetivo inexistente",
      (m) => m.solucion.push({ responder: { objetivo: "x", valor: "1" } }),
      /responder a objetivo inexistente: x/,
    ],
  ])("detecta: %s", (_nombre, mutar, patron) => {
    const e = errores(mutar);
    expect(e.join("\n")).toMatch(patron);
  });
});
