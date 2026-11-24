import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { leerEntorno } from "./entorno.js";

const here = dirname(fileURLToPath(import.meta.url));
const config = leerEntorno(process.env);

const app = await buildApp({
  staticDir: config.staticDir ?? join(here, "../../../client"),
  logger: true,
  trustProxyHops: config.trustProxyHops,
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    app.close().then(
      () => process.exit(0),
      () => process.exit(1),
    );
  });
}

await app.listen({ host: "0.0.0.0", port: config.port });
