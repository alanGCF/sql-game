// Lógica de `npm run play -- --mision <id>`: presentar la misión, procesar una línea del jugador
// (comando o ?orden) y correr la solución. play.ts solo maneja argumentos, la sesión y la entrada.
import { codigoDeId } from "../../src/engine/mision/curriculo";
import { respuestaEsperada } from "../../src/engine/mision/harness";
import type { Avance, Efecto, MisionEnCurso } from "../../src/engine/mision/runtime";
import { plantilla } from "../../src/engine/vars";
import { cargarPersonajes } from "./contenido";

const personajes = cargarPersonajes().personajes;
const nombre = (id: string) => personajes[id]?.nombre ?? id;
const companero = (personajes.companero?.nombre ?? "Eduardo").split(" ")[0];

const AYUDA =
  "Teclea comandos como en la terminal. ?pista [objetivo] pide una pista a " +
  `${companero}, ?responder <objetivo> <valor> contesta un ticket, ?pendientes muestra el pizarrón.`;

// biome-ignore lint/suspicious/noControlCharactersInRegex: ESC es justo lo que buscamos.
export const sinAnsi = (t: string) => t.replace(/\x1b\[[0-9;]*m/g, "");

function pendientes(mc: MisionEnCurso): string {
  return mc
    .pendientes()
    .map((p) => `[${p.cumplido ? "x" : " "}] ${p.pendiente} (${p.id})`)
    .join("\n");
}

export function presentar(mc: MisionEnCurso): string {
  const m = mc.mision;
  const briefing = mc.briefing().map((b) => `${nombre(b.quien)}: ${b.texto}`);
  return [
    `Misión ${codigoDeId(m.id)}: ${m.titulo}`,
    "",
    ...briefing,
    "",
    "Pendientes:",
    pendientes(mc),
    "",
    AYUDA,
    "",
  ].join("\n");
}

function efecto(e: Efecto): string | null {
  switch (e.tipo) {
    case "mensaje":
    case "llamada_entrante":
    case "visita":
      return `[${e.tipo.replace("_", " ")}] ${nombre(e.de)}: ${e.texto}`;
    case "postit":
      return `[post-it] ${e.texto}`;
    case "wall":
      return `[wall] Broadcast message from ${e.de}: ${e.texto}`;
    case "flag":
      return null;
  }
}

function avance(mc: MisionEnCurso, a: Avance): string {
  const lineas: string[] = [];
  for (const id of a.cumplidos) {
    const p = mc.pendientes().find((x) => x.id === id);
    lineas.push(`✓ ${p?.pendiente ?? id}`);
  }
  for (const e of a.efectos) {
    const t = efecto(e);
    if (t) lineas.push(t);
  }
  if (a.completada && a.cumplidos.length) {
    const n = mc.estrellas();
    lineas.push(`Misión completada ${"★".repeat(n)}${"☆".repeat(3 - n)}`);
  }
  return lineas.length ? `${lineas.join("\n")}\n` : "";
}

/** Id exacto o parte única de un id ("firma" → "responder-firma"). */
function objetivo(mc: MisionEnCurso, dado: string): string {
  const ids = mc.mision.objetivos.map((o) => o.id);
  if (ids.includes(dado)) return dado;
  const parecidos = ids.filter((id) => id.includes(dado));
  if (parecidos.length === 1 && parecidos[0]) return parecidos[0];
  if (parecidos.length > 1) throw new Error(`«${dado}» coincide con varios: ${parecidos.join(", ")}`);
  throw new Error(`no hay un objetivo «${dado}». Objetivos: ${ids.join(", ")}`);
}

/** Procesa una línea del jugador y devuelve el texto que vería. */
export async function procesar(mc: MisionEnCurso, linea: string): Promise<string> {
  const t = linea.trim();
  if (t.startsWith("?")) {
    const [orden = "", ...resto] = t.slice(1).split(/\s+/);
    try {
      if (orden === "pista") {
        const id = resto[0] ? objetivo(mc, resto[0]) : mc.pendientes().find((p) => !p.cumplido)?.id;
        if (!id) return `${companero}: Ya terminaste todo, ¿qué más quieres?\n`;
        const p = mc.pista(id);
        if (!p) return `${companero}: Ya te dije todo lo que sé de eso.\n`;
        return `${companero} (pista ${p.nivel}/3, ${id}): ${p.texto}\n`;
      }
      if (orden === "responder") {
        const [dado = "", ...valor] = resto;
        const r = await mc.responder(objetivo(mc, dado), valor.join(" "));
        if (r.correcta) return avance(mc, r) || "✓ Ya estaba respondido.\n";
        return r.comentario ? `No es correcto. ${r.comentario}\n` : "No es correcto.\n";
      }
      if (orden === "pendientes") return `${pendientes(mc)}\n`;
    } catch (e) {
      return `error: ${e instanceof Error ? e.message : String(e)}\n`;
    }
    return `${AYUDA}\n`;
  }
  const r = await mc.ejecutar(linea);
  if (!r.ejecutada) return `(pensamiento) ${r.pensamiento ?? ""}\n`;
  let salida = "";
  for (const f of r.fragmentos) {
    if (f.tipo === "glosa") salida += `↳ ${f.texto}\n`;
    else if (f.tipo === "pensamiento") salida += `(pensamiento) ${f.texto}\n`;
    else salida += f.texto;
  }
  return salida + avance(mc, r);
}

/** Corre la solución de referencia mostrando cada paso como lo teclearía el jugador. */
export async function correrSolucion(mc: MisionEnCurso): Promise<{ texto: string; completada: boolean }> {
  let texto = "";
  for (const p of mc.mision.solucion) {
    let linea: string;
    if (typeof p === "string") linea = plantilla(p, mc.vars);
    else if ("responder" in p) {
      const v = p.responder.valor.includes("{{respuesta.")
        ? await respuestaEsperada(mc, p.responder.objetivo)
        : plantilla(p.responder.valor, mc.vars);
      linea = `?responder ${p.responder.objetivo} ${v}`;
    } else {
      texto += "(los pasos SQL llegan con el motor SQL, F5)\n";
      continue;
    }
    texto += `$ ${linea}\n${await procesar(mc, linea)}`;
  }
  return { texto, completada: mc.cumplidos.size === mc.mision.objetivos.length };
}
