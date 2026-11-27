import { create } from "zustand";
import { esPartidaNueva, type MensajeBuzon, type Partida, type PistaAnotada } from "../../shared/partida";
import type { ResultadoLinea } from "../engine";
import { QUIEN_DA_PISTAS } from "../engine/llamadas";
import { isTestMode } from "../test-hooks";
import { almacenIndexedDb } from "./almacen-idb";
import { crearApiPartidas, type Motivo } from "./api";
import { contenidoComun, turnoInicial, versionContenido } from "./contenido";
import { conTimbre, type Dialogo, dialogoDe, dialogosDe } from "./dialogos";
import { aPartida, estadoDe, Guardian } from "./guardado";
import { type ApunteLibreta, type EventoJornada, Jornada } from "./jornada";
import { postitsDe } from "./pizarron";
import { useEscena } from "./store";
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
  /** Pistas que dio Eduardo, en orden: la libreta las muestra (F4-03). */
  pistas: PistaAnotada[];
  /** Llamadas entrantes que no contestaste, por escuchar (F4-04). */
  buzon: MensajeBuzon[];
  /** Apuntes automáticos de la libreta (Historia y Comandos) de lo terminado en el turno (F4-05). */
  apuntes: ApunteLibreta[];
  /** Post-its informativos del pizarrón (efecto `postit`, F4-07), los más nuevos al final. */
  postits: string[];
  /** Mis notas: lo que el jugador teclea en la libreta (hasta 200 de 500 caracteres). */
  notas: string[];
  /** Agrega una nota tecleada; false si está vacía o ya no caben. */
  agregarNota: (texto: string) => boolean;
  borrarNota: (i: number) => void;
  /** Contesta la llamada que está sonando (F4-04). */
  contestar: () => void;
  /** La llamada que sonaba se fue al buzón (nadie contestó a tiempo). */
  perderLlamada: () => void;
  /** Escucha el mensaje más viejo del buzón (en la tarjeta de llamada). */
  escucharBuzon: () => void;
  /** Cuelga la llamada que hizo el jugador (quita lo que faltaba de ella). */
  colgar: () => void;
}

// shortcut: el aviso de Eduardo pasa al contenido del Turno 0 (F4-14), donde él te recibe.
const AVISO_NUMERO =
  "Antes que se me olvide: Recursos Humanos te dejó tu número de empleado en un post-it, en tu monitor. Anótalo en tu libreta o en un papel; con él checas entrada en cualquier compu.";

const MAX_EVENTOS = 200;
const llamadas = contenidoComun().llamadas;

export type ResultadoLlamar = ResultadoMarcar | { tipo: "no_contesta"; texto: string };

/** Tres fallos seguidos (comandos con error o respuestas equivocadas del mismo objetivo) → lo piensas. */
const FALLOS_PARA_PENSAR = 3;
export const PENSAR_EN_EDUARDO = "Igual y le marco a Eduardo…";
let fallosComando = 0;
const fallosRespuesta = new Map<string, number>();

function fallo(contador: number): number {
  if (contador + 1 < FALLOS_PARA_PENSAR) return contador + 1;
  useEscena.getState().pensar(PENSAR_EN_EDUARDO);
  return 0;
}

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

const MAX_BUZON = 20;
export const MAX_NOTAS = 200;
const MAX_POSTITS = 12;
export const LARGO_NOTA = 500;
let entrantes = 0;
/** Diálogos de los eventos, con las llamadas entrantes agrupadas y sonando (F4-04). */
const dialogosConTimbre = (eventos: EventoJornada[]) =>
  conTimbre(dialogosDe(eventos, personajes), () => `entrante-${++entrantes}`);

function actualizado(j: Jornada, s: EstadoPartida, eventos: EventoJornada[]) {
  return {
    apuntes: j.libreta(),
    postits: [...s.postits, ...postitsDe(eventos)].slice(-MAX_POSTITS),
    minuto: Math.floor(j.minutoDelDia()),
    eventos: [...s.eventos, ...eventos].slice(-MAX_EVENTOS),
    pendientes: pendientesDe(j),
    tickets: unirTickets(s.tickets, ticketsDe(activas(j), personajes)),
    dialogos: [...s.dialogos, ...dialogosConTimbre(eventos)],
  };
}

