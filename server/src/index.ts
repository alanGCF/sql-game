import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DIAS_RETENCION_PARTIDAS } from "../../shared/limites.js";
import { buildApp } from "./app.js";
import { leerEntorno } from "./entorno.js";
import { codigoDeError, programarRetencion, repositorioEnMemoria, repositorioPostgres } from "./partidas.js";
import type { OpcionesPartidas } from "./rutas-partidas.js";

const here = dirname(fileURLToPath(import.meta.url));
const config = leerEntorno(process.env);

/**
 * Postgres con DATABASE_URL y PARTIDAS_PEPPER. Memoria solo con PARTIDAS_EN_MEMORIA=1 fuera de producción.
 * Si falta algo, la API contesta 503 (nunca se pierden partidas en silencio) y el resto del sitio sigue.
 */
let partidas: OpcionesPartidas | null = null;
let falta: string | null = null;
if (config.databaseUrl && config.pepper)
  partidas = {
    repo: repositorioPostgres(config.databaseUrl, (codigo) =>
      app.log.error({ codigo }, "conexión inactiva de Postgres perdida"),
    ),
    pepper: config.pepper,
  };
else if (config.partidasEnMemoria && !config.produccion)
  partidas = { repo: repositorioEnMemoria(), pepper: config.pepper ?? randomBytes(32) };
else falta = config.databaseUrl ? "PARTIDAS_PEPPER" : "DATABASE_URL";

const app = await buildApp({
  staticDir: config.staticDir ?? join(here, "../../../client"),
  logger: true,
  trustProxyHops: config.trustProxyHops,
  partidas,
});

if (falta) app.log.error(`sin ${falta}: la API de partidas contesta 503`);
else if (config.partidasEnMemoria && !config.databaseUrl)
  app.log.warn("partidas en memoria: se pierden al reiniciar");

const detenerRetencion = partidas
  ? programarRetencion(
      partidas.repo,
      DIAS_RETENCION_PARTIDAS,
      (n) => app.log.info({ borradas: n }, "retención de partidas"),
      (e) => app.log.error({ codigo: codigoDeError(e) }, "falla la retención de partidas"),
    )
  : () => {};

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    detenerRetencion();
    app
      .close()
      .then(() => partidas?.repo.cerrar())
      .then(
        () => process.exit(0),
        () => process.exit(1),
      );
  });
}

await app.listen({ host: "0.0.0.0", port: config.port });
