import { randomBytes } from "node:crypto";
import type { Config } from "./entorno.js";
import type { RepositorioPartidas } from "./partidas.js";
import type { OpcionesPartidas } from "./rutas-partidas.js";

/** En memoria (desarrollo y e2e), el límite de partidas nuevas por origen sube: la suite crea muchas. */
export const LIMITE_CREAR_EN_PRUEBAS = 500;

/**
 * Qué guarda las partidas: Postgres con DATABASE_URL y PARTIDAS_PEPPER (producción, límites de siempre);
 * memoria solo con PARTIDAS_EN_MEMORIA=1, fuera de producción y fuera de Railway. Si falta algo, la API
 * contesta 503 (nunca se pierden partidas en silencio) y el resto del sitio sigue.
 */
export function modoPartidas(
  config: Config,
  crear: { postgres: (url: string) => RepositorioPartidas; memoria: () => RepositorioPartidas },
): { partidas: OpcionesPartidas | null; falta: string | null } {
  if (config.databaseUrl && config.pepper)
    return { partidas: { repo: crear.postgres(config.databaseUrl), pepper: config.pepper }, falta: null };
  if (config.partidasEnMemoria && !config.produccion && !config.enRailway)
    return {
      partidas: {
        repo: crear.memoria(),
        pepper: config.pepper ?? randomBytes(32),
        limiteCreacionPorHora: LIMITE_CREAR_EN_PRUEBAS,
      },
      falta: null,
    };
  return { partidas: null, falta: config.databaseUrl ? "PARTIDAS_PEPPER" : "DATABASE_URL" };
}
