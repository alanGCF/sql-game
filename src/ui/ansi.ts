/** Convierte secuencias SGR (colores de ls) en segmentos con clases CSS. Lo demás se ignora. */
export interface SegmentoAnsi {
  texto: string;
  clases: string;
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: ESC es justo lo que buscamos.
const SGR = /\x1b\[([0-9;]*)m/g;

export function parsearAnsi(texto: string): SegmentoAnsi[] {
  const segmentos: SegmentoAnsi[] = [];
  let estilo = new Set<string>();
  let ultimo = 0;
  for (const m of texto.matchAll(SGR)) {
    if (m.index > ultimo)
      segmentos.push({ texto: texto.slice(ultimo, m.index), clases: [...estilo].join(" ") });
    for (const codigo of (m[1] || "0").split(";").map(Number)) {
      if (codigo === 0) estilo = new Set();
      else if (codigo === 1) estilo.add("ansi-negrita");
      else if (codigo >= 30 && codigo <= 37) {
        for (const c of estilo) if (c.startsWith("ansi-fg")) estilo.delete(c);
        estilo.add(`ansi-fg${codigo}`);
      }
    }
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) segmentos.push({ texto: texto.slice(ultimo), clases: [...estilo].join(" ") });
  return segmentos.filter((s) => s.texto);
}

export const LIMPIAR_PANTALLA = "\x1b[H\x1b[2J";
