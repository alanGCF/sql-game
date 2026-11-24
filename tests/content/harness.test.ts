import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { revisarMision } from "../../src/engine/mision/harness";

// biome-ignore lint/suspicious/noExplicitAny: se muta YAML arbitrario para provocar cada regla.
type Yaml = Record<string, any>;
const ejemplo = (): Yaml => parse(readFileSync("docs/ejemplos/mision-ejemplo.yaml", "utf8"));
const SEMILLAS = Number(process.env.SEMILLAS ?? 25);

async function reglas(mutar?: (m: Yaml) => void): Promise<string[]> {
  const m = ejemplo();
  mutar?.(m);
  const h = await revisarMision(m, { semillas: 3 });
  return h.filter((x) => x.severidad === "error").map((x) => `${x.regla}: ${x.mensaje}`);
}

describe("harness de contenido", () => {
  it(`el ejemplo canónico pasa con ${SEMILLAS} semillas`, async () => {
    const h = await revisarMision(ejemplo(), { semillas: SEMILLAS });
    expect(h.filter((x) => x.severidad === "error")).toEqual([]);
  });

  it.each<[string, (m: Yaml) => void, RegExp]>([
    [
      "C1 esquema",
      (m) => {
        m.titulo = "";
      },
      /^C1/,
    ],
    [
      "C2 solución incompleta",
      (m) => {
        m.solucion = ["ls"];
      },
      /^C2/,
    ],
    [
      "C3 alternativa que no resuelve",
      (m) => {
        m.soluciones_alternativas = [["pwd"]];
      },
      /^C3/,
    ],
    [
      "C4 contraejemplo que sí resuelve",
      (m) => {
        m.contraejemplos = [{ objetivo: "leer-leeme", pasos: ["cat LEEME.txt"] }];
      },
      /^C4/,
    ],
    [
      "C5 pista 3 que no resuelve",
      (m) => {
        m.objetivos[0].pistas[2] = "Teclea `ls`";
      },
      /^C5/,
    ],
    [
      "C8 comando fuera de la superficie",
      (m) => {
        m.solucion = ["awk 1 LEEME.txt", ...m.solucion];
      },
      /^C8/,
    ],
  ])("detecta %s", async (_n, mutar, patron) => {
    const e = await reglas(mutar);
    expect(e.some((x) => patron.test(x))).toBe(true);
  });
});
