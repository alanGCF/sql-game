import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { compilarContenido } from "../../src/engine/mision/compilar";
import { compararMisiones } from "../../src/engine/mision/curriculo";

// biome-ignore lint/suspicious/noExplicitAny: se muta YAML arbitrario para cada caso.
type Yaml = Record<string, any>;
const ejemplo = (): Yaml => parse(readFileSync("docs/ejemplos/mision-ejemplo.yaml", "utf8"));

function mision(id: string, turno: number | "TE", orden: number): Yaml {
  const m = ejemplo();
  Object.assign(m, { id, turno, orden });
  if (id.includes("-f")) {
    Object.assign(m, {
      tipo: "favor",
      ensena: [],
      refuerza: ["linux.files.cat"],
      disponible_desde: "t1-m02-el-leeme",
    });
  }
  return m;
}

describe("pipeline de contenido (YAML → JSON por turno)", () => {
  it("agrupa por turno, separa favores y ordena por código", () => {
    const r = compilarContenido([
      { ruta: "content/misiones/turno-01/b.yaml", datos: mision("t1-m03-otra", 1, 3) },
      { ruta: "content/misiones/turno-01/f.yaml", datos: mision("t1-f01-favor", 1, 1) },
      { ruta: "content/misiones/turno-01/a.yaml", datos: mision("t1-m02-el-leeme", 1, 2) },
      { ruta: "content/misiones/turno-02/c.yaml", datos: mision("t2-m01-sig", 2, 1) },
    ]);
    expect(r.errores).toEqual([]);
    expect([...r.turnos.keys()]).toEqual(["01", "02"]);
    const t1 = r.turnos.get("01");
    expect(t1?.turno).toBe(1);
    expect(t1?.misiones.map((m) => m.id)).toEqual(["t1-m02-el-leeme", "t1-m03-otra"]);
    expect(t1?.favores.map((m) => m.id)).toEqual(["t1-f01-favor"]);
  });

  it("la salida es determinista sin importar el orden de los archivos", () => {
    const a = { ruta: "content/misiones/turno-01/a.yaml", datos: mision("t1-m02-el-leeme", 1, 2) };
    const b = { ruta: "content/misiones/turno-01/b.yaml", datos: mision("t1-m03-otra", 1, 3) };
    const x = compilarContenido([a, b]);
    const y = compilarContenido([b, a]);
    expect(JSON.stringify([...x.turnos])).toBe(JSON.stringify([...y.turnos]));
  });

  it("el tiempo extra va a la llave 'te'", () => {
    const r = compilarContenido([
      { ruta: "content/misiones/turno-te/f.yaml", datos: mision("te-f01-sabado", "TE", 1) },
    ]);
    expect(r.errores).toEqual([]);
    expect(r.turnos.get("te")?.turno).toBe("TE");
  });

  it.each<[string, { ruta: string; datos: unknown }[], RegExp]>([
    [
      "esquema inválido, con ruta del campo",
      [
        {
          ruta: "content/misiones/turno-01/a.yaml",
          datos: { ...mision("t1-m02-el-leeme", 1, 2), titulo: "" },
        },
      ],
      /turno-01\/a\.yaml: titulo:/,
    ],
    [
      "id duplicado",
      [
        { ruta: "content/misiones/turno-01/a.yaml", datos: mision("t1-m02-el-leeme", 1, 2) },
        { ruta: "content/misiones/turno-01/b.yaml", datos: mision("t1-m02-el-leeme", 1, 2) },
      ],
      /b\.yaml: id duplicado t1-m02-el-leeme \(también en .*a\.yaml\)/,
    ],
    [
      "carpeta que no coincide con el turno",
      [{ ruta: "content/misiones/turno-02/a.yaml", datos: mision("t1-m02-el-leeme", 1, 2) }],
      /a\.yaml: la carpeta turno-02 no coincide con turno: 1/,
    ],
    [
      "id que no coincide con el turno",
      [{ ruta: "content/misiones/turno-02/a.yaml", datos: mision("t1-m02-el-leeme", 2, 2) }],
      /a\.yaml: el id t1-m02-el-leeme no corresponde a turno: 2/,
    ],
    [
      "id que no coincide con el orden",
      [{ ruta: "content/misiones/turno-01/a.yaml", datos: mision("t1-m02-el-leeme", 1, 5) }],
      /a\.yaml: el id t1-m02-el-leeme no corresponde a orden: 5/,
    ],
  ])("rechaza %s", (_n, entradas, error) => {
    const r = compilarContenido(entradas);
    expect(r.errores.join("\n")).toMatch(error);
  });
});

describe("orden de misiones con tiempo extra", () => {
  it("TE va después del T8 y antes del T9", () => {
    expect(["T9-M1", "TE-F1", "T8-M3"].sort(compararMisiones)).toEqual(["T8-M3", "TE-F1", "T9-M1"]);
  });
});
