import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import {
  LIMITE_CUERPO_BYTES,
  LIMITE_TASA_ASSETS_POR_MINUTO,
  LIMITE_TASA_GLOBAL_POR_MINUTO,
} from "../../shared/limites.js";

export interface AppOptions {
  /** Carpeta del build del cliente. Sin ella solo se sirve la API. */
  staticDir?: string;
  logger?: boolean;
  /** Destino del log (pruebas). Implica logger activo. */
  logStream?: { write(linea: string): void };
  /** Saltos de proxy confiables (Railway pone uno delante del contenedor). */
  trustProxyHops?: number;
  rateLimitMax?: number;
  rateLimitAssetsMax?: number;
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

/** Cabeceras para respuestas que salen antes de los hooks (URL malformada). */
const CABECERAS_ERROR_TEMPRANO = {
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "permissions-policy": PERMISSIONS_POLICY,
};

const esAsset = (req: FastifyRequest) => req.url.startsWith("/assets/");

function urlInvalida(_error: FastifyError, _req: FastifyRequest, reply: FastifyReply): void {
  reply.code(400).headers(CABECERAS_ERROR_TEMPRANO).send({ error: "solicitud_invalida" });
}

export async function buildApp(opts: AppOptions = {}): Promise<FastifyInstance> {
  const hops = opts.trustProxyHops ?? 1;
  const conLog = opts.logger || opts.logStream;
  const app = Fastify({
    logger: conLog
      ? {
          ...(opts.logStream ? { stream: opts.logStream } : {}),
          serializers: {
            // Solo la ruta declarada (/api/partidas/:codigo), nunca la URL real: el código de partida
            // no debe quedar en los logs. Sin cabeceras ni cuerpo.
            req: (req: FastifyRequest) => ({
              method: req.method,
              ruta: req.routeOptions?.url ?? "(sin ruta)",
              remoteAddress: req.ip,
            }),
          },
        }
      : false,
    bodyLimit: LIMITE_CUERPO_BYTES,
    // Confiar solo en N saltos (equivale a trustProxy numérico de proxy-addr). Nunca `true`:
    // el cliente podría falsificar su IP con X-Forwarded-For y saltarse el límite de tasa.
    trustProxy: (_address: string, hop: number) => hop < hops,
    connectionTimeout: 10_000,
    requestTimeout: 15_000,
    // URL malformada: sale antes de los hooks (helmet, límite de tasa); respuesta uniforme sin detalles.
    frameworkErrors: urlInvalida,
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

  const maxGeneral = opts.rateLimitMax ?? LIMITE_TASA_GLOBAL_POR_MINUTO;
  const maxAssets = opts.rateLimitAssetsMax ?? LIMITE_TASA_ASSETS_POR_MINUTO;
  await app.register(fastifyRateLimit, {
    global: true,
    // Dos contadores por IP: archivos con hash de /assets/ y todo lo demás (página y API).
    keyGenerator: (req) => `${req.ip}|${esAsset(req) ? "assets" : "general"}`,
    max: (req) => (esAsset(req) ? maxAssets : maxGeneral),
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

  // Los 404 también gastan límite: sin esto se podrían adivinar rutas sin tope.
  app.setNotFoundHandler({ preHandler: app.rateLimit() }, (_request, reply) => {
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
