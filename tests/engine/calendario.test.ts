import { describe, expect, it } from "vitest";
import { inicioTurno } from "../../src/engine/calendario";

describe("calendario de turnos (docs/plan/02-trama.md §Calendario)", () => {
  it.each<[number | "TE", string]>([
    [0, "2026-10-27"],
    [1, "2026-10-28"],
    [3, "2026-10-30"],
    [4, "2026-11-02"],
    [8, "2026-11-06"],
    ["TE", "2026-11-07"],
    [9, "2026-11-09"],
    [13, "2026-11-13"],
  ])("el turno %s empieza el %s a las 15:30", (turno, fecha) => {
    expect(inicioTurno(turno)).toBe(`${fecha}T15:30:00Z`);
  });

  it("los turnos de lunes a viernes nunca caen en fin de semana", () => {
    for (let t = 0; t <= 13; t++) expect([0, 6]).not.toContain(new Date(inicioTurno(t)).getUTCDay());
  });

  it("rechaza turnos fuera del calendario", () => {
    expect(() => inicioTurno(14)).toThrow(/turno fuera del calendario: 14/);
  });
});
