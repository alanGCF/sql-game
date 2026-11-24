import { describe, expect, it } from "vitest";
import { crearRng, elegir, entero, subSemilla } from "../../src/engine/rng";

describe("rng determinista", () => {
  it("misma semilla, misma secuencia; distinta semilla, distinta secuencia", () => {
    const a = crearRng(42);
    const b = crearRng(42);
    const c = crearRng(43);
    const sa = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(sa);
    expect(Array.from({ length: 5 }, c)).not.toEqual(sa);
  });

  it("entero() respeta el rango y cubre los extremos en 10 000 semillas", () => {
    const vistos = new Set<number>();
    for (let s = 0; s < 10_000; s++) {
      const v = entero(crearRng(subSemilla(s, "lote")), 4000, 4009);
      expect(v).toBeGreaterThanOrEqual(4000);
      expect(v).toBeLessThanOrEqual(4009);
      vistos.add(v);
    }
    expect(vistos.size).toBe(10);
  });

  it("subSemilla separa generadores", () => {
    expect(subSemilla(1, "lote")).not.toBe(subSemilla(1, "ip_delta"));
    expect(elegir(crearRng(7), [8080, 8081, 8443, 9000])).toBe(elegir(crearRng(7), [8080, 8081, 8443, 9000]));
  });
});
