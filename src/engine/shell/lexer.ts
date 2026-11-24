/** Lexer de un subconjunto de bash (ver docs/plan/05-arquitectura.md §Shell). */

export type Comillas = "ninguna" | "simples" | "dobles";

export interface Segmento {
  texto: string;
  comillas: Comillas;
}

export type Operador = "|" | "||" | "&&" | ";" | ">" | ">>" | "<" | "2>" | "2>>" | "2>&1" | "&";

export type Token = { tipo: "palabra"; segmentos: Segmento[] } | { tipo: "op"; op: Operador };

export interface ResultadoLexer {
  tokens: Token[];
  /** Construcciones que el juego no soporta (command substitution, heredoc, etc.). */
  avanzado: string[];
  error?: string;
}

const ESPACIO = /[ \t\n]/;
const METACHAR = /[|&;<> \t\n]/;

export function tokenizar(linea: string): ResultadoLexer {
  const tokens: Token[] = [];
  const avanzado: string[] = [];
  let i = 0;
  const n = linea.length;

  while (i < n) {
    const c = linea[i] as string;
    if (ESPACIO.test(c)) {
      i++;
      continue;
    }
    if (c === "#") break; // comentario hasta fin de línea

    // Operadores
    const dos = linea.slice(i, i + 2);
    const cuatro = linea.slice(i, i + 4);
    if (cuatro === "2>&1") {
      tokens.push({ tipo: "op", op: "2>&1" });
      i += 4;
      continue;
    }
    if (dos === "<<" || dos === "<(" || dos === ">(") {
      avanzado.push(dos);
      i += 2;
      continue;
    }
    if (dos === "||" || dos === "&&" || dos === ">>") {
      tokens.push({ tipo: "op", op: dos as Operador });
      i += 2;
      continue;
    }
    if (c === "|" || c === ";" || c === ">" || c === "<") {
      tokens.push({ tipo: "op", op: c as Operador });
      i++;
      continue;
    }
    if (c === "&") {
      if (linea[i + 1] === ">") avanzado.push("&>");
      else avanzado.push("&");
      tokens.push({ tipo: "op", op: "&" });
      i++;
      continue;
    }

    // Palabra
    const segmentos: Segmento[] = [];
    let actual = "";
    const cerrarLibre = () => {
      if (actual) segmentos.push({ texto: actual, comillas: "ninguna" });
      actual = "";
    };
    while (i < n && !METACHAR.test(linea[i] as string)) {
      const ch = linea[i] as string;
      if (ch === "\\") {
        cerrarLibre();
        if (i + 1 < n) segmentos.push({ texto: linea[i + 1] as string, comillas: "simples" });
        i += 2;
        continue;
      }
      if (ch === "'") {
        cerrarLibre();
        const fin = linea.indexOf("'", i + 1);
        if (fin === -1) return { tokens, avanzado, error: "unexpected EOF while looking for matching `''" };
        segmentos.push({ texto: linea.slice(i + 1, fin), comillas: "simples" });
        i = fin + 1;
        continue;
      }
      if (ch === '"') {
        cerrarLibre();
        let j = i + 1;
        let texto = "";
        while (j < n && linea[j] !== '"') {
          if (linea[j] === "\\" && j + 1 < n && '$`"\\'.includes(linea[j + 1] as string)) {
            texto += linea[j + 1];
            j += 2;
            continue;
          }
          if (linea[j] === "`" || linea.slice(j, j + 2) === "$(")
            avanzado.push(linea[j] === "`" ? "`" : "$(");
          texto += linea[j];
          j++;
        }
        if (j >= n) return { tokens, avanzado, error: "unexpected EOF while looking for matching `\"'" };
        segmentos.push({ texto, comillas: "dobles" });
        i = j + 1;
        continue;
      }
      if (ch === "`" || linea.slice(i, i + 2) === "$(") avanzado.push(ch === "`" ? "`" : "$(");
      // "2>" pegado a una palabra que solo es "2"
      if (ch === "2" && actual === "" && segmentos.length === 0 && linea[i + 1] === ">") {
        if (linea.slice(i, i + 4) === "2>&1") break;
        const op: Operador = linea[i + 2] === ">" ? "2>>" : "2>";
        tokens.push({ tipo: "op", op });
        i += op.length;
        actual = "";
        break;
      }
      actual += ch;
      i++;
    }
    cerrarLibre();
    if (segmentos.length) tokens.push({ tipo: "palabra", segmentos });
  }
  return { tokens, avanzado };
}

/** Texto plano de una palabra (sin expandir). */
export function textoPlano(segmentos: readonly Segmento[]): string {
  return segmentos.map((s) => s.texto).join("");
}
