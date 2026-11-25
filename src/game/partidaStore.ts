import { create } from "zustand";
import type { ResultadoLinea } from "../engine";
import { isTestMode } from "../test-hooks";
import { contenidoComun, turnoInicial } from "./contenido";
import { type Dialogo, dialogosDe } from "./dialogos";
import { type EventoJornada, Jornada } from "./jornada";
import { type Ticket, ticketsDe, unirTickets } from "./tickets";

/** Un renglón del pizarrón: objetivo de la misión en curso o de un favor activo. */
export interface Pendiente {
  mision: string;
  titulo: string;
  favor: boolean;
  id: string;
  pendiente: string;
  cumplido: boolean;
}

function semillaNueva(): number {
  // shortcut: la semilla vendrá de la partida guardada y su código (F4); en ?test=1 es fija.
  if (isTestMode) return 1;
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
}

const personajes = contenidoComun().personajes.personajes;

function activas(j: Jornada) {
  const actual = j.actual();
  return [...(actual ? [actual] : []), ...j.favoresActivos()];
}

function pendientesDe(j: Jornada): Pendiente[] {
  return activas(j).flatMap((mc) =>
    mc.pendientes().map((p) => ({
      mision: mc.mision.id,
      titulo: mc.mision.titulo,
      favor: mc.mision.tipo === "favor",
      ...p,
    })),
  );
}

interface EstadoPartida {
  /** Nombre que el jugador teclea en su gafete (se guarda con la partida en F4). */
  nombre: string;
  setNombre: (n: string) => void;
  jornada: Jornada;
  pendientes: Pendiente[];
  /** Tickets de la app Tickets (incluye los ya resueltos del turno). */
  tickets: Ticket[];
  /** Diálogos por mostrar, en orden (el primero es el que está en pantalla). */
  dialogos: Dialogo[];
  avanzarDialogo: () => void;
  /** Eventos para la interfaz (diálogos, objetivos, efectos), los más recientes al final. */
  eventos: EventoJornada[];
  ejecutar: (linea: string) => Promise<ResultadoLinea>;
  responder: (
    mision: string,
    objetivo: string,
    valor: string,
  ) => Promise<{ correcta: boolean; comentario?: string }>;
}

const MAX_EVENTOS = 200;

function actualizado(j: Jornada, s: EstadoPartida, eventos: EventoJornada[]) {
  return {
    eventos: [...s.eventos, ...eventos].slice(-MAX_EVENTOS),
    pendientes: pendientesDe(j),
    tickets: unirTickets(s.tickets, ticketsDe(activas(j), personajes)),
    dialogos: [...s.dialogos, ...dialogosDe(eventos, personajes)],
  };
}
const inicial = Jornada.iniciar(turnoInicial(), contenidoComun().mundo, semillaNueva());

export const usePartida = create<EstadoPartida>()((set, get) => ({
  nombre: "",
  setNombre: (nombre) => set({ nombre: nombre.trim().slice(0, 40) }),
  jornada: inicial,
  pendientes: pendientesDe(inicial),
  tickets: ticketsDe(activas(inicial), personajes),
  ...(() => {
    const eventos = inicial.tomarEventos();
    return { eventos, dialogos: dialogosDe(eventos, personajes) };
  })(),
  avanzarDialogo() {
    set({ dialogos: get().dialogos.slice(1) });
  },
  async ejecutar(linea) {
    const { jornada } = get();
    const { resultado, eventos } = await jornada.ejecutar(linea);
    if (eventos.length) set(actualizado(jornada, get(), eventos));
    return resultado;
  },
  async responder(mision, objetivo, valor) {
    const { jornada } = get();
    const r = await jornada.responder(mision, objetivo, valor);
    set(actualizado(jornada, get(), r.eventos));
    return { correcta: r.correcta, ...(r.comentario ? { comentario: r.comentario } : {}) };
  },
}));
