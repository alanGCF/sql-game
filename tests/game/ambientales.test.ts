import { describe, expect, it } from "vitest";
import { AMBIENTALES, PlanificadorAmbiental } from "../../src/game/ambientales";

/** Corre el planificador segundo a segundo; `dialogo(t)` dice si hay diálogo en pantalla en ese segundo. */
function correr(semilla: number, segundos: number, dialogo: (t: number) => boolean = () => false) {
  const p = new PlanificadorAmbiental(semilla);
  const eventos: { t: number; tipo: string }[] = [];
  for (let t = 0; t <= segundos; t++) {
    const e = p.tic(t, dialogo(t));
    if (e) eventos.push({ t, tipo: e });
  }
  return eventos;
}

describe("sonidos a lo lejos (F4-10, D-19)", () => {
  it("uno cada 2 a 4 minutos, nunca dos a la vez", () => {
    for (const semilla of [1, 2, 3, 77, 1234]) {
      const ev = correr(semilla, 3 * 3600);
      expect(ev.length).toBeGreaterThan(30);
      expect(ev[0]?.t).toBeGreaterThanOrEqual(120);
      for (let i = 1; i < ev.length; i++) {
        const prev = ev[i - 1];
        const cur = ev[i];
        if (!prev || !cur) continue;
        const hueco = cur.t - prev.t;
        // Entre el inicio de uno y el del siguiente: lo que dura el anterior (≤ 3 s) más 2–4 min.
        expect(hueco).toBeGreaterThanOrEqual(120 + 1);
        expect(hueco).toBeLessThanOrEqual(240 + 3 + 1);
      }
    }
  });

  it("nunca durante un diálogo: espera a que termine", () => {
    const enDialogo = (t: number) => t % 300 < 200; // 200 s de diálogo de cada 300
    const ev = correr(5, 3 * 3600, enDialogo);
    expect(ev.length).toBeGreaterThan(10);
    expect(ev.every((e) => !enDialogo(e.t))).toBe(true);
  });

  it("la misma semilla da la misma secuencia; no repite el mismo sonido dos veces seguidas", () => {
    expect(correr(42, 3600)).toEqual(correr(42, 3600));
    expect(correr(42, 3600)).not.toEqual(correr(43, 3600));
    const tipos = correr(9, 6 * 3600).map((e) => e.tipo);
    for (let i = 1; i < tipos.length; i++) expect(tipos[i]).not.toBe(tipos[i - 1]);
    for (const t of tipos) expect(Object.keys(AMBIENTALES)).toContain(t);
  });

  it("cada sonido tiene su subtítulo y dura de 1 a 3 segundos", () => {
    for (const a of Object.values(AMBIENTALES)) {
      expect(a.subtitulo.length).toBeGreaterThan(5);
      expect(a.segundos).toBeGreaterThanOrEqual(1);
      expect(a.segundos).toBeLessThanOrEqual(3);
    }
  });
});
