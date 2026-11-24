/**
 * Superficie de comandos implementados (docs/plan/03-curriculo.md §Superficie de comandos).
 * `cortas`: banderas cortas soportadas. `reales`: todas las banderas cortas que existen en la herramienta real;
 * una bandera real no soportada produce el globo de pensamiento; una inexistente se ejecuta y el comando
 * imprime su error real ("invalid option").
 */
export interface Especificacion {
  cortas: string;
  reales: string;
  largas?: readonly string[];
}

export const SUPERFICIE: Record<string, Especificacion> = {
  pwd: { cortas: "", reales: "LP" },
  cd: { cortas: "", reales: "LPe@" },
  ls: { cortas: "alh1dRtr", reales: "aAbBcCdDfFgGhHiIklLmnNopqQrRsStTuUvwxXZ1", largas: ["--help", "--all"] },
  cat: { cortas: "n", reales: "AbeEnstTuv", largas: ["--help"] },
  echo: { cortas: "ne", reales: "neE" },
  man: { cortas: "", reales: "acCdDfFhiIkKlLmMnopPrRsStTuwWZ7" },
  clear: { cortas: "", reales: "TVx" },
  history: { cortas: "", reales: "acdnprsw" },
  exit: { cortas: "", reales: "" },
};

export function estaEnSuperficie(comando: string): boolean {
  return Object.hasOwn(SUPERFICIE, comando);
}
