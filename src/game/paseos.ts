import { crearRng, entero, type Rng } from "../engine/rng";

/**
 * Oficina viva (F4-15, direccion-arte.md §Escena): de vez en cuando alguien pasa a lo lejos por los pasillos
 * del fondo. Uno a la vez, cada 1.5 a 3 minutos (con la semilla) y nunca empieza durante un diálogo.
 * Sin three ni React: la escena (Paseante) lo dibuja y pide cuadros solo mientras camina (ADR-018).
 */

/** Ropa, piel y pelo de una figura de bloques (D-30); la misma silueta para visitas y paseantes. */
export interface Aspecto {
  ropa: string;
  piel: string;
  pelo: string;
  detalle?: "gorra" | "corbata" | "chongo";
  detalleColor?: string;
}

/** Gente de la oficina sin nombre: no son personajes de la historia. */
export const PASEANTES: readonly Aspecto[] = [
  { ropa: "#7a8a99", piel: "#c68b62", pelo: "#2a1d15" },
  { ropa: "#b5523b", piel: "#8d5b3f", pelo: "#151515", detalle: "chongo" },
  { ropa: "#e8e4da", piel: "#d2a07a", pelo: "#5a4030", detalle: "corbata", detalleColor: "#2f5d8a" },
  { ropa: "#3f6b4f", piel: "#a8735a", pelo: "#1d1a17", detalle: "gorra", detalleColor: "#3f6b4f" },
  { ropa: "#4b3f6b", piel: "#7a4b32", pelo: "#0f0f0f" },
];

interface Punto {
  x: number;
  z: number;
}

/**
 * El pasillo entre las dos filas de cubículos del fondo, en los dos sentidos: desde tu silla (x = 0, z = 0.45,
 * ojos a 1.18 m) se le ven la cabeza y los hombros por encima de las mamparas, como en cualquier oficina. Los
 * pasillos de los costados quedan detrás de tus mamparas y no se verían.
 */
export const RUTAS: readonly { desde: Punto; hasta: Punto }[] = [
  { desde: { x: -4.6, z: -3.8 }, hasta: { x: 4.6, z: -3.8 } },
  { desde: { x: 4.6, z: -3.8 }, hasta: { x: -4.6, z: -3.8 } },
];

/** Lo que tarda en cruzar (paso tranquilo, ~1 m/s). */
export const SEGUNDOS_PASEO = 8;
const MIN_S = 90;
const MAX_S = 180;
/** Si toca durante un diálogo, se intenta de nuevo poco después. */
const REINTENTO_S = 10;

export class PlanificadorPaseos {
  private readonly rng: Rng;
  private siguiente: number;
  private ruta = -1;

  constructor(semilla: number) {
    this.rng = crearRng(semilla ^ 0x9a5e0);
    this.siguiente = entero(this.rng, MIN_S, MAX_S);
  }

  /** Se llama cada segundo (o así): devuelve quién sale a caminar y por dónde, o null. */
  tic(segundos: number, hayDialogo: boolean): { ruta: number; quien: number } | null {
    if (segundos < this.siguiente) return null;
    if (hayDialogo) {
      this.siguiente = segundos + REINTENTO_S;
      return null;
    }
    // No dos veces seguidas por el mismo pasillo.
    const ruta = (this.ruta + 1 + entero(this.rng, 0, RUTAS.length - 2)) % RUTAS.length;
    this.ruta = ruta;
    this.siguiente = segundos + SEGUNDOS_PASEO + entero(this.rng, MIN_S, MAX_S);
    return { ruta, quien: entero(this.rng, 0, PASEANTES.length - 1) };
  }
}
