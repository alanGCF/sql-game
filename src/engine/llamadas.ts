import { z } from "zod";
import type { Personajes } from "./mision/curriculo";

/**
 * Llamadas que hace el jugador desde el teléfono (F4-02, 02-trama.md §Teléfono): cada contacto tiene un guion
 * en content/llamadas/<contacto>.yaml y una paciencia por turno. Llamadas 1..paciencia platican (charla,
 * rumor, aviso), la siguiente es "ponte a trabajar" y de ahí en adelante no contesta. Gerencia gasta al doble:
 * su paciencia es 1. Sin DOM ni azar fuera de la semilla.
 */
const Texto280 = z.string().min(1).max(280, "máximo 280 caracteres por globo");
const Turno = z.union([z.number().int().min(0).max(13), z.literal("TE")]);
const Bandera = z.string().regex(/^[a-z0-9_-]+$/);

const Opcion = z.strictObject({
  /** Lo que dice el jugador (botón). */
  texto: z.string().min(1).max(90),
  respuesta: z.array(Texto280).min(1).max(4),
  /** Bandera que queda en la partida al elegirla (para la historia). */
  flag: Bandera.optional(),
});

const Conversacion = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** Solo en estos turnos; sin turnos, es general (cualquier turno). */
  turnos: z.array(Turno).min(1).optional(),
  /** Solo si la partida tiene esta bandera (p. ej. leyo_leeme). */
  requiere: Bandera.optional(),
  lineas: z.array(Texto280).min(1).max(6),
  opciones: z.array(Opcion).min(2).max(3).optional(),
});

export const GuionLlamadasEsquema = z.strictObject({
  contacto: z.string().regex(/^[a-z_]+$/),
  conversaciones: z.array(Conversacion).min(1),
  ponte_a_trabajar: z.array(Texto280).min(1),
  /** Lo que piensa el jugador cuando ya no le contestan. */
  no_contesta: Texto280,
});

export type GuionLlamadas = z.infer<typeof GuionLlamadasEsquema>;
export type Conversacion = z.infer<typeof Conversacion>;
export type OpcionLlamada = z.infer<typeof Opcion>;

export type Llamada =
  | { tipo: "charla"; conversacion: Conversacion }
  | { tipo: "ponte_a_trabajar"; texto: string }
  | { tipo: "no_contesta"; texto: string };

export interface ContextoLlamada {
  turno: number | "TE";
  /** Número de esta llamada al contacto en el turno (1 = la primera). */
  llamada: number;
  paciencia: number;
  flags: ReadonlySet<string>;
  semilla: number;
}

const especifica = (c: Conversacion) => c.turnos !== undefined || c.requiere !== undefined;

export function elegirLlamada(guion: GuionLlamadas, ctx: ContextoLlamada): Llamada {
  if (ctx.llamada > ctx.paciencia + 1) return { tipo: "no_contesta", texto: guion.no_contesta };
  if (ctx.llamada === ctx.paciencia + 1) {
    const t = typeof ctx.turno === "number" ? ctx.turno : 14;
    const i = (ctx.semilla + t) % guion.ponte_a_trabajar.length;
    return { tipo: "ponte_a_trabajar", texto: guion.ponte_a_trabajar[i] as string };
  }
  const vale = guion.conversaciones.filter(
    (c) => (!c.turnos || c.turnos.includes(ctx.turno)) && (!c.requiere || ctx.flags.has(c.requiere)),
  );
  // Primero lo de este turno y lo que pide una bandera (en el orden del archivo); luego lo general.
  const candidatas = [...vale.filter(especifica), ...vale.filter((c) => !especifica(c))];
  const c = candidatas[ctx.llamada - 1] ?? candidatas[candidatas.length - 1];
  // El harness exige una conversación general, así que siempre hay candidata.
  if (!c) throw new Error(`${guion.contacto}: sin conversación para el turno ${ctx.turno}`);
  return { tipo: "charla", conversacion: c };
}

/** Harness de content/llamadas: errores en texto (vacío = todo bien). */
export function revisarLlamadas(
  guiones: Readonly<Record<string, GuionLlamadas>>,
  personajes: Personajes["personajes"],
  flagsConocidas: ReadonlySet<string>,
): string[] {
  const errores: string[] = [];
  for (const [archivo, g] of Object.entries(guiones)) {
    const donde = `content/llamadas/${archivo}.yaml`;
    if (g.contacto !== archivo)
      errores.push(`${donde}: contacto (${g.contacto}) debe llamarse como el archivo`);
    const p = personajes[g.contacto];
    if (!p) errores.push(`${donde}: ${g.contacto} no está en personajes.yaml`);
    else if (p.extension === undefined) errores.push(`${donde}: ${g.contacto} está sin extensión`);
    else if (p.paciencia === undefined) errores.push(`${donde}: ${g.contacto} no tiene paciencia`);
    if (!g.conversaciones.some((c) => !especifica(c)))
      errores.push(`${donde}: falta una conversación general (sin turnos ni requiere)`);
    const ids = new Set<string>();
    for (const c of g.conversaciones) {
      if (ids.has(c.id)) errores.push(`${donde}: id repetido: ${c.id}`);
      ids.add(c.id);
      if (c.requiere && !flagsConocidas.has(c.requiere))
        errores.push(`${donde}: ${c.id}: bandera desconocida: ${c.requiere}`);
    }
    const textos = [
      ...g.conversaciones.flatMap((c) => [
        ...c.lineas,
        ...(c.opciones ?? []).flatMap((o) => [o.texto, ...o.respuesta]),
      ]),
      ...g.ponte_a_trabajar,
      g.no_contesta,
    ];
    if (textos.some((t) => t.includes("{{")))
      errores.push(`${donde}: las llamadas no llevan variables de partida ({{…}})`);
  }
  for (const [id, p] of Object.entries(personajes))
    if (p.extension !== undefined && id !== "jugador" && !guiones[id])
      errores.push(`falta content/llamadas/${id}.yaml`);
  return errores;
}

/** Banderas que pone una opción de llamada (también cuentan como conocidas para `requiere`). */
export function flagsDeLlamadas(guiones: Readonly<Record<string, GuionLlamadas>>): string[] {
  return Object.values(guiones).flatMap((g) =>
    g.conversaciones.flatMap((c) => (c.opciones ?? []).flatMap((o) => (o.flag ? [o.flag] : []))),
  );
}
