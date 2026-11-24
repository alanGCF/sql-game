import { entero, type Rng } from "../rng";
import type { Entrada } from "../vfs";

/** Generadores de archivos con semilla usados por los parches `tipo: generador`. */
export type GeneradorArchivos = (rng: Rng, destino: string, cantidad: number, dueno: string) => Entrada[];

const ASUNTOS = [
  "La impresora de etiquetas no imprime",
  "No puedo entrar al MES",
  "Se trabó la pantalla de la Línea 1",
  "Necesito acceso a la carpeta de Calidad",
  "El reloj checador va adelantado",
  "Cambiar el tóner de la impresora del comedor",
];

export const GENERADORES: Readonly<Record<string, GeneradorArchivos>> = {
  tickets_iniciales(rng, destino, cantidad, dueno) {
    const base = entero(rng, 1040, 1080);
    return Array.from({ length: cantidad }, (_, i) => ({
      ruta: `${destino.replace(/\/$/, "")}/T-${base + i}.txt`,
      dueno,
      contenido: `Ticket T-${base + i}\nAsunto: ${ASUNTOS[(base + i) % ASUNTOS.length]}\n`,
    }));
  },
};
