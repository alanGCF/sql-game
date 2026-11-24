import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";

const here = dirname(fileURLToPath(import.meta.url));
const staticDir = process.env.STATIC_DIR ?? join(here, "../../../client");
const port = Number(process.env.PORT ?? 3000);
const hops = Number(process.env.TRUST_PROXY_HOPS ?? 1);

const app = await buildApp({ staticDir, logger: true, trustProxyHops: hops });

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    app.close().then(
      () => process.exit(0),
      () => process.exit(1),
    );
  });
}

await app.listen({ host: "0.0.0.0", port });
