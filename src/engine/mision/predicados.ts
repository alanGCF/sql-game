import { GameClock } from "../clock";
import { Shell } from "../index";
import type { Sesion } from "../shell/executor";
import type { VNode } from "../vfs";
import type { Predicado } from "./esquema";

/** Evaluación de objetivos por resultado (ADR-005): nunca se compara el texto del comando. */

export class NoImplementado extends Error {}

export interface EstadoMision {
  shell: Shell;
  /** Respuestas tecleadas por el jugador, por id de objetivo. */
  respuestas: ReadonlyMap<string, string>;
  flags: ReadonlySet<string>;
}

/** Minúsculas, sin acentos, sin espacios sobrantes. */
export function normalizarRespuesta(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}

function nodo(e: EstadoMision, ruta: string): VNode | null {
  try {
    return e.shell.mundo.vfs.lookup(ruta);
  } catch {
    return null;
  }
}

function contenido(n: VNode | null): string | null {
  return n?.type === "file" ? n.content : null;
}

function arbolesIguales(a: VNode, b: VNode): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "file" || b.type === "file") return contenido(a) === contenido(b);
  if (a.children.size !== b.children.size) return false;
  for (const [nombre, hijo] of a.children) {
    const otro = b.children.get(nombre);
    if (!otro || !arbolesIguales(hijo, otro)) return false;
  }
  return true;
}

/** Copia aislada del mundo y la sesión para calcular respuestas sin tocar la partida. */
export function shellOculto(s: Shell): Shell {
  const sesion: Sesion = {
    ...s.sesion,
    env: new Map(s.sesion.env),
    historial: [...s.sesion.historial],
  };
  return new Shell(
    { vfs: s.mundo.vfs.clone(), reloj: new GameClock(s.mundo.reloj.now()), comandos: s.mundo.comandos },
    sesion,
  );
}

/** Valor esperado de una respuesta calculada: salida de una solución de referencia en el mundo oculto. */
export async function calcularEsperado(
  s: Shell,
  ref: { comando: string } | { sql: string },
): Promise<string> {
  if ("sql" in ref) throw new NoImplementado("esperado_de.sql llega con el motor SQL (F5)");
  const r = await shellOculto(s).ejecutar(ref.comando, { sinTerminal: true });
  return r.fragmentos
    .filter((f) => f.tipo === "stdout")
    .map((f) => f.texto)
    .join("")
    .trim();
}

export async function evaluar(p: Predicado, e: EstadoMision, objetivo: string): Promise<boolean> {
  const host = (h: string) => h === e.shell.sesion.host;
  if ("archivo_leido" in p)
    return host(p.archivo_leido.host) && e.shell.registro.leidos.has(p.archivo_leido.ruta);
  if ("archivo_existe" in p) {
    const n = host(p.archivo_existe.host) ? nodo(e, p.archivo_existe.ruta) : null;
    if (!n) return false;
    const tipo = p.archivo_existe.tipo;
    return !tipo || (tipo === "carpeta" ? n.type === "dir" : n.type === "file");
  }
  if ("no_existe" in p) return host(p.no_existe.host) && nodo(e, p.no_existe.ruta) === null;
  if ("archivo_contiene" in p) {
    const c = host(p.archivo_contiene.host) ? contenido(nodo(e, p.archivo_contiene.ruta)) : null;
    if (c === null) return false;
    const { patron, igual, lineas_min } = p.archivo_contiene;
    if (igual !== undefined && c !== igual) return false;
    if (patron !== undefined && !new RegExp(patron, "m").test(c)) return false;
    if (lineas_min !== undefined && c.split("\n").filter(Boolean).length < lineas_min) return false;
    return true;
  }
  if ("arbol_igual" in p) {
    const a = nodo(e, p.arbol_igual.a);
    const b = nodo(e, p.arbol_igual.b);
    return host(p.arbol_igual.host) && a !== null && b !== null && arbolesIguales(a, b);
  }
  if ("permisos" in p) {
    const n = host(p.permisos.host) ? nodo(e, p.permisos.ruta) : null;
    if (!n) return false;
    if (p.permisos.modo !== undefined && n.mode !== Number.parseInt(p.permisos.modo, 8)) return false;
    return p.permisos.dueno === undefined || n.owner === p.permisos.dueno;
  }
  if ("respuesta" in p) {
    const dada = e.respuestas.get(objetivo);
    if (dada === undefined) return false;
    const r = p.respuesta;
    const esperado = r.esperado ?? (r.esperado_de ? await calcularEsperado(e.shell, r.esperado_de) : "");
    const validas = [esperado, ...(r.acepta_tambien ?? [])].map(normalizarRespuesta);
    return validas.includes(normalizarRespuesta(dada));
  }
  if ("flag" in p) return e.flags.has(p.flag.nombre);
  if ("sesion_en" in p) {
    const { host: h, usuario, cwd } = p.sesion_en;
    const s = e.shell.sesion;
    return (
      (h === undefined || s.host === h) &&
      (usuario === undefined || s.usuario.name === usuario) &&
      (cwd === undefined || s.cwd === cwd)
    );
  }
  if ("comando_ejecutado" in p) {
    // Solo para comandos observacionales (pwd, whoami): se normalizan espacios.
    const objetivoCmd = p.comando_ejecutado.comando.trim().replace(/\s+/g, " ");
    return e.shell.sesion.historial.some((h) => h.trim().replace(/\s+/g, " ") === objetivoCmd);
  }
  if ("todos" in p) {
    for (const q of p.todos) if (!(await evaluar(q, e, objetivo))) return false;
    return true;
  }
  if ("alguno" in p) {
    for (const q of p.alguno) if (await evaluar(q, e, objetivo)) return true;
    return false;
  }
  if ("no" in p) return !(await evaluar(p.no, e, objetivo));
  const clave = Object.keys(p)[0];
  throw new NoImplementado(`predicado ${clave}: llega con SQL (F5) o red (F6)`);
}
