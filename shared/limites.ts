/** Límites compartidos entre cliente y servidor (ver docs/plan/08-seguridad.md). */
export const LIMITE_CUERPO_BYTES = 64 * 1024;
export const LIMITE_TASA_GLOBAL_POR_MINUTO = 300;
/** Archivos con hash de /assets/: contador aparte y más alto (un salón detrás de un mismo NAT). */
export const LIMITE_TASA_ASSETS_POR_MINUTO = 1200;

/** API de partidas (05-arquitectura.md §Servidor): por origen (IPv4 o /64 de IPv6). */
export const LIMITE_CREAR_PARTIDAS_POR_HORA = 10;
/** Partidas sin actividad durante estos días se borran (D-18). */
export const DIAS_RETENCION_PARTIDAS = 60;
/** Leer y guardar comparten este presupuesto por origen (IPv4 o /64 de IPv6). */
export const LIMITE_PETICIONES_CON_CODIGO_POR_MINUTO = 60;
/** Tras tantos códigos inexistentes en una hora, ese origen recibe 429 en toda petición con código. */
export const LIMITE_CODIGOS_INEXISTENTES_POR_HORA = 20;
/** El código de partida viaja en esta cabecera, nunca en la URL (los logs del borde registran la ruta). */
export const CABECERA_CODIGO = "x-codigo-partida";
