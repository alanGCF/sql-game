import type { EventoJornada } from "./jornada";
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

/** Renglones que se acaban de tachar (F4-07): el plumón los raya con animación; los demás ya estaban. */
export function recienTachados(
  antes: readonly RenglonPizarron[],
  ahora: readonly RenglonPizarron[],
): string[] {
  const hechosAntes = new Set(antes.filter((r) => r.hecho).map((r) => r.texto));
  const estabanAntes = new Set(antes.map((r) => r.texto));
  return ahora
    .filter((r) => r.hecho && estabanAntes.has(r.texto) && !hechosAntes.has(r.texto))
    .map((r) => r.texto);
}

/** Favores cuyo post-it se quita del pizarrón (terminados): se arrugan y caen al bote. */
export function favoresTerminados(antes: readonly string[], ahora: readonly string[]): string[] {
  return antes.filter((t) => !ahora.includes(t));
}

/** Post-its informativos que dejan los efectos `postit` (F4-07), en orden. */
export function postitsDe(eventos: readonly EventoJornada[]): string[] {
  return eventos.flatMap((e) => (e.tipo === "efecto" && e.efecto.tipo === "postit" ? [e.efecto.texto] : []));
}
