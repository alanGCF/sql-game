import type { Operador, Segmento, Token } from "./lexer";

export type Redireccion = { tipo: ">" | ">>" | "<" | "2>" | "2>>"; destino: Segmento[] } | { tipo: "2>&1" };

export interface ComandoSimple {
  palabras: Segmento[][];
  redirecciones: Redireccion[];
}

export type Tuberia = ComandoSimple[];

export interface Encadenado {
  tuberia: Tuberia;
  /** Operador que une esta tubería con la anterior (la primera no tiene). */
  union?: "&&" | "||";
}

/** Lista de comandos separados por `;`; cada elemento es una cadena `&&`/`||`. */
export type Programa = Encadenado[][];

export class ErrorSintaxis extends Error {}

const REDIRECCIONES = new Set<Operador>([">", ">>", "<", "2>", "2>>", "2>&1"]);

/** Mensaje de bash para un token inesperado. */
function inesperado(t: Token | undefined): ErrorSintaxis {
  if (!t) return new ErrorSintaxis("syntax error near unexpected token `newline'");
  const texto = t.tipo === "op" ? t.op : t.segmentos.map((s) => s.texto).join("");
  return new ErrorSintaxis(`syntax error near unexpected token \`${texto}'`);
}

export function parsear(tokens: readonly Token[]): Programa {
  let i = 0;
  const programa: Programa = [];

  const comandoSimple = (): ComandoSimple => {
    const cmd: ComandoSimple = { palabras: [], redirecciones: [] };
    while (i < tokens.length) {
      const t = tokens[i] as Token;
      if (t.tipo === "palabra") {
        cmd.palabras.push(t.segmentos);
        i++;
        continue;
      }
      if (REDIRECCIONES.has(t.op)) {
        i++;
        if (t.op === "2>&1") {
          cmd.redirecciones.push({ tipo: "2>&1" });
          continue;
        }
        const destino = tokens[i];
        if (destino?.tipo !== "palabra") throw inesperado(destino);
        cmd.redirecciones.push({ tipo: t.op as ">" | ">>" | "<" | "2>" | "2>>", destino: destino.segmentos });
        i++;
        continue;
      }
      break;
    }
    if (cmd.palabras.length === 0 && cmd.redirecciones.length === 0) throw inesperado(tokens[i]);
    return cmd;
  };

  const tuberia = (): Tuberia => {
    const t: Tuberia = [comandoSimple()];
    while (i < tokens.length) {
      const tok = tokens[i] as Token;
      if (tok.tipo !== "op" || tok.op !== "|") break;
      i++;
      if (i >= tokens.length) throw new ErrorSintaxis("syntax error: unexpected end of file");
      t.push(comandoSimple());
    }
    return t;
  };

  while (i < tokens.length) {
    const cadena: Encadenado[] = [{ tuberia: tuberia() }];
    while (i < tokens.length) {
      const tok = tokens[i] as Token;
      if (tok.tipo !== "op" || (tok.op !== "&&" && tok.op !== "||")) break;
      i++;
      if (i >= tokens.length) throw new ErrorSintaxis("syntax error: unexpected end of file");
      cadena.push({ tuberia: tuberia(), union: tok.op });
    }
    programa.push(cadena);
    const sep = tokens[i];
    if (!sep) break;
    if (sep.tipo === "op" && sep.op === ";") {
      i++;
      continue;
    }
    throw inesperado(sep);
  }
  return programa;
}
