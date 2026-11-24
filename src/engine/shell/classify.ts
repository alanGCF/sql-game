import { COMANDOS_LINUX, COMANDOS_WINDOWS } from "./comandos-linux";
import { textoPlano, tokenizar } from "./lexer";
import { ErrorSintaxis, type Programa, parsear } from "./parser";
import { SUPERFICIE } from "./superficie";

export type MotivoPensamiento = "fuera_de_alcance" | "avanzado" | "peligroso" | "anomalo" | "windows";

export type Clasificacion =
  | { tipo: "vacio" }
  | { tipo: "ejecutar"; programa: Programa }
  | { tipo: "error_sintaxis"; mensaje: string }
  | { tipo: "pensamiento"; motivo: MotivoPensamiento; sugerencia?: string };

export const LONGITUD_MAXIMA = 500;

const PELIGROSOS: readonly RegExp[] = [
  /\brm\s+(-[a-z]*\s+)*-[a-z]*r[a-z]*\s+(-[a-z]*\s+)*(\/|\/\*|~|\*)(\s|$)/i,
  /:\s*\(\s*\)\s*\{/, // fork bomb
  /\bmkfs(\.\w+)?\b/,
  /\bdd\s+.*\bof=\/dev\//,
  />\s*\/dev\/(sd|nvme|hd)/,
  /\bchmod\s+(-R\s+)?[0-7]*777\s+\/(\s|$)/,
  /\b(shutdown|reboot|halt|poweroff)\b/,
  /\bkill\s+-9\s+-1\b/,
];

/**
 * Decide qué hacer con una línea ANTES de ejecutarla (docs/plan/04-mecanicas.md §Fuera de alcance).
 * Nada que no sea `ejecutar` llega al ejecutor.
 */
export function clasificar(linea: string): Clasificacion {
  if (linea.trim() === "") return { tipo: "vacio" };
  // biome-ignore lint/suspicious/noControlCharactersInRegex: detectamos justamente caracteres de control.
  if (linea.length > LONGITUD_MAXIMA || /[\u0000-\u0008\u000b-\u001f\u007f]/.test(linea)) {
    return { tipo: "pensamiento", motivo: "anomalo" };
  }
  if (PELIGROSOS.some((re) => re.test(linea))) return { tipo: "pensamiento", motivo: "peligroso" };

  const lex = tokenizar(linea);
  if (lex.avanzado.length) return { tipo: "pensamiento", motivo: "avanzado" };
  if (lex.error) return { tipo: "error_sintaxis", mensaje: lex.error };
  if (lex.tokens.length === 0) return { tipo: "vacio" };

  let programa: Programa;
  try {
    programa = parsear(lex.tokens);
  } catch (e) {
    if (e instanceof ErrorSintaxis) return { tipo: "error_sintaxis", mensaje: e.message };
    throw e;
  }

  for (const cadena of programa) {
    for (const { tuberia } of cadena) {
      for (const cmd of tuberia) {
        const [primera, ...resto] = cmd.palabras;
        if (!primera) continue;
        const nombre = textoPlano(primera);
        if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(nombre)) return { tipo: "pensamiento", motivo: "avanzado" };
        const windows = COMANDOS_WINDOWS[nombre.toLowerCase()];
        if (windows) return { tipo: "pensamiento", motivo: "windows", sugerencia: windows };
        const spec = SUPERFICIE[nombre];
        if (!spec) {
          if (COMANDOS_LINUX.has(nombre)) return { tipo: "pensamiento", motivo: "fuera_de_alcance" };
          continue; // inexistente: el ejecutor responde "command not found" como bash
        }
        for (const palabra of resto) {
          const t = textoPlano(palabra);
          if (t === "-" || t === "--" || !t.startsWith("-")) continue;
          if (t.startsWith("--")) {
            if (!spec.largas?.includes(t)) return { tipo: "pensamiento", motivo: "fuera_de_alcance" };
            continue;
          }
          for (const letra of t.slice(1)) {
            if (spec.cortas.includes(letra)) continue;
            if (spec.reales.includes(letra)) return { tipo: "pensamiento", motivo: "fuera_de_alcance" };
            // No existe tampoco en la herramienta real: se ejecuta y el comando da su error real.
          }
        }
      }
    }
  }
  return { tipo: "ejecutar", programa };
}

const FRASES: Record<MotivoPensamiento, readonly string[]> = {
  fuera_de_alcance: [
    "No sé qué haga esto… mejor no le doy Enter.",
    "Mmm, eso no me lo han enseñado. Mejor no me arriesgo.",
    "Ni idea de qué haga eso. Mejor le pregunto a Eduardo antes de romper algo.",
  ],
  avanzado: [
    "Eso se ve muy avanzado. Mejor no me arriesgo.",
    "Demasiados símbolos raros. Mejor algo más sencillo.",
  ],
  peligroso: [
    "Si hago esto me corren el primer día.",
    "Eso suena a algo que borra medio servidor. Mejor no.",
  ],
  anomalo: ["Creo que me dormí sobre el teclado.", "Eso no tiene ni pies ni cabeza. Mejor lo borro."],
  windows: ["Eso es de Windows. Aquí creo que se usa"],
};

export function frasePensamiento(motivo: MotivoPensamiento, contador: number, sugerencia?: string): string {
  const opciones = FRASES[motivo];
  const frase = opciones[contador % opciones.length] as string;
  return sugerencia ? `${frase} \`${sugerencia}\`.` : frase;
}
