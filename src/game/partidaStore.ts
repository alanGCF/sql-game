import { create } from "zustand";
import { esPartidaNueva, type Partida } from "../../shared/partida";
import type { ResultadoLinea } from "../engine";
import { isTestMode } from "../test-hooks";
import { almacenIndexedDb } from "./almacen-idb";
import { crearApiPartidas, type Motivo } from "./api";
import { contenidoComun, turnoInicial, versionContenido } from "./contenido";
import { type Dialogo, dialogoDe, dialogosDe } from "./dialogos";
import { aPartida, estadoDe, Guardian } from "./guardado";
import { type EventoJornada, Jornada } from "./jornada";
import { marcar, type ResultadoMarcar } from "./telefono";
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

/** Dónde está guardada la partida en este momento (se muestra en el gafete). */
export type EstadoGuardado = "sin_partida" | "solo_local" | "sincronizado" | "pendiente";

function semillaAleatoria(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
}

const personajes = contenidoComun().personajes.personajes;
const mundo = contenidoComun().mundo;
export const guardian = new Guardian(almacenIndexedDb, crearApiPartidas());

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
  /** Nombre que el jugador teclea en su gafete. */
  nombre: string;
  setNombre: (n: string) => void;
  /** Código de partida (número de empleado, D-15); null si se creó sin servidor o no hay partida. */
  codigo: string | null;
  semilla: number;
  guardado: EstadoGuardado;
  jornada: Jornada;
  pendientes: Pendiente[];
  /** Tickets de la app Tickets (incluye los ya resueltos del turno). */
  tickets: Ticket[];
  /** Diálogos por mostrar, en orden (el primero es el que está en pantalla). */
  dialogos: Dialogo[];
  avanzarDialogo: () => void;
  /** Eventos para la interfaz (diálogos, objetivos, efectos), los más recientes al final. */
  eventos: EventoJornada[];
  /** Minuto del día del reloj de juego, entero (la ventana y el reloj de pared lo siguen). */
  minuto: number;
  ejecutar: (linea: string) => Promise<ResultadoLinea>;
  responder: (
    mision: string,
    objetivo: string,
    valor: string,
  ) => Promise<{ correcta: boolean; comentario?: string }>;
  /** Primer día: crea la partida (en el servidor si se puede) y empieza el turno. */
  empezar: (nombre: string) => Promise<{ sinServidor: boolean }>;
  /** Carga la partida de un código desde el servidor. */
  checarEntrada: (codigo: string) => Promise<{ ok: true } | { ok: false; motivo: Motivo }>;
  /** Sigue la partida guardada en este navegador (y sube lo pendiente). */
  continuar: () => Promise<boolean>;
  /** "No soy yo" (D-26): olvida la partida en este navegador y deja una jornada sin guardar. */
  olvidar: () => Promise<void>;
  /** Número recién creado que el jugador debe anotar (tarjeta de Recursos Humanos, D-27). */
  numeroPorAnotar: string | null;
  anotado: () => void;
  /** Teléfono (F4-01/02): marca una extensión; si contesta, su llamada entra a los diálogos. */
  llamar: (marcado: string) => Promise<ResultadoLlamar>;
  /** Elige una opción de respuesta del diálogo en pantalla (F4-02). */
  elegirOpcion: (i: number) => Promise<void>;
  /** Cuelga la llamada que hizo el jugador (quita lo que faltaba de ella). */
  colgar: () => void;
}

// shortcut: el aviso de Eduardo pasa al contenido del Turno 0 (F4-14), donde él te recibe.
const AVISO_NUMERO =
  "Antes que se me olvide: Recursos Humanos te dejó tu número de empleado en un post-it, en tu monitor. Anótalo en tu libreta o en un papel; con él checas entrada en cualquier compu.";

const MAX_EVENTOS = 200;
const llamadas = contenidoComun().llamadas;

export type ResultadoLlamar = ResultadoMarcar | { tipo: "no_contesta"; texto: string };

