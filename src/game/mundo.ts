import type { Shell } from "../engine";
import { inicioTurno } from "../engine/calendario";
import { crearShellBase, type MundoBase } from "../engine/mundo-base";

// Generado por `npm run build:content` y ya validado con Zod; viaja en el bundle inicial (es chico).
const comun = import.meta.glob<{ mundo: MundoBase }>("../../.generated/contenido/comun.json", {
  eager: true,
  import: "default",
});

/** Sesión del jugador al iniciar el Turno 1 en su servidor. */
export function crearShellInicial(semilla: number): Shell {
  const c = comun["../../.generated/contenido/comun.json"];
  if (!c) throw new Error("falta .generated/contenido/comun.json: corre npm run build:content");
  return crearShellBase(c.mundo, semilla, {
    host: "srv-sistemas",
    usuario: "becario",
    ahora: inicioTurno(1),
  }).shell;
}
