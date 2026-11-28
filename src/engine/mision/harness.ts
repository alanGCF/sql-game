import { inicioTurno } from "../calendario";
import { GameClock, Shell } from "../index";
import type { MundoBase } from "../mundo-base";
import { clasificar } from "../shell/classify";
import { textoPlano } from "../shell/lexer";
import { conUsuario } from "../usuario";
import { plantilla, VariableDesconocida } from "../vars";
import { vfsDesde } from "../vfs";
import { diferencias } from "../vfs-diff";
import type { Curriculo, Personajes } from "./curriculo";
import { type Mision, type Paso, validarMision } from "./esquema";
import { revisarConCurriculo } from "./harness-curriculo";
import { calcularEsperado, evaluar } from "./predicados";
import { MisionEnCurso } from "./runtime";

/** Harness de contenido (docs/plan/07-calidad-harness.md §2). */

export interface Hallazgo {
  regla: string;
  severidad: "error" | "aviso";
  mensaje: string;
}

export interface OpcionesHarness {
  semillas: number;
  curriculo?: Curriculo;
  personajes?: Personajes;
  /** Mundo base (content/mundo/); por omisión, solo la carpeta personal del usuario inicial. */
  mundo?: MundoBase;
}

/**
 * El contenido debe funcionar con cualquier nombre de jugador (F4-17): cada semilla usa un usuario distinto.
 */
export const USUARIOS_DE_PRUEBA = ["sofia", "tecnico", "jose-luis", "ana_maria", "x", "root2"] as const;
export const usuarioDePrueba = (semilla: number): string =>
  USUARIOS_DE_PRUEBA[semilla % USUARIOS_DE_PRUEBA.length] ?? "tecnico";

function iniciar(m: Mision, semilla: number, o: OpcionesHarness): MisionEnCurso {
  const jugador = usuarioDePrueba(semilla);
  if (o.mundo) return MisionEnCurso.sobreMundo(m, o.mundo, semilla, new Set(), jugador);
  const mi = conUsuario(m, jugador);
  const reloj = GameClock.desde(inicioTurno(mi.turno));
  const home = `/home/${mi.usuario_inicial}`;
  const shell = Shell.crear(
    vfsDesde([{ ruta: `${home}/`, dueno: mi.usuario_inicial }], reloj.now()),
    reloj,
    { name: mi.usuario_inicial, groups: [mi.usuario_inicial, "sistemas"], home },
    mi.host_inicial,
  );
  return new MisionEnCurso(m, shell, semilla, { usuario: jugador }, new Set());
}

/** Valor que debe teclear el jugador para un objetivo de respuesta, en el mundo actual. */
export async function respuestaEsperada(mc: MisionEnCurso, objetivo: string): Promise<string> {
  const o = mc.mision.objetivos.find((x) => x.id === objetivo);
  if (!o || !("respuesta" in o.cuando)) return "";
  const r = o.cuando.respuesta;
  if (r.esperado !== undefined) return plantilla(r.esperado, mc.vars);
  return r.esperado_de ? await calcularEsperado(mc.shell, r.esperado_de) : "";
}

async function correr(mc: MisionEnCurso, pasos: readonly Paso[]): Promise<string[]> {
  const problemas: string[] = [];
  for (const p of pasos) {
    if (typeof p === "string") {
      const linea = plantilla(p, mc.vars);
      const r = await mc.ejecutar(linea);
      if (!r.ejecutada) problemas.push(`el paso "${linea}" no se ejecuta (globo de pensamiento)`);
    } else if ("responder" in p) {
      let valor = p.responder.valor;
      if (valor.includes("{{respuesta.")) valor = await respuestaEsperada(mc, p.responder.objetivo);
      else valor = plantilla(valor, mc.vars);
      await mc.responder(p.responder.objetivo, valor);
    } else if ("accion" in p) {
      // Lo que haría la interfaz al abrir la libreta, mirar alrededor, etc. (F4-14).
      mc.flags.add(p.accion);
      await mc.revisar();
    } else {
      problemas.push("pasos SQL llegan con el motor SQL (F5)");
    }
  }
  return problemas;
}

