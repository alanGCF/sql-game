import { describe, expect, it } from "vitest";
import { leerAjustes } from "../../src/game/ajustes-datos";

describe("ajustes guardados (F3-08)", () => {
  it("lee los valores válidos", () => {
    expect(leerAjustes('{"reducirMovimiento":true,"letra":"grande","contrasteAlto":true}')).toEqual({
      reducirMovimiento: true,
      letra: "grande",
      contrasteAlto: true,
    });
  });

  it("ignora basura y campos con tipo incorrecto", () => {
    const base = { reducirMovimiento: false, letra: "normal", contrasteAlto: false };
    expect(leerAjustes(null)).toEqual(base);
    expect(leerAjustes("{no es json")).toEqual(base);
    expect(leerAjustes('{"letra":"<script>","contrasteAlto":"si","__proto__":{"x":1}}')).toEqual(base);
  });
});
