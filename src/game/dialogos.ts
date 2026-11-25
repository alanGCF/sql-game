import type { Personajes } from "../engine/mision/curriculo";
import type { EventoJornada } from "./jornada";

/** Un globo en pantalla (D-22): llamadas en tarjeta a un lado; lo demás, subtítulo con el departamento. */
export interface Dialogo {
  forma: "llamada" | "subtitulo";
  quien: string;
  nombre: string;
  /** "Llamada · ext. 214" en las llamadas; el departamento en los subtítulos. */
  detalle: string;
  texto: string;
}

export function dialogosDe(
  eventos: readonly EventoJornada[],
  personajes: Personajes["personajes"],
): Dialogo[] {
  const crear = (quien: string, texto: string, llamada: boolean): Dialogo => {
    const p = personajes[quien];
    const detalle = llamada
      ? `Llamada${p?.extension !== undefined ? ` · ext. ${p.extension}` : ""}`
      : (p?.departamento ?? "");
    return { forma: llamada ? "llamada" : "subtitulo", quien, nombre: p?.nombre ?? quien, detalle, texto };
  };
  return eventos.flatMap((e): Dialogo[] => {
    if (e.tipo === "dialogo") return [crear(e.quien, e.texto, e.entrega === "llamada")];
    if (e.tipo !== "efecto") return [];
    const f = e.efecto;
    if (f.tipo === "llamada_entrante") return [crear(f.de, f.texto, true)];
    if (f.tipo === "visita" || f.tipo === "mensaje") return [crear(f.de, f.texto, false)];
    return [];
  });
}
