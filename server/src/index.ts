import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DIAS_RETENCION_PARTIDAS } from "../../shared/limites.js";
import { buildApp } from "./app.js";
import { leerEntorno } from "./entorno.js";
import { modoPartidas } from "./modo-partidas.js";
import { codigoDeError, programarRetencion, repositorioEnMemoria, repositorioPostgres } from "./partidas.js";

const here = dirname(fileURLToPath(import.meta.url));
const config = leerEntorno(process.env);

const { partidas, falta } = modoPartidas(config, {
  postgres: (url) =>
    repositorioPostgres(url, (codigo) => app.log.error({ codigo }, "conexión inactiva de Postgres perdida")),
  memoria: repositorioEnMemoria,
});

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
