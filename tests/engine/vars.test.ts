import { describe, expect, it } from "vitest";
import { type Generador, plantilla, resolverVariables, VariableDesconocida } from "../../src/engine/vars";

const DEFS: Record<string, Generador> = {
  lote: { tipo: "entero", min: 4000, max: 4999 },
  ip_delta: { tipo: "ip", red: "10.7.3.0/24", min: 20, max: 250 },
  hora_acceso: { tipo: "hora", desde: "23:50:00", hasta: "23:58:59" },
  puerto_api: { tipo: "elegir", de: [8080, 8081, 8443, 9000] },
  contrasena: { tipo: "clave", palabras: ["duna", "ocotillo", "nopal"], digitos: 2 },
};

describe("variables de partida", () => {
  it("son deterministas por semilla", () => {
    expect(resolverVariables(7, DEFS)).toEqual(resolverVariables(7, DEFS));
  });

  it("cambian entre semillas (no se pueden memorizar)", () => {
    const lotes = new Set(Array.from({ length: 50 }, (_, s) => resolverVariables(s, DEFS).lote));
    expect(lotes.size).toBeGreaterThan(40);
  });

  it("respetan rangos y formatos en 2 000 semillas", () => {
    for (let s = 0; s < 2000; s++) {
      const v = resolverVariables(s, DEFS);
      expect(Number(v.lote)).toBeGreaterThanOrEqual(4000);
      expect(Number(v.lote)).toBeLessThanOrEqual(4999);
      expect(v.ip_delta).toMatch(/^10\.7\.3\.(\d+)$/);
      const octeto = Number(v.ip_delta?.split(".")[3]);
      expect(octeto).toBeGreaterThanOrEqual(20);
      expect(octeto).toBeLessThanOrEqual(250);
      expect(v.hora_acceso! >= "23:50:00" && v.hora_acceso! <= "23:58:59").toBe(true);
      expect(["8080", "8081", "8443", "9000"]).toContain(v.puerto_api);
      expect(v.contrasena).toMatch(/^(duna|ocotillo|nopal)\d{2}$/);
    }
  });

  it("agregar una variable no cambia las demás", () => {
    const antes = resolverVariables(99, DEFS);
    const despues = resolverVariables(99, { nueva: { tipo: "entero", min: 1, max: 9 }, ...DEFS });
    expect(despues.lote).toBe(antes.lote);
    expect(despues.ip_delta).toBe(antes.ip_delta);
  });

  it("plantilla reemplaza y falla con variables desconocidas", () => {
    const v = resolverVariables(1, DEFS);
    expect(plantilla("El lote {{lote}} salió de {{ ip_delta }}", v)).toBe(
      `El lote ${v.lote} salió de ${v.ip_delta}`,
    );
    expect(() => plantilla("{{no_existe}}", v)).toThrowError(VariableDesconocida);
  });
});
