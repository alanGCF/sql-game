import type { Personajes } from "../engine/mision/curriculo";
import { globos } from "../engine/mision/esquema";
import type { EventoJornada } from "./jornada";

/** Lo que hace una opción además de contestar (F4-03): pedir pista, elegir de qué, o platicar. */
export type AccionOpcion =
  | { tipo: "pista" }
  | { tipo: "pista_de"; mision: string; objetivo: string }
  | { tipo: "platicar" };

/** Una opción de respuesta del jugador en un diálogo. */
export interface OpcionDialogo {
  texto: string;
  /** Lo que contesta quien habla. */
  respuesta?: readonly string[] | undefined;
  /** Bandera que queda en la partida al elegirla. */
  flag?: string | undefined;
  accion?: AccionOpcion | undefined;
}

/** Un globo en pantalla (D-22): llamadas en tarjeta a un lado; lo demás, subtítulo con el departamento. */
export interface Dialogo {
  /** Llamada en tarjeta, subtítulo (D-22) o pensamiento del protagonista en su nube (F4-06). */
  forma: "llamada" | "subtitulo" | "pensamiento";
  quien: string;
  nombre: string;
  /** "Llamada · ext. 214" en las llamadas; el departamento en los subtítulos. */
  detalle: string;
  texto: string;
  /** Línea de una llamada que hizo el jugador desde el teléfono (F4-01): colgar la quita. */
  saliente?: true;
  /** Opciones de respuesta del jugador (F4-02): en lugar de "Siguiente", se elige una. */
  opciones?: OpcionDialogo[];
  /** Llamada entrante a la que pertenece la línea (F4-04): contestarla o perderla va junta. */
  entrante?: string;
  /** Primera línea de una llamada entrante que todavía suena (falta contestar). */
  timbre?: true;
  /** Lo dice alguien que vino al cubículo (F4-09): mientras tanto está parado detrás de la mampara. */
  visita?: true;
}

/**
 * Llamadas entrantes (F4-04): las líneas seguidas en tarjeta de una misma persona forman una llamada que
 * suena; la primera lleva `timbre` hasta que la contestas. Las que hizo el jugador (saliente) no suenan.
 */
export function conTimbre(dialogos: readonly Dialogo[], nuevoId: () => string): Dialogo[] {
  let actual: { id: string; quien: string } | null = null;
  return dialogos.map((d) => {
    if (d.forma !== "llamada" || d.saliente || d.entrante) {
      actual = null;
      return d;
    }
    if (actual?.quien === d.quien) return { ...d, entrante: actual.id };
    actual = { id: nuevoId(), quien: d.quien };
    return { ...d, entrante: actual.id, timbre: true };
  });
}

/** Un diálogo suelto (fuera de los eventos de una misión), con el nombre y el departamento del personaje. */
export function dialogoDe(
  quien: string,
  texto: string,
  llamada: boolean,
  personajes: Personajes["personajes"],
): Dialogo {
  const [d] = dialogosDe(
    [{ tipo: "dialogo", mision: "", entrega: llamada ? "llamada" : "visita", quien, texto }],
    personajes,
  );
  return d as Dialogo;
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
    if (e.tipo === "dialogo")
      return [
        {
          ...crear(e.quien, e.texto, e.entrega === "llamada"),
          ...(e.entrega === "visita" ? { visita: true as const } : {}),
        },
      ];
    if (e.tipo !== "efecto") return [];
    const f = e.efecto;
    if (f.tipo === "llamada_entrante") return globos(f.texto).map((t) => crear(f.de, t, true));
    if (f.tipo === "mensaje") return globos(f.texto).map((t) => crear(f.de, t, false));
    if (f.tipo === "visita") {
      // F4-09: quien viene al cubículo se queda mientras habla; sus opciones van en el último globo.
      const lineas = globos(f.texto);
      return lineas.map((t, i) => ({
        ...crear(f.de, t, false),
        visita: true as const,
        ...(f.opciones && i === lineas.length - 1
          ? { opciones: f.opciones.map((o) => ({ ...o, respuesta: globos(o.respuesta) })) }
          : {}),
      }));
    }
    if (f.tipo === "pensamiento")
      return globos(f.texto).map((texto) => ({
        forma: "pensamiento" as const,
        quien: "jugador",
        nombre: "Tú",
        detalle: "",
        texto,
      }));
    return [];
  });
}
