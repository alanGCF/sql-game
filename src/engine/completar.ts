import type { Sesion } from "./shell/executor";
import { compararC } from "./shell/expand";
import { normalizar, type Vfs } from "./vfs";

export interface ResultadoCompletar {
  linea: string;
  cursor: number;
  /** Opciones posibles cuando no hubo un único resultado (bash las lista con un segundo Tab). */
  candidatos: string[];
}

function prefijoComun(xs: readonly string[]): string {
  if (!xs.length) return "";
  let p = xs[0] as string;
  for (const x of xs) while (!x.startsWith(p)) p = p.slice(0, -1);
  return p;
}

/** Autocompletado tipo bash: comandos en la primera palabra; rutas en las demás. */
export function completar(
  linea: string,
  cursor: number,
  sesion: Sesion,
  vfs: Vfs,
  comandos: readonly string[],
): ResultadoCompletar {
  const antes = linea.slice(0, cursor);
  const despues = linea.slice(cursor);
  const inicio = Math.max(antes.lastIndexOf(" "), antes.lastIndexOf("\t")) + 1;
  const palabra = antes.slice(inicio);
  const sinCambio = { linea, cursor, candidatos: [] as string[] };
  if (/['"\\]/.test(palabra)) return sinCambio;

  const previo = antes.slice(0, inicio).trim();
  const esComando = (previo === "" || /[|;&]$/.test(previo)) && !palabra.includes("/");

  let opciones: { texto: string; esDir: boolean }[];
  let base: string;
  let parteDir = "";
  if (esComando) {
    base = palabra;
    opciones = comandos.filter((c) => c.startsWith(palabra)).map((c) => ({ texto: c, esDir: false }));
  } else {
    const corte = palabra.lastIndexOf("/");
    parteDir = corte >= 0 ? palabra.slice(0, corte + 1) : "";
    base = palabra.slice(corte + 1);
    const dirReal = parteDir.startsWith("~") ? sesion.usuario.home + parteDir.slice(1) : parteDir;
    let entradas: [string, { type: string }][];
    try {
      entradas = vfs.readdir(normalizar(sesion.cwd, dirReal || "."), sesion.usuario);
    } catch {
      return sinCambio;
    }
    opciones = entradas
      .filter(([n]) => n.startsWith(base) && (base.startsWith(".") || !n.startsWith(".")))
      .map(([n, nodo]) => ({ texto: n, esDir: nodo.type === "dir" }));
  }
  opciones.sort((a, b) => compararC(a.texto, b.texto));
  if (!opciones.length) return sinCambio;

  const reemplazar = (nueva: string) => {
    const izquierda = antes.slice(0, inicio) + nueva;
    return { linea: izquierda + despues, cursor: izquierda.length, candidatos: [] };
  };
  if (opciones.length === 1) {
    const unica = opciones[0] as { texto: string; esDir: boolean };
    return reemplazar(parteDir + unica.texto + (unica.esDir ? "/" : " "));
  }
  const comun = prefijoComun(opciones.map((o) => o.texto));
  if (comun.length > base.length) return reemplazar(parteDir + comun);
  return { linea, cursor, candidatos: opciones.map((o) => o.texto + (o.esDir ? "/" : "")) };
}
