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
  head: { cortas: "n", reales: "cnqvz" },
  tail: { cortas: "n", reales: "cfFnqsvz" },
  mkdir: { cortas: "p", reales: "mpvZ" },
  touch: { cortas: "", reales: "acdfhmrt" },
  cp: { cortas: "r", reales: "abdfHilLnPpRrsStTuvxZ" },
  mv: { cortas: "", reales: "bfintTuvZ" },
  rm: { cortas: "rf", reales: "dfiIrRv" },
};

export function estaEnSuperficie(comando: string): boolean {
  return Object.hasOwn(SUPERFICIE, comando);
}
