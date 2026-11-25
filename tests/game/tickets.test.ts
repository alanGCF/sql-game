import { describe, expect, it } from "vitest";
import { archivosYaml, cargarMundo, cargarPersonajes, leerYaml } from "../../scripts/lib/contenido";
import { compilarContenido, type TurnoCompilado } from "../../src/engine/mision/compilar";
import { Jornada } from "../../src/game/jornada";
import { ticketsDe, unirTickets } from "../../src/game/tickets";

const { turnos } = compilarContenido(
  archivosYaml("content/misiones").map((ruta) => {
    const y = leerYaml(ruta);
    if (!y.ok) throw new Error(y.error);
    return { ruta, datos: y.datos };
  }),
);
const t1 = turnos.get("01") as TurnoCompilado;
const personajes = cargarPersonajes().personajes;

describe("tickets de la app (D-21)", () => {
  it("T1-M1: dos tickets de Eduardo, de Sistemas, con la pregunta sin el prefijo", () => {
    const j = Jornada.iniciar(t1, cargarMundo(), 1);
    const t = ticketsDe(
      [j.actual()].filter((x) => x !== null),
      personajes,
    );
    expect(t.map((x) => [x.de, x.departamento, x.pregunta, x.resuelto])).toEqual([
      ["Eduardo Téllez", "Sistemas", "¿en qué carpeta estás? (ruta completa)", false],
      ["Eduardo Téllez", "Sistemas", "¿cuántos tickets hay en tu carpeta de tickets?", false],
    ]);
    expect(t[0]?.detalle).toContain("Te dejé tu primer ticket");
  });

  it("los objetivos que no son tickets (archivo leído, respuestas en la libreta) no salen", () => {
    const j = Jornada.iniciar(t1, cargarMundo(), 1);
    const m2 = t1.misiones[1];
    if (!m2) throw new Error("falta T1-M2");
    const objetivos = ticketsDe(
      [j.actual()].filter((x) => x !== null),
      personajes,
    ).map((x) => x.objetivo);
    expect(objetivos).not.toContain("leer-leeme");
  });

  it("al unir, los tickets que ya no están activos quedan resueltos y los nuevos se agregan al final", () => {
    const a = { mision: "m1", objetivo: "o1", de: "E", pregunta: "p", detalle: "", resuelto: false };
    const b = { mision: "m2", objetivo: "o1", de: "K", pregunta: "q", detalle: "", resuelto: false };
    expect(unirTickets([a], [b])).toEqual([{ ...a, resuelto: true }, b]);
  });
});
