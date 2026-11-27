import { describe, expect, it } from "vitest";
import { PASEANTES, PlanificadorPaseos, RUTAS, SEGUNDOS_PASEO } from "../../src/game/paseos";

/** Corre el planificador segundo a segundo; `dialogo(t)` dice si hay diálogo en pantalla en ese segundo. */
function correr(semilla: number, segundos: number, dialogo: (t: number) => boolean = () => false) {
  const p = new PlanificadorPaseos(semilla);
  const paseos: { t: number; ruta: number; quien: number }[] = [];
  for (let t = 0; t <= segundos; t++) {
    const e = p.tic(t, dialogo(t));
    if (e) paseos.push({ t, ...e });
  }
  return paseos;
}

describe("oficina viva: alguien pasa a lo lejos (F4-15)", () => {
  it("de vez en cuando (1.5 a 3 min entre uno y otro), nunca dos a la vez", () => {
    for (const semilla of [1, 2, 3, 77, 1234]) {
      const ps = correr(semilla, 3 * 3600);
      expect(ps.length).toBeGreaterThan(40);
      expect(ps[0]?.t).toBeGreaterThanOrEqual(90);
      for (let i = 1; i < ps.length; i++) {
        const hueco = (ps[i]?.t ?? 0) - (ps[i - 1]?.t ?? 0);
        // El anterior termina de cruzar antes de que salga el siguiente.
        expect(hueco).toBeGreaterThan(SEGUNDOS_PASEO + 90 - 1);
        expect(hueco).toBeLessThanOrEqual(SEGUNDOS_PASEO + 180 + 1);
      }
    }
  });

  it("nadie sale a caminar durante un diálogo", () => {
    const enDialogo = (t: number) => t % 400 < 250;
    const ps = correr(8, 3 * 3600, enDialogo);
    expect(ps.length).toBeGreaterThan(10);
    expect(ps.every((p) => !enDialogo(p.t))).toBe(true);
  });

  it("la semilla decide quién pasa y por dónde; misma semilla, mismos paseos", () => {
    expect(correr(42, 3600)).toEqual(correr(42, 3600));
    expect(correr(42, 3600)).not.toEqual(correr(43, 3600));
    const ps = correr(5, 6 * 3600);
    for (const p of ps) {
      expect(RUTAS[p.ruta]).toBeDefined();
      expect(PASEANTES[p.quien]).toBeDefined();
    }
    expect(new Set(ps.map((p) => p.ruta)).size).toBe(RUTAS.length);
    expect(new Set(ps.map((p) => p.quien)).size).toBeGreaterThan(1);
  });

  it("las rutas van lejos del cubículo (a más de 2.5 m, detrás de las mamparas del fondo)", () => {
    for (const r of RUTAS)
      for (const p of [r.desde, r.hasta]) expect(Math.hypot(p.x, p.z)).toBeGreaterThan(2.5);
  });
});
