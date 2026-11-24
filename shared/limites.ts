/** Límites compartidos entre cliente y servidor (ver docs/plan/08-seguridad.md). */
export const LIMITE_CUERPO_BYTES = 64 * 1024;
export const LIMITE_TASA_GLOBAL_POR_MINUTO = 300;
/** Archivos con hash de /assets/: contador aparte y más alto (un salón detrás de un mismo NAT). */
export const LIMITE_TASA_ASSETS_POR_MINUTO = 1200;
