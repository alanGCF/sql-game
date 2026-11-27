import { describe, expect, it } from "vitest";
import { archivosYaml, leerYaml } from "../../scripts/lib/contenido";
import { compilarContenido, type TurnoCompilado } from "../../src/engine/mision/compilar";
import { diaDeCalendario, estrellasDeTurno, resumenDelDia } from "../../src/game/calendario";

const { turnos } = compilarContenido(
  archivosYaml("content/misiones").map((ruta) => {
    const y = leerYaml(ruta);
    if (!y.ok) throw new Error(y.error);
    return { ruta, datos: y.datos };
  }),
);
const t1 = turnos.get("01") as TurnoCompilado;

describe("calendario (F4-08)", () => {
  it("las estrellas del turno son el promedio de sus misiones principales, redondeado", () => {
    expect(estrellasDeTurno([3, 3, 3, 3])).toBe(3);
    expect(estrellasDeTurno([3, 2, 2, 2])).toBe(2);
    expect(estrellasDeTurno([3, 3, 2, 2])).toBe(3);
    expect(estrellasDeTurno([1, 1, 2, 1])).toBe(1);
    expect(estrellasDeTurno([])).toBeNull();
  });

  it("resumen de T1 a medias: misiones con sus estrellas, favores y hallazgos de la libreta", () => {
    const r = resumenDelDia(t1, { "t1-m01-donde-estoy": 3, "t1-m02-el-leeme": 2 }, false, [
      { mision: "t1-m01-donde-estoy", pestana: "historia", texto: "Mi carpeta es /home/becario." },
      { mision: "t1-m01-donde-estoy", pestana: "comandos", concepto: "linux.nav.pwd" },
    ]);
    expect(r.fecha).toBe("2026-10-28");
    expect(r.terminado).toBe(false);
    expect(r.estrellas).toBeNull();
    expect(r.misiones.map((m) => [m.titulo, m.estrellas])).toEqual([
      ["¿Dónde estoy?", 3],
      [t1.misiones[1]?.titulo, 2],
      [t1.misiones[2]?.titulo, null],
      [t1.misiones[3]?.titulo, null],
    ]);
    expect(r.favores).toEqual([]);
    expect(r.hallazgos).toEqual(["Mi carpeta es /home/becario."]);
  });

  it("con el turno terminado da sus estrellas y los favores hechos", () => {
    const completadas = Object.fromEntries([
      ...t1.misiones.map((m) => [m.id, 3] as const),
      ["t1-f01-lentes-de-don-chuy", 2] as const,
    ]);
    const r = resumenDelDia(t1, completadas, true, []);
    expect(r.estrellas).toBe(3);
    expect(r.favores.map((f) => f.estrellas)).toEqual([2]);
  });

  it("del clic en la hoja del calendario sale el día (columnas L–D, del 26 oct al 16 nov)", () => {
    // 28 oct: miércoles de la primera fila.
    expect(diaDeCalendario({ x: (2 + 0.5) / 7, y: 1 - 150 / 520 })).toBe("2026-10-28");
    expect(diaDeCalendario({ x: (1 + 0.5) / 7, y: 1 - 150 / 520 })).toBe("2026-10-27");
    // 7 nov: sábado de la segunda fila.
    expect(diaDeCalendario({ x: (5 + 0.5) / 7, y: 1 - 240 / 520 })).toBe("2026-11-07");
    // Encabezado y fuera de la cuadrícula: nada.
    expect(diaDeCalendario({ x: 0.5, y: 1 - 50 / 520 })).toBeNull();
    expect(diaDeCalendario({ x: (1 + 0.5) / 7, y: 1 - 480 / 520 })).toBeNull();
  });
});
