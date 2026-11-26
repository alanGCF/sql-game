import { describe, expect, it } from "vitest";
import type { EventoJornada } from "../../src/game/jornada";
import { favoresTerminados, postitsDe, recienTachados } from "../../src/game/pizarron";

describe("pizarrón animado (F4-07)", () => {
  it("detecta los renglones que se acaban de tachar (no los que ya estaban)", () => {
    const antes = [
      { texto: "A", hecho: true },
      { texto: "B", hecho: false },
      { texto: "C", hecho: false },
    ];
    const ahora = [
      { texto: "A", hecho: true },
      { texto: "B", hecho: true },
      { texto: "C", hecho: false },
    ];
    expect(recienTachados(antes, ahora)).toEqual(["B"]);
    // Una misión nueva (otros renglones) no se anima.
    expect(recienTachados(antes, [{ texto: "Z", hecho: true }])).toEqual([]);
  });

  it("detecta los post-its de favor que se terminaron", () => {
    expect(favoresTerminados(["Lentes", "Impresora"], ["Impresora"])).toEqual(["Lentes"]);
    expect(favoresTerminados(["Lentes"], ["Lentes", "Otro"])).toEqual([]);
  });

  it("los post-its informativos salen de los efectos postit, en orden", () => {
    const eventos: EventoJornada[] = [
      { tipo: "efecto", mision: "m", efecto: { tipo: "postit", texto: "Ext. de Karla: 402" } },
      { tipo: "efecto", mision: "m", efecto: { tipo: "flag", nombre: "x" } },
    ];
    expect(postitsDe(eventos)).toEqual(["Ext. de Karla: 402"]);
  });
});
