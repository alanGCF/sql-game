import { inicioTurno } from "../engine/calendario";
import type { TurnoCompilado } from "../engine/mision/compilar";
import type { ApunteLibreta } from "./jornada";

/**
 * Calendario de pared (F4-08, 04-mecanicas.md §Calendario): estrellas de cada turno terminado, marca de
 * favores y resumen de un día. Sin DOM.
 */
type Estrellas = 1 | 2 | 3;

/** Calificación del turno: el promedio de sus misiones principales, redondeado (null sin misiones). */
export function estrellasDeTurno(estrellas: readonly number[]): Estrellas | null {
  if (!estrellas.length) return null;
  const p = Math.round(estrellas.reduce((a, b) => a + b, 0) / estrellas.length);
  return Math.min(3, Math.max(1, p)) as Estrellas;
}

export interface ResumenDia {
  turno: TurnoCompilado["turno"];
  fecha: string;
  terminado: boolean;
  /** Del turno terminado; null mientras va a medias. */
  estrellas: Estrellas | null;
  misiones: { id: string; titulo: string; estrellas: Estrellas | null }[];
  /** Solo los favores hechos. */
  favores: { id: string; titulo: string; estrellas: Estrellas }[];
  /** Lo que quedó en la pestaña Historia de la libreta ese día. */
  hallazgos: string[];
}

export function resumenDelDia(
  turno: TurnoCompilado,
  completadas: Readonly<Record<string, Estrellas>>,
  terminado: boolean,
  apuntes: readonly ApunteLibreta[],
): ResumenDia {
  const misiones = turno.misiones.map((m) => ({
    id: m.id,
    titulo: m.titulo,
    estrellas: completadas[m.id] ?? null,
  }));
  const favores = turno.favores.flatMap((f) => {
    const e = completadas[f.id];
    return e ? [{ id: f.id, titulo: f.titulo, estrellas: e }] : [];
  });
  const ids = new Set([...turno.misiones, ...turno.favores].map((m) => m.id));
  return {
    turno: turno.turno,
    fecha: inicioTurno(turno.turno).slice(0, 10),
    terminado,
    estrellas: terminado
      ? estrellasDeTurno(misiones.flatMap((m) => (m.estrellas ? [m.estrellas] : [])))
      : null,
    misiones,
    favores,
    hallazgos: apuntes.flatMap((a) =>
      a.pestana === "historia" && a.texto && ids.has(a.mision) ? [a.texto] : [],
    ),
  };
}

/** Las fechas de la hoja del calendario, en orden: del lunes 26 de octubre al lunes 16 de noviembre. */
export const FECHAS_CALENDARIO: readonly string[] = [
  ...[26, 27, 28, 29, 30, 31].map((d) => `2026-10-${d}`),
  ...Array.from({ length: 16 }, (_, i) => `2026-11-${String(i + 1).padStart(2, "0")}`),
];

/** Geometría de la hoja (la misma que dibuja `dibujarCalendario`): 512 × 520, celdas de 92 desde y = 110. */
const HOJA = { alto: 520, arriba: 110, fila: 92, columnas: 7 };

/** El día bajo un punto de la hoja (coordenadas UV de la textura) o null si cae fuera de la cuadrícula. */
export function diaDeCalendario(uv: { x: number; y: number }): string | null {
  const y = (1 - uv.y) * HOJA.alto;
  const fila = Math.floor((y - HOJA.arriba) / HOJA.fila);
  const col = Math.floor(uv.x * HOJA.columnas);
  if (fila < 0 || col < 0 || col >= HOJA.columnas) return null;
  return FECHAS_CALENDARIO[fila * HOJA.columnas + col] ?? null;
}
