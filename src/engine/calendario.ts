/**
 * Calendario de turnos (docs/plan/02-trama.md §Calendario): lunes a viernes de 2026, T0 el martes
 * 27 de octubre, tiempo extra (TE) el sábado 7 de noviembre. El turno vespertino entra a las 15:30.
 * El reloj de juego guarda la hora de la planta con sufijo Z (el servidor del juego corre en esa hora).
 */
const FECHAS: Readonly<Record<string, string>> = {
  "0": "2026-10-27",
  "1": "2026-10-28",
  "2": "2026-10-29",
  "3": "2026-10-30",
  "4": "2026-11-02",
  "5": "2026-11-03",
  "6": "2026-11-04",
  "7": "2026-11-05",
  "8": "2026-11-06",
  TE: "2026-11-07",
  "9": "2026-11-09",
  "10": "2026-11-10",
  "11": "2026-11-11",
  "12": "2026-11-12",
  "13": "2026-11-13",
};

export function inicioTurno(turno: number | "TE"): string {
  const fecha = FECHAS[String(turno)];
  if (!fecha) throw new Error(`turno fuera del calendario: ${turno}`);
  return `${fecha}T15:30:00Z`;
}
