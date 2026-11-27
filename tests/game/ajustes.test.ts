import { describe, expect, it } from "vitest";
import { leerAjustes } from "../../src/game/ajustes-datos";

describe("ajustes guardados (F3-08)", () => {
  it("lee los valores válidos", () => {
    expect(leerAjustes('{"reducirMovimiento":true,"letra":"grande","contrasteAlto":true}')).toEqual({
      reducirMovimiento: true,
      letra: "grande",
      contrasteAlto: true,
      silencio: false,
      teclear: false,
      general: 80,
      efectos: 70,
      voces: 60,
      ambiente: 50,
    });
  });

  it("ignora basura y campos con tipo incorrecto", () => {
    const base = {
      reducirMovimiento: false,
      letra: "normal",
      contrasteAlto: false,
      silencio: false,
      teclear: false,
      general: 80,
      efectos: 70,
      voces: 60,
      ambiente: 50,
    };
    expect(leerAjustes(null)).toEqual(base);
    expect(leerAjustes("{no es json")).toEqual(base);
    expect(leerAjustes('{"letra":"<script>","contrasteAlto":"si","__proto__":{"x":1}}')).toEqual(base);
  });

  it("sonido (F4-10): modo silencio y volúmenes enteros de 0 a 100; lo demás se ignora", () => {
    const a = leerAjustes('{"silencio":true,"efectos":0,"voces":100,"ambiente":35}');
    expect(a).toMatchObject({ silencio: true, efectos: 0, voces: 100, ambiente: 35 });
    const b = leerAjustes('{"silencio":"si","efectos":101,"voces":-1,"ambiente":2.5}');
    expect(b).toMatchObject({ silencio: false, efectos: 70, voces: 60, ambiente: 50 });
  });
});
