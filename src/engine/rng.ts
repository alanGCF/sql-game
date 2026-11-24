/** PRNG determinista (mulberry32). Nunca usar Math.random en el motor (ADR-008). */
export type Rng = () => number;

export function crearRng(semilla: number): Rng {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sub-semilla estable a partir de la semilla de la partida y un nombre (FNV-1a). */
export function subSemilla(semilla: number, nombre: string): number {
  let h = 0x811c9dc5 ^ (semilla >>> 0);
  for (let i = 0; i < nombre.length; i++) {
    h ^= nombre.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function entero(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function elegir<T>(rng: Rng, opciones: readonly T[]): T {
  const v = opciones[Math.floor(rng() * opciones.length)];
  if (v === undefined) throw new Error("elegir: lista vacía");
  return v;
}
