import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import { LIMITE_CUERPO_BYTES, LIMITE_TASA_GLOBAL_POR_MINUTO } from "../../shared/limites.js";

export interface AppOptions {
  /** Carpeta del build del cliente. Sin ella solo se sirve la API. */
  staticDir?: string;
  logger?: boolean;
  /** Saltos de proxy confiables (Railway pone uno delante del contenedor). */
  trustProxyHops?: number;
  rateLimitMax?: number;
}

/** CSP estricta: todo del mismo origen; WASM permitido para sql.js. Cambiarla requiere ADR. */
export const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
  styleSrc: ["'self'"],
  imgSrc: ["'self'", "data:", "blob:"],
  mediaSrc: ["'self'", "blob:"],
  fontSrc: ["'self'"],
  connectSrc: ["'self'"],
  workerSrc: ["'self'", "blob:"],
  objectSrc: ["'none'"],
  baseUri: ["'none'"],
  frameAncestors: ["'none'"],
  formAction: ["'none'"],
  upgradeInsecureRequests: [],
};

const PERMISSIONS_POLICY =
  "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), interest-cohort=()";

export async function buildApp(opts: AppOptions = {}): Promise<FastifyInstance> {
  const hops = opts.trustProxyHops ?? 1;
  const app = Fastify({
    logger: opts.logger
      ? { redact: ["req.headers.authorization", "req.headers.cookie", "req.params.codigo"] }
      : false,
    bodyLimit: LIMITE_CUERPO_BYTES,
    // Confiar solo en N saltos (equivale a trustProxy numérico de proxy-addr). Nunca `true`:
    // el cliente podría falsificar su IP con X-Forwarded-For y saltarse el límite de tasa.
    trustProxy: (_address: string, hop: number) => hop < hops,
    connectionTimeout: 10_000,
    requestTimeout: 15_000,
  });

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: { useDefaults: false, directives: CSP_DIRECTIVES },
    strictTransportSecurity: { maxAge: 31_536_000, includeSubDomains: true },
    referrerPolicy: { policy: "no-referrer" },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    frameguard: { action: "deny" },
  });

  app.addHook("onSend", async (_req, reply) => {
    reply.header("Permissions-Policy", PERMISSIONS_POLICY);
  });

  await app.register(fastifyRateLimit, {
    global: true,
    max: opts.rateLimitMax ?? LIMITE_TASA_GLOBAL_POR_MINUTO,
    timeWindow: "1 minute",
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const status = error.statusCode ?? 500;
    if (status >= 500) request.log.error(error);
    const codigo =
      status === 413
        ? "demasiado_grande"
        : status === 429
          ? "demasiadas_solicitudes"
          : status >= 500
            ? "error_interno"
            : "solicitud_invalida";
    // Nunca devolver mensajes ni trazas internas.
    reply.status(status >= 400 ? status : 500).send({ error: codigo });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ error: "no_encontrado" });
  });

  app.get("/healthz", async () => ({ ok: true }));

  if (opts.staticDir) {
    await app.register(fastifyStatic, {
      root: opts.staticDir,
      index: ["index.html"],
      wildcard: false,
      dotfiles: "deny",
      setHeaders(reply, path) {
        // Archivos con hash: caché larga. index.html: siempre revalidar.
        reply.header(
          "Cache-Control",
          path.includes("/assets/") ? "public, max-age=31536000, immutable" : "no-cache",
        );
      },
    });
  }

  return app;
}