/** Las líneas de una llamada del jugador, como diálogos de tarjeta; la última lleva las opciones. */
function lineasDeLlamada(
  quien: string,
  lineas: readonly string[],
  opciones?: Dialogo["opciones"],
): Dialogo[] {
  return lineas.map((texto, i) => ({
    ...dialogoDe(quien, texto, true, personajes),
    saliente: true as const,
    ...(opciones && i === lineas.length - 1 ? { opciones } : {}),
  }));
}

function actualizado(j: Jornada, s: EstadoPartida, eventos: EventoJornada[]) {
  return {
    minuto: Math.floor(j.minutoDelDia()),
    eventos: [...s.eventos, ...eventos].slice(-MAX_EVENTOS),
    pendientes: pendientesDe(j),
    tickets: unirTickets(s.tickets, ticketsDe(activas(j), personajes)),
    dialogos: [...s.dialogos, ...dialogosDe(eventos, personajes)],
  };
}

/** Estado de la interfaz para una jornada recién creada o cargada. */
function desdeJornada(j: Jornada) {
  const eventos = j.tomarEventos();
  return {
    jornada: j,
    minuto: Math.floor(j.minutoDelDia()),
    pendientes: pendientesDe(j),
    tickets: ticketsDe(activas(j), personajes),
    eventos,
    dialogos: dialogosDe(eventos, personajes),
  };
}

/** Jornada de una partida: nueva → primer turno; a medias → se restaura sin repetir diálogos. */
function jornadaDe(p: Partida): Jornada {
  if (esPartidaNueva(p)) return Jornada.iniciar(turnoInicial(), mundo, p.semilla);
  try {
    return Jornada.restaurar(turnoInicial(), mundo, p.semilla, estadoDe(p));
  } catch {
    // shortcut: si el contenido cambió y la misión guardada ya no existe, el turno empieza de nuevo con la
    // misma semilla (05-arquitectura.md §Persistencia pide reiniciar solo esa misión; llega con T2).
    return Jornada.iniciar(turnoInicial(), mundo, p.semilla);
  }
}

function estadoGuardado(): EstadoGuardado {
  const e = guardian.estado;
  if (!e) return "sin_partida";
  if (!e.codigo) return "solo_local";
  return e.pendiente ? "pendiente" : "sincronizado";
}

// La escena detrás del menú usa una jornada sin guardar; en ?test=1 la semilla es fija.
const inicial = Jornada.iniciar(turnoInicial(), mundo, isTestMode ? 1 : semillaAleatoria());
let guardadoProgramado: ReturnType<typeof setTimeout> | null = null;

