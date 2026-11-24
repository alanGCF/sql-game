import { codigoDeId, compararMisiones } from "./curriculo";
import { type Mision, validarMision } from "./esquema";

/** Contenido de un turno ya validado, tal como lo recibe el cliente. */
export interface TurnoCompilado {
  turno: Mision["turno"];
  misiones: Mision[];
  favores: Mision[];
}

export interface ArchivoContenido {
  ruta: string;
  datos: unknown;
}

/** Llave de archivo del turno: 1 → "01", "TE" → "te". */
export function llaveTurno(turno: Mision["turno"]): string {
  return turno === "TE" ? "te" : String(turno).padStart(2, "0");
}

/**
 * Valida las misiones y favores ya leídos del YAML y los agrupa por turno.
 * Puro y determinista: el orden de entrada no cambia la salida.
 */
export function compilarContenido(archivos: readonly ArchivoContenido[]): {
  turnos: Map<string, TurnoCompilado>;
  errores: string[];
} {
  const errores: string[] = [];
  const vistos = new Map<string, string>();
  const validas: Mision[] = [];

  for (const { ruta, datos } of [...archivos].sort((a, b) => a.ruta.localeCompare(b.ruta))) {
    const v = validarMision(datos);
    if (!v.ok) {
      errores.push(...v.errores.map((e) => `${ruta}: ${e}`));
      continue;
    }
    const m = v.mision;
    const previo = vistos.get(m.id);
    if (previo) {
      errores.push(`${ruta}: id duplicado ${m.id} (también en ${previo})`);
      continue;
    }
    vistos.set(m.id, ruta);
    const carpeta = /turno-([0-9]{2}|te)\//.exec(ruta)?.[1];
    if (carpeta && carpeta !== llaveTurno(m.turno))
      errores.push(`${ruta}: la carpeta turno-${carpeta} no coincide con turno: ${m.turno}`);
    const [t, orden] = /^T(\d+|E)-[MF](\d+)$/.exec(codigoDeId(m.id))?.slice(1) ?? [];
    if (t !== (m.turno === "TE" ? "E" : String(m.turno)))
      errores.push(`${ruta}: el id ${m.id} no corresponde a turno: ${m.turno}`);
    if (Number(orden) !== m.orden) errores.push(`${ruta}: el id ${m.id} no corresponde a orden: ${m.orden}`);
    validas.push(m);
  }

  const turnos = new Map<string, TurnoCompilado>();
  const ordenadas = validas.sort((a, b) => compararMisiones(codigoDeId(a.id), codigoDeId(b.id)));
  for (const m of ordenadas) {
    const k = llaveTurno(m.turno);
    let t = turnos.get(k);
    if (!t) {
      t = { turno: m.turno, misiones: [], favores: [] };
      turnos.set(k, t);
    }
    (m.tipo === "favor" ? t.favores : t.misiones).push(m);
  }
  return { turnos, errores };
}
