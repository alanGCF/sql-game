import { describe, expect, it } from "vitest";
import { cargarPersonajes } from "../../scripts/lib/contenido";
import { directorio, MAX_DIGITOS, marcar } from "../../src/game/telefono";

const personajes = cargarPersonajes().personajes;

describe("teléfono (F4-01)", () => {
  it("el directorio sale de personajes.yaml: solo contactos con extensión, sin el jugador", () => {
    const d = directorio(personajes);
    expect(d.map((c) => c.extension)).toEqual(["214", "301", "402", "100", "150", "900", "0"]);
    expect(d.find((c) => c.extension === "214")).toMatchObject({ id: "companero", corto: "Eduardo" });
    expect(d.some((c) => c.id === "jugador")).toBe(false);
  });

  it("una extensión del directorio contesta; la tuya da ocupado; otra no existe", () => {
    expect(marcar("214", personajes)).toEqual({ tipo: "contesta", id: "companero" });
    expect(marcar("0", personajes)).toEqual({ tipo: "contesta", id: "conmutador" });
    expect(marcar("210", personajes)).toEqual({ tipo: "ocupado" });
    expect(marcar("215", personajes)).toEqual({ tipo: "no_existe" });
    expect(marcar("", personajes)).toEqual({ tipo: "vacio" });
  });

  it("solo dígitos y a lo más 4: lo demás no existe (no se busca un contacto por nombre)", () => {
    expect(MAX_DIGITOS).toBe(4);
    expect(marcar("21a", personajes)).toEqual({ tipo: "no_existe" });
    expect(marcar("02140", personajes)).toEqual({ tipo: "no_existe" });
    // "0214" no es "214": los ceros a la izquierda cuentan, como en un conmutador de verdad.
    expect(marcar("0214", personajes)).toEqual({ tipo: "no_existe" });
  });
});