export const usePartida = create<EstadoPartida>()((set, get) => {
  const partidaActual = (): Partida => {
    const s = get();
    const previa = guardian.estado?.partida;
    return aPartida(s.jornada, {
      semilla: s.semilla,
      nombre: s.nombre,
      contenido: versionContenido(),
      xp: previa?.xp ?? 0,
      notas: previa?.notas ?? [],
    });
  };
  const refrescarGuardado = () => set({ guardado: estadoGuardado() });

  /** Tras cada acción: en el navegador (agrupado); al cerrar misión, favor o turno: también al servidor. */
  const guardar = (eventos: EventoJornada[]) => {
    if (!guardian.estado) return;
    const checkpoint = eventos.some((e) => e.tipo === "mision_completada" || e.tipo === "turno_completado");
    if (guardadoProgramado) clearTimeout(guardadoProgramado);
    guardadoProgramado = null;
    if (checkpoint) {
      void guardian.checkpoint(partidaActual()).then(refrescarGuardado);
      return;
    }
    guardadoProgramado = setTimeout(() => {
      guardadoProgramado = null;
      void guardian.guardarLocal(partidaActual()).then(refrescarGuardado);
    }, 400);
  };

  const cargar = (p: Partida, codigo: string | null) => {
    set({ ...desdeJornada(jornadaDe(p)), nombre: p.nombre, semilla: p.semilla, codigo });
    void guardian.guardarLocal(partidaActual()).then(refrescarGuardado);
  };

  return {
    nombre: "",
    setNombre: (nombre) => set({ nombre: nombre.trim().slice(0, 40) }),
    codigo: null,
    semilla: 0,
    guardado: "sin_partida",
    numeroPorAnotar: null,
    anotado() {
      set({ numeroPorAnotar: null });
    },
    ...desdeJornada(inicial),
    avanzarDialogo() {
      set({ dialogos: get().dialogos.slice(1) });
    },
    async llamar(marcado) {
      const r = marcar(marcado, personajes);
      const guion = r.tipo === "contesta" ? llamadas[r.id] : undefined;
      if (r.tipo !== "contesta" || !guion) return r.tipo === "contesta" ? { tipo: "no_existe" } : r;
      const { jornada } = get();
      const { llamada, eventos } = await jornada.llamar(r.id, guion, personajes[r.id]?.paciencia ?? 2);
      const s = get();
      const lineas =
        llamada.tipo === "charla"
          ? lineasDeLlamada(r.id, llamada.conversacion.lineas, llamada.conversacion.opciones)
          : llamada.tipo === "ponte_a_trabajar"
            ? lineasDeLlamada(r.id, [llamada.texto])
            : [];
      // La llamada va antes que lo que haya desatado (p. ej. un objetivo de T0 cumplido).
      const previos = s.dialogos.filter((d) => !d.saliente);
      set({
        ...actualizado(jornada, s, eventos),
        dialogos: [...previos, ...lineas, ...dialogosDe(eventos, personajes)],
      });
      guardar(eventos);
      return llamada.tipo === "no_contesta" ? { tipo: "no_contesta", texto: llamada.texto } : r;
    },
    async elegirOpcion(i) {
      const [actual, ...resto] = get().dialogos;
      const opcion = actual?.opciones?.[i];
      if (!actual || !opcion) return;
      const respuesta = lineasDeLlamada(actual.quien, opcion.respuesta);
      set({ dialogos: [...respuesta, ...resto] });
      if (!opcion.flag) return;
      const { jornada } = get();
      const eventos = await jornada.decidir(opcion.flag);
      if (eventos.length) set(actualizado(jornada, get(), eventos));
      guardar(eventos);
    },
    colgar() {
      set({ dialogos: get().dialogos.filter((d) => !d.saliente) });
    },
    async ejecutar(linea) {
      const { jornada } = get();
      const { resultado, eventos } = await jornada.ejecutar(linea);
      if (eventos.length) set(actualizado(jornada, get(), eventos));
      else set({ minuto: Math.floor(jornada.minutoDelDia()) });
      if (resultado.ejecutada) guardar(eventos);
      return resultado;
    },
    async responder(mision, objetivo, valor) {
      const { jornada } = get();
      const r = await jornada.responder(mision, objetivo, valor);
      set(actualizado(jornada, get(), r.eventos));
      guardar(r.eventos);
      return { correcta: r.correcta, ...(r.comentario ? { comentario: r.comentario } : {}) };
    },
    async empezar(nombre) {
      const limpio = nombre.trim().slice(0, 40);
      const r = await guardian.empezar(limpio, versionContenido(), semillaAleatoria);
      cargar(r.partida, r.codigo);
      if (r.codigo)
        set({
          numeroPorAnotar: r.codigo,
          dialogos: [...get().dialogos, dialogoDe("companero", AVISO_NUMERO, false, personajes)],
        });
      return { sinServidor: r.sinServidor };
    },
    async checarEntrada(codigo) {
      const r = await guardian.checarEntrada(codigo);
      if (!r.ok) return r;
      cargar(r.partida, r.codigo);
      return { ok: true };
    },
    async olvidar() {
      if (guardadoProgramado) clearTimeout(guardadoProgramado);
      guardadoProgramado = null;
      await guardian.olvidar();
      const j = Jornada.iniciar(turnoInicial(), mundo, isTestMode ? 1 : semillaAleatoria());
      set({ ...desdeJornada(j), nombre: "", codigo: null, semilla: 0, guardado: "sin_partida" });
    },
    async continuar() {
      const local = await guardian.cargarLocal();
      if (!local) return false;
      cargar(local.partida, local.codigo);
      void guardian.subir().then(refrescarGuardado);
      return true;
    },
  };
});

// Al volver la conexión se sube lo pendiente.
if (typeof window !== "undefined")
  window.addEventListener("online", () => {
    void guardian.subir().then(() => usePartida.setState({ guardado: estadoGuardado() }));
  });