function comandosDePista(texto: string): string[] {
  return [...texto.matchAll(/`([^`]+)`/g)].map((m) => m[1] as string);
}

export async function revisarMision(datos: unknown, o: OpcionesHarness): Promise<Hallazgo[]> {
  const h: Hallazgo[] = [];
  const error = (regla: string, mensaje: string) => h.push({ regla, severidad: "error", mensaje });
  const aviso = (regla: string, mensaje: string) => h.push({ regla, severidad: "aviso", mensaje });

  const v = validarMision(datos);
  if (!v.ok) {
    for (const e of v.errores) error("C1", e);
    return h;
  }
  const m = v.mision;
  if (o.curriculo) h.push(...revisarConCurriculo(m, o.curriculo, o.personajes));

  // C10: la sesión inicial existe en el mundo base.
  if (o.mundo) {
    const host = o.mundo.hosts.find((x) => x.host === m.host_inicial);
    if (!host) error("C10", `host_inicial desconocido: ${m.host_inicial}`);
    else if (!host.usuarios[m.usuario_inicial])
      error("C10", `usuario_inicial ${m.usuario_inicial} no existe en ${m.host_inicial}`);
    if (h.some((x) => x.severidad === "error")) return h;
  }

  // C8 (parcial): cada comando de la solución se ejecuta en el motor y existe en la superficie.
  const mc0 = iniciar(m, 0, o);
  for (const p of m.solucion) {
    if (typeof p !== "string") continue;
    let linea: string;
    try {
      linea = plantilla(p, mc0.vars);
    } catch (e) {
      if (!(e instanceof VariableDesconocida)) throw e;
      error("C10", `${e.message} en la solución: "${p}"`);
      continue;
    }
    const c = clasificar(linea);
    if (c.tipo !== "ejecutar") error("C8", `"${p}" no es un comando soportado (${c.tipo})`);
    else {
      for (const cadena of c.programa)
        for (const { tuberia } of cadena)
          for (const cmd of tuberia) {
            const nombre = cmd.palabras[0] ? textoPlano(cmd.palabras[0]) : "";
            if (nombre && !mc0.shell.mundo.comandos.has(nombre))
              error("C8", `comando no implementado: ${nombre}`);
          }
    }
  }
  if (h.some((x) => x.regla === "C10" && x.severidad === "error")) return h;

  // C2/C3: solución y alternativas completan la misión con cada semilla.
  const respuestasPorSemilla: string[] = [];
  for (let s = 0; s < o.semillas; s++) {
    const conjuntos: [string, readonly Paso[]][] = [
      ["solucion", m.solucion],
      ...m.soluciones_alternativas.map((a, i) => [`alternativa ${i + 1}`, a] as [string, readonly Paso[]]),
    ];
    for (const [nombre, pasos] of conjuntos) {
      const mc = iniciar(m, s, o);
      const problemas = await correr(mc, pasos);
      for (const pr of problemas) error(nombre === "solucion" ? "C2" : "C3", `semilla ${s}: ${pr}`);
      const faltan = m.objetivos.filter((x) => !mc.cumplidos.has(x.id)).map((x) => x.id);
      if (faltan.length)
        error(nombre === "solucion" ? "C2" : "C3", `semilla ${s}: ${nombre} no cumple ${faltan.join(", ")}`);
      if (nombre === "solucion") {
        const esperadas = await Promise.all(m.objetivos.map((x) => respuestaEsperada(mc, x.id)));
        respuestasPorSemilla.push(esperadas.join("|"));
      }
    }
    if (h.some((x) => x.severidad === "error")) break; // no repetir el mismo error en cada semilla
  }

  // C4: los contraejemplos no cumplen su objetivo.
  for (const c of m.contraejemplos) {
    const mc = iniciar(m, 0, o);
    await correr(mc, c.pasos);
    if (mc.cumplidos.has(c.objetivo))
      error("C4", `el contraejemplo ${JSON.stringify(c.pasos)} cumple ${c.objetivo}`);
  }

  // C5: el comando de la pista 3 resuelve el objetivo (o, si es de respuesta, se ejecuta sin error).
  for (const { id } of m.objetivos) {
    const mc = iniciar(m, 0, o);
    // La misión ya con el usuario de prueba en lugar de {{usuario}}.
    const obj = mc.mision.objetivos.find((x) => x.id === id);
    if (!obj || "flag" in obj.cuando) continue; // objetivo de interfaz: la pista dice qué hacer, no un comando
    const cmds = comandosDePista(plantilla(obj.pistas[2], mc.vars));
    for (const cmd of cmds) {
      const r = await mc.ejecutar(cmd);
      if (!r.ejecutada) error("C5", `${obj.id}: la pista 3 dicta "${cmd}", que no se ejecuta`);
      else if (mc.shell.sesion.ultimoCodigo !== 0) error("C5", `${obj.id}: "${cmd}" termina con error`);
    }
    const estado = { shell: mc.shell, respuestas: mc.respuestas, flags: mc.flags };
    if (!("respuesta" in obj.cuando) && !(await evaluar(obj.cuando, estado, obj.id))) {
      error("C5", `${obj.id}: el comando de la pista 3 no cumple el objetivo`);
    }
  }

  // C11: determinismo (misma semilla → mismo mundo final).
  const a = iniciar(m, 3, o);
  const b = iniciar(m, 3, o);
  await correr(a, m.solucion);
  await correr(b, m.solucion);
  const da = JSON.stringify(diferencias(vfsDesde([], 0), a.shell.mundo.vfs));
  const db = JSON.stringify(diferencias(vfsDesde([], 0), b.shell.mundo.vfs));
  if (da !== db) error("C11", "la misma semilla produce mundos distintos");

  // C17: las respuestas deben variar entre semillas para no poder memorizarse.
  if (o.semillas > 1 && respuestasPorSemilla.length > 1 && new Set(respuestasPorSemilla).size === 1) {
    aviso("C17", "ninguna respuesta cambia con la semilla: se puede memorizar");
  }

  // C13: duración y objetivos razonables.
  if (m.duracion_estimada_min < 3 || m.duracion_estimada_min > 8) aviso("C13", "duración fuera de 3–8 min");
  return h;
}
