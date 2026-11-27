import { crearRng, elegir, type Rng } from "../engine/rng";

/**
 * Sonidos a lo lejos (F4-10, D-19, direccion-arte.md §Audio): el silencio es lo normal; de vez en cuando
 * algo suena lejos en la planta. Uno cada 2 a 4 minutos (con la semilla), de 1 a 3 segundos, nunca dos a la
 * vez y nunca durante un diálogo. Cada uno trae su subtítulo.
 */
export const AMBIENTALES = {
  impresora: { segundos: 3, subtitulo: "A lo lejos, una impresora empieza a imprimir." },
  telefono_lejano: { segundos: 2, subtitulo: "Suena un teléfono en otro escritorio." },
  voceo: { segundos: 3, subtitulo: "Se oye el voceo de la planta, a lo lejos." },
  montacargas: { segundos: 2, subtitulo: "Pita un montacargas en la nave." },
  puerta: { segundos: 1, subtitulo: "Se cierra una puerta al fondo." },
} as const;

export type Ambiental = keyof typeof AMBIENTALES;

const MIN_S = 120;
const MAX_S = 240;
/** Si toca durante un diálogo, se intenta de nuevo poco después de que termine. */
const REINTENTO_S = 8;

export class PlanificadorAmbiental {
  private readonly rng: Rng;
  private siguiente: number;
  private anterior: Ambiental | null = null;

  constructor(semilla: number) {
    this.rng = crearRng(semilla ^ 0x5a0e);
    this.siguiente = this.espera();
  }

  private espera(): number {
    return MIN_S + Math.floor(this.rng() * (MAX_S - MIN_S + 1));
  }

  /** Se llama cada segundo (o así): devuelve el sonido que toca ahora, o null. */
  tic(segundos: number, hayDialogo: boolean): Ambiental | null {
    if (segundos < this.siguiente) return null;
    if (hayDialogo) {
      this.siguiente = segundos + REINTENTO_S;
      return null;
    }
    const opciones = (Object.keys(AMBIENTALES) as Ambiental[]).filter((a) => a !== this.anterior);
    const tipo = elegir(this.rng, opciones);
    this.anterior = tipo;
    this.siguiente = segundos + AMBIENTALES[tipo].segundos + this.espera();
    return tipo;
  }
}
