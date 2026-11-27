/** Ganchos para pruebas E2E. Solo se exponen con ?test=1 (ver docs/plan/07-calidad-harness.md §5). */
export interface TestHooks {
  webgl: boolean;
  ready: boolean;
  info?: () => { calls: number; triangles: number };
  setVista?: (vista: string) => void;
  mirar?: (x: number, y: number) => void;
  /** Responde un objetivo (mientras llega la app Tickets, F3-03). */
  responder?: (mision: string, objetivo: string, valor: string) => Promise<{ correcta: boolean }>;
  partida?: () => {
    mision: string | null;
    pendientes: string[];
    eventos: string[];
    nombre: string;
    codigo: string | null;
    guardado: string;
  };
  /** El diálogo en pantalla (forma, nombre, detalle, texto) o null. */
  dialogo?: () => { forma: string; nombre: string; detalle: string; texto: string } | null;
  /** Lo que muestra el pizarrón: "[x] texto" por renglón y los favores en post-it. */
  pizarron?: () => { renglones: string[]; favores: string[] };
  /** Pistas anotadas en la libreta (F4-03), en orden. */
  pistas?: () => { objetivo: string; nivel: number; texto: string }[];
  /** La llamada que suena se va al buzón sin esperar (F4-04). */
  dejarSonar?: () => void;
  /** Mensajes en el buzón del teléfono. */
  buzon?: () => number;
  /** Lo que se está animando en el pizarrón (F4-07): renglones rayándose y post-its cayendo al bote. */
  animacionPizarron?: () => {
    tachando: number;
    cayendo: number;
    vistos: { tachados: number; caidos: number };
  };
  /** Quién está de visita en el cubículo y en qué va: llegando, aquí o yéndose (F4-09). */
  visitante?: () => { quien: string | null; fase: string | null };
  /** Fija la hora que muestra la escena ("HH:MM", 24:00 = medianoche) para capturas de la ventana. */
  hora?: (hhmm: string) => void;
}

declare global {
  interface Window {
    __planta7?: TestHooks;
  }
}

export const isTestMode = new URLSearchParams(window.location.search).has("test");
/** En pruebas las animaciones van apagadas; `&animar=1` las prende para revisarlas (F4-07). */
export const animarEnPruebas = isTestMode && new URLSearchParams(window.location.search).has("animar");

export function setTestHook<K extends keyof TestHooks>(key: K, value: TestHooks[K]): void {
  if (!isTestMode) return;
  window.__planta7 ??= { webgl: false, ready: false };
  window.__planta7[key] = value;
}
