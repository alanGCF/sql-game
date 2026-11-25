import { z } from "zod";

/** Variables de entorno del servidor, validadas al arrancar: un valor inválido detiene el proceso. */
const Entorno = z.object({
  PORT: z
    .string()
    .regex(/^\d+$/, "entero")
    .transform(Number)
    .pipe(z.number().int().min(1).max(65_535))
    .default(3000),
  // Saltos de proxy confiables (Railway pone uno). De más permite falsificar la IP con X-Forwarded-For.
  TRUST_PROXY_HOPS: z
    .string()
    .regex(/^\d$/, "entero de 0 a 3")
    .transform(Number)
    .pipe(z.number().max(3))
    .default(1),
  STATIC_DIR: z.string().min(1).optional(),
  // Railway la da desde el servicio Postgres (red privada). Sin ella: memoria en desarrollo, 503 en producción.
  DATABASE_URL: z
    .string()
    .regex(/^postgres(ql)?:\/\/\S+$/, "URL postgres://")
    .optional(),
  NODE_ENV: z.string().optional(),
});

export interface Config {
  port: number;
  trustProxyHops: number;
  staticDir?: string;
  databaseUrl?: string;
  produccion: boolean;
}

export function leerEntorno(env: Readonly<Record<string, string | undefined>>): Config {
  const r = Entorno.safeParse(env);
  if (!r.success)
    throw new Error(
      `entorno inválido: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
    );
  const c: Config = {
    port: r.data.PORT,
    trustProxyHops: r.data.TRUST_PROXY_HOPS,
    produccion: r.data.NODE_ENV === "production",
  };
  if (r.data.STATIC_DIR) c.staticDir = r.data.STATIC_DIR;
  if (r.data.DATABASE_URL) c.databaseUrl = r.data.DATABASE_URL;
  return c;
}
