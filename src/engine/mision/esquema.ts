import { z } from "zod";

/** Esquema de misiones y favores (docs/plan/05-arquitectura.md §Esquema de misión). Regla C1 del harness. */

const Concepto = z.string().regex(/^[a-z]+\.[a-z_]+\.[a-z_]+$/, "concepto con formato dominio.área.concepto");
const Texto280 = z.string().min(1).max(280, "máximo 280 caracteres por globo");
const Ruta = z.string().startsWith("/", "ruta absoluta");
const HostRuta = z.strictObject({ host: z.string().min(1), ruta: Ruta });

export const GeneradorEsquema = z.discriminatedUnion("tipo", [
  z.strictObject({ tipo: z.literal("entero"), min: z.number().int(), max: z.number().int() }),
  z.strictObject({ tipo: z.literal("ip"), red: z.string(), min: z.number().int(), max: z.number().int() }),
  z.strictObject({ tipo: z.literal("hora"), desde: z.string(), hasta: z.string() }),
  z.strictObject({ tipo: z.literal("elegir"), de: z.array(z.union([z.string(), z.number()])).min(1) }),
  z.strictObject({
    tipo: z.literal("clave"),
    palabras: z.array(z.string()).min(1),
    digitos: z.number().int().min(1),
  }),
]);

const Referencia = z.union([
  z.strictObject({ comando: z.string().min(1) }),
  z.strictObject({ sql: z.string().min(1) }),
]);

export type Predicado =
  | { archivo_leido: { host: string; ruta: string } }
  | { archivo_existe: { host: string; ruta: string; tipo?: "archivo" | "carpeta" | undefined } }
  | { no_existe: { host: string; ruta: string } }
  | {
      archivo_contiene: {
        host: string;
        ruta: string;
        patron?: string | undefined;
        igual?: string | undefined;
        lineas_min?: number | undefined;
      };
    }
  | { arbol_igual: { host: string; a: string; b: string } }
  | { permisos: { host: string; ruta: string; modo?: string | undefined; dueno?: string | undefined } }
  | {
      respuesta: {
        donde: "ticket" | "libreta";
        esperado?: string | undefined;
        esperado_de?: { comando: string } | { sql: string } | undefined;
        acepta_tambien?: string[] | undefined;
        comentarios?: { si: string[]; texto: string }[] | undefined;
      };
    }
  | { flag: { nombre: string } }
  | { sesion_en: { host?: string | undefined; usuario?: string | undefined; cwd?: string | undefined } }
  | { comando_ejecutado: { comando: string } }
  | { consulta_resultado: { esperado_sql: string; orden_importa?: boolean | undefined } }
  | { estado_db: { sql: string; esperado: string } }
  | { host_descubierto: { host: string } }
  | { todos: Predicado[] }
  | { alguno: Predicado[] }
  | { no: Predicado };

export const PredicadoEsquema: z.ZodType<Predicado> = z.lazy(() =>
  z.union([
    z.strictObject({ archivo_leido: HostRuta }),
    z.strictObject({
      archivo_existe: z.strictObject({
        host: z.string(),
        ruta: Ruta,
        tipo: z.enum(["archivo", "carpeta"]).optional(),
      }),
    }),
    z.strictObject({ no_existe: HostRuta }),
    z.strictObject({
      archivo_contiene: z.strictObject({
        host: z.string(),
        ruta: Ruta,
        patron: z.string().optional(),
        igual: z.string().optional(),
        lineas_min: z.number().int().optional(),
      }),
    }),
    z.strictObject({ arbol_igual: z.strictObject({ host: z.string(), a: Ruta, b: Ruta }) }),
    z.strictObject({
      permisos: z.strictObject({
        host: z.string(),
        ruta: Ruta,
        modo: z.string().optional(),
        dueno: z.string().optional(),
      }),
    }),
    z.strictObject({
      respuesta: z
        .strictObject({
          donde: z.enum(["ticket", "libreta"]),
          esperado: z.string().optional(),
          esperado_de: Referencia.optional(),
          acepta_tambien: z.array(z.string()).optional(),
          /** Respuestas equivocadas comunes y qué decirle al jugador (sin regañar ni dar la respuesta). */
          comentarios: z
            .array(z.strictObject({ si: z.array(z.string()).min(1), texto: Texto280 }))
            .optional(),
        })
        .refine((r) => (r.esperado === undefined) !== (r.esperado_de === undefined), {
          message: "respuesta necesita exactamente uno: esperado o esperado_de",
        }),
    }),
    z.strictObject({ flag: z.strictObject({ nombre: z.string() }) }),
    z.strictObject({
      sesion_en: z.strictObject({
        host: z.string().optional(),
        usuario: z.string().optional(),
        cwd: z.string().optional(),
      }),
    }),
    z.strictObject({ comando_ejecutado: z.strictObject({ comando: z.string() }) }),
    z.strictObject({
      consulta_resultado: z.strictObject({ esperado_sql: z.string(), orden_importa: z.boolean().optional() }),
    }),
    z.strictObject({ estado_db: z.strictObject({ sql: z.string(), esperado: z.string() }) }),
    z.strictObject({ host_descubierto: z.strictObject({ host: z.string() }) }),
    z.strictObject({ todos: z.array(PredicadoEsquema).min(1) }),
    z.strictObject({ alguno: z.array(PredicadoEsquema).min(1) }),
    z.strictObject({ no: PredicadoEsquema }),
  ]),
);

