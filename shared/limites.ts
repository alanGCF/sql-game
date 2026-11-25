/** Límites compartidos entre cliente y servidor (ver docs/plan/08-seguridad.md). */
export const LIMITE_CUERPO_BYTES = 64 * 1024;
export const LIMITE_TASA_GLOBAL_POR_MINUTO = 300;
/** Archivos con hash de /assets/: contador aparte y más alto (un salón detrás de un mismo NAT). */
export const LIMITE_TASA_ASSETS_POR_MINUTO = 1200;

/** API de partidas (05-arquitectura.md §Servidor): por IP. */
export const LIMITE_CREAR_PARTIDAS_POR_HORA = 10;
export const LIMITE_LEER_PARTIDA_POR_MINUTO = 30;
export const LIMITE_GUARDAR_PARTIDA_POR_MINUTO = 60;
/** Partidas sin actividad durante estos días se borran (D-18). */
export const DIAS_RETENCION_PARTIDAS = 60;
