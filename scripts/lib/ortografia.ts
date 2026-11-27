// C14 (07-calidad-harness.md): ortografía es-MX de los textos que ve el jugador, con cspell, el diccionario
// de español de cspell y el del proyecto (content/diccionario.txt: nombres, regionalismos y términos).
// Es aviso: no rompe CI. Solo Node (scripts y pruebas); el motor no lo importa.
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { spellCheckDocument } from "cspell-lib";
import { archivosYaml, leerYaml } from "./contenido";

export interface TextoVisible {
  /** Dónde está: archivo y campo (para el aviso). */
  origen: string;
  texto: string;
}

export interface FaltaOrtografia {
  origen: string;
  palabra: string;
  sugerencias: string[];
}

/** Campos de una misión o llamada que no son texto para el jugador (ids, comandos, rutas, banderas…). */
const NO_VISIBLE = new Set([
  "id",
  "turno",
  "orden",
  "tipo",
  "solucion",
  "soluciones_alternativas",
  "contraejemplos",
  "mundo",
  "variables",
  "host_inicial",
  "usuario_inicial",
  "cwd_inicial",
  "apps",
  "ensena",
  "refuerza",
  "requiere",
  "disponible_desde",
  "entrega",
  "quien",
  "de",
  "concepto",
  "pestana",
  "flag",
  "nombre",
  "turnos",
  "contacto",
  "recompensas",
  "duracion_estimada_min",
]);

/**
 * Los textos visibles de un YAML de misión o de llamadas. De `cuando` solo cuentan los comentarios a una
 * respuesta equivocada (lo demás son valores esperados).
 */
export function textosVisibles(datos: unknown, origen: string): TextoVisible[] {
  const salida: TextoVisible[] = [];
  const recorrer = (v: unknown, ruta: string, soloComentarios: boolean): void => {
    if (typeof v === "string") {
      if (!soloComentarios) salida.push({ origen: `${origen}:${ruta}`, texto: v });
      return;
    }
    if (Array.isArray(v)) {
      v.forEach((x, i) => {
        recorrer(x, `${ruta}[${i}]`, soloComentarios);
      });
      return;
    }
    if (v === null || typeof v !== "object") return;
    for (const [k, x] of Object.entries(v)) {
      const r = ruta ? `${ruta}.${k}` : k;
      if (soloComentarios) {
        if (k === "comentarios" && Array.isArray(x))
          x.forEach((c, i) => {
            const t = (c as { texto?: unknown }).texto;
            if (typeof t === "string") salida.push({ origen: `${origen}:${r}[${i}].texto`, texto: t });
          });
        else recorrer(x, r, true);
      } else if (k === "cuando") recorrer(x, r, true);
      else if (!NO_VISIBLE.has(k)) recorrer(x, r, false);
    }
  };
  recorrer(datos, "", false);
  return salida;
}

/** El texto de una página de la libreta sin los bloques de código. */
export function textoDeMarkdown(md: string): string {
  return md.replace(/```[\s\S]*?```/g, " ");
}

const requerir = createRequire(import.meta.url);

/** Lo que cspell no debe revisar: código entre backticks, variables de partida, rutas, opciones y correos. */
const IGNORAR = [
  "`[^`]*`",
  "\\{\\{[^}]*\\}\\}",
  "(?:^|\\s)~?/[^\\s]*",
  "(?:^|\\s)--?[a-zA-Z][\\w-]*",
  "\\S+@\\S+",
  "\\b\\w*\\d\\w*\\b",
];

export async function revisarOrtografia(
  textos: readonly TextoVisible[],
  diccionario = "content/diccionario.txt",
): Promise<FaltaOrtografia[]> {
  const palabras = readFileSync(diccionario, "utf8")
    .split("\n")
    .map((l) => l.replace(/#.*/, "").trim())
    .filter(Boolean);
  const ajustes = {
    import: [requerir.resolve("@cspell/dict-es-es/cspell-ext.json")],
    language: "es,es-ES",
    words: palabras,
    ignoreRegExpList: IGNORAR.map((r) => `/${r}/gm`),
    suggestionsTimeout: 2000,
    numSuggestions: 3,
  };
  const faltas: FaltaOrtografia[] = [];
  for (const t of textos) {
    const r = await spellCheckDocument(
      { uri: "texto.txt", text: t.texto, languageId: "plaintext", locale: "es,es-ES" },
      { generateSuggestions: true, noConfigSearch: true },
      ajustes,
    );
    for (const i of r.issues)
      faltas.push({ origen: t.origen, palabra: i.text, sugerencias: (i.suggestions ?? []).slice(0, 3) });
  }
  return faltas;
}

/**
 * Los textos visibles de los YAML indicados y, si `todo`, también de las llamadas y de las páginas de comandos
 * de la libreta.
 */
export function textosDelContenido(yamls: readonly string[], todo: boolean): TextoVisible[] {
  const textos: TextoVisible[] = [];
  for (const f of [...yamls, ...(todo ? archivosYaml("content/llamadas") : [])]) {
    const y = leerYaml(f);
    if (y.ok) textos.push(...textosVisibles(y.datos, f));
  }
  if (todo) {
    const dir = "content/libreta/comandos";
    for (const f of readdirSync(dir)
      .filter((n) => n.endsWith(".md"))
      .sort())
      textos.push({ origen: `${dir}/${f}`, texto: textoDeMarkdown(readFileSync(`${dir}/${f}`, "utf8")) });
  }
  return textos;
}
