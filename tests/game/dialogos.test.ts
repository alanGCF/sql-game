import { describe, expect, it } from "vitest";
import { cargarPersonajes } from "../../scripts/lib/contenido";
import { dialogosDe } from "../../src/game/dialogos";
import type { EventoJornada } from "../../src/game/jornada";

const personajes = cargarPersonajes().personajes;

describe("diálogos en pantalla (D-22)", () => {
  it("llamadas en tarjeta con extensión; lo demás en subtítulo con el departamento, nunca 'visita'", () => {
    const eventos: EventoJornada[] = [
      { tipo: "mision_iniciada", mision: "m", titulo: "t", favor: false },
      { tipo: "dialogo", mision: "m", entrega: "ticket", quien: "karla", texto: "Te dejé un ticket." },
      { tipo: "dialogo", mision: "m", entrega: "llamada", quien: "companero", texto: "Te marco rapidito." },
      { tipo: "efecto", mision: "m", efecto: { tipo: "llamada_entrante", de: "companero", texto: "¡Eso!" } },
      { tipo: "efecto", mision: "m", efecto: { tipo: "visita", de: "don_chuy", texto: "¿Qué tanto lees?" } },
      { tipo: "efecto", mision: "m", efecto: { tipo: "flag", nombre: "x" } },
    ];
    expect(dialogosDe(eventos, personajes).map((d) => [d.forma, d.nombre, d.detalle])).toEqual([
      ["subtitulo", "Ing. Karla Ibáñez", "Calidad"],
      ["llamada", "Eduardo Téllez", "Llamada · ext. 214"],
      ["llamada", "Eduardo Téllez", "Llamada · ext. 214"],
      ["subtitulo", 'Jesús "Don Chuy" Ortega', "Mantenimiento"],
    ]);
  });
});
