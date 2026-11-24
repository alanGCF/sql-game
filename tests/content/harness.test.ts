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

import { CurriculoEsquema, PersonajesEsquema } from "../../src/engine/mision/curriculo";
import { revisarRepasos } from "../../src/engine/mision/harness-curriculo";

const curriculo = CurriculoEsquema.parse(parse(readFileSync("content/curriculo.yaml", "utf8")));
const personajes = PersonajesEsquema.parse(parse(readFileSync("content/personajes.yaml", "utf8")));

async function reglasCurriculo(mutar: (m: Yaml) => void): Promise<string[]> {
  const m = ejemplo();
  mutar(m);
  const h = await revisarMision(m, { semillas: 1, curriculo, personajes });
  return h.map((x) => `${x.regla}: ${x.mensaje}`);
}

describe("harness de contenido: reglas del currículo", () => {
  it("el ejemplo canónico pasa con currículo y personajes", async () => {
    expect((await reglasCurriculo(() => undefined)).filter((x) => !x.startsWith("C17"))).toEqual([]);
  });

  it.each<[string, (m: Yaml) => void, RegExp]>([
    [
      "C6 prerequisito que se enseña después",
      (m) => {
        m.requiere = ["linux.text.grep"];
      },
      /^C6/,
    ],
    [
      "C7 concepto que el currículo pone en otra misión",
      (m) => {
        m.ensena = ["linux.nav.cd"];
      },
      /^C7/,
    ],
    [
      "C10 concepto inexistente",
      (m) => {
        m.requiere = ["linux.nada.nada"];
      },
      /^C10.*concepto/,
    ],
    [
      "C10 personaje inexistente",
      (m) => {
        m.briefing[0].quien = "fantasma";
      },
      /^C10.*personaje/,
    ],
    [
      "C15 briefing que regala la solución",
      (m) => {
        m.briefing[1].texto = "Solo teclea cat LEEME.txt y listo.";
      },
      /^C15/,
    ],
    [
      "C16 favor demasiado tarde",
      (m) => {
        m.id = "t1-f01-tarde";
        m.tipo = "favor";
        m.ensena = [];
        m.refuerza = ["linux.nav.pwd"];
        m.disponible_desde = "T2-M4";
      },
      /^C16/,
    ],
    [
      "C18 IP escrita a mano",
      (m) => {
        m.variables.ip = { tipo: "ip", red: "10.7.3.0/24", min: 20, max: 250 };
        m.briefing[0].texto = "Algo raro en 10.7.3.99.";
      },
      /^C18/,
    ],
    [
      "C18 lote escrito a mano",
      (m) => {
        m.variables.lote = { tipo: "entero", min: 4000, max: 4999 };
        m.briefing[0].texto = "El lote 4471 salió mal.";
      },
      /^C18/,
    ],
  ])("detecta %s", async (_n, mutar, patron) => {
    expect((await reglasCurriculo(mutar)).some((x) => patron.test(x))).toBe(true);
  });

  it("C9 avisa conceptos sin repaso cuando hay contenido de varios turnos", async () => {
    const { validarMision } = await import("../../src/engine/mision/esquema");
    const a = validarMision(ejemplo());
    const b = ejemplo();
    b.id = "t2-m01-otra";
    b.turno = 2;
    b.ensena = ["linux.nav.ls_largo"];
    b.requiere = ["linux.files.cat"];
    const vb = validarMision(b);
    if (!a.ok || !vb.ok) throw new Error("fixture inválido");
    const avisos = revisarRepasos([a.mision, vb.mision]);
    expect(avisos.some((x) => x.mensaje.includes("linux.files.cat") && x.mensaje.includes("1 vez"))).toBe(
      true,
    );
  });
});
