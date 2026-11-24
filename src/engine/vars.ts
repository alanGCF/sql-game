import { crearRng, elegir, entero, subSemilla } from "./rng";

/**
 * Variables de partida (ADR-011): cada una se genera con su propia sub-semilla derivada de la semilla
 * de la partida y de su nombre, así que agregar o quitar variables no cambia las demás.
 */
export type Generador =
  | { tipo: "entero"; min: number; max: number }
  | { tipo: "ip"; red: string; min: number; max: number }
  | { tipo: "hora"; desde: string; hasta: string }
  | { tipo: "elegir"; de: readonly (string | number)[] }
  | { tipo: "clave"; palabras: readonly string[]; digitos: number };

export type Variables = Readonly<Record<string, string>>;

function segundos(hhmmss: string): number {
  const [h = 0, m = 0, s = 0] = hhmmss.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

function hhmmss(total: number): string {
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${dos(Math.floor(total / 3600))}:${dos(Math.floor((total % 3600) / 60))}:${dos(total % 60)}`;
}

export function generar(semilla: number, nombre: string, g: Generador): string {
  const rng = crearRng(subSemilla(semilla, nombre));
  switch (g.tipo) {
    case "entero":
      return String(entero(rng, g.min, g.max));
    case "ip": {
      const base = g.red.split("/")[0]?.split(".").slice(0, 3).join(".");
      if (!base || !g.red.endsWith("/24")) throw new Error(`variable ${nombre}: solo se soportan redes /24`);
      return `${base}.${entero(rng, g.min, g.max)}`;
    }
    case "hora":
      return hhmmss(entero(rng, segundos(g.desde), segundos(g.hasta)));
    case "elegir":
      return String(elegir(rng, g.de));
    case "clave": {
      const palabra = elegir(rng, g.palabras);
      const digitos = String(entero(rng, 0, 10 ** g.digitos - 1)).padStart(g.digitos, "0");
      return `${palabra}${digitos}`;
    }
  }
}

export function resolverVariables(
  semilla: number,
  definiciones: Readonly<Record<string, Generador>>,
): Variables {
  const vars: Record<string, string> = {};
  for (const [nombre, g] of Object.entries(definiciones)) vars[nombre] = generar(semilla, nombre, g);
  return vars;
}

export class VariableDesconocida extends Error {}

/** Reemplaza `{{nombre}}` por su valor. Una variable inexistente es un error de contenido (regla C10). */
export function plantilla(texto: string, vars: Variables): string {
  return texto.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_.-]*)\s*\}\}/g, (_m, nombre: string) => {
    const v = vars[nombre];
    if (v === undefined) throw new VariableDesconocida(`variable desconocida: {{${nombre}}}`);
    return v;
  });
}
