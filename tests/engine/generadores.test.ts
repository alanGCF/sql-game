import { describe, expect, it } from "vitest";
import { GENERADORES } from "../../src/engine/mision/generadores";
import { crearRng } from "../../src/engine/rng";

const bandeja = GENERADORES.bandeja_t1;

describe("generador bandeja_t1 (tickets del Turno 1)", () => {
  it("crea la cantidad pedida, con folios consecutivos y exactamente un ticket de Karla", () => {
    for (let semilla = 0; semilla < 50; semilla++) {
      const cantidad = 3 + (semilla % 4);
      const t = bandeja?.(crearRng(semilla), "/home/becario/tickets/", cantidad, "becario") ?? [];
      expect(t).toHaveLength(cantidad);
      const folios = t.map((e) => Number(/T-(\d+)\.txt$/.exec(e.ruta)?.[1]));
      for (let i = 1; i < folios.length; i++) expect(folios[i]).toBe((folios[0] ?? 0) + i);
      const deKarla = t.filter((e) => e.contenido?.includes("Karla"));
      expect(deKarla).toHaveLength(1);
      for (const e of t) {
        expect(e.dueno).toBe("becario");
        expect(e.contenido).toMatch(/^Ticket T-\d+\nSolicita: .+\nAsunto: .+\n(Detalle: .+\n)?$/);
      }
    }
  });

  it("el ticket de Karla no siempre queda en la misma posición", () => {
    const posiciones = new Set(
      Array.from({ length: 30 }, (_, s) =>
        (bandeja?.(crearRng(s), "/t/", 5, "becario") ?? []).findIndex((e) => e.contenido?.includes("Karla")),
      ),
    );
    expect(posiciones.size).toBeGreaterThan(2);
  });

  it("con la variable folio_karla, el ticket de Karla lleva ese folio", () => {
    for (let s = 0; s < 20; s++) {
      const t = bandeja?.(crearRng(s), "/t/", 4, "becario", { folio_karla: "1050" }) ?? [];
      const k = t.find((e) => e.contenido?.includes("Karla"));
      expect(k?.ruta).toBe("/t/T-1050.txt");
    }
  });
});
