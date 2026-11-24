import { create } from "zustand";
import type { ResultadoLinea } from "../engine";
import { isTestMode } from "../test-hooks";
import { contenidoComun, turnoInicial } from "./contenido";
import { type EventoJornada, Jornada } from "./jornada";

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

function pendientesDe(j: Jornada): Pendiente[] {
  const actual = j.actual();
  return [...(actual ? [actual] : []), ...j.favoresActivos()].flatMap((mc) =>
    mc.pendientes().map((p) => ({
      mision: mc.mision.id,
      titulo: mc.mision.titulo,
      favor: mc.mision.tipo === "favor",
      ...p,
    })),
  );
}

interface EstadoPartida {
  jornada: Jornada;
  pendientes: Pendiente[];
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
const inicial = Jornada.iniciar(turnoInicial(), contenidoComun().mundo, semillaNueva());

export const usePartida = create<EstadoPartida>()((set, get) => ({
  jornada: inicial,
  pendientes: pendientesDe(inicial),
  eventos: inicial.tomarEventos(),
  async ejecutar(linea) {
    const { jornada } = get();
    const { resultado, eventos } = await jornada.ejecutar(linea);
    if (eventos.length)
      set({ eventos: [...get().eventos, ...eventos].slice(-MAX_EVENTOS), pendientes: pendientesDe(jornada) });
    return resultado;
  },
  async responder(mision, objetivo, valor) {
    const { jornada } = get();
    const r = await jornada.responder(mision, objetivo, valor);
    set({ eventos: [...get().eventos, ...r.eventos].slice(-MAX_EVENTOS), pendientes: pendientesDe(jornada) });
    return { correcta: r.correcta, ...(r.comentario ? { comentario: r.comentario } : {}) };
  },
}));