/** Estado de la interfaz para una jornada recién creada o cargada. */
function desdeJornada(j: Jornada) {
  const eventos = j.tomarEventos();
  return {
    jornada: j,
    apuntes: j.libreta(),
    minuto: Math.floor(j.minutoDelDia()),
    pendientes: pendientesDe(j),
    tickets: ticketsDe(activas(j), personajes),
    eventos,
    dialogos: dialogosConTimbre(eventos),
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
      notas: s.notas,
      pistas: s.pistas,
      buzon: s.buzon,
      postits: s.postits,
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
    set({
      ...desdeJornada(jornadaDe(p)),
      nombre: p.nombre,
      semilla: p.semilla,
      codigo,
      pistas: p.pistas,
      buzon: p.buzon,
      notas: p.notas,
      postits: p.postits,
    });
    void guardian.guardarLocal(partidaActual()).then(refrescarGuardado);
  };

  /**
   * Platicar con un contacto (F4-02): gasta su paciencia y pone su conversación. Si ya no contesta y la llamada
   * estaba recién marcada, regresa "no_contesta"; si ya había contestado (Eduardo), dice "ponte a trabajar".
   */
  const platicar = async (id: string, recienMarcada: boolean): Promise<"contesta" | "no_contesta"> => {
    const guion = llamadas[id];
    if (!guion) return "no_contesta";
    const { jornada } = get();
    const { llamada, eventos } = await jornada.llamar(id, guion, personajes[id]?.paciencia ?? 2);
    if (llamada.tipo === "no_contesta" && recienMarcada) {
      if (eventos.length) set(actualizado(jornada, get(), eventos));
      guardar(eventos);
      return "no_contesta";
    }
    const s = get();
    const lineas =
      llamada.tipo === "charla"
        ? lineasDeLlamada(id, llamada.conversacion.lineas, llamada.conversacion.opciones)
        : lineasDeLlamada(id, [
            llamada.tipo === "ponte_a_trabajar" ? llamada.texto : (guion.ponte_a_trabajar[0] ?? ""),
          ]);
    // La llamada va antes que lo que haya desatado (p. ej. un objetivo de T0 cumplido).
    const previos = s.dialogos.filter((d) => !d.saliente);
    set({
      ...actualizado(jornada, s, eventos),
      dialogos: [...previos, ...lineas, ...dialogosConTimbre(eventos)],
    });
    guardar(eventos);
    return "contesta";
  };

  /** Eduardo dicta la pista (F4-03) y queda anotada en la libreta si es nueva. */
  const darPista = (quien: string, mision: string, objetivo: string, resto: Dialogo[]) => {
    const { jornada, pistas } = get();
    const p = jornada.pista(mision, objetivo);
    const guion = llamadas[quien];
    const lineas = p.nueva ? [p.texto] : [guion?.pistas?.repite ?? "Va de nuevo:", p.texto];
    set({
      dialogos: [...lineasDeLlamada(quien, lineas), ...resto],
      pistas: p.nueva ? [...pistas, { mision, objetivo, nivel: p.nivel, texto: p.texto }] : pistas,
    });
    guardar([]);
  };

  return {
    nombre: "",
    setNombre: (nombre) => set({ nombre: nombre.trim().slice(0, 40) }),
    codigo: null,
    semilla: 0,
    guardado: "sin_partida",
    numeroPorAnotar: null,
    pistas: [],
    buzon: [],
    notas: [],
    postits: [],
    agregarNota(texto) {
      const limpia = texto.trim().slice(0, LARGO_NOTA);
      const { notas } = get();
      if (!limpia || notas.length >= MAX_NOTAS) return false;
      set({ notas: [...notas, limpia] });
      guardar([]);
      return true;
    },
    borrarNota(i) {
      set({ notas: get().notas.filter((_, k) => k !== i) });
      guardar([]);
    },
    contestar() {
      const [actual, ...resto] = get().dialogos;
      if (!actual?.timbre) return;
      const { timbre: _, ...contestada } = actual;
      set({ dialogos: [contestada, ...resto] });
    },
    perderLlamada() {
      const { dialogos, buzon } = get();
      const id = dialogos[0]?.timbre ? dialogos[0].entrante : undefined;
      if (!id) return;
      const perdida = dialogos.filter((d) => d.entrante === id);
      const mensaje = { quien: perdida[0]?.quien ?? "", lineas: perdida.map((d) => d.texto) };
      set({
        dialogos: dialogos.filter((d) => d.entrante !== id),
        buzon: [...buzon, mensaje].slice(-MAX_BUZON),
      });
      guardar([]);
    },
    escucharBuzon() {
      const { buzon, dialogos } = get();
      const [mensaje, ...resto] = buzon;
      if (!mensaje) return;
      const ext = personajes[mensaje.quien]?.extension;
      const lineas = lineasDeLlamada(mensaje.quien, mensaje.lineas).map((d) => ({
        ...d,
        detalle: `Buzón${ext !== undefined ? ` · ext. ${ext}` : ""}`,
      }));
      set({ buzon: resto, dialogos: [...dialogos.filter((d) => !d.saliente), ...lineas] });
      guardar([]);
    },
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
      // Eduardo: si hay pendientes, primero pregunta qué ocupas; pedir pista no gasta paciencia (D-14).
      if (r.id === QUIEN_DA_PISTAS && guion.pistas && jornada.pendientesParaPista().length) {
        const menu = lineasDeLlamada(
          r.id,
          [guion.pistas.saludo],
          [
            { texto: guion.pistas.pedir, accion: { tipo: "pista" } },
            { texto: guion.pistas.platicar, accion: { tipo: "platicar" } },
          ],
        );
        set({ dialogos: [...get().dialogos.filter((d) => !d.saliente), ...menu] });
        return r;
      }
      const resultado = await platicar(r.id, true);
      return resultado === "no_contesta" ? { tipo: "no_contesta", texto: guion.no_contesta } : r;
    },
    async elegirOpcion(i) {
      const [actual, ...resto] = get().dialogos;
      const opcion = actual?.opciones?.[i];
      if (!actual || !opcion) return;
      const a = opcion.accion;
      if (a?.tipo === "platicar") {
        set({ dialogos: resto });
        await platicar(actual.quien, false);
        return;
      }
      if (a?.tipo === "pista" || a?.tipo === "pista_de") {
        const guion = llamadas[actual.quien];
        const pendientes = get().jornada.pendientesParaPista();
        const elegido = a.tipo === "pista_de" ? a : pendientes.length === 1 ? pendientes[0] : undefined;
        if (!elegido) {
          // Varios pendientes: ¿con cuál te atoraste? (el texto del pizarrón).
          const cual = lineasDeLlamada(
            actual.quien,
            [guion?.pistas?.cual ?? "¿Con cuál?"],
            pendientes.map((p) => ({
              texto: p.pendiente,
              accion: { tipo: "pista_de", mision: p.mision, objetivo: p.objetivo },
            })),
          );
          set({ dialogos: [...cual, ...resto] });
          return;
        }
        darPista(actual.quien, elegido.mision, elegido.objetivo, resto);
        return;
      }
      // La respuesta sale igual que lo que se le contestó: tarjeta de llamada o subtítulo de visita (F4-09).
      const respuesta =
        actual.forma === "llamada"
          ? lineasDeLlamada(actual.quien, opcion.respuesta ?? [])
          : (opcion.respuesta ?? []).map((t) => ({
              ...dialogoDe(actual.quien, t, false, personajes),
              ...(actual.visita ? { visita: true as const } : {}),
            }));
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
      if (resultado.ejecutada) {
        guardar(eventos);
        const error = resultado.fragmentos.some((f) => f.tipo === "stderr");
        const avanzo = eventos.some((e) => e.tipo === "objetivo_cumplido");
        fallosComando = error && !avanzo ? fallo(fallosComando) : 0;
      }
      return resultado;
    },
    async responder(mision, objetivo, valor) {
      const { jornada } = get();
      const r = await jornada.responder(mision, objetivo, valor);
      set(actualizado(jornada, get(), r.eventos));
      guardar(r.eventos);
      const llave = `${mision}/${objetivo}`;
      if (r.correcta) fallosRespuesta.delete(llave);
      else fallosRespuesta.set(llave, fallo(fallosRespuesta.get(llave) ?? 0));
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
      set({
        ...desdeJornada(j),
        nombre: "",
        codigo: null,
        semilla: 0,
        guardado: "sin_partida",
        pistas: [],
        buzon: [],
        notas: [],
        postits: [],
      });
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
