import type { TurnoCompilado } from "../engine/mision/compilar";
import type { Personajes } from "../engine/mision/curriculo";
import type { MundoBase } from "../engine/mundo-base";

// Generado por `npm run build:content` y ya validado con Zod en build: el cliente no vuelve a validar.
interface Comun {
  personajes: Personajes;
  mundo: MundoBase;
}
const comun = import.meta.glob<Comun>("../../.generated/contenido/comun.json", {
  eager: true,
  import: "default",
});
// shortcut: T1 viaja en el bundle inicial (≈5 KB gzip; toda partida empieza ahí). Los turnos siguientes
// se cargarán bajo demanda con un glob no eager cuando exista su contenido (F5).
const turno1 = import.meta.glob<TurnoCompilado>("../../.generated/contenido/turno-01.json", {
  eager: true,
  import: "default",
});

const FALTA = "corre npm run build:content";

export function contenidoComun(): Comun {
  const c = comun["../../.generated/contenido/comun.json"];
  if (!c) throw new Error(`falta .generated/contenido/comun.json: ${FALTA}`);
  return c;
}

export function turnoInicial(): TurnoCompilado {
  const t = turno1["../../.generated/contenido/turno-01.json"];
  if (!t) throw new Error(`falta .generated/contenido/turno-01.json: ${FALTA}`);
  return t;
}

/** Huella corta del contenido (FNV-1a de 32 bits): se guarda en la partida para saber con qué versión se jugó. */
export function versionContenido(): string {
  const texto = JSON.stringify([turnoInicial(), contenidoComun().mundo]);
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
