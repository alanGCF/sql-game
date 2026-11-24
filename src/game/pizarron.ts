import type { Pendiente } from "./partidaStore";

/** Lo que se escribe en el pizarrón: pendientes de la misión principal; los favores van en post-its. */
export interface RenglonPizarron {
  texto: string;
  hecho: boolean;
}

export function renglonesPizarron(pendientes: readonly Pendiente[]): RenglonPizarron[] {
  return pendientes.filter((p) => !p.favor).map((p) => ({ texto: p.pendiente, hecho: p.cumplido }));
}

/** Títulos de los favores activos (uno por post-it). */
export function favoresPizarron(pendientes: readonly Pendiente[]): string[] {
  return [...new Set(pendientes.filter((p) => p.favor).map((p) => p.titulo))];
}
