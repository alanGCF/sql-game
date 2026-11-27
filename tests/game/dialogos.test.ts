import { describe, expect, it } from "vitest";
import { cargarPersonajes } from "../../scripts/lib/contenido";
import { conTimbre, type Dialogo, dialogosDe } from "../../src/game/dialogos";
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

describe("llamadas entrantes (F4-04)", () => {
  const d = (quien: string, forma: "llamada" | "subtitulo", texto: string) =>
    dialogosDe(
      [
        forma === "llamada"
          ? { tipo: "dialogo", mision: "m", entrega: "llamada", quien, texto }
          : { tipo: "dialogo", mision: "m", entrega: "visita", quien, texto },
      ],
      personajes,
    )[0] as Dialogo;

  it("agrupa las líneas seguidas de una llamada de la misma persona; la primera suena", () => {
    let n = 0;
    const r = conTimbre(
      [
        d("companero", "llamada", "a"),
        d("companero", "llamada", "b"),
        d("karla", "subtitulo", "c"),
        d("companero", "llamada", "d"),
      ],
      () => `ll-${++n}`,
    );
    expect(r.map((x) => [x.texto, x.entrante ?? null, x.timbre ?? false])).toEqual([
      ["a", "ll-1", true],
      ["b", "ll-1", false],
      ["c", null, false],
      ["d", "ll-2", true],
    ]);
  });

  it("las líneas de una llamada que hizo el jugador no suenan", () => {
    const saliente = { ...d("companero", "llamada", "a"), saliente: true as const };
    expect(conTimbre([saliente], () => "x")[0]).toEqual(saliente);
  });
});

describe("varios globos y pensamiento (F4-06)", () => {
  it("un efecto con lista de globos da un diálogo por globo; el pensamiento va en su nube", () => {
    const eventos: EventoJornada[] = [
      {
        tipo: "efecto",
        mision: "m",
        efecto: { tipo: "visita", de: "don_chuy", texto: ["¿Qué tanto lees?", "Al rato vengo."] },
      },
      { tipo: "efecto", mision: "m", efecto: { tipo: "pensamiento", texto: "¿Quién será R.?" } },
    ];
    expect(dialogosDe(eventos, personajes).map((d) => [d.forma, d.quien, d.texto])).toEqual([
      ["subtitulo", "don_chuy", "¿Qué tanto lees?"],
      ["subtitulo", "don_chuy", "Al rato vengo."],
      ["pensamiento", "jugador", "¿Quién será R.?"],
    ]);
  });
});

describe("visitas (F4-09)", () => {
  it("las líneas de una visita la marcan como visita y sus opciones van en el último globo", () => {
    const eventos: EventoJornada[] = [
      {
        tipo: "efecto",
        mision: "m",
        efecto: {
          tipo: "visita",
          de: "don_chuy",
          texto: ["¿Qué tanto lees?", "Dime."],
          opciones: [
            { texto: "Una nota.", respuesta: "Ah, la de la ingeniera." },
            { texto: "Nada.", respuesta: ["Ajá.", "Al rato vengo."] },
          ],
        },
      },
      { tipo: "dialogo", mision: "m", entrega: "visita", quien: "karla", texto: "Te traigo un ticket." },
      { tipo: "dialogo", mision: "m", entrega: "ticket", quien: "karla", texto: "Te dejé un ticket." },
    ];
    const d = dialogosDe(eventos, personajes);
    expect(d.map((x) => [x.texto, x.visita ?? false, x.opciones?.length ?? 0])).toEqual([
      ["¿Qué tanto lees?", true, 0],
      ["Dime.", true, 2],
      ["Te traigo un ticket.", true, 0],
      ["Te dejé un ticket.", false, 0],
    ]);
    expect(d[1]?.opciones?.map((o) => o.respuesta)).toEqual([
      ["Ah, la de la ingeniera."],
      ["Ajá.", "Al rato vengo."],
    ]);
  });
});
