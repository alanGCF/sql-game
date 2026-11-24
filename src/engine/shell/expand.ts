import { normalizar, type User, type Vfs } from "../vfs";
import type { Segmento } from "./lexer";

export interface EntornoExpansion {
  env: ReadonlyMap<string, string>;
  ultimoCodigo: number;
  cwd: string;
  home: string;
  vfs: Vfs;
  user: User;
}

const VAR = /\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*)|(\?))/g;

function expandirVariables(texto: string, e: EntornoExpansion): string {
  return texto.replace(
    VAR,
    (_m, llaves: string | undefined, simple: string | undefined, interrog: string | undefined) => {
      if (interrog) return String(e.ultimoCodigo);
      return e.env.get((llaves ?? simple) as string) ?? "";
    },
  );
}

/** Compara C/byte a byte (LC_COLLATE=C), como un servidor Debian sin locale configurado. */
export function compararC(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function patronARegex(patron: string): RegExp {
  let re = "^";
  for (const ch of patron) {
    if (ch === "*") re += "[^/]*";
    else if (ch === "?") re += "[^/]";
    else re += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`${re}$`);
}

/** Expande comodines contra el VFS. Si no hay coincidencias devuelve null (bash deja el patrón literal). */
function expandirGlob(patron: string, e: EntornoExpansion): string[] | null {
  const absoluto = patron.startsWith("/");
  const partes = patron.split("/").filter((p, idx) => p !== "" || idx === 0);
  let candidatos: string[] = [absoluto ? "/" : ""];
  for (const parte of partes) {
    if (parte === "") continue;
    const siguientes: string[] = [];
    const tieneComodin = /[*?]/.test(parte);
    for (const base of candidatos) {
      const join = (n: string) => (base === "" ? n : base === "/" ? `/${n}` : `${base}/${n}`);
      if (!tieneComodin) {
        siguientes.push(join(parte));
        continue;
      }
      const dir = normalizar(e.cwd, base === "" ? "." : base);
      let entradas: string[];
      try {
        entradas = e.vfs.readdir(dir, e.user).map(([n]) => n);
      } catch {
        continue;
      }
      const re = patronARegex(parte);
      for (const nombre of entradas.sort(compararC)) {
        if (nombre.startsWith(".") && !parte.startsWith(".")) continue;
        if (re.test(nombre)) siguientes.push(join(nombre));
      }
    }
    candidatos = siguientes;
  }
  const existentes = candidatos.filter((c) => e.vfs.exists(normalizar(e.cwd, c)));
  return existentes.length ? existentes : null;
}

/** Expande una palabra: tilde, variables y comodines (solo en partes sin comillas). */
export function expandirPalabra(segmentos: readonly Segmento[], e: EntornoExpansion): string[] {
  let texto = "";
  let patronGlob = "";
  let tieneGlob = false;
  segmentos.forEach((s, idx) => {
    let t = s.texto;
    if (s.comillas === "ninguna") {
      if (idx === 0 && (t === "~" || t.startsWith("~/"))) t = e.home + t.slice(1);
      t = expandirVariables(t, e);
      if (/[*?]/.test(t)) tieneGlob = true;
      patronGlob += t;
    } else {
      if (s.comillas === "dobles") t = expandirVariables(t, e);
      // Los comodines dentro de comillas son literales: se escapan para el patrón.
      patronGlob += t.replace(/[*?]/g, (c) => (c === "*" ? "\uE000" : "\uE001"));
    }
    texto += t;
  });
  if (!tieneGlob) return [texto];
  const resultado = expandirGlob(patronGlob, e);
  if (!resultado) return [texto];
  return resultado.map((r) => r.replace(/\uE000/g, "*").replace(/\uE001/g, "?"));
}
