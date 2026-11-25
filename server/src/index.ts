import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DIAS_RETENCION_PARTIDAS } from "../../shared/limites.js";
import { buildApp } from "./app.js";
import { leerEntorno } from "./entorno.js";
import { programarRetencion, repositorioEnMemoria, repositorioPostgres } from "./partidas.js";

const here = dirname(fileURLToPath(import.meta.url));
const config = leerEntorno(process.env);

// Sin base: en desarrollo, memoria; en producción la API contesta 503 (nunca perder partidas en silencio).
const partidas = config.databaseUrl
  ? repositorioPostgres(config.databaseUrl)
  : config.produccion
    ? null
    : repositorioEnMemoria();

const app = await buildApp({
  staticDir: config.staticDir ?? join(here, "../../../client"),
  logger: true,
  trustProxyHops: config.trustProxyHops,
  partidas,
});

if (!config.databaseUrl)
  app.log[config.produccion ? "error" : "warn"](
    config.produccion
      ? "sin DATABASE_URL: la API de partidas contesta 503"
      : "sin DATABASE_URL: partidas en memoria (se pierden al reiniciar)",
  );

const detenerRetencion = partidas
  ? programarRetencion(
      partidas,
      DIAS_RETENCION_PARTIDAS,
      (n) => app.log.info({ borradas: n }, "retención de partidas"),
      (e) =>
        app.log.error({ err: e instanceof Error ? { tipo: e.name } : {} }, "falla la retención de partidas"),
    )
  : () => {};

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    detenerRetencion();
    app
      .close()
      .then(() => partidas?.cerrar())
      .then(
        () => process.exit(0),
        () => process.exit(1),
      );
  });
}

await app.listen({ host: "0.0.0.0", port: config.port });
