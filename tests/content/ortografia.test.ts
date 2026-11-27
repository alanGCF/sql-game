import { describe, expect, it } from "vitest";
import { revisarOrtografia, textosVisibles } from "../../scripts/lib/ortografia";

describe("C14: ortografía es-MX de lo que ve el jugador (F2-09)", () => {
  it("solo cuenta los textos visibles: no ids, comandos, rutas ni valores esperados", () => {
    const mision = {
      id: "t9-m01-algo",
      titulo: "Título",
      briefing: [{ quien: "companero", texto: "Hola" }],
      objetivos: [
        {
          id: "x",
          pendiente: "Pendiente",
          cuando: {
            respuesta: { esperado_de: { comando: "pwd" }, comentarios: [{ si: ["~"], texto: "Casi" }] },
          },
          pistas: ["a", "b", "c"],
        },
      ],
      solucion: ["pwd"],
      eventos: { al_completar: [{ tipo: "visita", de: "don_chuy", texto: ["Gracias"] }] },
    };
    const textos = textosVisibles(mision, "m.yaml").map((t) => t.texto);
    expect(textos.sort()).toEqual(["Casi", "Gracias", "Hola", "Pendiente", "Título", "a", "b", "c"].sort());
  });

  it("detecta una falta y no marca código, variables, rutas ni palabras del diccionario del proyecto", async () => {
    const faltas = await revisarOrtografia([
      { origen: "fixture", texto: "No hay que hechar a perder el trabajo, joven." },
      {
        origen: "limpio",
        texto:
          "Teclea `grep -r Karla tickets` en /srv/lineas/linea3 y contéstame {{lote}}. ¡Ándale, Eduardo!",
      },
    ]);
    expect(faltas.map((f) => [f.origen, f.palabra])).toEqual([["fixture", "hechar"]]);
    expect(faltas[0]?.sugerencias.length).toBeGreaterThan(0);
  });
});
