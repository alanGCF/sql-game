import { z } from "zod";
import { LIMITE_CUERPO_BYTES } from "./limites.js";

/**
 * Formato de la partida guardada (local y en el servidor). Lo validan el cliente y el servidor con el
 * mismo esquema (ADR-010, ADR-013): claves desconocidas, tamaños o tipos fuera de rango se rechazan.
 */
const Id = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9_-]+$/);
// Sin NUL ni surrogates sueltos: Postgres jsonb los rechaza y serían un 503 a voluntad.
const SURROGATE_SUELTO = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/;
export const textoSeguro = (s: string) => !s.includes("\u0000") && !SURROGATE_SUELTO.test(s);
const Texto = (max: number) => z.string().max(max).refine(textoSeguro, "texto con caracteres inválidos");

const EntradaDiff = z.strictObject({
  ruta: Texto(500).startsWith("/"),
  tipo: z.enum(["file", "dir"]),
  contenido: Texto(32_768).optional(),
  mode: z.number().int().min(0).max(0o7777),
  owner: Texto(32),
  group: Texto(32),
  mtime: z.number().int(),
});

const GuardadoMision = z.strictObject({
  id: Id,
  cumplidos: z.array(Id).max(3),
  respuestas: z.record(Id, Texto(200)),
  pistas: z.record(Id, z.number().int().min(1).max(3)),
  diff: z.strictObject({
    cambiados: z.array(EntradaDiff).max(2000),
    borrados: z.array(Texto(500)).max(2000),
  }),
  historial: z.array(Texto(500)).max(500),
  cwd: Texto(500).startsWith("/"),
  leidos: z.array(Texto(500).startsWith("/")).max(500),
});

export const PartidaEsquema = z.strictObject({
  formato: z.literal(1),
  semilla: z.number().int().min(0).max(0xffffffff),
  nombre: z.string().trim().min(1).max(40).refine(textoSeguro, "texto con caracteres inválidos"),
  contenido: Texto(64),
  turno: z.number().int().min(0).max(14),
  completadas: z.record(Id, z.strictObject({ estrellas: z.number().int().min(1).max(3) })),
  favores: z.array(Id).max(40),
  flags: z.array(Id).max(200),
  xp: z.number().int().min(0).max(1_000_000),
  notas: z.array(Texto(500)).max(200),
  mision: GuardadoMision.nullable(),
});

export type Partida = z.infer<typeof PartidaEsquema>;

/** Migraciones de formatos anteriores al actual (índice = formato de origen). */
// Map y no objeto: un `formato` hostil nunca alcanza métodos del prototipo (constructor, toString…).
const MIGRACIONES = new Map<number, (d: Record<string, unknown>) => Record<string, unknown>>();

export type ResultadoPartida = { ok: true; partida: Partida } | { ok: false; error: string };

/** Valida una partida que viene de fuera (servidor, almacenamiento local, archivo importado). */
export function leerPartida(datos: unknown): ResultadoPartida {
  let tamano: number;
  try {
    tamano = new TextEncoder().encode(JSON.stringify(datos)).length;
  } catch {
    return { ok: false, error: "no es JSON serializable" };
  }
  if (tamano > LIMITE_CUERPO_BYTES)
    return { ok: false, error: `partida de ${tamano} bytes; límite ${LIMITE_CUERPO_BYTES}` };
  let d = datos as Record<string, unknown>;
  for (
    let guarda = 0;
    d && typeof d === "object" && Number.isInteger(d.formato) && (d.formato as number) < 1 && guarda < 10;
    guarda++
  ) {
    const migrar = MIGRACIONES.get(d.formato as number);
    if (!migrar) return { ok: false, error: `formato ${String(d.formato)} sin migración` };
    d = migrar(d);
  }
  const r = PartidaEsquema.safeParse(d);
  if (r.success) return { ok: true, partida: r.data };
  const i = r.error.issues[0];
  return { ok: false, error: `${i?.path.join(".") || "(raíz)"}: ${i?.message ?? "inválida"}` };
}