const Paso = z.union([
  z.string().min(1),
  z.strictObject({ responder: z.strictObject({ objetivo: z.string(), valor: z.string() }) }),
  z.strictObject({ sql: z.string().min(1) }),
]);
export type Paso = z.infer<typeof Paso>;

const Parche = z.discriminatedUnion("tipo", [
  z.strictObject({
    tipo: z.literal("archivo"),
    host: z.string(),
    ruta: Ruta,
    contenido: z.string().optional(),
    propietario: z.string().optional(),
    grupo: z.string().optional(),
    modo: z
      .string()
      .regex(/^0?[0-7]{3}$/)
      .optional(),
    modificado: z.string().optional(),
  }),
  z.strictObject({
    tipo: z.literal("carpeta"),
    host: z.string(),
    ruta: Ruta,
    propietario: z.string().optional(),
    modo: z.string().optional(),
  }),
  z.strictObject({ tipo: z.literal("borrar"), host: z.string(), ruta: Ruta }),
  z.strictObject({
    tipo: z.literal("generador"),
    host: z.string(),
    generador: z.string(),
    destino: Ruta,
    cantidad: z.union([z.number(), z.string()]),
  }),
  z.strictObject({ tipo: z.literal("sql"), sentencias: z.string() }),
]);

/** Lo que dice alguien en un evento: un globo, o de 2 a 4 seguidos (F4-06; 02-trama.md, regla 3). */
const Globos = z.union([Texto280, z.array(Texto280).min(2).max(4)]);

/** Los globos de un texto de efecto, siempre como lista. */
export function globos(texto: string | readonly string[]): string[] {
  return typeof texto === "string" ? [texto] : [...texto];
}

const Efecto = z.discriminatedUnion("tipo", [
  z.strictObject({ tipo: z.literal("mensaje"), de: z.string(), texto: Globos }),
  z.strictObject({ tipo: z.literal("llamada_entrante"), de: z.string(), texto: Globos }),
  z.strictObject({ tipo: z.literal("visita"), de: z.string(), texto: Globos }),
  /** Lo que piensa el protagonista, en su nube (F4-06). */
  z.strictObject({ tipo: z.literal("pensamiento"), texto: Globos }),
  z.strictObject({ tipo: z.literal("flag"), nombre: z.string() }),
  z.strictObject({ tipo: z.literal("postit"), texto: Texto280 }),
  z.strictObject({ tipo: z.literal("wall"), de: z.string(), texto: z.string() }),
]);

