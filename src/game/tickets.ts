import type { Personajes } from "../engine/mision/curriculo";
import type { MisionEnCurso } from "../engine/mision/runtime";

/** Un ticket de la app Tickets: un objetivo `respuesta` con `donde: ticket` (D-17, D-21). */
export interface Ticket {
  mision: string;
  objetivo: string;
  de: string;
  departamento?: string;
  pregunta: string;
  detalle: string;
  resuelto: boolean;
}

/** Tickets de las misiones activas; quien pide es quien da el briefing. */
export function ticketsDe(
  misiones: readonly MisionEnCurso[],
  personajes: Personajes["personajes"],
): Ticket[] {
  return misiones.flatMap((mc) => {
    const briefing = mc.briefing();
    const quien = briefing[0]?.quien ?? "sistema";
    const p = personajes[quien];
    const detalle = briefing
      .filter((b) => b.quien === quien)
      .map((b) => b.texto)
      .join("\n\n");
    const pendientes = mc.pendientes();
    return mc.mision.objetivos
      .filter((o) => "respuesta" in o.cuando && o.cuando.respuesta.donde === "ticket")
      .map((o) => {
        const texto = pendientes.find((x) => x.id === o.id)?.pendiente ?? o.pendiente;
        const t: Ticket = {
          mision: mc.mision.id,
          objetivo: o.id,
          de: p?.nombre ?? quien,
          pregunta: texto.replace(/^Ticket de [^:]+:\s*/, ""),
          detalle,
          resuelto: mc.cumplidos.has(o.id),
        };
        if (p?.departamento) t.departamento = p.departamento;
        return t;
      });
  });
}

/** Junta los tickets nuevos con los anteriores: los de misiones terminadas se quedan como resueltos. */
export function unirTickets(previos: readonly Ticket[], actuales: readonly Ticket[]): Ticket[] {
  const clave = (t: Ticket) => `${t.mision}/${t.objetivo}`;
  const nuevos = new Map(actuales.map((t) => [clave(t), t]));
  const unidos = previos.map((t) => nuevos.get(clave(t)) ?? { ...t, resuelto: true });
  const vistos = new Set(previos.map(clave));
  return [...unidos, ...actuales.filter((t) => !vistos.has(clave(t)))];
}
