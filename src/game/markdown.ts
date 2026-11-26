/**
 * Markdown mínimo de las páginas de la libreta (F4-05): títulos `#`, párrafos, listas `- `, bloques ``` y,
 * dentro del texto, `código`, *itálica* y **negrita**. Devuelve un árbol de datos: la interfaz lo dibuja con
 * elementos de React, así que nada del contenido se interpreta como HTML.
 */
export type Inline = { tipo: "texto" | "codigo" | "cursiva" | "negrita"; texto: string };

export type Bloque =
  | { tipo: "titulo"; nivel: 1 | 2 | 3; inline: Inline[] }
  | { tipo: "parrafo"; inline: Inline[] }
  | { tipo: "lista"; items: Inline[][] }
  | { tipo: "codigo"; texto: string };

const INLINE = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

export function leerInline(texto: string): Inline[] {
  const r: Inline[] = [];
  let i = 0;
  for (const m of texto.matchAll(INLINE)) {
    if (m.index > i) r.push({ tipo: "texto", texto: texto.slice(i, m.index) });
    if (m[1] !== undefined) r.push({ tipo: "codigo", texto: m[1] });
    else if (m[2] !== undefined) r.push({ tipo: "negrita", texto: m[2] });
    else r.push({ tipo: "cursiva", texto: m[3] ?? "" });
    i = m.index + m[0].length;
  }
  if (i < texto.length) r.push({ tipo: "texto", texto: texto.slice(i) });
  return r;
}

export function leerMarkdown(md: string): Bloque[] {
  const bloques: Bloque[] = [];
  const lineas = md.replace(/\r\n/g, "\n").split("\n");
  let parrafo: string[] = [];
  let lista: Inline[][] | null = null;
  const cerrar = () => {
    if (parrafo.length) bloques.push({ tipo: "parrafo", inline: leerInline(parrafo.join(" ")) });
    if (lista) bloques.push({ tipo: "lista", items: lista });
    parrafo = [];
    lista = null;
  };
  for (let k = 0; k < lineas.length; k++) {
    const l = lineas[k] ?? "";
    if (l.startsWith("```")) {
      cerrar();
      const codigo: string[] = [];
      for (k++; k < lineas.length && !(lineas[k] ?? "").startsWith("```"); k++) codigo.push(lineas[k] ?? "");
      bloques.push({ tipo: "codigo", texto: codigo.join("\n") });
      continue;
    }
    const titulo = /^(#{1,3}) (.*)$/.exec(l);
    if (titulo) {
      cerrar();
      const nivel = (titulo[1]?.length ?? 1) as 1 | 2 | 3;
      bloques.push({ tipo: "titulo", nivel, inline: leerInline(titulo[2] ?? "") });
      continue;
    }
    const item = /^- (.*)$/.exec(l);
    if (item) {
      if (parrafo.length) cerrar();
      lista ??= [];
      lista.push(leerInline(item[1] ?? ""));
      continue;
    }
    if (l.trim() === "") {
      cerrar();
      continue;
    }
    if (lista) cerrar();
    parrafo.push(l.trim());
  }
  cerrar();
  return bloques;
}
