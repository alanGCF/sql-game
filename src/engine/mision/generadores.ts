import { elegir, entero, type Rng } from "../rng";
import type { Variables } from "../vars";
import type { Entrada } from "../vfs";

/** Generadores de archivos con semilla (parches `tipo: generador` y `generadores` del mundo base). */
export type GeneradorArchivos = (
  rng: Rng,
  destino: string,
  cantidad: number,
  dueno: string,
  vars?: Variables,
) => Entrada[];

/** Tickets de rutina: quién pide y el asunto van juntos (sin combinaciones absurdas ni pistas falsas). */
const RUTINA: ReadonlyArray<readonly [string, string]> = [
  ["Supervisión Línea 2", "La impresora de etiquetas no imprime"],
  ["Supervisión Línea 1", "Se trabó la pantalla de la Línea 1"],
  ["Almacén", "No puedo entrar al MES"],
  ["Comedor", "Cambiar el tóner de la impresora del comedor"],
  ["Recepción", "No se oye el voceo en el almacén"],
  ["Mantenimiento (lo capturó Recepción)", "No prende el monitor del taller"],
];
const ASUNTOS = RUTINA.map(([, a]) => a);

export const GENERADORES: Readonly<Record<string, GeneradorArchivos>> = {
  tickets_iniciales(rng, destino, cantidad, dueno) {
    const base = entero(rng, 1040, 1080);
    return Array.from({ length: cantidad }, (_, i) => ({
      ruta: `${destino.replace(/\/$/, "")}/T-${base + i}.txt`,
      dueno,
      contenido: `Ticket T-${base + i}\nAsunto: ${ASUNTOS[(base + i) % ASUNTOS.length]}\n`,
    }));
  },

  /**
   * Bandeja del Turno 1: tickets de rutina y, en una posición al azar, el de Karla (T1-M2). Si existe
   * la variable de partida `folio_karla`, su ticket lleva ese folio (las pistas pueden nombrarlo).
   */
  bandeja_t1(rng, destino, cantidad, dueno, vars) {
    const deKarla = entero(rng, 0, cantidad - 1);
    const folio = Number(vars?.folio_karla);
    const base = Number.isInteger(folio) ? folio - deKarla : entero(rng, 1040, 1080);
    return Array.from({ length: cantidad }, (_, i) => {
      const id = `T-${base + i}`;
      // El detalle del ticket de Karla no debe repetir "Karla": la respuesta se busca con grep.
      const [solicita, asunto, detalle] =
        i === deKarla
          ? [
              "Ing. Karla Ibáñez (Calidad)",
              "Nota de la ingeniera anterior (LEEME.txt)",
              "Contesta aquí con qué inicial está firmada. Urge.",
            ]
          : [...elegir(rng, RUTINA), ""];
      const extra = detalle ? `Detalle: ${detalle}\n` : "";
      return {
        ruta: `${destino.replace(/\/$/, "")}/${id}.txt`,
        dueno,
        contenido: `Ticket ${id}\nSolicita: ${solicita}\nAsunto: ${asunto}\n${extra}`,
      };
    });
  },
};
