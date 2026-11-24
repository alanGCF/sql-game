import { GameClock, Shell } from "../index";
import { clasificar } from "../shell/classify";
import { textoPlano } from "../shell/lexer";
import { plantilla } from "../vars";
import { type Entrada, vfsDesde } from "../vfs";
import { diferencias } from "../vfs-diff";
import { type Mision, type Paso, validarMision } from "./esquema";
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
  /** Mundo base del turno; por omisión, solo la carpeta personal del usuario inicial. */
  mundoBase?: (m: Mision) => Entrada[];
}

const AHORA = "2026-10-28T15:40:00Z";

function iniciar(m: Mision, semilla: number, o: OpcionesHarness): MisionEnCurso {
  const reloj = GameClock.desde(AHORA);
  const home = `/home/${m.usuario_inicial}`;
  const entradas = o.mundoBase?.(m) ?? [{ ruta: `${home}/`, dueno: m.usuario_inicial }];
  const shell = Shell.crear(
    vfsDesde(entradas, reloj.now()),
    reloj,
    { name: m.usuario_inicial, groups: [m.usuario_inicial, "sistemas"], home },
    m.host_inicial,
  );
  return new MisionEnCurso(m, shell, semilla, {}, new Set());
}

/** Valor que debe teclear el jugador para un objetivo de respuesta, en el mundo actual. */
async function respuestaEsperada(mc: MisionEnCurso, objetivo: string): Promise<string> {
  const o = mc.mision.objetivos.find((x) => x.id === objetivo);
  if (!o || !("respuesta" in o.cuando)) return "";
  const r = o.cuando.respuesta;
  return r.esperado ?? (r.esperado_de ? await calcularEsperado(mc.shell, r.esperado_de) : "");
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

  // C8 (parcial): cada comando de la solución se ejecuta en el motor y existe en la superficie.
  for (const p of m.solucion) {
    if (typeof p !== "string") continue;
    const c = clasificar(plantilla(p, {}).replace(/\{\{[^}]+\}\}/g, "x"));
    if (c.tipo !== "ejecutar") error("C8", `"${p}" no es un comando soportado (${c.tipo})`);
    else {
      for (const cadena of c.programa)
        for (const { tuberia } of cadena)
          for (const cmd of tuberia) {
            const nombre = cmd.palabras[0] ? textoPlano(cmd.palabras[0]) : "";
            if (nombre && !iniciar(m, 0, o).shell.mundo.comandos.has(nombre))
              error("C8", `comando no implementado: ${nombre}`);
          }
    }
  }

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
  for (const obj of m.objetivos) {
    const mc = iniciar(m, 0, o);
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
