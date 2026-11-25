import { describe, expect, it } from "vitest";
import { horaTexto, iluminacion, mezclarColor } from "../../src/game/hora";

const min = (h: number, m = 0) => h * 60 + m;

describe("luz de la ventana por hora de juego", () => {
  it("mezcla colores hex por componente", () => {
    expect(mezclarColor("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mezclarColor("#102030", "#102030", 0.7)).toBe("#102030");
  });

  it("a las 15:30 es tarde: sol fuerte y sin luces en la planta", () => {
    const l = iluminacion(min(15, 30));
    expect(l.intensidadSol).toBeGreaterThan(1);
    expect(l.lucesPlanta).toBe(0);
  });

  it("de noche el sol casi no alumbra y la planta tiene las luces prendidas", () => {
    for (const m of [min(20), min(22, 15), min(23, 59), min(24)]) {
      const l = iluminacion(m);
      expect(l.intensidadSol).toBeLessThan(0.2);
      expect(l.lucesPlanta).toBe(1);
    }
  });

  it("la luz baja sin saltos de la tarde a la noche", () => {
    let antes = iluminacion(min(15, 30)).intensidadSol;
    for (let m = min(15, 30); m <= min(24); m += 5) {
      const ahora = iluminacion(m).intensidadSol;
      expect(ahora).toBeLessThanOrEqual(antes + 1e-9);
      expect(antes - ahora).toBeLessThan(0.1);
      antes = ahora;
    }
  });

  it("fuera del turno se queda en los extremos", () => {
    expect(iluminacion(min(9))).toEqual(iluminacion(min(15, 30)));
    expect(iluminacion(min(26))).toEqual(iluminacion(min(24)));
  });

  it("la etapa sirve para refrescar los reflejos pocas veces por turno", () => {
    const etapas = new Set<string>();
    for (let m = min(15, 30); m <= min(24); m += 1) etapas.add(iluminacion(m).etapa);
    expect([...etapas]).toEqual(["tarde", "atardecer", "noche"]);
  });

  it("formatea la hora del reloj", () => {
    expect(horaTexto(min(15, 30))).toBe("15:30");
    expect(horaTexto(min(9, 5))).toBe("09:05");
    expect(horaTexto(min(24, 10))).toBe("00:10");
  });
});