const Objetivo = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  pendiente: z.string().min(1).max(80),
  cuando: PredicadoEsquema,
  pistas: z.tuple([Texto280, Texto280, Texto280]).refine((p) => /`[^`]+`/.test(p[2]), {
    message: "la pista 3 debe incluir el comando exacto entre backticks",
  }),
});

export const MisionEsquema = z
  .strictObject({
    id: z.string().regex(/^t(\d{1,2}|e)-[mf]\d{2}-[a-z0-9-]+$/, "id tN-mNN-slug o tN-fNN-slug"),
    turno: z.union([z.number().int().min(0).max(13), z.literal("TE")]),
    orden: z.number().int().min(1),
    tipo: z.enum(["ticket", "investigacion", "repaso", "evento", "final", "favor"]),
    titulo: z.string().min(1).max(40),
    duracion_estimada_min: z.number().int().min(1).max(15),
    ensena: z.array(Concepto).max(2),
    refuerza: z.array(Concepto).min(1).max(3).optional(),
    disponible_desde: z.string().optional(),
    requiere: z.array(Concepto),
    entrega: z.enum(["pizarron", "llamada", "visita", "ticket", "correo"]),
    host_inicial: z.string(),
    usuario_inicial: z.string(),
    cwd_inicial: Ruta,
    apps: z.array(z.enum(["terminal", "tickets", "correo", "datos", "red"])).optional(),
    variables: z.record(z.string(), GeneradorEsquema).optional(),
    mundo: z.strictObject({ parches: z.array(Parche) }).optional(),
    briefing: z
      .array(z.strictObject({ quien: z.string(), texto: Texto280 }))
      .min(2)
      .max(4),
    objetivos: z.array(Objetivo).min(1).max(3),
    solucion: z.array(Paso).min(1),
    soluciones_alternativas: z.array(z.array(Paso).min(1)).min(1),
    contraejemplos: z.array(z.strictObject({ objetivo: z.string(), pasos: z.array(Paso).min(1) })).min(1),
    libreta: z
      .array(
        z.strictObject({
          pestana: z.enum(["historia", "comandos", "pistas"]),
          concepto: Concepto.optional(),
          texto: z.string().optional(),
        }),
      )
      .optional(),
    recompensas: z.strictObject({
      xp: z.number().int().min(0),
      logros: z.array(z.string()),
      adorno: z.string().optional(),
    }),
    eventos: z.record(z.string(), z.array(Efecto)).optional(),
  })
  .superRefine((m, ctx) => {
    const ids = m.objetivos.map((o) => o.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: "custom", message: "ids de objetivos repetidos", path: ["objetivos"] });
    m.contraejemplos.forEach((c, i) => {
      if (!ids.includes(c.objetivo)) {
        ctx.addIssue({
          code: "custom",
          message: `objetivo inexistente: ${c.objetivo}`,
          path: ["contraejemplos", i, "objetivo"],
        });
      }
    });
    const pasos = [m.solucion, ...m.soluciones_alternativas, ...m.contraejemplos.map((c) => c.pasos)].flat();
    for (const p of pasos) {
      if (typeof p === "object" && "responder" in p && !ids.includes(p.responder.objetivo)) {
        ctx.addIssue({
          code: "custom",
          message: `responder a objetivo inexistente: ${p.responder.objetivo}`,
          path: ["solucion"],
        });
      }
    }
    if (m.tipo === "favor") {
      if (m.ensena.length)
        ctx.addIssue({ code: "custom", message: "un favor no enseña conceptos nuevos", path: ["ensena"] });
      if (!m.refuerza)
        ctx.addIssue({ code: "custom", message: "un favor necesita refuerza", path: ["refuerza"] });
      if (!m.disponible_desde)
        ctx.addIssue({
          code: "custom",
          message: "un favor necesita disponible_desde",
          path: ["disponible_desde"],
        });
    } else if (!["repaso", "final", "evento"].includes(m.tipo) && m.ensena.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: `una misión de tipo ${m.tipo} debe enseñar al menos un concepto`,
        path: ["ensena"],
      });
    }
  });

export type Mision = z.infer<typeof MisionEsquema>;

/** Valida y devuelve errores legibles con la ruta del campo. */
export function validarMision(
  datos: unknown,
): { ok: true; mision: Mision } | { ok: false; errores: string[] } {
  const r = MisionEsquema.safeParse(datos);
  if (r.success) return { ok: true, mision: r.data };
  return {
    ok: false,
    errores: r.error.issues.map((i) => `${i.path.length ? i.path.join(".") : "(raíz)"}: ${i.message}`),
  };
}
