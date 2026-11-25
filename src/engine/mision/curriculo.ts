import { z } from "zod";

/** Esquema del grafo de conceptos (content/curriculo.yaml) y de personajes (content/personajes.yaml). */

const Concepto = z.string().regex(/^[a-z]+\.[a-z_]+\.[a-z_]+$/);
const CodigoMision = z.string().regex(/^T\d{1,2}-M\d{1,2}$/);

/** "T3-M2" → [3, 2] para ordenar misiones. El tiempo extra (TE, sábado 7) va entre T8 y T9. */
export function ordenMision(codigo: string): [number, number] {
  const m = /^T(\d+|E)-[MF](\d+)$/.exec(codigo);
  if (!m) throw new Error(`código de misión inválido: ${codigo}`);
  return [m[1] === "E" ? 8.5 : Number(m[1]), Number(m[2])];
}

export function compararMisiones(a: string, b: string): number {
  const [ta, oa] = ordenMision(a);
  const [tb, ob] = ordenMision(b);
  return ta - tb || oa - ob;
}

/** "t1-m02-el-leeme" → "T1-M2"; "t3-f01-x" → "T3-F1". */
export function codigoDeId(id: string): string {
  const m = /^t(\d+|e)-([mf])(\d+)-/.exec(id);
  if (!m) throw new Error(`id de misión inválido: ${id}`);
  return `T${m[1]?.toUpperCase()}-${m[2]?.toUpperCase()}${Number(m[3])}`;
}

export const CurriculoEsquema = z
  .strictObject({
    conceptos: z.record(
      Concepto,
      z.strictObject({
        dominio: z.enum(["linux", "sql", "redes"]),
        nombre: z.string().min(1),
        sintaxis: z.string(),
        requiere: z.array(Concepto),
        mision: CodigoMision,
        repaso: z.string(),
      }),
    ),
    superficie: z.record(
      z.string(),
      z.strictObject({ forma: z.string(), turno: z.string(), referencia: z.string() }),
    ),
  })
  .superRefine((c, ctx) => {
    for (const [id, con] of Object.entries(c.conceptos)) {
      for (const r of con.requiere) {
        const req = c.conceptos[r];
        if (!req) {
          ctx.addIssue({
            code: "custom",
            message: `${id} requiere ${r}, que no existe`,
            path: ["conceptos", id],
          });
        } else if (compararMisiones(req.mision, con.mision) > 0) {
          ctx.addIssue({
            code: "custom",
            message: `${id} (${con.mision}) requiere ${r}, que se enseña después (${req.mision})`,
            path: ["conceptos", id],
          });
        }
      }
    }
  });

export type Curriculo = z.infer<typeof CurriculoEsquema>;

export const PersonajesEsquema = z.strictObject({
  personajes: z.record(
    z.string().regex(/^[a-z_]+$/),
    z.strictObject({
      nombre: z.string().min(1),
      rol: z.string(),
      /** Lo que se muestra junto al nombre en diálogos y tickets (D-22): "Mantenimiento", "Calidad"… */
      departamento: z.string().min(1).optional(),
      extension: z.number().int().optional(),
      usuario: z.string().optional(),
      /** Llamadas por turno antes de "ponte a trabajar" (2) y de dejar de contestar (3). */
      paciencia: z.number().int().min(0).max(10).optional(),
    }),
  ),
});

export type Personajes = z.infer<typeof PersonajesEsquema>;
